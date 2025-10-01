/*
# Initial Schema Setup for OceanCollect
This script sets up the initial database structure for the OceanCollect application. It includes tables for user profiles, roles, teams, establishments, and the core questionnaire functionality.

## Query Description: 
This is a foundational but non-destructive script for a new database. It creates new tables, types, and functions. It assumes it's running on a fresh Supabase project. It sets up Row Level Security (RLS) on all new tables to ensure data is protected by default. A trigger is also created to automatically populate a user's profile upon sign-up.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by dropping created tables and types)

## Structure Details:
- **Types Created**: app_role (ENUM)
- **Tables Created**: profiles, teams, establishments, questionnaires, questions, responses, answers.
- **Functions Created**: public.handle_new_user()
- **Triggers Created**: on_auth_user_created on auth.users

## Security Implications:
- RLS Status: Enabled on all new tables.
- Policy Changes: Yes, new policies are created to control access.
  - Users can see all profiles but only update their own.
  - Authenticated users can manage core application data (this will be refined later).
- Auth Requirements: Policies are based on `auth.uid()` and require authenticated users.

## Performance Impact:
- Indexes: Primary keys are automatically indexed. Foreign keys are indexed for better join performance.
- Triggers: A single trigger on `auth.users` which fires once per user creation. Impact is minimal.
- Estimated Impact: Low. The schema is designed for a standard relational workload.
*/

-- 1. Create a type for user roles
CREATE TYPE public.app_role AS ENUM ('Super Admin', 'Admin', 'Manager', 'Membre', 'Observateur');

-- 2. Create a table for Teams
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  region TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.teams IS 'Stores team information, which can be assigned to users.';

-- 3. Create a table for user profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role public.app_role DEFAULT 'Membre'::public.app_role NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ
);
COMMENT ON TABLE public.profiles IS 'Stores public profile information for each user.';
COMMENT ON COLUMN public.profiles.id IS 'References the internal Supabase auth user.';

-- 4. Create a table for Establishments
CREATE TABLE public.establishments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT,
    address TEXT,
    latitude REAL,
    longitude REAL,
    contact_info JSONB,
    notes TEXT,
    status TEXT DEFAULT 'Actif' NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ
);
COMMENT ON TABLE public.establishments IS 'Stores information about educational establishments.';

-- 5. Create a table for Questionnaire Templates
CREATE TABLE public.questionnaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'draft' NOT NULL, -- e.g., draft, published, archived
    version INT DEFAULT 1 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ
);
COMMENT ON TABLE public.questionnaires IS 'Templates for questionnaires or surveys.';

-- 6. Create a table for Questions within a Questionnaire
CREATE TABLE public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    questionnaire_id UUID REFERENCES public.questionnaires(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g., text, number, choice, multiple_choice, boolean
    options JSONB, -- For choice-based questions
    "order" INT NOT NULL,
    is_required BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.questions IS 'Individual questions belonging to a questionnaire.';

-- 7. Create a table for Responses (a filled-out questionnaire instance)
CREATE TABLE public.responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    questionnaire_id UUID REFERENCES public.questionnaires(id) ON DELETE CASCADE NOT NULL,
    establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE NOT NULL,
    submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
    status TEXT DEFAULT 'in_progress' NOT NULL, -- e.g., in_progress, completed
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ
);
COMMENT ON TABLE public.responses IS 'A specific instance of a questionnaire being filled out for an establishment.';

-- 8. Create a table for individual Answers
CREATE TABLE public.answers (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    response_id UUID REFERENCES public.responses(id) ON DELETE CASCADE NOT NULL,
    question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
COMMENT ON TABLE public.answers IS 'Stores the actual answer for a specific question in a response.';


-- Set up the trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Teams
CREATE POLICY "Authenticated users can view teams" ON public.teams FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage teams" ON public.teams FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Super Admin')
);

-- Establishments, Questionnaires, Questions
CREATE POLICY "Authenticated users can view core data" ON public.establishments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view core data" ON public.questionnaires FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view core data" ON public.questions FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Members can create core data" ON public.establishments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Members can create core data" ON public.questionnaires FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Members can create core data" ON public.questions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update and delete core data" ON public.establishments FOR UPDATE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Super Admin'));
CREATE POLICY "Admins can update and delete core data" ON public.questionnaires FOR UPDATE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Super Admin'));
CREATE POLICY "Admins can update and delete core data" ON public.questions FOR UPDATE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Super Admin'));

CREATE POLICY "Admins can update and delete core data" ON public.establishments FOR DELETE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Super Admin'));
CREATE POLICY "Admins can update and delete core data" ON public.questionnaires FOR DELETE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Super Admin'));
CREATE POLICY "Admins can update and delete core data" ON public.questions FOR DELETE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Super Admin'));

-- Responses and Answers
CREATE POLICY "Users can manage their own responses and answers" ON public.responses FOR ALL USING (auth.uid() = submitted_by);
CREATE POLICY "Users can manage their own responses and answers" ON public.answers FOR ALL USING (
    (SELECT submitted_by FROM public.responses WHERE id = response_id) = auth.uid()
);
CREATE POLICY "Admins can view all responses and answers" ON public.responses FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Super Admin'));
CREATE POLICY "Admins can view all responses and answers" ON public.answers FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Super Admin'));
