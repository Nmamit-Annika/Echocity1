-- Simple database setup for Echocity - Run this first
-- This creates the basic structure without complex RLS policies

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    address TEXT,
    role TEXT DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin', 'department_head')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create departments table
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    head_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create complaints table
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
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'rejected')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    admin_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default categories
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

-- Insert default departments
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

-- Simple RLS Policies (no recursion)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Allow all reads for now (we'll tighten security later)
CREATE POLICY "Allow all to read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow all to read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow all to read departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Allow all to read complaints" ON public.complaints FOR SELECT USING (true);

-- Allow authenticated users to insert their own data
CREATE POLICY "Allow users to insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow users to insert complaints" ON public.complaints FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow users to update own complaints" ON public.complaints FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, username)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();