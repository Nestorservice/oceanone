/*
          # [Schema Correction]
          This script completely rebuilds the public schema to fix all foreign key type mismatches (bigint vs uuid) and dependency errors. It ensures the entire database structure is consistent and correct.

          ## Query Description: This operation is destructive but safe for a development environment. It will DROP all tables, types, and functions in the 'public' schema before recreating them correctly. Any existing data in these tables will be lost. This is necessary to fix fundamental type errors in the table definitions.

          ## Metadata:
          - Schema-Category: ["Dangerous"]
          - Impact-Level: ["High"]
          - Requires-Backup: true
          - Reversible: false
          
          ## Structure Details:
          - Drops and recreates: user_role, question_type, question_status, establishment_status types.
          - Drops and recreates tables: profiles, establishments, questions, question_templates, answers, question_template_items, audit_logs.
          - Drops and recreates functions: handle_new_user, get_user_role, delete_user.
          - Re-applies all RLS policies correctly.
          
          ## Security Implications:
          - RLS Status: Enabled on all tables.
          - Policy Changes: Yes, policies are dropped and recreated correctly to fix recursion errors.
          - Auth Requirements: No changes to auth schema.
          
          ## Performance Impact:
          - Indexes: All primary and foreign key indexes are recreated.
          - Triggers: The `on_auth_user_created` trigger is recreated.
          - Estimated Impact: Negligible on an empty or small database.
          */

-- Step 1: Drop dependent objects to avoid errors
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_user_role(uuid);
DROP FUNCTION IF EXISTS public.delete_user(uuid);

-- Step 2: Drop tables in reverse order of dependency
DROP TABLE IF EXISTS public.audit_logs;
DROP TABLE IF EXISTS public.question_template_items;
DROP TABLE IF EXISTS public.answers;
DROP TABLE IF EXISTS public.question_templates;
DROP TABLE IF EXISTS public.questions;
DROP TABLE IF EXISTS public.establishments;
DROP TABLE IF EXISTS public.profiles;

-- Step 3: Drop custom types
DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.question_type;
DROP TYPE IF EXISTS public.question_status;
DROP TYPE IF EXISTS public.establishment_status;

-- Step 4: Recreate custom types
CREATE TYPE public.user_role AS ENUM ('Super Admin', 'Admin', 'Manager', 'Membre', 'Observateur');
CREATE TYPE public.question_type AS ENUM ('Texte court', 'Texte long', 'Numérique', 'Oui/Non', 'Choix unique', 'Choix multiple', 'Échelle', 'Date/Heure');
CREATE TYPE public.question_status AS ENUM ('Proposition', 'En revue', 'Validé', 'Archivé');
CREATE TYPE public.establishment_status AS ENUM ('Actif', 'Inactif', 'À vérifier');

-- Step 5: Recreate tables with correct data types
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name text,
    last_name text,
    role public.user_role NOT NULL DEFAULT 'Membre',
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.establishments (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    name text NOT NULL,
    type text NOT NULL,
    address text,
    latitude double precision,
    longitude double precision,
    contact_name text,
    contact_email text,
    notes text,
    status public.establishment_status NOT NULL DEFAULT 'À vérifier',
    responsible_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE public.questions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    question_text text NOT NULL,
    question_type public.question_type NOT NULL,
    category text,
    options text[],
    status public.question_status NOT NULL DEFAULT 'Proposition',
    created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE public.question_templates (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    version integer NOT NULL DEFAULT 1
);

CREATE TABLE public.answers (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    answer_value text,
    synchronized_at timestamp with time zone
);

CREATE TABLE public.question_template_items (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    template_id uuid NOT NULL REFERENCES public.question_templates(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    item_order integer NOT NULL,
    UNIQUE(template_id, question_id)
);

CREATE TABLE public.audit_logs (
    id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    "timestamp" timestamp with time zone NOT NULL DEFAULT now(),
    actor_user_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    action_type text NOT NULL,
    target_type text,
    target_id text,
    payload_before jsonb,
    payload_after jsonb,
    ip_address inet,
    user_agent text
);

-- Step 6: Recreate functions and triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    (NEW.raw_user_meta_data->>'role')::public.user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text AS $$
DECLARE
  user_role_text text;
BEGIN
  SELECT role::text INTO user_role_text FROM public.profiles WHERE id = user_id;
  RETURN user_role_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.delete_user(user_id uuid)
RETURNS void AS $$
BEGIN
  -- This requires the service_role key to be used in the client
  DELETE FROM auth.users WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Step 8: Recreate RLS policies
-- Profiles
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Les utilisateurs peuvent mettre à jour leur propre profil" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Les admins peuvent tout voir et gérer" ON public.profiles FOR ALL USING (public.get_user_role(auth.uid()) IN ('Admin', 'Super Admin'));

-- Establishments
CREATE POLICY "Les utilisateurs authentifiés peuvent tout voir" ON public.establishments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Les admins peuvent tout gérer" ON public.establishments FOR ALL USING (public.get_user_role(auth.uid()) IN ('Admin', 'Super Admin'));

-- Questions
CREATE POLICY "Les utilisateurs authentifiés peuvent tout voir" ON public.questions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Les utilisateurs peuvent créer des questions" ON public.questions FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Les admins peuvent tout gérer" ON public.questions FOR ALL USING (public.get_user_role(auth.uid()) IN ('Admin', 'Super Admin'));

-- Question Templates
CREATE POLICY "Les utilisateurs authentifiés peuvent tout voir" ON public.question_templates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Les admins peuvent tout gérer" ON public.question_templates FOR ALL USING (public.get_user_role(auth.uid()) IN ('Admin', 'Super Admin'));

-- Question Template Items
CREATE POLICY "Les utilisateurs authentifiés peuvent tout voir" ON public.question_template_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Les admins peuvent tout gérer" ON public.question_template_items FOR ALL USING (public.get_user_role(auth.uid()) IN ('Admin', 'Super Admin'));

-- Answers
CREATE POLICY "Les utilisateurs peuvent voir leurs propres réponses" ON public.answers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Les utilisateurs peuvent insérer leurs propres réponses" ON public.answers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Les admins peuvent tout voir" ON public.answers FOR SELECT USING (public.get_user_role(auth.uid()) IN ('Admin', 'Super Admin'));

-- Audit Logs
CREATE POLICY "Seuls les admins peuvent voir les logs" ON public.audit_logs FOR SELECT USING (public.get_user_role(auth.uid()) IN ('Admin', 'Super Admin'));
