-- Create user role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'citizen');

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT DEFAULT 'Mumbai',
  state TEXT DEFAULT 'Maharashtra',
  pincode TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'citizen',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  department_id UUID REFERENCES public.departments(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create complaints table
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) NOT NULL,
  department_id UUID REFERENCES public.departments(id),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in_progress', 'resolved', 'rejected')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  image_urls TEXT[],
  admin_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for departments
CREATE POLICY "Everyone can view departments"
  ON public.departments FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage departments"
  ON public.departments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for categories
CREATE POLICY "Everyone can view categories"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for complaints
CREATE POLICY "Users can view their own complaints"
  ON public.complaints FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all complaints"
  ON public.complaints FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create complaints"
  ON public.complaints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending complaints"
  ON public.complaints FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can update all complaints"
  ON public.complaints FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'citizen');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert default departments
INSERT INTO public.departments (name, description, contact_email) VALUES
  ('Public Works Department', 'Roads, streetlights, water supply, drainage', 'pwd@echocity.gov.in'),
  ('Sanitation Department', 'Garbage disposal, sewage, waste management', 'sanitation@echocity.gov.in'),
  ('Traffic Police', 'Traffic congestion, signals, parking violations', 'traffic@echocity.gov.in'),
  ('Municipal Corporation', 'Public safety, flooding, infrastructure', 'municipal@echocity.gov.in'),
  ('Environment Department', 'Air quality, noise pollution, deforestation', 'environment@echocity.gov.in');

-- Insert default categories
INSERT INTO public.categories (name, description, icon, department_id) 
SELECT 'Potholes', 'Road damage and potholes', 'Construction', d.id FROM public.departments d WHERE d.name = 'Public Works Department'
UNION ALL
SELECT 'Street Lights', 'Non-functional or damaged street lights', 'Lightbulb', d.id FROM public.departments d WHERE d.name = 'Public Works Department'
UNION ALL
SELECT 'Water Supply', 'Water supply issues and leakage', 'Droplet', d.id FROM public.departments d WHERE d.name = 'Public Works Department'
UNION ALL
SELECT 'Garbage Collection', 'Uncollected garbage and waste', 'Trash2', d.id FROM public.departments d WHERE d.name = 'Sanitation Department'
UNION ALL
SELECT 'Sewage', 'Sewage overflow and drainage issues', 'Waves', d.id FROM public.departments d WHERE d.name = 'Sanitation Department'
UNION ALL
SELECT 'Traffic Congestion', 'Traffic jams and road blocks', 'Car', d.id FROM public.departments d WHERE d.name = 'Traffic Police'
UNION ALL
SELECT 'Parking Issues', 'Illegal parking and violations', 'ParkingCircle', d.id FROM public.departments d WHERE d.name = 'Traffic Police'
UNION ALL
SELECT 'Public Safety', 'Unsafe areas and broken infrastructure', 'Shield', d.id FROM public.departments d WHERE d.name = 'Municipal Corporation'
UNION ALL
SELECT 'Noise Pollution', 'Excessive noise complaints', 'Volume2', d.id FROM public.departments d WHERE d.name = 'Environment Department'
UNION ALL
SELECT 'Infrastructure', 'Building infrastructure issues and maintenance', 'Building2', d.id FROM public.departments d WHERE d.name = 'Public Works Department';