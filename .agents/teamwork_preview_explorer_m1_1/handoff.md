# Handoff Report — Milestone 1: R1 Context-Aware Tester Claim Button & Listings

## 1. Observation
- **Target File**: `app/dashboard/tester/page.tsx`
  - Lines 26–41: `JobListing` interface lacks fields for tester submission status (`user_submission_status`).
  - Lines 235–294: `fetchProfileAndListings` queries listings and tasks, but does not correlate the authenticated user's specific submission status for each listing.
  - Lines 558–619: The claim slot button only evaluates binary capacity `const isFull = job.slots_filled >= job.slots_count`.
    - If `isFull` is true: Renders `Unclickable (Full)` (gray, disabled).
    - If `isFull` is false: Renders `Claim Slot & Start Test` (green).
- **Target Workspaces**:
  - `app/dashboard/tester/tasks/[id]/page.tsx` (lines 286–299): Checks submission status and transitions to `'active_task'` for `in_progress`, or `'submitted'` for `pending_review`, `approved`, and `rejected`.
  - `app/dashboard/tester/tasks/five-second/[id]/page.tsx` (lines 307–317): Performs identical state checking and routing for 5-second Quick Impression tasks.
- **Database Schema & RLS**:
  - `supabase/migrations/00001_initial_schema.sql` (lines 55–79): `submissions` table uses `status check (status in ('in_progress', 'pending_review', 'approved', 'rejected', 'expired'))`.
  - `supabase/migrations/00005_fix_rls_recursion.sql`: Policy `"Read submissions if owner or poster"` allows `tester_id = auth.uid()` to select their own submission rows.

---

## 2. Logic Chain
1. **Observation**: Currently, `app/dashboard/tester/page.tsx` renders either `Claim Slot & Start Test` (green) or `Unclickable (Full)` (gray) purely based on `job.slots_filled >= job.slots_count`.
2. **Reasoning**:
   - A tester with an existing `in_progress` submission sees `Claim Slot & Start Test` (or `Unclickable (Full)` if capacity is reached), causing confusion and blocking task resumption.
   - A tester with a `pending_review`, `approved`, or `rejected` submission sees generic listing states rather than their submission feedback or view details action.
3. **Deduction**:
   - To render state-aware buttons, the dashboard must fetch the tester's submissions (`select id, listing_id, status from submissions where tester_id = user.id`) and attach `user_submission_status` to each listing model.
   - The button renderer must check `user_submission_status` in order of precedence BEFORE checking listing capacity (`isFull`).
4. **Resolution**:
   - `in_progress` -> `Continue Testing →` (blue solid) -> Links to `/dashboard/tester/tasks/[id]` or `five-second/[id]`.
   - `pending_review` -> `⏳ Awaiting Review` (amber badge, disabled).
   - `approved` -> `✅ Approved — View Details` (green outline) -> Links to `/dashboard/tester/tasks/[id]` or `five-second/[id]`.
   - `rejected` -> `❌ Rejected — View Details` (red outline) -> Links to `/dashboard/tester/tasks/[id]` or `five-second/[id]`.
   - `null` / `expired` & `isFull` -> `Slots Full` (gray, disabled).
   - `null` / `expired` & open slots -> `Claim Slot & Start Test` (green solid) -> Links to `/dashboard/tester/tasks/[id]` or `five-second/[id]`.

---

## 3. Caveats
- **Read-Only Scope**: This analysis was performed in read-only investigation mode per assignment rules. Code edits to `app/dashboard/tester/page.tsx` are specified in `analysis.md` for the implementer agent to execute.
- **Offline / Mock Data**: If Supabase connection fails or local schema is uninitialized, mock listings in `AVAILABLE_JOBS` must default `user_submission_status` to `null` unless local session state overrides it.

---

## 4. Conclusion
The implementation plan for Milestone 1 (R1 Context-Aware Tester Claim Button) is fully defined, validated against project contracts (`08-FEATURES.md`, `PROJECT.md`), and compatible with existing task workspaces (`/tasks/[id]` and `/tasks/five-second/[id]`).

---

## 5. Verification Method

### 1. Build and Type Checking
Execute TypeScript compilation check:
```bash
npx tsc --noEmit
```

### 2. Unit Testing
Execute Vitest test suite:
```bash
npx vitest run tests/unit/
```

### 3. E2E Browser Testing
Execute Playwright test specs:
```bash
npx playwright test tests/e2e/tester-flow.spec.ts
```

### 4. Manual Verification Matrix
Inspect `app/dashboard/tester/page.tsx` for listings with test user logged in:
1. No submission & slots open -> Green `Claim Slot & Start Test` button.
2. Active submission (`in_progress`) -> Blue `Continue Testing →` button.
3. Pending review (`pending_review`) -> Amber `⏳ Awaiting Review` disabled badge.
4. Approved submission (`approved`) -> Green outline `✅ Approved — View Details` button.
5. Rejected submission (`rejected`) -> Red outline `❌ Rejected — View Details` button.
6. No submission & slots full -> Gray `Slots Full` disabled button.
