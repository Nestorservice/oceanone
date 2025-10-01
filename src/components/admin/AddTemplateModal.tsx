import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { QuestionTemplate } from '../../types/supabase';
import { useAuth } from '../../hooks/useAuth';
import Textarea from '../ui/Textarea';

interface AddTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddTemplateModal: React.FC<AddTemplateModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<QuestionTemplate>>({
    title: '',
    description: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { error } = await supabase.from('question_templates').insert([
      { ...formData, created_by: user.id }
    ]);

    setLoading(false);

    if (error) {
        toast.error("Erreur lors de l'ajout: " + error.message);
    } else {
      onSuccess();
      onClose();
      setFormData({ title: '', description: '' });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un modèle de questionnaire">
      <form onSubmit={handleAdd} className="space-y-4">
        <Input
          name="title"
          placeholder="Titre du modèle"
          value={formData.title || ''}
          onChange={handleChange}
          required
        />
        <Textarea
          name="description"
          label="Description"
          value={formData.description || ''}
          onChange={handleChange}
          rows={3}
        />
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" className="bg-gray-200 hover:bg-gray-300 text-gray-800 w-auto" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading} className="w-auto">
            {loading ? 'Ajout...' : 'Ajouter le modèle'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddTemplateModal;
