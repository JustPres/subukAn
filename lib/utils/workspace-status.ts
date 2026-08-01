export const REJECTION_REASON_LABELS: Record<string, string> = {
  instructions_not_followed: 'Instructions Not Followed',
  recording_mismatch: 'Recording / Proof Mismatch',
  incomplete: 'Incomplete Submission',
  low_effort: 'Low Effort / Quality Issues',
};

export const DISPUTE_REASON_LABELS: Record<string, string> = {
  followed_instructions: 'Followed All Instructions',
  valid_evidence: 'Media Evidence Valid & Clear',
  poster_error: 'Poster Feedback Inaccurate',
  other: 'Other Dispute Reason',
};

/**
 * Formats a rejection reason code or category string into a human-readable label.
 */
export function formatRejectionReason(reason?: string | null): string {
  if (!reason) return 'Quality / Guideline Issue';
  if (REJECTION_REASON_LABELS[reason]) {
    return REJECTION_REASON_LABELS[reason];
  }
  return reason
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function formatDisputeReason(reason?: string | null): string {
  if (!reason) return 'Dispute Under Review';
  if (DISPUTE_REASON_LABELS[reason]) {
    return DISPUTE_REASON_LABELS[reason];
  }
  return reason
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export type SubmissionStatus = 'in_progress' | 'pending_review' | 'approved' | 'rejected' | 'disputed' | 'expired' | 'submitted';

export interface WorkspaceStatusInfo {
  status: SubmissionStatus;
  badgeLabel: string;
  badgeTheme: 'amber' | 'emerald' | 'rose' | 'blue';
  title: string;
  subtitle: string;
  escrowOrPayoutText: string;
  rejectionReasonLabel?: string;
  rejectionExplanation?: string | null;
  disputeReasonLabel?: string;
  disputeExplanation?: string | null;
  reviewCompletedAt?: string | null;
  autoReleaseAt?: string | null;
  posterFeedback?: string | null;
}

/**
 * Helper to extract status display info from a submission and listing.
 */
export function getWorkspaceStatusInfo(
  submission: {
    status: string;
    rejection_reason?: string | null;
    rejection_category?: string | null;
    rejection_explanation?: string | null;
    dispute_reason?: string | null;
    dispute_explanation?: string | null;
    review_completed_at?: string | null;
    auto_release_at?: string | null;
    poster_feedback?: string | null;
  } | null | undefined,
  listing?: {
    rate_per_tester?: number | null;
    review_window_minutes?: number | null;
  } | null
): WorkspaceStatusInfo {
  const currentStatus = (submission?.status as SubmissionStatus) || 'pending_review';
  const rate = (listing?.rate_per_tester ?? 0).toFixed(2);
  const rawReason = submission?.rejection_reason || submission?.rejection_category;

  if (currentStatus === 'approved') {
    return {
      status: 'approved',
      badgeLabel: 'Approved',
      badgeTheme: 'emerald',
      title: 'Task Approved!',
      subtitle: 'Great job! The poster reviewed and accepted your test submission.',
      escrowOrPayoutText: `+₱${rate} Credited to Earnings`,
      reviewCompletedAt: submission?.review_completed_at || null,
      posterFeedback: submission?.poster_feedback || null,
    };
  }

  if (currentStatus === 'disputed') {
    return {
      status: 'disputed',
      badgeLabel: 'Disputed',
      badgeTheme: 'amber',
      title: 'Dispute Under Review',
      subtitle: 'You have submitted a dispute for this rejection. Our support team is reviewing your claim.',
      escrowOrPayoutText: `₱${rate} Held Pending Dispute`,
      disputeReasonLabel: formatDisputeReason(submission?.dispute_reason),
      disputeExplanation: submission?.dispute_explanation || null,
      rejectionReasonLabel: formatRejectionReason(rawReason),
      rejectionExplanation: submission?.rejection_explanation || null,
      reviewCompletedAt: submission?.review_completed_at || null,
    };
  }

  if (currentStatus === 'rejected') {
    return {
      status: 'rejected',
      badgeLabel: 'Rejected',
      badgeTheme: 'rose',
      title: 'Submission Rejected',
      subtitle: 'The poster reviewed your submission and flagged issues with the completed work.',
      escrowOrPayoutText: `₱${rate} Escrow Refunded`,
      rejectionReasonLabel: formatRejectionReason(rawReason),
      rejectionExplanation: submission?.rejection_explanation || null,
      reviewCompletedAt: submission?.review_completed_at || null,
    };
  }

  // Fallback: pending_review / submitted
  return {
    status: 'pending_review',
    badgeLabel: 'Under Review',
    badgeTheme: 'amber',
    title: 'Submission Under Review',
    subtitle: `Your feedback is now pending poster review. The poster has up to ${listing?.review_window_minutes ?? 0} minutes to review.`,
    escrowOrPayoutText: `₱${rate} Held in Escrow`,
    autoReleaseAt: submission?.auto_release_at || null,
  };
}

