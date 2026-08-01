# Project: subukAn — R1, R2, R3 Feature Completion

## Architecture
Next.js (App Router), React, TypeScript, Tailwind CSS, Supabase (Auth, RLS, DB), Vitest (unit/integration), Playwright (E2E).

## Code Layout
- `app/dashboard/tester/page.tsx`: Tester dashboard listing available & claimed test slots.
- `app/dashboard/tester/tasks/[id]/page.tsx`: Standard task workspace page.
- `app/dashboard/tester/tasks/five-second/[id]/page.tsx`: 5-Second Quick Impression task workspace page.
- `08-FEATURES.md` & `02-MECHANICS.md`: Core product specs and feature matrix.
- `tests/`: Vitest unit and integration test suite.
- `tests/e2e/` or root `playwright.config.ts`: Playwright browser test specs.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Exploration & Audit | Analyze codebase, UI components, submission DB queries, 08-FEATURES.md gaps | None | DONE |
| 2 | M2: R1 Claim Button UI | Implement dynamic state-aware claim buttons in tester dashboard | M1 | DONE |
| 3 | M3: R2 Task Workspace UI | Implement distinct submission status screens in task workspaces | M1 | IN_PROGRESS |
| 4 | M4: R3 Feature Gaps | Implement identified gaps (notifications, profile info, cash-out balance) | M1 | PLANNED |
| 5 | M5: Verification & Audit | Clean build, unit tests, E2E tests, Forensic Integrity Audit | M2, M3, M4 | PLANNED |

## Interface Contracts
### Tester Dashboard ↔ Submissions DB
- Submissions table contains `status`: `'in_progress' | 'pending_review' | 'approved' | 'rejected'`.
- Submissions table contains `rejection_reason` / `rejection_category` / `rejection_explanation` (or equivalent columns).
- Listing claim button checks user's submission state for that specific listing ID and slot availability.
