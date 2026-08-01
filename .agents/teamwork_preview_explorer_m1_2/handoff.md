# Handoff Report: Milestone 1 R2 — Status-Aware Tester Task Workspace UI

## 1. Observation

### File & Code Line Observations:
1. **Standard Task Workspace (`app/dashboard/tester/tasks/[id]/page.tsx`)**:
   - **Line 294-296**:
     ```typescript
     } else if (submissionData.status === 'pending_review' || submissionData.status === 'approved' || submissionData.status === 'rejected') {
       setCurrentStep('submitted');
       await fetchComments(submissionData.id);
     }
     ```
   - **Line 822-849**:
     When `currentStep === 'submitted'`, it renders a hardcoded success card:
     ```tsx
     <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
       <CheckCircle className="w-6 h-6" />
     </div>
     <div>
       <h2 className="text-xl font-black text-gray-900">Submitted!</h2>
       <p className="text-xs text-gray-500 mt-2 leading-relaxed font-medium">
         Your feedback is now pending review. The poster has up to <span className="font-bold text-gray-800">{listing.review_window_minutes} minutes</span> to review.
       </p>
     ```

2. **5-Second Quick Impression Workspace (`app/dashboard/tester/tasks/five-second/[id]/page.tsx`)**:
   - **Line 312-315**:
     ```typescript
     } else if (['pending_review', 'approved', 'rejected'].includes(submissionData.status)) {
       await fetchComments(submissionData.id);
       setCurrentStep('submitted');
     }
     ```
   - **Line 704-730**:
     When `currentStep === 'submitted'`, it renders an identical hardcoded success card stating `"Submitted! Your feedback is now pending review."`

3. **Database Schema (`supabase/migrations/00001_initial_schema.sql`)**:
   - **Line 59**:
     `status text not null default 'in_progress' check (status in ('in_progress', 'pending_review', 'approved', 'rejected', 'expired'))`
   - **Lines 67-70**:
     ```sql
     rejection_reason text check (rejection_reason in ('instructions_not_followed', 'recording_mismatch', 'incomplete', 'low_effort')),
     rejection_explanation text check (rejection_explanation is null or (char_length(rejection_explanation) >= 10 and char_length(rejection_explanation) <= 500)),
     ```

---

## 2. Logic Chain

1. **Observation**: Both `app/dashboard/tester/tasks/[id]/page.tsx` (lines 294-296) and `app/dashboard/tester/tasks/five-second/[id]/page.tsx` (lines 312-315) map `pending_review`, `approved`, and `rejected` statuses into the single state `'submitted'`.
2. **Observation**: The `'submitted'` view (lines 822-849 in standard workspace, lines 704-730 in 5-second workspace) renders a generic card with `"Submitted! Your feedback is now pending review."` regardless of the actual submission status.
3. **Logic Step**:
   - If a poster approves a submission (`status === 'approved'`), the tester currently sees "Your feedback is now pending review", failing to confirm payout release (`✅ Task Approved! Payout Credited`).
   - If a poster rejects a submission (`status === 'rejected'`), the tester currently sees "Your feedback is now pending review", completely concealing the rejection category (`rejection_reason`), the poster's explanation (`rejection_explanation`), and dispute options (`❌ Submission Rejected`).
4. **Conclusion**:
   To fulfill Milestone 1 R2, both workspace routes require refactoring of their step state logic to render distinct status cards for `pending_review`, `approved`, and `rejected` states while preserving active testing flows (`in_progress`) and the Post-Test Debrief Thread.

---

## 3. Caveats

- **Read-Only Scope**: This report is produced under read-only investigation rules. Code modifications must be executed by the Implementer agent.
- **Dispute Workflow**: Rejection dispute escalation currently uses the Post-Test Debrief Thread (`submission_comments` table). Formal dispute status tracking in a separate table is part of the v1.2 backlog.
- **Layout Integrity**: Both routes share a 2-column grid layout (`grid-cols-1 md:grid-cols-3`) when submitted. The status card occupies 1 column on the left, and the debrief thread occupies 2 columns on the right. This structural pattern must be preserved across all three submitted states.

---

## 4. Conclusion

The current codebase contains a UI blind spot where all post-submission states (`pending_review`, `approved`, `rejected`) display identical generic "Pending Review" text.

### Required Changes:
1. **Refactor step state handling**: Set `currentStep` to `submission.status` (`'pending_review'`, `'approved'`, `'rejected'`) or branch conditionally on `submission.status` in the submitted step.
2. **Implement Pending Review Screen (`⏳ Submission Under Review`)**:
   - Yellow/Amber visual theme.
   - Text explaining poster review window (30/60 mins) & escrow hold (`₱XX.XX Held in Escrow`).
3. **Implement Approved Screen (`✅ Task Approved! Payout Credited`)**:
   - Emerald/Green visual theme.
   - Confirmation badge stating payout has been credited (`+₱XX.XX Credited to Earnings`) with `review_completed_at` timestamp.
4. **Implement Rejected Screen (`❌ Submission Rejected`)**:
   - Rose/Red visual theme.
   - Human-readable rejection category (`Instructions Not Followed`, `Recording Mismatch`, `Incomplete Submission`, `Low Effort / Quality Issues`).
   - Blockquote rendering `submission.rejection_explanation` (10-500 chars).
   - Dispute guidance encouraging tester to utilize the debrief thread for clarifications.
5. **Preserve Active Testing Screens (`in_progress`)**:
   - NDA modal -> checklist/timed display -> submission submission flow.

---

## 5. Verification Method

### 1. File Inspection
Check that `app/dashboard/tester/tasks/[id]/page.tsx` and `app/dashboard/tester/tasks/five-second/[id]/page.tsx` render distinct UI blocks for `pending_review`, `approved`, and `rejected`.

### 2. Command Verification
Run build and lint checks after implementation:
```powershell
npm run lint
npm run build
```

### 3. Invalidation Conditions
The solution is invalid if:
- An approved submission displays "pending review" text.
- A rejected submission fails to display `rejection_reason` or `rejection_explanation`.
- The debrief thread component is hidden or inaccessible on approved/rejected status screens.
