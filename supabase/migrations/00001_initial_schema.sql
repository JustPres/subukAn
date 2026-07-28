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

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

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

-- ==========================================
-- TRIGGERS AND UTILITY FUNCTIONS
-- ==========================================

-- 1. Profile Synchronization Trigger
-- This function automatically creates a profile record when a new user signs up via Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = ''
language plpgsql
as $$
begin
  insert into public.profiles (
    id,
    role,
    full_name,
    avatar_url,
    device_type,
    tech_comfort_level,
    phone_verified
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'tester'), -- defaults to tester
    coalesce(new.raw_user_meta_data->>'full_name', ''),  -- defaults to empty string
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'device_type',
    new.raw_user_meta_data->>'tech_comfort_level',
    coalesce((new.raw_user_meta_data->>'phone_verified')::boolean, false)
  );
  return new;
end;
$$;

-- Trigger to execute the function after a new user is inserted into auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Updated At Auto-Update Trigger Function
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Triggers for tables that track updated_at
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at_column();

create trigger set_listings_updated_at
  before update on public.listings
  for each row execute procedure public.update_updated_at_column();

-- ==========================================
-- INDEXES FOR QUERY OPTIMIZATION
-- ==========================================

-- Primary Foreign Key & Filter Indexes (as defined in 08-TECH-DESIGN.md)
create index idx_listings_poster on public.listings(poster_id);
create index idx_listings_status on public.listings(status);
create index idx_submissions_listing on public.submissions(listing_id);
create index idx_submissions_tester on public.submissions(tester_id);
create index idx_task_responses_submission on public.task_responses(submission_id);
create index idx_payouts_submission on public.payouts(submission_id);

-- Additional Indexes for optimizing FK joins and frequently filtered queries
create index idx_tasks_listing on public.tasks(listing_id);
create index idx_submissions_status on public.submissions(status);
create index idx_task_responses_task on public.task_responses(task_id);
create index idx_payouts_tester on public.payouts(tester_id);
