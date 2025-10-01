import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Question } from '../../types/supabase';
import { Loader2, Search } from 'lucide-react';
import Input from '../ui/Input';

interface AddQuestionToTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  templateId: string;
  existingQuestionIds: string[];
}

const AddQuestionToTemplateModal: React.FC<AddQuestionToTemplateModalProps> = ({ isOpen, onClose, onSuccess, templateId, existingQuestionIds }) => {
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Erreur lors de la récupération des questions: " + error.message);
    } else {
      // Filter out questions that are already in the template
      const availableQuestions = data.filter(q => !existingQuestionIds.includes(q.id));
      setAllQuestions(availableQuestions);
    }
    setLoading(false);
  }, [existingQuestionIds]);

  useEffect(() => {
    if (isOpen) {
      fetchQuestions();
      setSelectedQuestions(new Set());
    }
  }, [isOpen, fetchQuestions]);

  const handleToggleQuestion = (questionId: string) => {
    const newSelection = new Set(selectedQuestions);
    if (newSelection.has(questionId)) {
      newSelection.delete(questionId);
    } else {
      newSelection.add(questionId);
    }
    setSelectedQuestions(newSelection);
  };

  const handleSave = async () => {
    setSaving(true);
    const itemsToInsert = Array.from(selectedQuestions).map((questionId, index) => ({
      template_id: templateId,
      question_id: questionId,
      item_order: index, // This should be improved for proper ordering
    }));

    const { error } = await supabase.from('question_template_items').insert(itemsToInsert);
    setSaving(false);

    if (error) {
      toast.error("Erreur lors de l'ajout des questions: " + error.message);
    } else {
      onSuccess();
      onClose();
    }
  };

  const filteredQuestions = allQuestions.filter(q => 
    q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter des questions au modèle">
      <div className="space-y-4">
        <Input 
            icon={<Search className="h-4 w-4 text-gray-400" />}
            placeholder="Rechercher une question..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          {loading ? (
            <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-brand-DEFAULT" /></div>
          ) : filteredQuestions.length === 0 ? (
            <p className="text-center py-4 text-gray-500">Aucune autre question disponible.</p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredQuestions.map(q => (
                <li key={q.id} className="p-4 flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => handleToggleQuestion(q.id)}>
                  <input
                    type="checkbox"
                    checked={selectedQuestions.has(q.id)}
                    onChange={() => handleToggleQuestion(q.id)}
                    className="h-4 w-4 text-brand-DEFAULT border-gray-300 rounded focus:ring-brand-light"
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{q.question_text}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{q.category}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" className="bg-gray-200 hover:bg-gray-300 text-gray-800 w-auto" onClick={onClose}>
            Annuler
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || selectedQuestions.size === 0} className="w-auto">
            {saving ? 'Ajout...' : `Ajouter ${selectedQuestions.size} question(s)`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddQuestionToTemplateModal;
