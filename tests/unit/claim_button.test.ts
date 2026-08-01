import { describe, it, expect } from 'vitest';
import { getButtonConfig, JobListing } from '@/lib/utils/claim-button';

describe('getButtonConfig - Tester Claim & Submission Action Button', () => {
  const baseStandardJob: JobListing = {
    id: 'listing-101',
    title: 'Standard App Usability Test',
    description: 'Test checkout flow and submit feedback.',
    rate_per_tester: 200,
    slots_count: 5,
    slots_filled: 2,
    requires_recording: true,
    requires_image: false,
    question_text: 'How smooth was the checkout process?',
    is_quick_impression: false,
    user_submission_status: null
  };

  const baseQuickImpressionJob: JobListing = {
    ...baseStandardJob,
    id: 'listing-102',
    title: 'Quick 5-Second Impression Test',
    is_quick_impression: true
  };

  it('1. should return "Claim Slot & Start Test" green button when no submission exists and slots are open', () => {
    const config = getButtonConfig(baseStandardJob);
    expect(config.text).toBe('Claim Slot & Start Test');
    expect(config.disabled).toBe(false);
    expect(config.href).toBe('/dashboard/tester/tasks/listing-101');
    expect(config.className).toContain('bg-emerald-600');
  });

  it('2. should return "Continue Testing →" blue button when user_submission_status is in_progress', () => {
    const job: JobListing = {
      ...baseStandardJob,
      user_submission_status: 'in_progress'
    };
    const config = getButtonConfig(job);
    expect(config.text).toBe('Continue Testing →');
    expect(config.disabled).toBe(false);
    expect(config.href).toBe('/dashboard/tester/tasks/listing-101');
    expect(config.className).toContain('bg-blue-600');
  });

  it('3. should return "⏳ Awaiting Review" disabled amber badge when user_submission_status is pending_review', () => {
    const job: JobListing = {
      ...baseStandardJob,
      user_submission_status: 'pending_review'
    };
    const config = getButtonConfig(job);
    expect(config.text).toBe('⏳ Awaiting Review');
    expect(config.disabled).toBe(true);
    expect(config.href).toBe('#');
    expect(config.className).toContain('bg-amber-50');
    expect(config.className).toContain('pointer-events-none');
  });

  it('4. should return "✅ Approved — View Details" green outline button when user_submission_status is approved', () => {
    const job: JobListing = {
      ...baseStandardJob,
      user_submission_status: 'approved'
    };
    const config = getButtonConfig(job);
    expect(config.text).toBe('✅ Approved — View Details');
    expect(config.disabled).toBe(false);
    expect(config.href).toBe('/dashboard/tester/tasks/listing-101');
    expect(config.className).toContain('border-emerald-600');
  });

  it('5. should return "❌ Rejected — View Details" red outline button when user_submission_status is rejected', () => {
    const job: JobListing = {
      ...baseStandardJob,
      user_submission_status: 'rejected'
    };
    const config = getButtonConfig(job);
    expect(config.text).toBe('❌ Rejected — View Details');
    expect(config.disabled).toBe(false);
    expect(config.href).toBe('/dashboard/tester/tasks/listing-101');
    expect(config.className).toContain('border-rose-600');
  });

  it('6. should return "Slots Full" disabled gray badge when no submission exists and slots are full', () => {
    const fullJob: JobListing = {
      ...baseStandardJob,
      slots_filled: 5,
      slots_count: 5,
      user_submission_status: null
    };
    const config = getButtonConfig(fullJob);
    expect(config.text).toBe('Slots Full');
    expect(config.disabled).toBe(true);
    expect(config.href).toBe('#');
    expect(config.className).toContain('bg-gray-100');
  });

  it('7. PRECENDENCE TEST: user submission status MUST take precedence over full slots', () => {
    const fullJobWithInProgress: JobListing = {
      ...baseStandardJob,
      slots_filled: 5,
      slots_count: 5,
      user_submission_status: 'in_progress'
    };
    const config = getButtonConfig(fullJobWithInProgress);
    expect(config.text).toBe('Continue Testing →');
    expect(config.disabled).toBe(false);

    const fullJobWithApproved: JobListing = {
      ...baseStandardJob,
      slots_filled: 5,
      slots_count: 5,
      user_submission_status: 'approved'
    };
    const appConfig = getButtonConfig(fullJobWithApproved);
    expect(appConfig.text).toBe('✅ Approved — View Details');
    expect(appConfig.disabled).toBe(false);
  });

  it('8. ROUTING TEST: should direct to 5-second Quick Impression task page when is_quick_impression is true', () => {
    const inProgressQuick: JobListing = {
      ...baseQuickImpressionJob,
      user_submission_status: 'in_progress'
    };
    const config = getButtonConfig(inProgressQuick);
    expect(config.href).toBe('/dashboard/tester/tasks/five-second/listing-102');
  });
});
