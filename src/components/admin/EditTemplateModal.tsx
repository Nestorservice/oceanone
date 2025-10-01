import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { QuestionTemplate } from '../../types/supabase';
import Textarea from '../ui/Textarea';

interface EditTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  template: QuestionTemplate | null;
}

const EditTemplateModal: React.FC<EditTemplateModalProps> = ({ isOpen, onClose, onSuccess, template }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<QuestionTemplate>>({});

  useEffect(() => {
    if (template) {
      setFormData(template);
    }
  }, [template]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template) return;

    setLoading(true);
    const { error } = await supabase
      .from('question_templates')
      .update({ title: formData.title, description: formData.description })
      .eq('id', template.id);

    setLoading(false);

    if (error) {
        toast.error("Erreur: " + error.message);
    } else {
      onSuccess();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modifier le modèle">
      <form onSubmit={handleUpdate} className="space-y-4">
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
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditTemplateModal;
