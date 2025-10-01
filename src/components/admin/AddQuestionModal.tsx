import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { Question, QuestionType } from '../../types/supabase';
import { useAuth } from '../../hooks/useAuth';
import Textarea from '../ui/Textarea';

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const questionTypes: QuestionType[] = ['Texte court', 'Texte long', 'Numérique', 'Oui/Non', 'Choix unique', 'Choix multiple', 'Échelle', 'Date/Heure'];

const AddQuestionModal: React.FC<AddQuestionModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { error } = await supabase.from('questions').insert([
      { ...formData, created_by: user.id }
    ]);

    setLoading(false);

    if (error) {
        toast.error("Erreur lors de l'ajout: " + error.message);
    } else {
      onSuccess();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter une question">
      <form onSubmit={handleAdd} className="space-y-4">
        <Textarea
          name="question_text"
          label="Texte de la question"
          value={formData.question_text || ''}
          onChange={handleChange}
          required
          rows={3}
        />
        <Select
          name="question_type"
          label="Type de question"
          value={formData.question_type || 'Texte court'}
          onChange={handleChange}
          required
        >
          {questionTypes.map(type => <option key={type}>{type}</option>)}
        </Select>
        <Input
          name="category"
          placeholder="Catégorie (ex: Pédagogie, Matériel)"
          value={formData.category || ''}
          onChange={handleChange}
        />
         <Select
          name="status"
          label="Statut"
          value={formData.status || 'Proposition'}
          onChange={handleChange}
          required
        >
          <option>Proposition</option>
          <option>En revue</option>
          <option>Validé</option>
          <option>Archivé</option>
        </Select>
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" className="bg-gray-200 hover:bg-gray-300 text-gray-800 w-auto" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading} className="w-auto">
            {loading ? 'Ajout...' : 'Ajouter'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddQuestionModal;
