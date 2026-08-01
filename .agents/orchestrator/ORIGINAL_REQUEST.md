# Original User Request

## Initial Request — 2026-08-01T18:05:26Z

Complete the feature set for both Poster and Tester roles by implementing key missing UX and transactional flows as outlined in the codebase documentation (08-FEATURES.md and 02-MECHANICS.md).

Working directory: c:\Users\justi\Development\subukAn
Integrity mode: development

## Requirements

### R1. Context-Aware Tester Claim Button & Listings
- Update the tester dashboard (app/dashboard/tester/page.tsx) so the "Claim Slot & Start Test" button updates dynamically based on the current user's submission state for that listing.
- The button must display:
  - `Claim Slot & Start Test` (green) if no submission exists.
  - `Continue Testing →` (blue) if submission is in progress.
  - `⏳ Awaiting Review` (amber, disabled) if pending review.
  - `✅ Approved — View Details` (green outline) if approved.
  - `❌ Rejected — View Details` (red outline) if rejected.
  - `Slots Full` (gray, disabled) if slots are full and user hasn't claimed.

### R2. Status-Aware Tester Task Workspace UI
- Update the tester task workspaces (app/dashboard/tester/tasks/[id]/page.tsx and app/dashboard/tester/tasks/five-second/[id]/page.tsx) to display distinct screens for each submission status instead of always showing the generic "Submitted!" screen.
- Show rejection category and explanation if the status is `rejected`.

### R3. Comprehensive Feature Review and Gaps Audit
- Review the implemented features against 08-FEATURES.md and list/implement any low-hanging gaps (e.g. notifications list, profile info, cash-out, total balance display).

## Acceptance Criteria

### Task Completion & Status Flows
- [ ] Claim buttons on the tester dashboard correctly reflect the user's specific submission status for each listing.
- [ ] Standard and 5-second Quick Impression task pages show distinct approved, pending review, and rejected states.
- [ ] Rejected states clearly display the rejection reason and explanation provided by the poster.
- [ ] The app builds cleanly (`npm run build`) and all tests pass (`npm test` and `npx playwright test`).

## Generation 2 Dispatch — 2026-08-01T18:37:59Z

Concrete Action Plan for Generation 2:
1. Complete Milestone 3 polish items:
   - Dispatch Worker M3-fix to apply rate_per_tester fallback in `lib/utils/workspace-status.ts`, `break-words` in `components/shared/WorkspaceStatusCard.tsx`, and locator update in `tests/e2e/tester-flow.spec.ts:90`.
   - Mark Milestone 3: DONE in `progress.md` and `PROJECT.md`.
2. Execute Milestone 4 (R3 Feature Review & Gaps Implementation):
   - Dispatch Worker M4 to implement low-hanging feature gaps (Notification Center UI/Drawer, Tester Dashboard Submissions/Earnings tabs in `app/dashboard/tester/page.tsx`, Profile Settings Modal, Rejection Dispute UI).
   - Dispatch 2 Reviewers, 2 Challengers, and 1 Forensic Auditor for M4.
   - Mark Milestone 4: DONE in `progress.md` and `PROJECT.md`.
3. Execute Milestone 5 (Final Verification & Audit):
   - Run `npm run build`, `npm test`, `npx playwright test`.
   - Run Forensic Integrity Audit (`teamwork_preview_auditor`).
   - Confirm all acceptance criteria from `ORIGINAL_REQUEST.md` are met.
   - Report final completion to parent (1b3e253c-4703-44f3-a81d-221f3dd8bb0b) and user.
