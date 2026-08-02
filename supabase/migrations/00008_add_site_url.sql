-- Migration: Add site_url column to listings table
-- Required by: 08-FEATURES.md §Poster/Listings — "Create a listing: site URL..."

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS site_url text;

COMMENT ON COLUMN public.listings.site_url IS 'The URL of the site/app that testers will visit during the test.';
