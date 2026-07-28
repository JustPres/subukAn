-- Migration: Add demographic columns to profiles and quick impression parameters to listings
-- Description: Adds demographic targeting fields to profiles and quick impression flags to listings.

-- 1. Add demographic profile columns to profiles table
alter table public.profiles
  add column if not exists age_group text,
  add column if not exists gender text,
  add column if not exists employment_status text,
  add column if not exists tech_literacy text;

-- 2. Add quick impression parameters to listings table
alter table public.listings
  add column if not exists is_quick_impression boolean not null default false,
  add column if not exists impression_duration_seconds integer default 5;
