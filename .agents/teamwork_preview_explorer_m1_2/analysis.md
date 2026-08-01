# Milestone 1: R2 — Status-Aware Tester Task Workspace UI Analysis & Technical Strategy

## 1. Executive Summary

This document provides a comprehensive technical investigation of Milestone 1: R2 (Status-Aware Tester Task Workspace UI) across the two primary tester workspace routes:
1. Standard Task Workspace: `app/dashboard/tester/tasks/[id]/page.tsx`
2. 5-Second Quick Impression Workspace: `app/dashboard/tester/tasks/five-second/[id]/page.tsx`

### Core Finding
Both workspace routes currently query the `submissions` table and check the `status` column. However, when rendering the UI, both pages group `pending_review`, `approved`, and `rejected` into a single `'submitted'` step state:
```typescript
// Current logic in both workspace pages
if (submissionData.status === 'in_progress') {
  setCurrentStep('active_task'); // or 'cover' for five-second
} else if (['pending_review', 'approved', 'rejected'].includes(submissionData.status)) {
  setCurrentStep('submitted');
}
```
As a result:
- **Approved Submissions** erroneously display: *"Submitted! Your feedback is now pending review."* (failing to notify the tester that their work was accepted and funds credited).
- **Rejected Submissions** erroneously display: *"Submitted! Your feedback is now pending review."* (completely hiding the poster's rejection decision, rejection category, and explanation).
- **Pending Review Submissions** display a static message without clear visual emphasis on the auto-release window (`⏳ Submission Under Review`).

To achieve status awareness, both pages must be updated to conditionally render distinct, purpose-built UI screens for all 4 submission states (`in_progress`, `pending_review`, `approved`, `rejected`).

---

## 2. Current Implementation Breakdown

### 2.1 Standard Workspace (`app/dashboard/tester/tasks/[id]/page.tsx`)
- **Submission Fetching**:
  Lines 272-277 fetch submission details for the current user and listing:
  ```typescript
  const { data: submissionData, error: subErr } = await supabase
    .from('submissions')
    .select('*')
    .eq('listing_id', id)
    .eq('tester_id', userId)
    .maybeSingle();
  ```
- **Step Machine**:
  Steps include: `'loading' | 'unauthorized' | 'agreement' | 'active_task' | 'submitted' | 'expired' | 'error'`.
- **Status Branching Deficit (Lines 294-296)**:
  `else if (submissionData.status === 'pending_review' || submissionData.status === 'approved' || submissionData.status === 'rejected')` sets `currentStep` to `'submitted'`.
- **Rendered Submitted Screen (Lines 822-926)**:
  Shows a generic card with `<CheckCircle className="w-6 h-6" />`, title `"Submitted!"`, and text *"Your feedback is now pending review."* Regardless of whether the poster approved or rejected the submission.

### 2.2 5-Second Test Workspace (`app/dashboard/tester/tasks/five-second/[id]/page.tsx`)
- **Submission Fetching**:
  Lines 293-298 perform identical queries against `submissions`.
- **Step Machine**:
  Steps include: `'loading' | 'unauthorized' | 'agreement' | 'cover' | 'viewing' | 'questionnaire' | 'submitted' | 'expired' | 'error'`.
- **Status Branching Deficit (Lines 312-315)**:
  `else if (['pending_review', 'approved', 'rejected'].includes(submissionData.status))` sets `currentStep` to `'submitted'`.
- **Rendered Submitted Screen (Lines 704-814)**:
  Exact same static green card rendering `"Submitted! Your feedback is now pending review."`

---

## 3. Database Schema & Data Model Analysis

The database schema (`supabase/migrations/00001_initial_schema.sql` and `00004_backlog_features.sql`) provides full support for status tracking and rejection details.

### 3.1 `public.submissions` Schema Columns

| Column Name | Type | Constraints / Allowed Values | Description |
|---|---|---|---|
| `id` | `uuid` | Primary Key | Unique submission identifier |
| `listing_id` | `uuid` | Foreign Key (`public.listings.id`) | Target test listing |
| `tester_id` | `uuid` | Foreign Key (`public.profiles.id`) | Participant profile |
| `status` | `text` | `'in_progress' \| 'pending_review' \| 'approved' \| 'rejected' \| 'expired'` | Current submission lifecycle state |
| `started_at` | `timestamp` | `NOT NULL`, default `now()` | Timestamp when tester claimed slot |
| `submitted_at` | `timestamp` | Nullable | Timestamp when feedback was submitted |
| `auto_release_at` | `timestamp` | Nullable | Calculated auto-release deadline (`submitted_at + review_window_minutes`) |
| `review_completed_at` | `timestamp` | Nullable | Timestamp when poster approved or rejected |
| `rejection_reason` | `text` | `'instructions_not_followed' \| 'recording_mismatch' \| 'incomplete' \| 'low_effort'` | Discrete category selected by poster |
| `rejection_explanation` | `text` | Length 10-500 chars (or null) | Custom explanation written by poster |
| `assigned_variant_id` | `text` | Nullable | A/B testing variant ID assigned |

### 3.2 Category Label Mapping for `rejection_reason`

To present human-readable rejection categories to testers:

```typescript
export const REJECTION_REASON_LABELS: Record<string, string> = {
  instructions_not_followed: 'Instructions Not Followed',
  recording_mismatch: 'Recording / Proof Mismatch',
  incomplete: 'Incomplete Submission',
  low_effort: 'Low Effort / Quality Issues',
};
```

---

## 4. UI Design Specifications for Distinct Status Screens

Both workspace routes will render distinct visual themes and information cards based on `submission.status`.

### 4.1 Screen 1: Active Testing Screen (`status === 'in_progress'`)
- **Standard Route**:
  - `currentStep === 'agreement'`: Renders `AgreementModal` for NDA click-through consent.
  - `currentStep === 'active_task'`: Active task workspace with countdown `TimerDisplay`, `EscrowStatusBar`, assigned variant URL box (if A/B test), task checklist with duration tracker, screen recording uploader (<=100MB VP8/VP9 webm), screenshot uploader (PNG/JPG), and submit button.
- **5-Second Route**:
  - `currentStep === 'agreement'`: `AgreementModal` NDA consent.
  - `currentStep === 'cover'`: Overview of rules, impression time duration (e.g. 5s), variant URL box, and "Start Test" CTA.
  - `currentStep === 'viewing'`: Fullscreen dark canvas displaying image screenshot for 5 seconds with disabled copy/right-click/dev-tools key events.
  - `currentStep === 'questionnaire'`: Post-impression recall questionnaire with 1-5 rating buttons and response inputs.

---

### 4.2 Screen 2: Pending Review Screen (`status === 'pending_review'`)
- **Visual Palette**: Amber / Yellow (`bg-amber-50`, `border-amber-200`, `text-amber-800`, `Clock` icon).
- **Header**: `⏳ Submission Under Review`
- **Main Status Card**:
  - Icon: `<Clock className="w-6 h-6 text-amber-600" />`
  - Headline: `Submission Under Review`
  - Subtitle: *"Your feedback has been submitted and is currently being reviewed by the poster."*
  - Review Countdown / Window Badge: Show poster review deadline (e.g., *"Poster has up to 30/60 minutes to complete review"*). If `auto_release_at` is set, render a live remaining time countdown.
  - Escrow Badge: `₱[rate].00 Held in Escrow` (`bg-amber-100/70 border border-amber-200 text-amber-800 font-bold`).
- **Debrief Thread Column**: Right-hand column (2/3 width) displays `Post-Test Debrief Thread` allowing the tester to send notes or answer clarification questions.

---

### 4.3 Screen 3: Approved Screen (`status === 'approved'`)
- **Visual Palette**: Emerald / Green (`bg-emerald-50`, `border-emerald-200`, `text-emerald-800`, `CheckCircle2` icon).
- **Header**: `✅ Task Approved! Payout Credited`
- **Main Status Card**:
  - Icon: `<CheckCircle2 className="w-8 h-8 text-emerald-600" />`
  - Headline: `Task Approved!`
  - Subtitle: *"Great job! The poster reviewed and approved your test submission."*
  - Payout Credit Badge: Prominent banner stating `+₱[rate].00 Credited to Earnings` with timestamp (`review_completed_at`).
  - Action Button: Primary CTA `Return to Tester Dashboard` linking to `/dashboard/tester`.
- **Debrief Thread Column**: Retained so tester can view historical conversation or express gratitude.

---

### 4.4 Screen 4: Rejected Screen (`status === 'rejected'`)
- **Visual Palette**: Rose / Red (`bg-rose-50`, `border-rose-200`, `text-rose-900`, `XCircle` / `AlertTriangle` icon).
- **Header**: `❌ Submission Rejected`
- **Main Status Card**:
  - Icon: `<XCircle className="w-8 h-8 text-rose-600" />`
  - Headline: `Submission Rejected`
  - Subtitle: *"The poster reviewed your submission and flagged issues with the completed work."*
  - Rejection Category Pill:
    `Category: [Formatted Reason Label]` (e.g. `Instructions Not Followed` or `Incomplete Submission`).
  - Poster Explanation Quote Box:
    ```tsx
    <div className="bg-rose-50/80 border-l-4 border-rose-500 p-4 rounded-r-[8px]">
      <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block mb-1">
        Poster's Explanation:
      </span>
      <p className="text-xs text-rose-950 font-medium italic leading-relaxed">
        "{submission.rejection_explanation}"
      </p>
    </div>
    ```
  - Dispute Guidance Box:
    Information banner: *"If you believe this rejection was unjustified, you can post a clarification note in the debrief thread below. Serious disputes escalate to manual review."*
  - Action Button: Secondary button `Return to Dashboard`.
- **Debrief Thread Column**: Active debrief thread allowing tester to request clarification directly from poster.

---

## 5. Detailed Implementation Strategy & Code Changes

### 5.1 Step Machine Refactoring
Instead of collapsing `pending_review`, `approved`, and `rejected` into `'submitted'`, both files will maintain explicit `currentStep` states or branch conditionally on `submission.status` when `currentStep === 'submitted'`.

#### Proposed Step Handler Pattern:
```typescript
if (submissionData) {
  setSubmission(submissionData);
  
  if (submissionData.status === 'in_progress') {
    setCurrentStep('active_task'); // or 'cover' in 5-second test
  } else if (['pending_review', 'approved', 'rejected'].includes(submissionData.status)) {
    setCurrentStep(submissionData.status); // set exact status as step!
    await fetchComments(submissionData.id);
  } else if (submissionData.status === 'expired') {
    setCurrentStep('expired');
  }
}
```

### 5.2 Helper Component or Sub-render Functions
To keep code modular and readable in both `app/dashboard/tester/tasks/[id]/page.tsx` and `app/dashboard/tester/tasks/five-second/[id]/page.tsx`, we will introduce a status-aware render function or component for completed submissions.

#### Example Render Function Structure:
```tsx
const renderCompletedStatusCard = (submission: Submission, listing: Listing) => {
  switch (submission.status) {
    case 'approved':
      return (
        <div className="bg-white border border-emerald-200 rounded-[12px] p-6 shadow-sm text-center space-y-5 animate-fadeIn">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider inline-block mb-2">
              Approved
            </span>
            <h2 className="text-xl font-black text-gray-900">Task Approved!</h2>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed font-medium">
              The poster reviewed and accepted your feedback.
            </p>
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-[8px]">
              <span className="text-xs text-emerald-600 block font-semibold">Payout Credited</span>
              <span className="text-xl font-black text-emerald-700">+₱{listing.rate_per_tester.toFixed(2)}</span>
              {submission.review_completed_at && (
                <span className="text-[10px] text-emerald-600/80 block mt-1">
                  Released: {new Date(submission.review_completed_at).toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <Link
            href="/dashboard/tester"
            className="block w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-[8px] text-xs shadow-sm transition-all text-center"
          >
            Return to Dashboard
          </Link>
        </div>
      );

    case 'rejected':
      const reasonLabel = REJECTION_REASON_LABELS[submission.rejection_reason || ''] || submission.rejection_reason || 'Quality Issues';
      return (
        <div className="bg-white border border-rose-200 rounded-[12px] p-6 shadow-sm space-y-5 animate-fadeIn">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-100">
            <XCircle className="w-7 h-7" />
          </div>
          <div className="text-center">
            <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-rose-100 text-rose-800 uppercase tracking-wider inline-block mb-2">
              Rejected
            </span>
            <h2 className="text-xl font-black text-gray-900">Submission Rejected</h2>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              The poster flagged issues with this submission.
            </p>
          </div>

          {/* Rejection Category */}
          <div className="bg-rose-50/60 border border-rose-200/80 rounded-[8px] p-3 text-xs">
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">Reason Category</span>
            <span className="font-bold text-rose-900 text-sm">{reasonLabel}</span>
          </div>

          {/* Rejection Explanation */}
          {submission.rejection_explanation && (
            <div className="bg-rose-50/90 border-l-4 border-rose-500 p-3.5 rounded-r-[8px]">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block mb-1">
                Poster's Explanation:
              </span>
              <p className="text-xs text-rose-950 font-medium italic leading-relaxed whitespace-pre-wrap">
                "{submission.rejection_explanation}"
              </p>
            </div>
          )}

          {/* Dispute Nudge */}
          <div className="bg-gray-50 border border-gray-200 rounded-[8px] p-3 text-[11px] text-gray-600 leading-relaxed">
            <span className="font-bold text-gray-800 block mb-0.5">Need clarification?</span>
            You can send a message to the poster using the debrief thread on the right to resolve misunderstandings.
          </div>

          <Link
            href="/dashboard/tester"
            className="block w-full py-2.5 bg-gray-900 hover:bg-black text-white font-bold rounded-[8px] text-xs shadow-sm transition-all text-center"
          >
            Return to Dashboard
          </Link>
        </div>
      );

    case 'pending_review':
    default:
      return (
        <div className="bg-white border border-amber-200 rounded-[12px] p-6 shadow-sm text-center space-y-5 animate-fadeIn">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-100">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <span className="px-2.5 py-1 text-[10px] font-extrabold rounded-full bg-amber-100 text-amber-800 uppercase tracking-wider inline-block mb-2">
              Under Review
            </span>
            <h2 className="text-xl font-black text-gray-900">Submission Under Review</h2>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed font-medium">
              Your feedback is now pending poster review. The poster has up to{' '}
              <span className="font-bold text-gray-800">{listing.review_window_minutes} minutes</span> to review.
            </p>
            <p className="text-xs text-amber-700 font-bold bg-amber-50 border border-amber-200 rounded px-2.5 py-1 inline-block mt-3">
              ₱{listing.rate_per_tester.toFixed(2)} Held in Escrow
            </p>
          </div>
          <Link
            href="/dashboard/tester"
            className="block w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-[8px] text-xs shadow-sm transition-all text-center"
          >
            Return to Dashboard
          </Link>
        </div>
      );
  }
};
```

---

## 6. Actionable Implementation Checklist for Implementer

1. **Update `app/dashboard/tester/tasks/[id]/page.tsx`**:
   - Change `submissionData` status routing logic to set `currentStep` to `submissionData.status` (`'pending_review'`, `'approved'`, `'rejected'`).
   - Import `CheckCircle2`, `XCircle`, `Clock`, `AlertTriangle` from `lucide-react`.
   - Update step machine check to handle `'pending_review'`, `'approved'`, and `'rejected'` steps.
   - Render the status-aware card in the left column while preserving the Debrief Thread on the right.

2. **Update `app/dashboard/tester/tasks/five-second/[id]/page.tsx`**:
   - Change `submissionData` status routing logic to set `currentStep` to `submissionData.status` (`'pending_review'`, `'approved'`, `'rejected'`).
   - Import `CheckCircle2`, `XCircle`, `Clock`, `AlertTriangle` from `lucide-react`.
   - Update step machine check to handle `'pending_review'`, `'approved'`, and `'rejected'` steps.
   - Render the status-aware card in the left column while preserving the Debrief Thread on the right.

3. **Verify UI Consistency**:
   - Ensure color schemes match subukAn design guidelines (`DESIGN.md`).
   - Ensure responsive grid design (`grid-cols-1 md:grid-cols-3`) works seamlessly on desktop and mobile viewports.
