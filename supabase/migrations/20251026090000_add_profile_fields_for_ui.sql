-- Add additional profile fields
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS dob date,
  ADD COLUMN IF NOT EXISTS avatar_url text;
