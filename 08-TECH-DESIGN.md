---
version: 1.0
name: tech-design
description: Technical Design Blueprint (v1.0 Pre-planning) for the subukAn platform.
---

# Technical Design Blueprint (v1.0 Pre-planning)

This document establishes the official technical design, database architecture, security constraints, and data validation rules for the **subukAn** platform (v0.1 Manual Pilot & v1.0 Core).

---

## 1. Next.js App Router Structure

The application follows the Next.js App Router convention with TypeScript. Reusable UI components, hooks, validation logic, and third-party payment wrappers are cleanly separated.

```text
subukan-app/
├── app/
│   ├── layout.tsx                      # Root layout (Inter font, Tailwind variables)
│   ├── page.tsx                        # Public landing page (marketing, overview, role selector)
│   ├── providers.tsx                   # React Query, Theme Providers, and Supabase Auth Provider
│   ├── dashboard/
│   │   ├── layout.tsx                  # Dashboard sidebar & top navigation (Notion-style, persistent header)
│   │   ├── page.tsx                    # Role-based routing gate (directs to poster or tester home)
│   │   ├── poster/
│   │   │   ├── page.tsx                # Poster dashboard (escrow summaries, listing history, quick stats)
│   │   │   └── listings/
│   │   │       ├── page.tsx            # View and manage all listings owned by poster
│   │   │       ├── new/
│   │   │       │   └── page.tsx        # Listing creation form (validates rate tiers, budget math)
│   │   │       └── [id]/
│   │   │           ├── page.tsx        # Specific listing details: structured metrics summary, overall progress
│   │   │           └── submissions/
│   │   │               └── [submissionId]/
│   │   │                   └── page.tsx # Review screen for a single tester's response (Accept/Reject buttons with friction steps)
│   │   └── tester/
│   │       ├── page.tsx                # Tester dashboard (available tasks, total earnings, active slots count)
│   │       └── tasks/
│   │           ├── page.tsx            # Task browser (filters, rates, slots open)
│   │           └── [id]/
│   │               └── page.tsx        # Active task workspace (Agreement modal, persistent timer, question sheet, native screen recorder)
│   └── api/
│       ├── payout/
│       │   └── route.ts                # Endpoint to request or process payouts (idempotency checks, PayMongo/Xendit payload construction)
│       ├── webhooks/
│       │   └── paymongo/
│       │       └── route.ts            # Payment & payout webhook receiver (verifies signatures, triggers database status updates)
│       └── uploads/
│           └── route.ts                # Endpoint to request signed upload URLs (enforces size ≤ 100MB and MIME types on the server)
├── components/
│   ├── ui/                             # shadcn/ui custom components (8px/12px border radius, Notion-inspired colors)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   └── textarea.tsx
│   └── shared/
│       ├── EscrowStatusBar.tsx         # Notion-style indicator (e.g., "₱500 held — 3 of 5 slots filled")
│       ├── TimerDisplay.tsx            # Top-sticky countdown timer for testers (notifies when session auto-stops)
│       ├── AgreementModal.tsx          # Agreement modal (scroll-to-bottom triggers accept button activation, plain language NDA summary)
│       └── SubmitButton.tsx            # Submit action button (remains disabled until all required questions/metrics are complete)
├── hooks/
│   ├── useScreenRecorder.ts            # MediaRecorder wrapper that captures browser canvas/tabs (enforces 100MB limit locally)
│   ├── useTimer.ts                     # Handles countdown logic, window-level focus tracking, and auto-submit hooks
│   └── useEscrow.ts                    # Local calculator for Rate × Slots to lock in escrow inputs
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Client-side Supabase connection helper
│   │   └── server.ts                   # Server-side / Route Handler Supabase connection wrapper
│   ├── validation/
│   │   └── schemas.ts                  # Zod validation rules (shared between client-side forms and API routes)
│   └── payment/
│       └── paymongo.ts                 # Server-only wrappers to interact with PayMongo/Xendit APIs
├── types/
│   └── index.ts                        # Shared TypeScript interfaces (Profiles, Submissions, Tasks, Ratings)
├── middleware.ts                       # Navigation middleware (verifies auth state, prevents route cross-contamination between posters and testers)
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## 2. Supabase PostgreSQL Schema

This DDL script creates the database schema, foreign relationships, and strict check constraints to match the financial and structural requirements of `02-MECHANICS.md`.

```sql
-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
-- Captures system identity. Synchronized with auth.users via triggers.
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null check (role in ('poster', 'tester')),
  full_name text not null,
  avatar_url text,
  device_type text check (device_type in ('mobile', 'desktop', 'both')),
  tech_comfort_level text check (tech_comfort_level in ('student_dev', 'casual_user', 'non_technical')),
  phone_verified boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. LISTINGS TABLE
-- Stores tasks created by posters and funded with escrow.
create table public.listings (
  id uuid default gen_random_uuid() primary key,
  poster_id uuid references public.profiles(id) on delete cascade not null,
  title text not null check (char_length(title) >= 5 and char_length(title) <= 100),
  description text not null check (char_length(description) >= 20 and char_length(description) <= 2000),
  rate_per_tester integer not null check (rate_per_tester in (50, 100, 200, 300, 400, 500, 1000, 1100)),
  slots_count integer not null check (slots_count = 1 or slots_count >= 3),
  total_budget integer not null,
  review_window_minutes integer not null check (review_window_minutes in (30, 60)),
  status text not null default 'open' check (status in ('open', 'filling', 'review', 'released', 'expired')),
  escrow_payment_ref text, -- Reference from PayMongo/Xendit transaction
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Enforce Budget = Rate x Slots
  constraint budget_match check (total_budget = rate_per_tester * slots_count)
);

-- 3. TASKS TABLE
-- Holds individual steps/questions associated with a listing.
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  order_index integer not null,
  question_text text not null check (char_length(question_text) >= 5 and char_length(question_text) <= 500),
  requires_recording boolean not null default false,
  requires_image boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Prevent index overlaps within a single listing
  unique (listing_id, order_index)
);

-- 4. SUBMISSIONS TABLE
-- Links testers to listings they joined and worked on.
create table public.submissions (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  tester_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'in_progress' check (status in ('in_progress', 'pending_review', 'approved', 'rejected', 'expired')),
  
  -- Timestamps for monitoring
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  submitted_at timestamp with time zone,
  auto_release_at timestamp with time zone, -- Calculated as submitted_at + review_window_minutes
  review_completed_at timestamp with time zone,
  
  -- Rejection details
  rejection_reason text check (rejection_reason in ('instructions_not_followed', 'recording_mismatch', 'incomplete', 'low_effort')),
  rejection_explanation text check (rejection_explanation is null or (char_length(rejection_explanation) >= 10 and char_length(rejection_explanation) <= 500)),
  
  -- Anti-fraud metrics (Sybil prevention)
  device_fingerprint text,
  ip_address text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Enforce one submission per tester per listing
  unique (listing_id, tester_id)
);

-- 5. TASK_RESPONSES TABLE
-- Stores answers and structured metrics collected per task in a submission.
create table public.task_responses (
  id uuid default gen_random_uuid() primary key,
  submission_id uuid references public.submissions(id) on delete cascade not null,
  task_id uuid references public.tasks(id) on delete cascade not null,
  answer_text text not null check (char_length(answer_text) >= 10 and char_length(answer_text) <= 1000),
  
  -- Per-task structured metrics
  completed_successfully boolean not null,
  time_on_task_seconds integer not null check (time_on_task_seconds > 0 and time_on_task_seconds <= 7200),
  difficulty_rating integer not null check (difficulty_rating >= 1 and difficulty_rating <= 5),
  
  -- Attachment assets (Supabase Storage signed URLs)
  recording_url text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure unique response per task per submission
  unique (submission_id, task_id)
);

-- 6. PAYOUTS TABLE
-- Records processed payments out of escrow to testers.
create table public.payouts (
  id uuid default gen_random_uuid() primary key,
  submission_id uuid references public.submissions(id) on delete cascade not null,
  tester_id uuid references public.profiles(id) on delete cascade not null,
  amount integer not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  processor_payout_id text, -- ID from Xendit/PayMongo payout response
  idempotency_key text not null unique, -- Used to prevent double pay during retries
  processed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for query optimization
create index idx_listings_poster on public.listings(poster_id);
create index idx_listings_status on public.listings(status);
create index idx_submissions_listing on public.submissions(listing_id);
create index idx_submissions_tester on public.submissions(tester_id);
create index idx_task_responses_submission on public.task_responses(submission_id);
create index idx_payouts_submission on public.payouts(submission_id);
```

---

## 3. Row Level Security (RLS) SQL Policies

Row Level Security is enabled on every table to restrict access according to the system boundaries outlined in `04-SECURITY.md`.

```sql
-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.tasks enable row level security;
alter table public.submissions enable row level security;
alter table public.task_responses enable row level security;
alter table public.payouts enable row level security;

-- ==========================================
-- PROFILES POLICIES
-- ==========================================
create policy "Public read profiles"
  on public.profiles for select
  using (true);

create policy "Insert profile on signup"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ==========================================
-- LISTINGS POLICIES
-- ==========================================
create policy "Read listings conditional"
  on public.listings for select
  using (
    status in ('open', 'filling') 
    or poster_id = auth.uid()
    or exists (
      select 1 from public.submissions
      where submissions.listing_id = listings.id and submissions.tester_id = auth.uid()
    )
  );

create policy "Posters can create listings"
  on public.listings for insert
  with check (
    auth.uid() = poster_id 
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'poster'
    )
  );

create policy "Posters can update own listings"
  on public.listings for update
  using (auth.uid() = poster_id);

-- ==========================================
-- TASKS POLICIES
-- ==========================================
create policy "Read tasks if associated listing is visible"
  on public.tasks for select
  using (
    exists (
      select 1 from public.listings
      where listings.id = tasks.listing_id
      and (
        listings.status in ('open', 'filling') 
        or listings.poster_id = auth.uid()
        or exists (
          select 1 from public.submissions
          where submissions.listing_id = listings.id and submissions.tester_id = auth.uid()
        )
      )
    )
  );

create policy "Posters can manage tasks"
  on public.tasks for all
  using (
    exists (
      select 1 from public.listings
      where listings.id = tasks.listing_id and listings.poster_id = auth.uid()
    )
  );

-- ==========================================
-- SUBMISSIONS POLICIES
-- ==========================================
create policy "Read submissions if owner or poster"
  on public.submissions for select
  using (
    tester_id = auth.uid()
    or exists (
      select 1 from public.listings
      where listings.id = submissions.listing_id and listings.poster_id = auth.uid()
    )
  );

create policy "Testers can start submission"
  on public.submissions for insert
  with check (
    auth.uid() = tester_id
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'tester'
    )
    and exists (
      select 1 from public.listings
      where listings.id = submissions.listing_id and listings.status in ('open', 'filling')
    )
  );

create policy "Update submission state"
  on public.submissions for update
  using (
    tester_id = auth.uid()
    or exists (
      select 1 from public.listings
      where listings.id = submissions.listing_id and listings.poster_id = auth.uid()
    )
  );

-- ==========================================
-- TASK_RESPONSES POLICIES
-- ==========================================
create policy "Read responses if associated with submission"
  on public.task_responses for select
  using (
    exists (
      select 1 from public.submissions
      join public.listings on listings.id = submissions.listing_id
      where submissions.id = task_responses.submission_id
      and (submissions.tester_id = auth.uid() or listings.poster_id = auth.uid())
    )
  );

create policy "Testers can insert task responses before submission"
  on public.task_responses for insert
  with check (
    exists (
      select 1 from public.submissions
      where submissions.id = task_responses.submission_id
      and submissions.tester_id = auth.uid()
      and submissions.status = 'in_progress'
    )
  );

create policy "Testers can update task responses before submission"
  on public.task_responses for update
  using (
    exists (
      select 1 from public.submissions
      where submissions.id = task_responses.submission_id
      and submissions.tester_id = auth.uid()
      and submissions.status = 'in_progress'
    )
  );

-- ==========================================
-- PAYOUTS POLICIES
-- ==========================================
-- Write operations (INSERT/UPDATE/DELETE) on payouts bypass RLS 
-- by using the service_role key server-side. No user is authorized to modify payout records directly.
create policy "View payouts if tester or funding poster"
  on public.payouts for select
  using (
    tester_id = auth.uid()
    or exists (
      select 1 from public.submissions
      join public.listings on listings.id = submissions.listing_id
      where submissions.id = payouts.submission_id
      and listings.poster_id = auth.uid()
    )
  );
```

---

## 4. Zod Validation Schemas

Below is the complete TypeScript file containing the Zod schemas used to validate client-side submission schemas and backend route validation.

```typescript
import { z } from 'zod';

/**
 * Custom Rate Tiers allowed in subukAn (in Philippine Peso - PHP)
 * Must be exactly one of the discrete tiers defined by the platform mechanics.
 */
export const CUSTOM_RATE_TIERS = [50, 100, 200, 300, 400, 500, 1000, 1100] as const;
export type CustomRateTier = typeof CUSTOM_RATE_TIERS[number];

/**
 * 1. CREATE LISTING SCHEMA
 * Handles the rate tier verification, budget calculations, and slots math.
 */
export const createListingSchema = z.object({
  title: z.string()
    .min(5, { message: 'Title must be at least 5 characters long.' })
    .max(100, { message: 'Title cannot exceed 100 characters.' }),
  
  description: z.string()
    .min(20, { message: 'Description must be at least 20 characters long.' })
    .max(2000, { message: 'Description cannot exceed 2000 characters.' }),
  
  rate_per_tester: z.number({
    required_error: 'Please select a rate per tester.',
    invalid_type_error: 'Rate per tester must be a number.',
  }).refine((val) => CUSTOM_RATE_TIERS.includes(val as CustomRateTier), {
    message: `Rate per tester must be one of the permitted tiers: ₱${CUSTOM_RATE_TIERS.join(', ₱')}`,
  }),
  
  // Custom slots check: Must be 1 (for Preview Round) or in the range [3, 100]
  slots_count: z.number({
    required_error: 'Number of target participants is required.',
  })
  .int({ message: 'Slots count must be an integer.' })
  .refine((val) => val === 1 || (val >= 3 && val <= 100), {
    message: 'Slot size must be 1 (for preview round) or between 3 and 100 (for standard listings).',
  }),
  
  total_budget: z.number({
    required_error: 'Total budget must be defined.',
  }).int({ message: 'Budget must be an integer.' }),
  
  review_window_minutes: z.union([z.literal(30), z.literal(60)], {
    errorMap: () => ({ message: 'Review window must be exactly 30 or 60 minutes.' }),
  }),
  
  questions: z.array(
    z.object({
      question_text: z.string()
        .min(5, { message: 'Question must be at least 5 characters long.' })
        .max(500, { message: 'Question cannot exceed 500 characters.' }),
      requires_recording: z.boolean().default(false),
      requires_image: z.boolean().default(false),
    })
  )
  .min(1, { message: 'You must add at least 1 testing question.' })
  .max(10, { message: 'A listing can contain up to 10 questions.' }),
})
.refine((data) => data.total_budget === data.rate_per_tester * data.slots_count, {
  message: 'Escrow verification failed: Total budget does not equal rate multiplied by slots.',
  path: ['total_budget'],
});

export type CreateListingInput = z.infer<typeof createListingSchema>;

/**
 * Helper to validate a generic URL string with standard HTTP/S schemes.
 */
const secureUrlSchema = z.string()
  .url({ message: 'Attachment must be a valid URL format.' })
  .refine((url) => url.startsWith('https://') || url.startsWith('http://localhost'), {
    message: 'Attachment must use a secure protocol (HTTPS) or local environment routing.',
  });

/**
 * 2. INDIVIDUAL TASK RESPONSE SCHEMA
 * Validates individual answers, task completion statuses, times-on-task, and attachment URLs.
 */
export const taskResponseSchema = z.object({
  task_id: z.string().uuid({ message: 'Invalid Task identifier structure.' }),
  
  answer_text: z.string()
    .min(10, { message: 'Response answer must contain at least 10 characters.' })
    .max(1000, { message: 'Response answer cannot exceed 1000 characters.' }),
  
  completed_successfully: z.boolean({
    required_error: 'Task completion status is required.',
  }),
  
  // Enforces time-on-task limits (between 1 second and 2 hours)
  time_on_task_seconds: z.number({
    required_error: 'Time-on-task tracker must record a duration.',
  })
  .int()
  .positive({ message: 'Time on task must be positive.' })
  .max(7200, { message: 'Recorded session duration cannot exceed 2 hours.' }),
  
  // 1 to 5 difficulty rating constraint
  difficulty_rating: z.number({
    required_error: 'Please rate the difficulty of this task.',
  })
  .int()
  .min(1, { message: 'Rating must be at least 1 (Very Easy).' })
  .max(5, { message: 'Rating cannot exceed 5 (Very Hard).' }),
  
  recording_url: secureUrlSchema.nullable().optional(),
  image_url: secureUrlSchema.nullable().optional(),
});

export type TaskResponseInput = z.infer<typeof taskResponseSchema>;

/**
 * 3. SUBMIT TEST RESPONSE SCHEMA
 * Orchestrates submission validation on the API edge.
 */
export const submitTestResponseSchema = z.object({
  listing_id: z.string().uuid({ message: 'Invalid Listing identifier.' }),
  
  responses: z.array(taskResponseSchema)
    .min(1, { message: 'A submission must contain responses to the questions.' }),
  
  device_fingerprint: z.string()
    .min(5, { message: 'A valid browser fingerprint is required for verification.' })
    .max(256)
    .optional(),
  
  ip_address: z.string()
    .max(45) // Length allows for long IPv6 structures
    .optional(),
});

export type SubmitTestResponseInput = z.infer<typeof submitTestResponseSchema>;
```

---

## 5. Architectural & Design Security Alignment

To guarantee adherence to the policies defined in `04-SECURITY.md` and UI guidelines in `05-DESIGN.md`, the technical blueprints implement the following mapping rules:

1. **Escrow Integration Verification:**
   - The backend `/api/payout` and listing validation functions explicitly check that `total_budget` balances match `rate_per_tester * slots_count` to ensure a poster cannot bypass frontend controls and allocate slots below the deposit cost.
   - Payout triggers enforce an `idempotency_key` (hash representation of `submission_id` + `tester_id`) in Postgres to completely lock out duplicate payment processing at the gateway.

2. **Sybil/Fraud Checks:**
   - Tester signup requires `phone_verified` in `profiles`.
   - The submission schema logs `device_fingerprint` and `ip_address` directly in the database. A verification system flags submissions targeting the same listing that share a fingerprint or an IP range.

3. **Auto-release & Session Timers:**
   - The database stores an `auto_release_at` value on `submissions`. The auto-release worker running on a cron triggers updates matching this timestamp if the poster fails to respond inside their chosen window (30m/60m).
   - Local JavaScript text manipulation events are intercepted, but primary question leakage is handled through short-lived signed URLs for media attachments (`recording_url` / `image_url`) and click-through agreement structures.
