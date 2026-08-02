ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payment_settings jsonb DEFAULT '{"sandbox_mode": true, "paymongo_public_key": "", "paymongo_secret_key": "", "gcash_payout_number": ""}'::jsonb;
