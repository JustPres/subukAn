import { describe, it, expect } from 'vitest';
import { getButtonConfig, JobListing } from '@/lib/utils/claim-button';

describe('getButtonConfig - Additional Edge Cases & Precedence Stress Tests', () => {
  const baseJobZeroSlots: JobListing = {
    id: 'listing-zero-slots',
    title: 'Zero Slot Listing',
    description: 'Testing listing created with 0 total slots.',
    rate_per_tester: 150,
    slots_count: 0,
    slots_filled: 0,
    requires_recording: false,
    requires_image: false,
    question_text: 'Feedback question',
    is_quick_impression: false,
    user_submission_status: null
  };

  const baseJobFullSlots: JobListing = {
    id: 'listing-full-slots',
    title: 'Full Slots Listing',
    description: 'Testing listing with 5/5 slots filled.',
    rate_per_tester: 300,
    slots_count: 5,
    slots_filled: 5,
    requires_recording: true,
    requires_image: true,
    question_text: 'Feedback question',
    is_quick_impression: false,
    user_submission_status: null
  };

  describe('1. Zero Total Slots (slots_count = 0)', () => {
    it('should return "Slots Full" disabled when user has no submission status', () => {
      const config = getButtonConfig(baseJobZeroSlots);
      expect(config.text).toBe('Slots Full');
      expect(config.disabled).toBe(true);
      expect(config.href).toBe('#');
      expect(config.className).toContain('bg-gray-100');
    });

    it('should prioritize in_progress submission over 0 slots count', () => {
      const config = getButtonConfig({
        ...baseJobZeroSlots,
        user_submission_status: 'in_progress'
      });
      expect(config.text).toBe('Continue Testing →');
      expect(config.disabled).toBe(false);
      expect(config.href).toBe('/dashboard/tester/tasks/listing-zero-slots');
    });

    it('should prioritize pending_review submission over 0 slots count', () => {
      const config = getButtonConfig({
        ...baseJobZeroSlots,
        user_submission_status: 'pending_review'
      });
      expect(config.text).toBe('⏳ Awaiting Review');
      expect(config.disabled).toBe(true);
      expect(config.href).toBe('#');
    });

    it('should prioritize approved submission over 0 slots count', () => {
      const config = getButtonConfig({
        ...baseJobZeroSlots,
        user_submission_status: 'approved'
      });
      expect(config.text).toBe('✅ Approved — View Details');
      expect(config.disabled).toBe(false);
      expect(config.href).toBe('/dashboard/tester/tasks/listing-zero-slots');
    });

    it('should prioritize rejected submission over 0 slots count', () => {
      const config = getButtonConfig({
        ...baseJobZeroSlots,
        user_submission_status: 'rejected'
      });
      expect(config.text).toBe('❌ Rejected — View Details');
      expect(config.disabled).toBe(false);
      expect(config.href).toBe('/dashboard/tester/tasks/listing-zero-slots');
    });
  });

  describe('2. Full Slots Precedence (slots_filled >= slots_count)', () => {
    it('should prioritize pending_review when slots are full (5/5)', () => {
      const config = getButtonConfig({
        ...baseJobFullSlots,
        user_submission_status: 'pending_review'
      });
      expect(config.text).toBe('⏳ Awaiting Review');
      expect(config.disabled).toBe(true);
    });

    it('should prioritize rejected when slots are full (5/5)', () => {
      const config = getButtonConfig({
        ...baseJobFullSlots,
        user_submission_status: 'rejected'
      });
      expect(config.text).toBe('❌ Rejected — View Details');
      expect(config.disabled).toBe(false);
      expect(config.href).toBe('/dashboard/tester/tasks/listing-full-slots');
    });
  });

  describe('3. Quick Impression 5-Second Task Routing in All Submission States', () => {
    const quickJob: JobListing = {
      ...baseJobFullSlots,
      id: 'quick-5s-job',
      is_quick_impression: true,
    };

    it('should route approved 5-second test to five-second route', () => {
      const config = getButtonConfig({ ...quickJob, user_submission_status: 'approved' });
      expect(config.href).toBe('/dashboard/tester/tasks/five-second/quick-5s-job');
    });

    it('should route rejected 5-second test to five-second route', () => {
      const config = getButtonConfig({ ...quickJob, user_submission_status: 'rejected' });
      expect(config.href).toBe('/dashboard/tester/tasks/five-second/quick-5s-job');
    });
  });

  describe('4. Multiple Submissions Resolution Logic Simulation', () => {
    interface SubmissionRecord {
      id: string;
      listing_id: string;
      status: string;
      created_at: string;
    }

    // Demonstrates bug in userSubmissions.find((s) => s.listing_id === listing.id && s.status !== 'expired')
    // when unordered query returns an older submission first.
    it('demonstrates non-deterministic behavior when userSubmissions.find is used without ordering', () => {
      const listingId = 'listing-multi-sub';
      
      // Suppose DB returns older rejected submission first
      const submissionsArrayUnordered: SubmissionRecord[] = [
        { id: 'sub-1', listing_id: listingId, status: 'rejected', created_at: '2026-08-01T08:00:00Z' },
        { id: 'sub-2', listing_id: listingId, status: 'in_progress', created_at: '2026-08-01T09:00:00Z' },
      ];

      // Current page logic:
      const userSubCurrent = submissionsArrayUnordered.find(s => s.listing_id === listingId && s.status !== 'expired');
      expect(userSubCurrent?.status).toBe('rejected'); // Picks sub-1 (rejected) instead of sub-2 (in_progress)!

      // Correct logic should sort by created_at DESC or prioritize active states ('in_progress', 'pending_review'):
      const userSubCorrect = [...submissionsArrayUnordered]
        .filter(s => s.status !== 'expired')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      expect(userSubCorrect?.status).toBe('in_progress');
    });
  });
});
