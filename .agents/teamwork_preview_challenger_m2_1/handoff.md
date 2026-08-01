# Verification & Stress-Test Handoff Report: Milestone 2 (R1)

## 1. Observation

### Command Executions & Results
- **Unit Tests (`npm test`)**: 
  - Command: `npm test`
  - Output: All 70 tests passed across 7 test files (including 8 tests in `tests/unit/claim_button.test.ts` and 10 new edge case tests in `tests/unit/claim_button_edge_cases.test.ts`).
  - Result: **PASS** (Unit test logic for `getButtonConfig` passes isolated checks).

- **Production Build (`npm run build`)**:
  - Command: `npm run build`
  - Exit code: `1`
  - Verbatim Output Error:
    ```
    .next/types/app/dashboard/tester/page.ts:8:13
    Type error: Type 'OmitWithTag<typeof import("C:/Users/justi/Development/subukAn/app/dashboard/tester/page"), "config" | "generateStaticParams" | "revalidate" | "dynamic" | "dynamicParams" | "fetchCache" | ... 7 more ... | "generateViewport", "">' does not satisfy the constraint '{ [x: string]: never; }'.
      Property 'getButtonConfig' is incompatible with index signature.
        Type '(job: JobListing) => ButtonConfig' is not assignable to type 'never'.
    ```
  - Result: **FAIL** (Next.js App Router strict page validator fails build due to named export `getButtonConfig` in `app/dashboard/tester/page.tsx`).

### Codebase Observations
1. **Named Export in Page Entry (`app/dashboard/tester/page.tsx:52`)**:
   - `export function getButtonConfig(job: JobListing): ButtonConfig`
   - Direct export from a Next.js App Router `page.tsx` file violates Next.js route entry conventions and fails TypeScript type-checking during `next build`.

2. **Non-deterministic Multiple Submissions Match (`app/dashboard/tester/page.tsx:335`)**:
   - Lines 320-323: `const { data: userSubsData } = await supabase.from('submissions').select('id, listing_id, status').eq('tester_id', user.id)`
   - Line 335: `const userSub = userSubmissions.find((s) => s.listing_id === listing.id && s.status !== 'expired')`
   - `userSubmissions.find()` returns the first array element without ordering. If a tester has an older `rejected` or completed submission record alongside a newer `in_progress` record, `find()` can return the older `rejected` submission depending on database insertion order, blocking access to the active test.

3. **Demographic Filter Hides Active/Claimed Tasks (`app/dashboard/tester/page.tsx:361-374`)**:
   - Lines 361-374 filter out listings from the UI array `listings` if profile demographic fields do not match `listing.target_...`.
   - If a tester claims a slot (`in_progress` or `pending_review`) and subsequently updates their demographics profile, the listing is excluded from `listings`, making their active task unreachable from the dashboard.

4. **Edge Case Verification for `getButtonConfig`**:
   - `slots_count: 0`, `slots_filled: 0`, `user_submission_status: null` -> Returns `Slots Full` (disabled: true, href: '#').
   - `slots_count: 0` with `user_submission_status: 'in_progress'` -> Returns `Continue Testing →` (disabled: false, href: `/dashboard/tester/tasks/${id}`).
   - `slots_count: 0` with `user_submission_status: 'pending_review'` -> Returns `⏳ Awaiting Review` (disabled: true, href: '#').
   - `slots_count: 0` with `user_submission_status: 'approved'` -> Returns `✅ Approved — View Details` (disabled: false, href: `/dashboard/tester/tasks/${id}`).
   - `slots_count: 0` with `user_submission_status: 'rejected'` -> Returns `❌ Rejected — View Details` (disabled: false, href: `/dashboard/tester/tasks/${id}`).
   - Quick impression routing (`is_quick_impression: true`) correctly directs to `/dashboard/tester/tasks/five-second/${id}` across all active states.

---

## 2. Logic Chain

1. **Build Failure Chain**:
   - Next.js App Router automatically generates page validator types (`.next/types/app/.../page.ts`) during build.
   - `page.ts` enforces that exported properties from `page.tsx` match allowed route segment options (e.g. `default`, `revalidate`, `dynamic`).
   - `app/dashboard/tester/page.tsx` exports `getButtonConfig`, `JobListing`, and `ButtonConfig`.
   - Next.js type check flags `getButtonConfig` as incompatible with the index signature (`[x: string]: never`).
   - Therefore, `npm run build` exits with code 1. Moving `getButtonConfig` and types to a standalone utility (e.g. `lib/utils/claim-button.ts`) resolves this error without altering logic.

2. **Multiple Submissions Chain**:
   - Supabase query on `submissions` table selects all rows for `tester_id` without an `order by` clause.
   - The frontend uses `userSubmissions.find(...)` which retrieves the first match in array order.
   - For a tester with multiple submission records for the same listing (e.g. historic `rejected` + active `in_progress`), the order returned by PostgreSQL is non-deterministic.
   - If `rejected` appears first in the array, `userSubmissionStatus` becomes `'rejected'`, overriding the active `'in_progress'` status and presenting the wrong button state.
   - Sorting by `created_at desc` or prioritizing active submission statuses before calling `.find()` fixes this ambiguity.

3. **Demographic Filtering Chain**:
   - Demographic filtering (lines 361-374) filters listings solely based on current `profileData` properties.
   - Active user submissions (`in_progress`, `pending_review`, `approved`, `rejected`) are mapped onto listings *before* demographic filtering occurs.
   - If demographic matching fails, the listing is dropped from the returned array regardless of `user_submission_status`.
   - As a result, a user with an active task who updates demographic profile lose UI access to continue or review their submission.
   - Correct logic should bypass demographic exclusion when `user_submission_status` is truthy.

---

## 3. Caveats

- **Database RLS Policies**: Database-level constraints for `submissions` and `listings` were tested via mocked Supabase clients and Vitest unit suites; live Supabase instance testing requires a running DB connection.
- **Review-Only Role**: Per role instructions, implementation fixes for `app/dashboard/tester/page.tsx` were not directly written into the source file by Challenger 1, but clear resolution paths have been provided.

---

## 4. Conclusion

- **Overall Status**: **FAILED BUILD / REQUIRES REFACTORED EXPORT**
- **Critical Defects Identified**:
  1. **Build Failure**: `npm run build` fails because `getButtonConfig` is exported from `app/dashboard/tester/page.tsx`. Must move `getButtonConfig` and its type definitions to `lib/utils/claim-button.ts` (or similar helper file) and import them into `page.tsx` and unit tests.
  2. **Multi-submission Non-determinism**: Unordered Supabase submission retrieval combined with `Array.prototype.find()` can cause stale submission statuses (e.g., `rejected`) to mask active `in_progress` tests.
  3. **Demographic Lockout**: Updating profile demographics can prematurely hide claimed active tasks from the dashboard grid.
- **Pure Function Correctness**: `getButtonConfig` logic itself correctly handles 0 total slots, full slots, and submission status precedence when called with valid `JobListing` objects.

---

## 5. Verification Method

To independently verify these findings, run the following commands in project root:

1. **Verify Production Build Failure**:
   ```bash
   npm run build
   ```
   *Expected Output*: Type error in `.next/types/app/dashboard/tester/page.ts` complaining about property `getButtonConfig`.

2. **Verify Unit & Edge Case Tests**:
   ```bash
   npm test
   ```
   *Expected Output*: 7 test files pass, including `tests/unit/claim_button.test.ts` and `tests/unit/claim_button_edge_cases.test.ts`.

3. **Verify Refactoring Plan**:
   - Extract `getButtonConfig`, `JobListing`, `ButtonConfig` from `app/dashboard/tester/page.tsx` into `lib/utils/claim-button.ts`.
   - Update imports in `app/dashboard/tester/page.tsx`, `tests/unit/claim_button.test.ts`, and `tests/unit/claim_button_edge_cases.test.ts`.
   - Re-run `npm run build` to confirm build succeeds with exit code 0.
