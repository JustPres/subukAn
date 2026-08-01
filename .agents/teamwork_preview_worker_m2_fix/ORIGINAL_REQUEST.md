## 2026-08-01T10:17:37Z
You are Worker M2-fix refactoring Milestone 2: R1 (Context-Aware Tester Claim Button & Listings).
Working directory: c:\Users\justi\Development\subukAn\.agents\teamwork_preview_worker_m2_fix
Project root: c:\Users\justi\Development\subukAn

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Task:
1. Create `lib/utils/claim-button.ts` containing:
   - Types: `JobListing`, `SubmissionStatus`, `ButtonConfig`.
   - Helper function: `getButtonConfig(job: JobListing): ButtonConfig`.
2. Update `app/dashboard/tester/page.tsx`:
   - Import `JobListing`, `ButtonConfig`, `getButtonConfig` from `@/lib/utils/claim-button` (or relative import `../../../lib/utils/claim-button`).
   - In `fetchProfileAndListings`, add `.order('created_at', { ascending: false })` when querying user's `submissions` table so the latest submission status is matched per listing.
   - Remove exported non-page functions/types from `app/dashboard/tester/page.tsx` so Next.js App Router build check succeeds.
3. Update `tests/unit/claim_button.test.ts` to import `getButtonConfig` from `@/lib/utils/claim-button` (or `../../lib/utils/claim-button`).
4. Run `npm run build` and `npm test` using run_command to verify Next.js build succeeds cleanly without type/page export errors and all unit tests pass.
5. Log build success to `builds.log` with timestamp if build passes.
6. Write your report to `c:\Users\justi\Development\subukAn\.agents\teamwork_preview_worker_m2_fix\handoff.md` and send a message to orchestrator.
