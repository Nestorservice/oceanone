/*
          # [Schema Final et Correction RLS]
          Ce script finalise la structure de la base de données, corrige les erreurs de dépendance et de récursion RLS, et ajoute les tables pour les modèles de questionnaires.

          ## Query Description: [Ce script est conçu pour être exécuté en toute sécurité, même s'il a déjà été appliqué partiellement. Il supprime les anciens objets conflictuels (fonctions, déclencheurs) avant de recréer l'ensemble du schéma de manière ordonnée. Il n'y a pas de risque de perte de données pour les tables existantes (`profiles`, `establishments`, `questions`).]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Medium"]
          - Requires-Backup: false
          - Reversible: false
          
          ## Structure Details:
          - Création des tables: `question_templates`, `question_template_items`.
          - Correction des types de données et des clés étrangères.
          - Réorganisation de la création des fonctions et des politiques RLS.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [Admin, Super Admin]
          
          ## Performance Impact:
          - Indexes: [Added]
          - Triggers: [Re-created]
          - Estimated Impact: [Faible. Améliore la sécurité et la cohérence.]
          */

-- 1. Arrêter et supprimer les anciens objets conflictuels
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.delete_user(uuid);
DROP FUNCTION IF EXISTS public.get_user_role(uuid);

-- 2. Création des types ENUM pour la cohérence
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('Super Admin', 'Admin', 'Manager', 'Membre', 'Observateur');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'establishment_status') THEN
        CREATE TYPE public.establishment_status AS ENUM ('Actif', 'Inactif', 'À vérifier');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_status') THEN
        CREATE TYPE public.question_status AS ENUM ('Proposition', 'En revue', 'Validé', 'Archivé');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_type') THEN
        CREATE TYPE public.question_type AS ENUM ('Texte court', 'Texte long', 'Numérique', 'Oui/Non', 'Choix unique', 'Choix multiple', 'Échelle', 'Date/Heure');
    END IF;
END
$$;

-- 3. Création de la fonction pour récupérer le rôle (sans récursion)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT raw_user_meta_data->>'role' INTO user_role
  FROM auth.users
  WHERE id = user_id;
  RETURN user_role;
END;
$$;

-- 4. Création des tables dans le bon ordre
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name text,
    last_name text,
    role public.user_role NOT NULL DEFAULT 'Membre',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.establishments (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at timestamptz NOT NULL DEFAULT now(),
    name text NOT NULL,
    type text,
    address text,
    latitude double precision,
    longitude double precision,
    contact_name text,
    contact_email text,
    notes text,
    status public.establishment_status NOT NULL DEFAULT 'À vérifier',
    responsible_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz NOT NULL DEFAULT now(),
    question_text text NOT NULL,
    question_type public.question_type NOT NULL,
    category text,
    options text[],
    status public.question_status NOT NULL DEFAULT 'Proposition',
    created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.question_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    version integer NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.question_template_items (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    template_id uuid NOT NULL REFERENCES public.question_templates(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    item_order integer NOT NULL,
    UNIQUE(template_id, question_id)
);

CREATE TABLE IF NOT EXISTS public.answers (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    created_at timestamptz NOT NULL DEFAULT now(),
    answer_value jsonb,
    created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    establishment_id bigint NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE
);

-- 5. Création des fonctions pour les déclencheurs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    (new.raw_user_meta_data->>'role')::public.user_role
  );
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_user(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;

-- 6. Création du déclencheur pour les nouveaux utilisateurs
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Activation de RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_template_items ENABLE ROW LEVEL SECURITY;

-- 8. Suppression des anciennes politiques pour éviter les conflits
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil." ON public.profiles;
DROP POLICY IF EXISTS "Les admins peuvent tout gérer." ON public.profiles;
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent tout lire." ON public.establishments;
DROP POLICY IF EXISTS "Les admins peuvent tout gérer." ON public.establishments;
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent tout lire." ON public.questions;
DROP POLICY IF EXISTS "Les admins peuvent tout gérer." ON public.questions;
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres réponses." ON public.answers;
DROP POLICY IF EXISTS "Les admins peuvent tout gérer." ON public.answers;
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent lire les modèles." ON public.question_templates;
DROP POLICY IF EXISTS "Les admins peuvent gérer les modèles." ON public.question_templates;
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent lire les items." ON public.question_template_items;
DROP POLICY IF EXISTS "Les admins peuvent gérer les items." ON public.question_template_items;


-- 9. Création des politiques RLS
-- Profiles
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil." ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Les admins peuvent tout gérer." ON public.profiles
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('Admin', 'Super Admin'));

-- Establishments
CREATE POLICY "Les utilisateurs authentifiés peuvent tout lire." ON public.establishments
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Les admins peuvent tout gérer." ON public.establishments
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('Admin', 'Super Admin'));

-- Questions
CREATE POLICY "Les utilisateurs authentifiés peuvent tout lire." ON public.questions
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Les admins peuvent tout gérer." ON public
.questions
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('Admin', 'Super Admin'));

-- Question Templates
CREATE POLICY "Les utilisateurs authentifiés peuvent lire les modèles." ON public.question_templates
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Les admins peuvent gérer les modèles." ON public.question_templates
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('Admin', 'Super Admin'));

-- Question Template Items
CREATE POLICY "Les utilisateurs authentifiés peuvent lire les items." ON public.question_template_items
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Les admins peuvent gérer les items." ON public.question_template_items
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('Admin', 'Super Admin'));

-- Answers
CREATE POLICY "Les utilisateurs peuvent voir leurs propres réponses." ON public.answers
  FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Les admins peuvent tout gérer." ON public.answers
  FOR ALL USING (public.get_user_role(auth.uid()) IN ('Admin', 'Super Admin'));
