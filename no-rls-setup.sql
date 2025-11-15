-- SUPER SIMPLE DATABASE SETUP - NO RLS ISSUES
-- Run this to completely fix the infinite recursion

-- First, completely disable ALL RLS and drop ALL policies
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "categories_select_policy" ON public.categories;
DROP POLICY IF EXISTS "departments_select_policy" ON public.departments;
DROP POLICY IF EXISTS "complaints_select_policy" ON public.complaints;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "complaints_insert_policy" ON public.complaints;
DROP POLICY IF EXISTS "complaints_update_policy" ON public.complaints;

-- Drop any other problematic policies
DROP POLICY IF EXISTS "Allow all to read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all to read categories" ON public.categories;
DROP POLICY IF EXISTS "Allow all to read departments" ON public.departments;
DROP POLICY IF EXISTS "Allow all to read complaints" ON public.complaints;
DROP POLICY IF EXISTS "Allow users to insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to insert complaints" ON public.complaints;
DROP POLICY IF EXISTS "Allow users to update own complaints" ON public.complaints;

-- Disable ALL RLS for testing
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints DISABLE ROW LEVEL SECURITY;

-- Make sure tables exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    address TEXT,
    role TEXT DEFAULT 'citizen',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.departments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id),
    department_id UUID REFERENCES public.departments(id),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    location_address TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    admin_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert categories if they don't exist
INSERT INTO public.categories (name, description, icon, color) VALUES
    ('Roads & Traffic', 'Potholes, traffic signals, road repairs', '🛣️', '#f59e0b'),
    ('Waste Management', 'Garbage collection, littering, recycling', '🗑️', '#10b981'),
    ('Water & Sewage', 'Water supply, drainage, sewage issues', '💧', '#3b82f6'),
    ('Street Lighting', 'Broken streetlights, dark areas', '💡', '#fbbf24'),
    ('Parks & Recreation', 'Park maintenance, playground issues', '🌳', '#22c55e'),
    ('Public Safety', 'Security concerns, emergency issues', '🚨', '#ef4444'),
    ('Noise Pollution', 'Excessive noise, sound pollution', '🔊', '#8b5cf6'),
    ('Building & Construction', 'Unauthorized construction, building issues', '🏗️', '#f97316'),
    ('Public Transport', 'Bus stops, metro, transport issues', '🚌', '#06b6d4'),
    ('Other', 'Issues not covered by other categories', '📝', '#6b7280')
ON CONFLICT (name) DO NOTHING;

-- Insert departments if they don't exist
INSERT INTO public.departments (name, description, contact_email) VALUES
    ('Public Works Department', 'Handles roads, infrastructure, and public facilities', 'pwd@city.gov'),
    ('Waste Management Corporation', 'Responsible for garbage collection and waste disposal', 'waste@city.gov'),
    ('Water Board', 'Manages water supply and sewage systems', 'water@city.gov'),
    ('Electricity Board', 'Handles street lighting and electrical issues', 'electricity@city.gov'),
    ('Parks Department', 'Maintains parks and recreational facilities', 'parks@city.gov'),
    ('Police Department', 'Handles public safety and security', 'police@city.gov'),
    ('Pollution Control Board', 'Manages noise and environmental issues', 'pollution@city.gov'),
    ('Building Department', 'Regulates construction and building permits', 'building@city.gov'),
    ('Transport Authority', 'Manages public transportation systems', 'transport@city.gov'),
    ('General Administration', 'Handles miscellaneous civic issues', 'admin@city.gov')
ON CONFLICT (name) DO NOTHING;

-- Function to automatically create profile on signup (with default role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, username, role)
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'full_name', new.email), 
        new.email,
        'citizen'  -- Everyone starts as citizen
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant ALL permissions to bypass any issues
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;