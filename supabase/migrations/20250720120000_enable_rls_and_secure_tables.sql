/*
          # [Operation Name]: Enable RLS and Secure All Tables
          [This script enables Row Level Security (RLS) on all public tables and applies foundational security policies to protect your data. This is a critical security update.]

          ## Query Description: [This operation will restrict access to your database tables, making them private by default. It then adds specific rules (policies) to grant access only to authorized users based on their roles. This fixes the "RLS Disabled" security advisory. There is no risk of data loss, but it is essential for securing your application.]
          
          ## Metadata:
          - Schema-Category: ["Security", "Structural"]
          - Impact-Level: ["High"]
          - Requires-Backup: [false]
          - Reversible: [true]
          
          ## Structure Details:
          - Tables affected: profiles, establishments, questionnaires, questions, answers
          - Action: Enables RLS and creates access policies.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [Access will now require authentication and specific roles for most actions.]
          
          ## Performance Impact:
          - Indexes: [Not Affected]
          - Triggers: [Not Affected]
          - Estimated Impact: [Negligible. RLS adds a small overhead to queries, which is necessary for security.]
          */

-- Enable RLS on all tables to make them private by default
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure this script can be re-run safely
DROP POLICY IF EXISTS "Les administrateurs peuvent tout gérer." ON public.profiles;
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil." ON public.profiles;
DROP POLICY IF EXISTS "Les administrateurs peuvent tout gérer." ON public.establishments;
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent lire les établissements." ON public.establishments;
DROP POLICY IF EXISTS "Les administrateurs peuvent tout gérer." ON public.questionnaires;
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent lire les questionnaires." ON public.questionnaires;
DROP POLICY IF EXISTS "Les administrateurs peuvent tout gérer." ON public.questions;
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent lire les questions." ON public.questions;
DROP POLICY IF EXISTS "Les administrateurs peuvent tout gérer." ON public.answers;
DROP POLICY IF EXISTS "Les membres peuvent créer leurs propres réponses." ON public.answers;
DROP POLICY IF EXISTS "Les membres peuvent voir leurs propres réponses." ON public.answers;


-- === PROFILES POLICIES ===
-- 1. Admins can manage all profiles.
CREATE POLICY "Les administrateurs peuvent tout gérer." ON public.profiles
    FOR ALL
    USING (get_user_role() = 'Admin')
    WITH CHECK (get_user_role() = 'Admin');

-- 2. Users can view their own profile.
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil." ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);


-- === ESTABLISHMENTS POLICIES ===
-- 1. Admins can manage all establishments.
CREATE POLICY "Les administrateurs peuvent tout gérer." ON public.establishments
    FOR ALL
    USING (get_user_role() = 'Admin')
    WITH CHECK (get_user_role() = 'Admin');

-- 2. Authenticated users can read establishments.
CREATE POLICY "Les utilisateurs authentifiés peuvent lire les établissements." ON public.establishments
    FOR SELECT
    USING (auth.role() = 'authenticated');


-- === QUESTIONNAIRES POLICIES ===
-- 1. Admins can manage all questionnaires.
CREATE POLICY "Les administrateurs peuvent tout gérer." ON public.questionnaires
    FOR ALL
    USING (get_user_role() = 'Admin')
    WITH CHECK (get_user_role() = 'Admin');

-- 2. Authenticated users can read questionnaires.
CREATE POLICY "Les utilisateurs authentifiés peuvent lire les questionnaires." ON public.questionnaires
    FOR SELECT
    USING (auth.role() = 'authenticated');


-- === QUESTIONS POLICIES ===
-- 1. Admins can manage all questions.
CREATE POLICY "Les administrateurs peuvent tout gérer." ON public.questions
    FOR ALL
    USING (get_user_role() = 'Admin')
    WITH CHECK (get_user_role() = 'Admin');

-- 2. Authenticated users can read questions.
CREATE POLICY "Les utilisateurs authentifiés peuvent lire les questions." ON public.questions
    FOR SELECT
    USING (auth.role() = 'authenticated');


-- === ANSWERS POLICIES ===
-- 1. Admins can manage all answers.
CREATE POLICY "Les administrateurs peuvent tout gérer." ON public.answers
    FOR ALL
    USING (get_user_role() = 'Admin')
    WITH CHECK (get_user_role() = 'Admin');

-- 2. Members can create their own answers.
CREATE POLICY "Les membres peuvent créer leurs propres réponses." ON public.answers
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 3. Members can see their own answers.
CREATE POLICY "Les membres peuvent voir leurs propres réponses." ON public.answers
    FOR SELECT
    USING (auth.uid() = user_id);
