export type SubmissionStatus = 'in_progress' | 'pending_review' | 'approved' | 'rejected' | null;

export interface JobListing {
  id: string;
  title: string;
  description: string;
  rate_per_tester: number;
  slots_count: number;
  slots_filled: number;
  requires_recording: boolean;
  requires_image: boolean;
  question_text: string;
  is_quick_impression: boolean;
  target_age_group?: string | null;
  target_gender?: string | null;
  target_employment_status?: string | null;
  target_tech_literacy?: string | null;
  target_accessibility_tags?: string[] | null;
  user_submission_status?: SubmissionStatus;
}

export interface ButtonConfig {
  text: string;
  className: string;
  href: string;
  disabled: boolean;
}

export function getButtonConfig(job: JobListing): ButtonConfig {
  const targetUrl = job.is_quick_impression 
    ? `/dashboard/tester/tasks/five-second/${job.id}` 
    : `/dashboard/tester/tasks/${job.id}`;

  switch (job.user_submission_status) {
    case 'in_progress':
      return {
        text: 'Continue Testing →',
        className: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
        href: targetUrl,
        disabled: false
      };
    case 'pending_review':
      return {
        text: '⏳ Awaiting Review',
        className: 'bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed opacity-80 pointer-events-none',
        href: '#',
        disabled: true
      };
    case 'approved':
      return {
        text: '✅ Approved — View Details',
        className: 'border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 bg-white shadow-sm font-bold',
        href: targetUrl,
        disabled: false
      };
    case 'rejected':
      return {
        text: '❌ Rejected — View Details',
        className: 'border-2 border-rose-600 text-rose-700 hover:bg-rose-50 bg-white shadow-sm font-bold',
        href: targetUrl,
        disabled: false
      };
    default:
      if (job.slots_filled >= job.slots_count) {
        return {
          text: 'Slots Full',
          className: 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 pointer-events-none',
          href: '#',
          disabled: true
        };
      }
      return {
        text: 'Claim Slot & Start Test',
        className: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
        href: targetUrl,
        disabled: false
      };
  }
}
