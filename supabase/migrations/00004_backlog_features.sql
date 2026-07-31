-- Migration: Add backlog features schema elements (A/B testing, Accessibility matching, comments, first-clicks, benchmarking)
-- Description: Adds schema columns and tables required for v1.2 backlog features.

-- 1. A/B Testing: Support multiple variants/URLs per listing and record assigned variant per tester submission
alter table public.listings
  add column if not exists variants jsonb default '[]'::jsonb;

alter table public.submissions
  add column if not exists assigned_variant_id text;

-- 2. Accessibility Tagging: Match tester capabilities with listing requirements
alter table public.profiles
  add column if not exists accessibility_tags text[] default '{}'::text[];

alter table public.listings
  add column if not exists target_accessibility_tags text[] default '{}'::text[];

-- 3. Post-Test Debrief: Create submission comments table
create table if not exists public.submission_comments (
  id uuid default gen_random_uuid() primary key,
  submission_id uuid references public.submissions(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  message_text text not null check (char_length(message_text) >= 1 and char_length(message_text) <= 1000),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on comments
alter table public.submission_comments enable row level security;

-- Comments RLS Policies
create policy "Users can view comments on their own submissions or listings"
  on public.submission_comments for select
  using (
    exists (
      select 1 from public.submissions s
      join public.listings l on s.listing_id = l.id
      where s.id = submission_comments.submission_id
      and (s.tester_id = auth.uid() or l.poster_id = auth.uid())
    )
  );

create policy "Users can post comments on their own submissions or listings"
  on public.submission_comments for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.submissions s
      join public.listings l on s.listing_id = l.id
      where s.id = submission_id
      and (s.tester_id = auth.uid() or l.poster_id = auth.uid())
    )
  );

-- 4. First-Click Coordinates: Store coordinates and click timestamps
alter table public.task_responses
  add column if not exists first_click_x integer,
  add column if not exists first_click_y integer,
  add column if not exists first_click_time_ms integer,
  add column if not exists first_click_screen_width integer,
  add column if not exists first_click_screen_height integer;

-- 5. Version Benchmark: Link iterations to their parent rounds
alter table public.listings
  add column if not exists parent_listing_id uuid references public.listings(id) on delete set null;
