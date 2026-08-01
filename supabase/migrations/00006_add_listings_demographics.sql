-- Migration: Add target demographic targeting columns to listings
-- Description: Adds targeting columns to listings table to filter tasks according to tester demographics.

alter table public.listings
  add column if not exists target_age_group text,
  add column if not exists target_gender text,
  add column if not exists target_employment_status text,
  add column if not exists target_tech_literacy text;
