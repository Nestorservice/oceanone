import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import { Question, QuestionType } from '../../types/supabase';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const questionTypes: QuestionType[] = ['Texte court', 'Texte long', 'Numérique', 'Oui/Non', 'Choix unique', 'Choix multiple', 'Échelle', 'Date/Heure'];

const ProposeQuestionPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Question>>({
    question_text: '',
    question_type: 'Texte court',
    category: '',
    status: 'Proposition',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Vous devez être connecté pour proposer une question.");
      return;
    }
    setLoading(true);

    const { error } = await supabase.from('questions').insert([
      { ...formData, created_by: user.id }
    ]);

    setLoading(false);

    if (error) {
        toast.error("Erreur lors de la soumission: " + error.message);
    } else {
      toast.success("Votre question a été soumise pour validation !");
      navigate('/member/contributions');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Proposer une nouvelle question</h1>
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Textarea
            id="question_text"
            name="question_text"
            label="Texte de la question"
            value={formData.question_text || ''}
            onChange={handleChange}
            required
            rows={4}
            placeholder="Ex: Quel est l'état général de la toiture ?"
          />
          <Select
            id="question_type"
            name="question_type"
            label="Type de question"
            value={formData.question_type || 'Texte court'}
            onChange={handleChange}
            required
          >
            {questionTypes.map(type => <option key={type}>{type}</option>)}
          </Select>
          <div className="relative">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catégorie</label>
            <Input
              id="category"
              name="category"
              placeholder="Ex: Infrastructure, Pédagogie, Sanitaire"
              value={formData.category || ''}
              onChange={handleChange}
            />
          </div>
          <div className="pt-4">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Soumission...</> : 'Soumettre la question'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProposeQuestionPage;
