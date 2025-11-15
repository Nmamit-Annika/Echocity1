-- Step 1: Find your actual user ID
-- Run this first to see your real user ID
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- Step 2: After finding your user ID, create the profile
-- Replace 'YOUR_ACTUAL_USER_ID' with the ID from Step 1
/*
INSERT INTO public.profiles (id, full_name, username, role)
VALUES (
    'YOUR_ACTUAL_USER_ID'::uuid,
    'Annika M',
    'nnm24ad010@nmamit.in',
    'citizen'
)
ON CONFLICT (id) DO UPDATE SET 
    role = 'citizen',
    full_name = EXCLUDED.full_name,
    username = EXCLUDED.username;
*/

-- Alternative: Create profile for ALL existing users
-- This will create profiles for all users in auth.users
INSERT INTO public.profiles (id, full_name, username, role)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
    email as username,
    'citizen' as role
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);