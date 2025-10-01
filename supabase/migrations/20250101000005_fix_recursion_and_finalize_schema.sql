/*
          # [Schema Correction]
          Fixes an infinite recursion error in the RLS policy for the `profiles` table and ensures all RLS policies are correctly configured.

          ## Query Description: [This script corrects a critical security policy misconfiguration. It drops the faulty policies on the `profiles` table and recreates them using a `SECURITY DEFINER` function to safely check user roles without causing recursion. It also ensures RLS is enabled on all tables, resolving security advisories.]
          
          ## Metadata:
          - Schema-Category: ["Structural", "Safe"]
          - Impact-Level: ["High"]
          - Requires-Backup: false
          - Reversible: false
          
          ## Structure Details:
          - Drops and recreates policies on `public.profiles`.
          - Creates a `SECURITY DEFINER` function `is_admin_or_super_admin`.
          - Ensures RLS is enabled on all relevant tables.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [Admin/Super Admin roles are now checked safely.]
          
          ## Performance Impact:
          - Indexes: [No change]
          - Triggers: [No change]
          - Estimated Impact: [Low. Resolves a blocking error.]
          */

-- Drop the trigger and function if they exist to ensure a clean state
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop existing policies on profiles to avoid conflicts and recursion
DROP POLICY IF EXISTS "Admins can see all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update and delete profiles" ON public.profiles;

-- Function to create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'role'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Safely check for admin role using SECURITY DEFINER to break recursion
CREATE OR REPLACE FUNCTION is_admin_or_super_admin()
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  -- This function runs as the owner, so it bypasses RLS on `profiles` for this one query.
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
  RETURN user_role IN ('Admin', 'Super Admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate policies for 'profiles' table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (is_admin_or_super_admin());

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update and delete profiles"
  ON public.profiles FOR ALL
  USING (is_admin_or_super_admin())
  WITH CHECK (is_admin_or_super_admin());

-- Ensure RLS is enabled on all other tables
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for other tables to ensure consistency
DROP POLICY IF EXISTS "Public can read all establishments" ON public.establishments;
DROP POLICY IF EXISTS "Admins can update and delete core data" ON public.establishments;
CREATE POLICY "Authenticated users can read all establishments" ON public.establishments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage establishments" ON public.establishments FOR ALL USING (is_admin_or_super_admin());

DROP POLICY IF EXISTS "Public can read all questions" ON public.questions;
DROP POLICY IF EXISTS "Admins can update and delete core data" ON public.questions;
CREATE POLICY "Authenticated users can read all questions" ON public.questions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage questions" ON public.questions FOR ALL USING (is_admin_or_super_admin());

DROP POLICY IF EXISTS "Public can read all templates" ON public.question_templates;
DROP POLICY IF EXISTS "Admins can update and delete core data" ON public.question_templates;
CREATE POLICY "Authenticated users can read all templates" ON public.question_templates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage templates" ON public.question_templates FOR ALL USING (is_admin_or_super_admin());

DROP POLICY IF EXISTS "Users can manage their own answers" ON public.answers;
DROP POLICY IF EXISTS "Admins can update and delete core data" ON public.answers;
CREATE POLICY "Users can manage their own answers" ON public.answers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all answers" ON public.answers FOR SELECT USING (is_admin_or_super_admin());
