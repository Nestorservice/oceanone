import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { QuestionTemplate, QuestionTemplateItem, Question } from '../../types/supabase';
import { Loader2, ArrowLeft, PlusCircle, Trash2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import AddQuestionToTemplateModal from '../../components/admin/AddQuestionToTemplateModal';

const TemplateDetailPage: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const [template, setTemplate] = useState<QuestionTemplate | null>(null);
  const [items, setItems] = useState<QuestionTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTemplateDetails = useCallback(async () => {
    if (!templateId) return;
    setLoading(true);

    const { data: templateData, error: templateError } = await supabase
      .from('question_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) {
      toast.error("Erreur lors de la récupération du modèle: " + templateError.message);
      setLoading(false);
      return;
    }
    setTemplate(templateData);

    const { data: itemsData, error: itemsError } = await supabase
      .from('question_template_items')
      .select('*, questions (*)')
      .eq('template_id', templateId)
      .order('item_order', { ascending: true });

    if (itemsError) {
      toast.error("Erreur lors de la récupération des questions du modèle: " + itemsError.message);
    } else {
      setItems(itemsData as QuestionTemplateItem[]);
    }

    setLoading(false);
  }, [templateId]);

  useEffect(() => {
    fetchTemplateDetails();
  }, [fetchTemplateDetails]);

  const handleRemoveQuestion = async (itemId: number) => {
    const { error } = await supabase.from('question_template_items').delete().eq('id', itemId);
    if (error) {
      toast.error("Erreur: " + error.message);
    } else {
      toast.success("Question retirée du modèle.");
      fetchTemplateDetails();
    }
  };

  if (loading) {
    return <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto text-brand-DEFAULT" /></div>;
  }

  if (!template) {
    return <div className="text-center py-8">Modèle non trouvé.</div>;
  }

  return (
    <>
      <div className="mb-6">
        <Link to="/admin/templates" className="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux modèles
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-4">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{template.title}</h1>
            <Button className="w-full sm:w-auto" onClick={() => setIsModalOpen(true)}>
                <PlusCircle className="h-5 w-5 mr-2" />
                Ajouter des questions
            </Button>
        </div>
        <p className="mt-1 text-gray-500 dark:text-gray-400">{template.description}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {items.length > 0 ? items.map((item, index) => (
            <li key={item.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-gray-500 dark:text-gray-400 font-bold mr-4">{index + 1}.</span>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.questions.question_text}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.questions.question_type} - {item.questions.category}</p>
                </div>
              </div>
              <button onClick={() => handleRemoveQuestion(item.id)} className="text-red-500 hover:text-red-700">
                <Trash2 className="h-5 w-5" />
              </button>
            </li>
          )) : (
            <li className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
              Ce modèle ne contient aucune question.
            </li>
          )}
        </ul>
      </div>

      <AddQuestionToTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        templateId={template.id}
        existingQuestionIds={items.map(i => i.question_id)}
        onSuccess={() => {
            fetchTemplateDetails();
            toast.success("Le modèle a été mis à jour.");
        }}
      />
    </>
  );
};

export default TemplateDetailPage;
