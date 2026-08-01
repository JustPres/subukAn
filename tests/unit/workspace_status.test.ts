import { describe, it, expect } from 'vitest';
import {
  formatRejectionReason,
  getWorkspaceStatusInfo,
  REJECTION_REASON_LABELS,
} from '@/lib/utils/workspace-status';

describe('Workspace Status Utility & Formatting', () => {
  describe('formatRejectionReason', () => {
    it('formats known rejection reason codes correctly', () => {
      expect(formatRejectionReason('instructions_not_followed')).toBe('Instructions Not Followed');
      expect(formatRejectionReason('recording_mismatch')).toBe('Recording / Proof Mismatch');
      expect(formatRejectionReason('incomplete')).toBe('Incomplete Submission');
      expect(formatRejectionReason('low_effort')).toBe('Low Effort / Quality Issues');
    });

    it('formats unknown snake_case reason strings gracefully', () => {
      expect(formatRejectionReason('custom_rejection_reason')).toBe('Custom Rejection Reason');
    });

    it('returns default fallback when reason is null, undefined, or empty', () => {
      expect(formatRejectionReason(null)).toBe('Quality / Guideline Issue');
      expect(formatRejectionReason(undefined)).toBe('Quality / Guideline Issue');
      expect(formatRejectionReason('')).toBe('Quality / Guideline Issue');
    });

    it('matches REJECTION_REASON_LABELS map entries', () => {
      Object.entries(REJECTION_REASON_LABELS).forEach(([key, expectedLabel]) => {
        expect(formatRejectionReason(key)).toBe(expectedLabel);
      });
    });
  });

  describe('getWorkspaceStatusInfo - Status Routing & Formatting', () => {
    const mockListing = {
      rate_per_tester: 150,
      review_window_minutes: 60,
    };

    it('returns approved status metadata with payout credit details and poster feedback', () => {
      const mockSubmission = {
        status: 'approved',
        review_completed_at: '2026-08-01T12:00:00Z',
        poster_feedback: 'Excellent work on the recorded walkthrough!',
      };

      const info = getWorkspaceStatusInfo(mockSubmission, mockListing);

      expect(info.status).toBe('approved');
      expect(info.badgeTheme).toBe('emerald');
      expect(info.title).toBe('Task Approved!');
      expect(info.escrowOrPayoutText).toBe('+₱150.00 Credited to Earnings');
      expect(info.reviewCompletedAt).toBe('2026-08-01T12:00:00Z');
      expect(info.posterFeedback).toBe('Excellent work on the recorded walkthrough!');
    });

    it('returns rejected status metadata with rejection reason, explanation, and dispute guidance', () => {
      const mockSubmission = {
        status: 'rejected',
        rejection_reason: 'instructions_not_followed',
        rejection_explanation: 'The video recording did not show the checkout process.',
        review_completed_at: '2026-08-01T14:30:00Z',
      };

      const info = getWorkspaceStatusInfo(mockSubmission, mockListing);

      expect(info.status).toBe('rejected');
      expect(info.badgeTheme).toBe('rose');
      expect(info.title).toBe('Submission Rejected');
      expect(info.rejectionReasonLabel).toBe('Instructions Not Followed');
      expect(info.rejectionExplanation).toBe('The video recording did not show the checkout process.');
      expect(info.reviewCompletedAt).toBe('2026-08-01T14:30:00Z');
    });

    it('handles rejection_category field when rejection_reason is undefined', () => {
      const mockSubmission = {
        status: 'rejected',
        rejection_category: 'low_effort',
        rejection_explanation: 'Summary answers were too short.',
      };

      const info = getWorkspaceStatusInfo(mockSubmission, mockListing);

      expect(info.status).toBe('rejected');
      expect(info.rejectionReasonLabel).toBe('Low Effort / Quality Issues');
      expect(info.rejectionExplanation).toBe('Summary answers were too short.');
    });

    it('returns pending_review status metadata with escrow hold and auto-release details', () => {
      const mockSubmission = {
        status: 'pending_review',
        auto_release_at: '2026-08-01T16:00:00Z',
      };

      const info = getWorkspaceStatusInfo(mockSubmission, mockListing);

      expect(info.status).toBe('pending_review');
      expect(info.badgeTheme).toBe('amber');
      expect(info.title).toBe('Submission Under Review');
      expect(info.escrowOrPayoutText).toBe('₱150.00 Held in Escrow');
      expect(info.autoReleaseAt).toBe('2026-08-01T16:00:00Z');
    });

    it('handles fallback submitted status as pending_review', () => {
      const mockSubmission = {
        status: 'submitted',
      };

      const info = getWorkspaceStatusInfo(mockSubmission, mockListing);

      expect(info.status).toBe('pending_review');
      expect(info.badgeTheme).toBe('amber');
      expect(info.escrowOrPayoutText).toBe('₱150.00 Held in Escrow');
    });
  });

  describe('Edge Case Testing', () => {
    const mockListing = {
      rate_per_tester: 250,
      review_window_minutes: 30,
    };

    it('Edge Case 1: handles missing rejection explanation gracefully', () => {
      const mockSubmissionNull = {
        status: 'rejected',
        rejection_reason: 'incomplete',
        rejection_explanation: null,
      };
      const infoNull = getWorkspaceStatusInfo(mockSubmissionNull, mockListing);
      expect(infoNull.rejectionExplanation).toBeNull();

      const mockSubmissionUndefined = {
        status: 'rejected',
        rejection_reason: 'incomplete',
      };
      const infoUndefined = getWorkspaceStatusInfo(mockSubmissionUndefined, mockListing);
      expect(infoUndefined.rejectionExplanation).toBeNull();
    });

    it('Edge Case 2: handles long rejection explanations (500 chars)', () => {
      const longExplanation = 'A'.repeat(500);
      const mockSubmissionLong = {
        status: 'rejected',
        rejection_reason: 'recording_mismatch',
        rejection_explanation: longExplanation,
      };
      const info = getWorkspaceStatusInfo(mockSubmissionLong, mockListing);
      expect(info.rejectionExplanation).toBe(longExplanation);
      expect(info.rejectionExplanation?.length).toBe(500);
    });

    it('Edge Case 3: handles missing auto-release date gracefully', () => {
      const mockSubmissionNoAutoRelease = {
        status: 'pending_review',
        auto_release_at: null,
      };
      const info = getWorkspaceStatusInfo(mockSubmissionNoAutoRelease, mockListing);
      expect(info.autoReleaseAt).toBeNull();
    });

    it('Edge Case 4: handles null or undefined payout amount safely', () => {
      const invalidListingNull = {
        rate_per_tester: null as unknown as number,
        review_window_minutes: 30,
      };
      const mockSubmission = { status: 'approved' };

      const info = getWorkspaceStatusInfo(mockSubmission, invalidListingNull);
      expect(info.escrowOrPayoutText).toBe('+₱0.00 Credited to Earnings');
    });
  });
});

