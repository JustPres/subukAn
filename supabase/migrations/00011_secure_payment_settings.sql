-- Migration: Secure Poster Payment Settings
-- Description: Splits sensitive payment settings into a separate private table gated by owner RLS policies.

-- 1. Create the new poster_payment_settings table
create table if not exists public.poster_payment_settings (
  id uuid references public.profiles(id) on delete cascade primary key,
  payment_settings jsonb not null default '{"sandbox_mode": true, "paymongo_public_key": "", "paymongo_secret_key": "", "gcash_payout_number": ""}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Migrate existing payment_settings data from public.profiles if any exists
insert into public.poster_payment_settings (id, payment_settings, created_at, updated_at)
select id, payment_settings, created_at, updated_at 
from public.profiles
where payment_settings is not null
on conflict (id) do update set payment_settings = excluded.payment_settings;

-- 3. Drop the payment_settings column from public.profiles to prevent leaks
alter table public.profiles drop column if exists payment_settings;

-- 4. Enable Row Level Security (RLS)
alter table public.poster_payment_settings enable row level security;

-- 5. Create owner-restricted policies
create policy "Users can view own payment settings"
  on public.poster_payment_settings for select
  using (auth.uid() = id);

create policy "Users can update own payment settings"
  on public.poster_payment_settings for update
  using (auth.uid() = id);

-- 6. Trigger to set updated_at automatically on settings update
create trigger set_poster_payment_settings_updated_at
  before update on public.poster_payment_settings
  for each row execute procedure public.update_updated_at_column();

-- 7. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
