export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: 'Super Admin' | 'Admin' | 'Manager' | 'Membre' | 'Observateur';
  created_at: string;
  email?: string; // This will come from the user_details view
}

export interface Establishment {
  id: string; 
  created_at: string;
  name: string;
  type: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  contact_name: string | null;
  contact_email: string | null;
  notes: string | null;
  status: 'Actif' | 'Inactif' | 'À vérifier';
  responsible_id: string | null;
  created_by: string;
}

export type QuestionType = 'Texte court' | 'Texte long' | 'Numérique' | 'Oui/Non' | 'Choix unique' | 'Choix multiple' | 'Échelle' | 'Date/Heure';

export interface Question {
    id: string;
    created_at: string;
    question_text: string;
    question_type: QuestionType;
    category: string | null;
    options: string[] | null;
    status: 'Proposition' | 'En revue' | 'Validé' | 'Archivé';
    created_by: string;
}

export interface QuestionTemplate {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  created_by: string;
  version: number;
}

export interface QuestionTemplateItem {
  id: number;
  template_id: string;
  question_id: string;
  item_order: number;
  questions: Question;
}
