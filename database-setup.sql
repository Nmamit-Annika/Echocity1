-- Database Setup for Echocity Maps
-- Run these commands in Supabase SQL Editor

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

-- Create complaint_updates table (for status updates and comments)
CREATE TABLE IF NOT EXISTS public.complaint_updates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    status_change TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
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

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_updates ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((select auth.uid()) = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((select auth.uid()) = id);

-- Categories policies (read-only for users, admin can modify)
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Only admins can insert categories" ON public.categories FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
);
CREATE POLICY "Only admins can update categories" ON public.categories FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
);

-- Departments policies (read-only for users, admin can modify)
CREATE POLICY "Departments are viewable by everyone" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Only admins can insert departments" ON public.departments FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
);
CREATE POLICY "Only admins can update departments" ON public.departments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role = 'admin')
);

-- Complaints policies
CREATE POLICY "Users can view all complaints" ON public.complaints FOR SELECT USING (true);
CREATE POLICY "Users can insert their own complaints" ON public.complaints FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update their own complaints" ON public.complaints FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Admins can update any complaint" ON public.complaints FOR UPDATE USING (
    (select auth.uid()) = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (select auth.uid()) AND role IN ('admin', 'department_head'))
);

-- Complaint updates policies
CREATE POLICY "Users can view all complaint updates" ON public.complaint_updates FOR SELECT USING (true);
CREATE POLICY "Users can insert their own updates" ON public.complaint_updates FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update their own updates" ON public.complaint_updates FOR UPDATE USING ((select auth.uid()) = user_id);

-- Functions and Triggers

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

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON public.complaints
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;