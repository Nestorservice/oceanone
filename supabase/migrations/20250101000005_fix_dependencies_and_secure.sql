/*
          # [Schema Re-creation and Security Hardening]
          This script corrects a dependency error from the previous migration and ensures the entire database schema is correctly set up and secured with Row Level Security (RLS). It drops the user creation trigger and function in the correct order before re-creating them, and it enables RLS on all tables with appropriate policies.

          ## Query Description: [This script is safe to run multiple times. It will:
          1. Fix the "cannot drop function" error by removing dependent objects in the correct order.
          2. Re-create all tables (profiles, establishments, questions, answers) if they don't exist.
          3. Re-create the user creation trigger and function.
          4. Enable Row Level Security on all tables to fix critical security vulnerabilities.
          5. Apply policies to ensure only authenticated users and admins can access data.]
          
          ## Metadata:
          - Schema-Category: ["Structural", "Safe"]
          - Impact-Level: ["Low"]
          - Requires-Backup: false
          - Reversible: false
          
          ## Structure Details:
          - Tables affected: profiles, establishments, questions, answers
          - Functions affected: handle_new_user
          - Triggers affected: on_auth_user_created
          
          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes
          - Auth Requirements: Policies are added for authenticated users and admins.
          
          ## Performance Impact:
          - Indexes: No change
          - Triggers: Re-created
          - Estimated Impact: Negligible
          */

-- Step 1: Drop dependent objects in the correct order to avoid errors.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Step 2: Create the function to create a profile for a new user.
-- The `security_invoker` option is important for the function to run with the permissions of the user that calls it.
-- In this case, the user creation is initiated by the user themselves, so their ID is available.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER -- Important for accessing new.id
AS $$
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
$$;

-- Step 3: Create the trigger to run the function after a new user is created in auth.users.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 4: Define all tables, ensuring they exist.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    first_name TEXT,
    last_name TEXT,
    role TEXT NOT NULL DEFAULT 'Membre'::text,
    phone TEXT,
    avatar_url TEXT
);

CREATE TABLE IF NOT EXISTS public.establishments (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    address TEXT,
    latitude FLOAT,
    longitude FLOAT,
    contact_name TEXT,
    contact_email TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'À vérifier'::text,
    responsible_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.questions (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL,
    options JSONB,
    category TEXT,
    status TEXT NOT NULL DEFAULT 'Proposition'::text,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    version INT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.answers (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    question_id BIGINT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    establishment_id BIGINT NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    answer_value TEXT,
    is_draft BOOLEAN NOT NULL DEFAULT false
);

-- Step 5: Enable Row Level Security (RLS) on all tables to secure data.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop existing policies to prevent "already exists" errors.
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view all establishments" ON public.establishments;
DROP POLICY IF EXISTS "Admins can update and delete core data" ON public.establishments;
DROP POLICY IF EXISTS "Authenticated users can view all questions" ON public.questions;
DROP POLICY IF EXISTS "Admins can manage questions" ON public.questions;
DROP POLICY IF EXISTS "Users can manage their own answers" ON public.answers;
DROP POLICY IF EXISTS "Admins can view all answers" ON public.answers;

-- Step 7: Create RLS policies.
-- Profiles Policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Super Admin'));

-- Establishments Policies
CREATE POLICY "Authenticated users can view all establishments" ON public.establishments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update and delete core data" ON public.establishments
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Super Admin'));

-- Questions Policies
CREATE POLICY "Authenticated users can view all questions" ON public.questions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage questions" ON public.questions
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Super Admin'));

-- Answers Policies
CREATE POLICY "Users can manage their own answers" ON public.answers
  FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "Admins can view all answers" ON public.answers
  FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Super Admin'));
