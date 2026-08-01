## 2026-08-01T10:07:49Z
<USER_REQUEST>
You are Worker 1 implementing Milestone 2: R1 (Context-Aware Tester Claim Button & Listings).
Working directory: c:\Users\justi\Development\subukAn\.agents\teamwork_preview_worker_m2
Project root: c:\Users\justi\Development\subukAn
Scope document: c:\Users\justi\Development\subukAn\.agents\orchestrator\PROJECT.md
Explorer findings reference: c:\Users\justi\Development\subukAn\.agents\teamwork_preview_explorer_m1_1\handoff.md and analysis.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Task:
1. Update `c:\Users\justi\Development\subukAn\app\dashboard\tester\page.tsx`:
   - Fetch the authenticated user's active/past submissions from Supabase (`submissions` table where `tester_id = user.id`).
   - Map each listing to include its `user_submission_status` (`'in_progress' | 'pending_review' | 'approved' | 'rejected' | null`).
   - Dynamically render the listing's claim/action button based on the user's specific submission state and listing capacity:
     - `Claim Slot & Start Test` (green bg, active link to task workspace) if no submission exists and slots are available.
     - `Continue Testing →` (blue bg, active link to task workspace) if `user_submission_status === 'in_progress'`.
     - `⏳ Awaiting Review` (amber/yellow, disabled badge) if `user_submission_status === 'pending_review'`.
     - `✅ Approved — View Details` (green outline button, active link to workspace) if `user_submission_status === 'approved'`.
     - `❌ Rejected — View Details` (red outline button, active link to workspace) if `user_submission_status === 'rejected'`.
     - `Slots Full` (gray, disabled badge) if no submission exists and `claimed_slots >= total_slots`.
2. Ensure user submission status takes precedence over listing capacity (a tester with an existing submission must see their submission state button, even if total listing slots are full).
3. Run `npm run build` and `npm test` using run_command to verify compilation and tests pass cleanly. If lint or TypeScript errors occur, fix them.
4. If appropriate, write/update unit tests in `tests/` for the button configuration logic.
5. Write your implementation report to `c:\Users\justi\Development\subukAn\.agents\teamwork_preview_worker_m2\handoff.md` and send a message to the orchestrator.
</USER_REQUEST>
