# Technical Analysis: R1 Context-Aware Tester Claim Button & Listings

## Overview
This document presents the detailed architectural and codebase analysis for Milestone 1 / R1: Context-Aware Tester Claim Button & Listings. It details how listing queries, user submission states, and claim slot buttons currently work in `app/dashboard/tester/page.tsx`, identifies the exact technical gaps, and specifies the exact code modifications required to render dynamic, state-aware claim buttons.

---

## 1. Codebase Baseline & Observation Summary

### Target File
- `app/dashboard/tester/page.tsx` (Lines 1 to 1086)

### Related Files & Workspaces
- `app/dashboard/tester/tasks/[id]/page.tsx` (Standard task workspace)
- `app/dashboard/tester/tasks/five-second/[id]/page.tsx` (5-Second Quick Impression workspace)
- `supabase/migrations/00001_initial_schema.sql` (`submissions` table DDL & RLS)
- `supabase/migrations/00005_fix_rls_recursion.sql` (Submissions RLS security definer policies)

### Current Listing & Submission Query Mechanics
In `app/dashboard/tester/page.tsx` (lines 235–294):
```typescript
const { data: listingsData, error: listingsError } = await supabase
  .from('listings')
  .select(`
    *,
    tasks (
      id,
      question_text,
      requires_recording,
      requires_image
    ),
    submissions (
      id,
      status
    )
  `)
  .eq('status', 'open')
```
When mapping `listingsData` to `JobListing[]` objects (lines 255–276):
```typescript
slots_filled: listing.submissions 
  ? listing.submissions.filter((s: any) => s.status !== 'expired' && s.status !== 'rejected').length 
  : 0
```

### Current Button Rendering Mechanics
In `app/dashboard/tester/page.tsx` (lines 558–619):
```tsx
{listings.map((job) => {
  const isFull = job.slots_filled >= job.slots_count
  return (
    ...
    <Link
      href={isFull ? '#' : (job.is_quick_impression ? `/dashboard/tester/tasks/five-second/${job.id}` : `/dashboard/tester/tasks/${job.id}`)}
      className={`w-full py-2.5 font-bold text-sm rounded-[8px] text-center transition-all flex items-center justify-center ${
        isFull 
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 pointer-events-none'
          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
      }`}
    >
      {isFull ? 'Unclickable (Full)' : 'Claim Slot & Start Test'}
    </Link>
  )
})}
```

---

## 2. Gap & Defect Analysis

1. **Missing User Submission Context**: The `JobListing` interface (lines 26–41) does not track the user's specific submission state (`user_submission_status`).
2. **Binary Button Logic**: The button currently checks only a binary flag `isFull` (`job.slots_filled >= job.slots_count`).
3. **Flawed Button Labels & States**:
   - A tester with an active task (`in_progress`) sees `Claim Slot & Start Test` instead of `Continue Testing →` (blue).
   - A tester awaiting poster review sees `Claim Slot & Start Test` instead of `⏳ Awaiting Review` (amber, disabled).
   - A tester with an approved submission sees `Claim Slot & Start Test` instead of `✅ Approved — View Details` (green outline).
   - A tester with a rejected submission sees `Claim Slot & Start Test` instead of `❌ Rejected — View Details` (red outline).
4. **Precedence Collisions**: If a listing reaches full slots after a tester has claimed it (`in_progress`), the current UI displays `Unclickable (Full)`, locking the tester out of continuing or viewing their claimed slot. User submission state MUST take precedence over listing capacity (`isFull`).

---

## 3. Required State Matrix & Routing Specification

| State | User Submission Status | Slots Capacity | Button Label | Visual Styling | Route / Action | Disabled? |
|---|---|---|---|---|---|---|
| **1. No Submission** | `null` or `expired` | `slots_filled < slots_count` | `Claim Slot & Start Test` | Solid Emerald (`bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm`) | `/dashboard/tester/tasks/[id]` or `/dashboard/tester/tasks/five-second/[id]` | No |
| **2. In Progress** | `in_progress` | Any | `Continue Testing →` | Solid Blue (`bg-blue-600 hover:bg-blue-700 text-white shadow-sm`) | `/dashboard/tester/tasks/[id]` or `/dashboard/tester/tasks/five-second/[id]` | No |
| **3. Awaiting Review** | `pending_review` | Any | `⏳ Awaiting Review` | Amber Badge (`bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed opacity-80 pointer-events-none`) | `href="#"` | Yes |
| **4. Approved** | `approved` | Any | `✅ Approved — View Details` | Green Outline (`border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 bg-white shadow-sm font-bold`) | `/dashboard/tester/tasks/[id]` or `/dashboard/tester/tasks/five-second/[id]` | No |
| **5. Rejected** | `rejected` | Any | `❌ Rejected — View Details` | Red Outline (`border-2 border-rose-600 text-rose-700 hover:bg-rose-50 bg-white shadow-sm font-bold`) | `/dashboard/tester/tasks/[id]` or `/dashboard/tester/tasks/five-second/[id]` | No |
| **6. Slots Full** | `null` or `expired` | `slots_filled >= slots_count` | `Slots Full` | Gray Disabled (`bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 pointer-events-none`) | `href="#"` | Yes |

### Target Workspace Route Verification
When navigating to the target workspace (`/dashboard/tester/tasks/[id]` or `five-second/[id]`):
- **`in_progress`**: The workspace checks `submissionData.status === 'in_progress'` and opens the active task workspace (`'active_task'` or `'cover'`), preserving input state without duplicate claim attempts.
- **`approved`**: The workspace checks `submissionData.status === 'approved'` and sets `currentStep = 'submitted'`, rendering the escrow release summary and the Post-Test Debrief Thread.
- **`rejected`**: The workspace checks `submissionData.status === 'rejected'` and sets `currentStep = 'submitted'`, rendering rejection details and the Post-Test Debrief Thread for disputes.

---

## 4. Exact Implementation Strategy & Code Modifications

### Step 1: Update `JobListing` Type Interface
In `app/dashboard/tester/page.tsx`:
```typescript
interface JobListing {
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
  user_submission_status?: 'in_progress' | 'pending_review' | 'approved' | 'rejected' | null;
}
```

### Step 2: Fetch User Submissions in `fetchProfileAndListings`
In `fetchProfileAndListings`:
```typescript
// Fetch user's own submissions
const { data: userSubmissions } = await supabase
  .from('submissions')
  .select('id, listing_id, status')
  .eq('tester_id', user.id);
```
Map user submission status to each listing item:
```typescript
const mapped = (listingsData || []).map((listing: any) => {
  const firstTask = listing.tasks?.[0];
  const userSub = userSubmissions?.find((s: any) => s.listing_id === listing.id);
  const userSubmissionStatus = (userSub && userSub.status !== 'expired') ? userSub.status : null;

  return {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    rate_per_tester: listing.rate_per_tester,
    slots_count: listing.slots_count,
    slots_filled: listing.submissions 
      ? listing.submissions.filter((s: any) => s.status !== 'expired' && s.status !== 'rejected').length 
      : 0,
    requires_recording: listing.tasks?.some((t: any) => t.requires_recording) || false,
    requires_image: listing.tasks?.some((t: any) => t.requires_image) || false,
    question_text: firstTask?.question_text || 'Provide feedback on this design.',
    is_quick_impression: listing.is_quick_impression,
    target_age_group: listing.target_age_group,
    target_gender: listing.target_gender,
    target_employment_status: listing.target_employment_status,
    target_tech_literacy: listing.target_tech_literacy,
    target_accessibility_tags: listing.target_accessibility_tags,
    user_submission_status: userSubmissionStatus as 'in_progress' | 'pending_review' | 'approved' | 'rejected' | null,
  };
});
```

### Step 3: Implement Dynamic Button Configuration Helper
```typescript
const getButtonConfig = (job: JobListing) => {
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
};
```

### Step 4: Render Dynamic Button in Listing Card
```tsx
const btnConfig = getButtonConfig(job);
return (
  <Link
    href={btnConfig.href}
    className={`w-full py-2.5 font-bold text-sm rounded-[8px] text-center transition-all flex items-center justify-center ${btnConfig.className}`}
    onClick={(e) => {
      if (btnConfig.disabled) {
        e.preventDefault();
      }
    }}
  >
    {btnConfig.text}
  </Link>
);
```

---

## 5. Risk Assessment & Mitigations

| Potential Risk | Impact | Prevention / Mitigation |
|---|---|---|
| RLS policy restricts `submissions` query | High | Query user submissions explicitly using `eq('tester_id', user.id)`. Postgres RLS policy `Read submissions if owner or poster` permits testers to select their own rows. |
| Button click fails on disabled state | Low | Combine `pointer-events-none`, `onClick={e => e.preventDefault()}`, and `href="#"`. |
| Full slots block user from resuming `in_progress` task | High | Enforce strict precedence check: `user_submission_status` is evaluated before checking `slots_filled >= slots_count`. |
