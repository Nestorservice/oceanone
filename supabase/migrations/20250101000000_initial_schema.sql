/*
          # [Initial Schema Setup for OceanCollect]
          This script establishes the core database structure for the OceanCollect application. It creates user roles, profiles, establishments, and the foundational tables for the questionnaire system. It also configures Row Level Security (RLS) to ensure data is accessed securely based on user roles.

          ## Query Description: This is a foundational script. If run on a database with existing conflicting tables ('profiles', 'establishments', etc.), it will not overwrite them due to 'IF NOT EXISTS' checks. However, it will drop and recreate policies and triggers to ensure they are up-to-date. It's safest to run this on a clean project. No data will be lost if tables already exist.

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "High"
          - Requires-Backup: true
          - Reversible: false

          ## Structure Details:
          - **Enums**: user_role, establishment_type, question_type, response_status.
          - **Tables**: profiles, establishments, questions, questionnaires, questionnaire_questions, responses, response_answers.
          - **Functions**: public.handle_new_user() for creating user profiles automatically.
          - **Triggers**: on_auth_user_created to link auth users to profiles.
          - **RLS Policies**: Secure access for Admins and Members on 'profiles' and 'establishments'.

          ## Security Implications:
          - RLS Status: Enabled on 'profiles' and 'establishments'.
          - Policy Changes: Yes, policies are defined for admin and user access.
          - Auth Requirements: A trigger is set up to work with Supabase Auth.

          ## Performance Impact:
          - Indexes: Primary keys and foreign keys are indexed by default.
          - Triggers: One trigger on user creation. Impact is minimal.
          - Estimated Impact: Low performance impact on a new database.
          */

-- 1. Custom Types (Enums)
CREATE TYPE public.user_role AS ENUM (
    'super_admin',
    'admin',
    'manager',
    'member',
    'observer'
);

CREATE TYPE public.establishment_type AS ENUM (
    'school',
    'high_school',
    'university',
    'training_center',
    'other'
);

CREATE TYPE public.question_type AS ENUM (
    'text_short',
    'text_long',
    'number',
    'boolean',
    'choice_single',
    'choice_multiple',
    'scale',
    'dropdown',
    'date',
    'file',
    'signature'
);

CREATE TYPE public.response_status AS ENUM (
    'draft',
    'submitted',
    'validated'
);


-- 2. Profiles Table
-- Stores public user data. Linked to Supabase auth.users.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    phone_number TEXT,
    role public.user_role NOT NULL DEFAULT 'member'
);

-- Comments for Profiles table
COMMENT ON TABLE public.profiles IS 'Stores public user data, extending the authentication users.';
COMMENT ON COLUMN public.profiles.id IS 'Links to the internal Supabase authentication user.';
COMMENT ON COLUMN public.profiles.role IS 'Defines the access level of the user within the application.';

-- 3. Function to create a public profile for a new user.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'member');
  RETURN new;
END;
$$;

-- 4. Trigger to call the function upon new user creation in auth.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. Establishments Table
CREATE TABLE IF NOT EXISTS public.establishments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    type public.establishment_type NOT NULL,
    address TEXT,
    latitude FLOAT,
    longitude FLOAT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    notes TEXT,
    status TEXT DEFAULT 'active', -- e.g., 'active', 'inactive', 'to_verify'
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.establishments IS 'Stores information about educational establishments.';

-- 6. Questionnaires and Questions
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    question_text TEXT NOT NULL,
    question_type public.question_type NOT NULL,
    options JSONB, -- For multiple choice, dropdown, etc.
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.questionnaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    title TEXT NOT NULL,
    description TEXT,
    is_template BOOLEAN DEFAULT false,
    version INT DEFAULT 1,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.questionnaire_questions (
    questionnaire_id UUID NOT NULL REFERENCES public.questionnaires(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    display_order INT NOT NULL,
    is_required BOOLEAN DEFAULT true,
    PRIMARY KEY (questionnaire_id, question_id)
);

-- 7. Responses and Answers
CREATE TABLE IF NOT EXISTS public.responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    questionnaire_id UUID NOT NULL REFERENCES public.questionnaires(id) ON DELETE CASCADE,
    establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status public.response_status NOT NULL DEFAULT 'draft',
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.response_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES public.responses(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    answer_value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Row Level Security (RLS)
-- Enable RLS on tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
-- (RLS for other tables can be added later)

-- Drop existing policies to prevent errors on re-run
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Members can view all establishments" ON public.establishments;
DROP POLICY IF EXISTS "Admins can manage all establishments" ON public.establishments;
DROP POLICY IF EXISTS "Members can create establishments" ON public.establishments;


-- Define policies for 'profiles'
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
);

-- Define policies for 'establishments'
CREATE POLICY "Members can view all establishments"
ON public.establishments FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage all establishments"
ON public.establishments FOR ALL
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
);

CREATE POLICY "Members can create establishments"
ON public.establishments FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated' AND created_by = auth.uid()
);

-- Grant usage on schema and tables to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
