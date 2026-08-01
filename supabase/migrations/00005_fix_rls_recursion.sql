-- Migration: Fix Submissions RLS Infinite Recursion
-- Description: Introduces a SECURITY DEFINER function to verify listing ownership and breaks the mutual RLS recursion between listings and submissions.

-- 1. Create a helper function that bypasses RLS checking on the listings table
create or replace function public.check_is_listing_poster(l_id uuid, u_id uuid)
returns boolean
security definer
set search_path = public
language plpgsql
as $$
begin
  return exists (
    select 1 from public.listings
    where id = l_id and poster_id = u_id
  );
end;
$$;

-- Grant execution permission to public users (since it's called inside RLS)
grant execute on function public.check_is_listing_poster(uuid, uuid) to public;

-- 2. Drop existing problematic RLS policies on public.submissions
drop policy if exists "Read submissions if owner or poster" on public.submissions;
drop policy if exists "Update submission state" on public.submissions;

-- 3. Re-create policies using the SECURITY DEFINER function to break recursion
create policy "Read submissions if owner or poster"
  on public.submissions for select
  using (
    tester_id = auth.uid()
    or public.check_is_listing_poster(listing_id, auth.uid())
  );

create policy "Update submission state"
  on public.submissions for update
  using (
    tester_id = auth.uid()
    or public.check_is_listing_poster(listing_id, auth.uid())
  );
