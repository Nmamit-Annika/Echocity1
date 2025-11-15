-- TEST CONNECTION - Run this in Supabase SQL Editor to verify everything is working
-- This will show you if your database is properly set up

-- Check if tables exist
SELECT 'Tables exist:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check profiles table structure
SELECT 'Profiles table structure:' as status;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public';

-- Check auth users (should be empty right now)
SELECT 'Auth users count:' as status;
SELECT COUNT(*) as user_count FROM auth.users;

-- Check if we can create a test profile manually (this should work)
SELECT 'Testing profile creation:' as status;

-- Generate a test UUID for manual testing
SELECT gen_random_uuid() as test_uuid;