# Comprehensive Feature Review, Gaps Audit & Test Suite Analysis (R3 Baseline)

**Agent:** Explorer 3  
**Milestone:** M1 - Exploration & Audit (R3 Comprehensive Review & Test Suite Baseline)  
**Working Directory:** `c:\Users\justi\Development\subukAn\.agents\teamwork_preview_explorer_m1_3`  
**Project Root:** `c:\Users\justi\Development\subukAn`  
**Date:** 2026-08-01  

---

## Executive Summary

This audit evaluates the current state of the **subukAn** codebase against the product specification documents `08-FEATURES.md` and `02-MECHANICS.md`. It also conducts a thorough audit of the existing Vitest unit/integration test suite and Playwright E2E test setup.

The codebase is well-structured using Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase JS, Vitest, and Playwright. The core listing creation, escrow calculation, 5-second quick impression test, A/B comparative routing, first-click heatmap rendering, and PayMongo GCash payout API integration are functional and covered by unit/integration/E2E tests.

However, several **key low-hanging feature gaps (R3)** and **test suite enhancements** were identified across both Poster and Tester user flows. Most notably:
1. **Notification Center UI & State** is missing for both Poster and Tester roles.
2. **Tester Dashboard "My Submissions" & "Earnings / Payout History" Views** are missing (the dashboard currently only shows Available Testing Slots, leaving testers unable to track submission review statuses, rejection details, or payout logs).
3. **Rejection Dispute UI & Flow** for testers is missing.
4. **Poster Listing Duplication ("Repost") & 1-Slot Preview Round UI Nudge** are missing.
5. **Profile Settings / Account Details Display** is missing outside of demographic targeting.

---

## 1. Feature Matrix Audit (`08-FEATURES.md` & `02-MECHANICS.md` vs Codebase)

### 1.1 Poster Flow Feature Matrix

| Feature Specification (`08-FEATURES.md`) | Codebase Implementation Status | Source File Location | Identified Gap / Missing Detail |
|---|---|---|---|
| **Create Listing** (title, description, rate ₱50–1000+, questions, 30/60 min review window) | **Implemented** | `app/dashboard/poster/page.tsx` | Missing explicit "Site URL" field in form (currently title & description only). |
| **Auto-Computed Slot Math** (`Total Budget = Rate × Slots`) | **Implemented** | `app/dashboard/poster/page.tsx`, `lib/validation/schemas.ts` | Validated strictly via Zod schema refinement. |
| **1-Slot Preview Round** | **Partially Implemented** | `lib/validation/schemas.ts`, `app/dashboard/poster/page.tsx` | Schema permits `slots_count = 1`, but there is no prominent UI button/nudge encouraging posters to test a 1-slot preview round first. |
| **Listing Statuses & Progress** (`open`, `filling`, `review`, `released`, `expired`, slot fill count) | **Implemented** | `app/dashboard/poster/page.tsx`, `components/shared/EscrowStatusBar.tsx` | Table shows slot fill counts (e.g. `3 of 5 filled`) and status badges. Status badges hardcode generic Tailwind colors instead of `DESIGN.md` pastel status tints. |
| **Duplicate / Repost Listing** | **Missing** | N/A | No "Duplicate Listing" or "Repost" button on Poster Dashboard table or detail page. |
| **Review & Payment Release** (Individual submission review, video, images, metrics, release payment) | **Implemented** | `app/dashboard/poster/listings/[id]/submissions/[submissionId]/page.tsx` | Fully functional with signed media URLs, difficulty rating 1–5, completion status, `/api/payout` trigger. |
| **Reject Submission** (Reason dropdown + 10–500 char explanation) | **Implemented** | `app/dashboard/poster/listings/[id]/submissions/[submissionId]/page.tsx` | Modal enforces reason dropdown + text explanation. Optional voice/video attachment mentioned in spec is missing. |
| **Escrow Security Ledger** | **Implemented** | `app/dashboard/poster/page.tsx` | Displays total escrow funds locked, active listing count, PayMongo status. |
| **Auto-Release Rule & Countdown** | **Implemented** | `app/dashboard/poster/listings/[id]/submissions/[submissionId]/page.tsx` | Live countdown timer displays remaining review time before auto-release trigger. |
| **Insight Report & Analytics** (Metrics summary, A/B testing, heatmap, benchmarking) | **Implemented** | `app/dashboard/poster/listings/[id]/page.tsx` | A/B comparative metrics, first-click heatmap canvas, version benchmark comparison graphs implemented. |
| **Notification Center** (Review reminders, auto-release notices, disputes) | **Missing** | N/A | No notification bell icon, drawer, or list UI on Poster Dashboard or Sidebar. |
| **Account & Spend History** | **Missing** | N/A | No dedicated spend history/receipts page or profile settings modal for posters. |

---

### 1.2 Tester Flow Feature Matrix

| Feature Specification (`08-FEATURES.md`) | Codebase Implementation Status | Source File Location | Identified Gap / Missing Detail |
|---|---|---|---|
| **Browse Teasers & Public Listings** | **Implemented** | `app/dashboard/tester/page.tsx` | Shows available task cards, rewards, slot availability, deliverable tags. |
| **Onboarding & Demographics Setup** | **Implemented** | `app/dashboard/tester/page.tsx` | "Configure Demographics" modal supports age group, gender, employment, tech literacy, accessibility accommodations. |
| **Phone Number Verification** | **Partially Implemented** | `app/api/auth/verify-phone/route.ts`, `app/dashboard/tester/page.tsx` | Backend route exists, and UI displays "Verified GCash Receiver", but no interactive modal exists for unverified users to verify phone number. |
| **Claiming Slot & NDA Consent** | **Implemented** | `components/shared/AgreementModal.tsx`, `app/dashboard/tester/tasks/[id]/page.tsx` | Requires scroll-to-bottom before enabling Accept button. Slot is claimed immediately upon entering workspace. |
| **Task Execution & Timers** | **Implemented** | `components/shared/TimerDisplay.tsx`, `app/dashboard/tester/tasks/[id]/page.tsx` | Persistent timer display, structured metrics (difficulty 1–5, completion Y/N, time on task), anti-copy protection. |
| **Media Attachments** (Recording ≤100MB, Screenshots) | **Implemented** | `app/dashboard/tester/tasks/[id]/page.tsx`, `app/api/uploads/route.ts` | MediaRecorder API screen recording + signed upload URLs. Enforces 100MB limit. |
| **5-Second Quick Impression Test** | **Implemented** | `app/dashboard/tester/tasks/five-second/[id]/page.tsx` | Timed 5s visual impression display, visual recall questionnaire, first-click heatmap coordinate capture, anti-screenshot/anti-copy events. |
| **Post-Test Debrief Thread** | **Implemented** | `app/dashboard/tester/tasks/[id]/page.tsx`, `app/dashboard/poster/listings/[id]/submissions/[submissionId]/page.tsx` | Comment thread between tester and poster implemented on both workspace and review screens. |
| **Submission Statuses** (`pending_review`, `released`, `rejected`, `expired`) | **Partially Implemented** | `app/dashboard/tester/page.tsx` | Status screens exist after submitting, BUT there is **NO "My Submissions" list** on the Tester Dashboard to check past submission statuses. |
| **Rejection Reason & Dispute Path** | **Missing on Tester Dashboard** | N/A | Tester cannot view rejection reasons or submit a dispute from their dashboard because "My Submissions" list is missing. |
| **Earnings History & Balance Display** | **Partially Implemented** | `app/dashboard/tester/page.tsx` | Total earnings balance displays ₱ amount, BUT no detailed payout transaction history table exists. |
| **Withdraw / Cash Out Earnings** | **Implemented** | `app/dashboard/tester/page.tsx`, `app/api/payout/route.ts` | Modal validates 11-digit PH mobile number starting with `09` and calls `/api/payout`. |
| **Notification Center** (Slot reminders, auto-stop, payment released, rejection notices) | **Missing** | N/A | No notification center UI for testers. |

---

## 2. Test Suite Baseline Audit

### 2.1 Vitest Unit & Integration Tests Audit

The Vitest configuration (`vitest.config.ts`) uses Node environment with alias path `@/` mapping to project root. Test files reside in `tests/unit/` and `tests/integration/`.

#### Existing Coverage:
- `tests/unit/error.test.ts`: 7 test cases covering `sanitizeDatabaseError` utility (null fallback, custom fallback, safe error messages, database schema keywords, unique constraint messages, RLS policy violations).
- `tests/unit/payment.test.ts`: 10 test cases covering PayMongo utilities (`createPaymentLink`, `processGCashPayout`, `verifyWebhookSignature` for sandbox and live modes, HMAC SHA-256 verification).
- `tests/unit/validation.test.ts`: 15 test cases covering Zod schemas (`createListingSchema`, `taskResponseSchema`, `submitTestResponseSchema`, rate tiers, slot bounds, escrow budget calculation, review window, A/B variants sum to 100, accessibility tags, heatmap coordinates).
- `tests/integration/cron.test.ts`: 5 test cases covering `GET /api/cron/auto-release` (CRON_SECRET bearer token auth, Vercel cron header, zero expired submissions, processing expired submissions with payout ledger updates, idempotency skip).
- `tests/integration/payout.test.ts`: 6 test cases covering `POST /api/payout` (Zod input validation, 400 for bad UUID/amount, 401 missing/invalid auth, 404 missing submission, 403 forbidden poster check, 200 successful payout processing).

#### Gaps in Vitest Suite:
1. **No tests for Notifications API / helper functions.**
2. **No tests for Profile Demographics / Settings update logic.**
3. **No tests for Listing Duplication / Repost pre-fill utility.**
4. **No component unit tests** (e.g. testing `EscrowStatusBar`, `TimerDisplay`, `AgreementModal` rendering using `@testing-library/react` or `jsdom`).

---

### 2.2 Playwright E2E Test Suite Audit

The Playwright configuration (`playwright.config.ts`) runs against `http://localhost:3000` with 1 worker, 60s timeout, and Chromium browser.
Crucially, Playwright overrides environment variables to target the local in-memory Mock Supabase API route (`app/api/mock-supabase/[[...path]]/route.ts`):
- `NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:3000/api/mock-supabase'`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key'`
- `SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key'`

#### Existing Spec Coverage:
- `tests/e2e/poster-flow.spec.ts`: Tests poster authentication bypass, creating a listing with title, description, rate 200, 5 slots, 5-second quick impression, A/B testing variants, demographic filters, checking mock PayMongo checkout link generation, and verifying listing row in poster dashboard table.
- `tests/e2e/tester-flow.spec.ts`: Tests tester authentication bypass, opening/closing demographic configuration modal, creating a 5-second quick impression mock listing, navigating to `/dashboard/tester/tasks/five-second/[id]`, scrolling NDA agreement modal to enable Accept button, clicking start 5s test, recording first-click heatmap coordinates on image, filling questionnaire, selecting 1-5 rating, submitting test output, and posting a debrief comment.

#### Mock Supabase Route Capabilities (`app/api/mock-supabase/[[...path]]/route.ts`):
The mock route uses `globalThis.mockDb` with in-memory maps for `users`, `profiles`, `listings`, `tasks`, `submissions`, `taskResponses`, `submissionComments`.
It supports GET, POST, PATCH, PUT, DELETE operations for Supabase Auth admin/user routes, profiles, listings, tasks, submissions, task_responses, submission_comments, and payouts.

#### Gaps in Playwright E2E Suite:
1. **Standard Task Workspace E2E Spec**: Currently, only 5-second quick impression task workspace (`/dashboard/tester/tasks/five-second/[id]`) has E2E test coverage. Standard task workspace (`/dashboard/tester/tasks/[id]`) with screen recording / screenshot upload is not tested in E2E.
2. **Poster Review & Payout E2E Spec**: No E2E spec tests the poster navigating to `/dashboard/poster/listings/[id]/submissions/[submissionId]`, reviewing submission evidence, clicking "Approve & Release Payout" (or "Reject Submission"), and verifying payout status update.
3. **Tester My Submissions & Cash-out E2E Spec**: No E2E spec tests a tester navigating to their My Submissions list, checking submission status, or opening the Cash-Out modal to request a GCash payout.

---

## 3. Concrete Recommendations for R3 Feature Implementations

To close all identified low-hanging R3 feature gaps and fulfill `08-FEATURES.md` requirements, the following concrete implementations are recommended:

### 3.1 Feature Recommendation 1: Notification Center UI & State (`components/shared/NotificationCenter.tsx`)
- **Description:** A universal notification bell component with an unread badge counter and popover drawer listing recent notifications for both Posters and Testers.
- **Notification Types:**
  - `review_reminder`: Reminds poster that a submission requires review before auto-release.
  - `auto_release_notice`: Informs poster/tester that payout was auto-released due to window expiration.
  - `payment_released`: Informs tester that poster approved their submission and released GCash funds.
  - `rejection_notice`: Informs tester that their submission was rejected, with link to view reason.
  - `dispute_update`: Informs tester/poster of dispute status updates.
- **Integration Points:** Add `NotificationCenter` into the top header of `DashboardLayout.tsx` and mobile/desktop sidebar header.

### 3.2 Feature Recommendation 2: Tester Dashboard "My Submissions" & "Payout History" Tabs
- **Description:** Enhance `app/dashboard/tester/page.tsx` with a multi-tab interface:
  1. `Available Tasks`: Existing grid of open listings.
  2. `My Submissions`: Table showing all claimed/submitted slots by the tester with listing title, reward, submission status (`pending_review`, `approved`, `rejected`, `expired`), auto-release countdown timer, rejection reason (if rejected), and a "Dispute Rejection" button.
  3. `Earnings & Payout History`: Total balance card, "Request GCash Payout" modal trigger, and a transaction history table showing past payouts (`payout_id`, `amount`, `status`, `processor_payout_id`, `date`).

### 3.3 Feature Recommendation 3: Rejection Dispute Flow for Testers (`components/shared/DisputeModal.tsx`)
- **Description:** Allow testers to view poster rejection feedback on the "My Submissions" tab and open a "Dispute Rejection" modal to submit a counter-explanation.
- **Mechanism:** Updates submission status or logs a record to `submission_disputes` table, escalating the rejection to founder/manual review.

### 3.4 Feature Recommendation 4: Poster "Duplicate Listing" & 1-Slot Preview Nudge
- **Description:**
  1. **Duplicate Listing Button:** Add a "Duplicate" button in `PosterDashboard` (`app/dashboard/poster/page.tsx`) table rows. Clicking pre-fills the "Create New Listing" modal with title, description, rate, questions, and demographic settings of a past listing.
  2. **1-Slot Preview Nudge:** Add a prominent "Create 1-Slot Preview Round" button in the Create Listing modal that pre-sets `slots_count = 1` and adds a subtle badge ("Sanity check your test setup before committing full budget").

### 3.5 Feature Recommendation 5: Profile Info & Settings Modal (`components/shared/ProfileSettingsModal.tsx`)
- **Description:** A dedicated account settings modal accessible from `DashboardSidebar.tsx` allowing both Posters and Testers to view/edit their profile info (full name, email, role badge, phone verification status, device preferences).

---

## 4. Concrete Recommendations for Test Suite Enhancements

### 4.1 Vitest Unit / Integration Additions
1. **Notifications Unit Tests (`tests/unit/notifications.test.ts`):**
   - Test notification filtering, unread count calculations, and date formatting.
2. **Profile & Duplication Unit Tests (`tests/unit/poster-helpers.test.ts`):**
   - Test listing duplication helper functions (copying questions, resetting slots, clearing listing ID).
3. **Dispute Validation Tests (`tests/unit/dispute-validation.test.ts`):**
   - Test dispute counter-explanation length validation (min 10 chars, max 500 chars).

### 4.2 Playwright E2E Additions
1. **Full Poster Review & Payout E2E Spec (`tests/e2e/poster-review-flow.spec.ts`):**
   - Step 1: Create a mock submission in `pending_review` status.
   - Step 2: Poster logs in, navigates to `/dashboard/poster/listings/[id]/submissions/[submissionId]`.
   - Step 3: Verifies video player / screenshot evidence, answers, and metrics.
   - Step 4: Clicks "Approve & Release Payout" and confirms modal.
   - Step 5: Asserts status badge updates to `Approved` and payout ledger is displayed.
2. **Tester My Submissions & Payout E2E Spec (`tests/e2e/tester-submissions-flow.spec.ts`):**
   - Step 1: Tester logs in to `/dashboard/tester`.
   - Step 2: Switches to "My Submissions" tab, verifies claimed/submitted slot status.
   - Step 3: Switches to "Earnings & Payout History" tab, clicks "Request GCash Payout", fills GCash number `09171234567`, submits, and asserts success screen.
