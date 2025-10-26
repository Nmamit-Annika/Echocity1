-- Enable Row Level Security (safe to run multiple times)
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.departments ENABLE ROW LEVEL SECURITY;

-- Idempotent policy creation: create only if missing
DO $$
BEGIN
  -- Profiles: view
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile"
      ON public.profiles
      FOR SELECT
      USING ((SELECT auth.uid()) = id);
  END IF;

  -- Profiles: update
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile"
      ON public.profiles
      FOR UPDATE
      USING ((SELECT auth.uid()) = id);
  END IF;

  -- Profiles: insert
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
      ON public.profiles
      FOR INSERT
      WITH CHECK ((SELECT auth.uid()) = id);
  END IF;

  -- user_roles: view
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_roles'
      AND policyname = 'Users can view their own roles'
  ) THEN
    CREATE POLICY "Users can view their own roles"
      ON public.user_roles
      FOR SELECT
      USING ((SELECT auth.uid()) = user_id);
  END IF;

  -- user_roles: admin management (all)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_roles'
      AND policyname = 'Only admins can manage roles'
  ) THEN
    CREATE POLICY "Only admins can manage roles"
      ON public.user_roles
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = (SELECT auth.uid())
            AND ur.role = 'admin'
        )
      );
  END IF;

  -- departments: public view
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'departments'
      AND policyname = 'Anyone can view departments'
  ) THEN
    CREATE POLICY "Anyone can view departments"
      ON public.departments
      FOR SELECT
      TO PUBLIC
      USING (true);
  END IF;

  -- departments: admin management (all)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'departments'
      AND policyname = 'Only admins can manage departments'
  ) THEN
    CREATE POLICY "Only admins can manage departments"
      ON public.departments
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = (SELECT auth.uid())
            AND ur.role = 'admin'
        )
      );
  END IF;

END$$;