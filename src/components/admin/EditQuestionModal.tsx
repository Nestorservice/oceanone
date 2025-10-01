import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { Question, QuestionType } from '../../types/supabase';
import Textarea from '../ui/Textarea';

interface EditQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  question: Question | null;
}

const questionTypes: QuestionType[] = ['Texte court', 'Texte long', 'Numérique', 'Oui/Non', 'Choix unique', 'Choix multiple', 'Échelle', 'Date/Heure'];

const EditQuestionModal: React.FC<EditQuestionModalProps> = ({ isOpen, onClose, onSuccess, question }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Question>>({});

  useEffect(() => {
    if (question) {
      setFormData(question);
    }
  }, [question]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question) return;

    setLoading(true);
    const { error } = await supabase
      .from('questions')
      .update({ ...formData })
      .eq('id', question.id);

    setLoading(false);

    if (error) {
        toast.error("Erreur: " + error.message);
    } else {
      onSuccess();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modifier la question">
      <form onSubmit={handleUpdate} className="space-y-4">
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
          placeholder="Catégorie"
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
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditQuestionModal;
