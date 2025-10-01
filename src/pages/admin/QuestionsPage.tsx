import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { PlusCircle, Edit, Trash2, Loader2, FileText } from 'lucide-react';
import Button from '../../components/ui/Button';
import AddQuestionModal from '../../components/admin/AddQuestionModal';
import EditQuestionModal from '../../components/admin/EditQuestionModal';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import { toast } from 'sonner';
import { Question } from '../../types/supabase';
import ViewToggle from '../../components/ui/ViewToggle';
import { useViewMode } from '../../hooks/useViewMode';

const QuestionsPage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [questionToEdit, setQuestionToEdit] = useState<Question | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewMode, setViewMode] = useViewMode('questions-view', 'card');

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('questions').select('*').order('created_at', { ascending: false });

    if (error) {
      toast.error("Erreur lors de la récupération des questions: " + error.message);
    } else {
      setQuestions(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleEditClick = (question: Question) => {
    setQuestionToEdit(question);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (question: Question) => {
    setQuestionToDelete(question);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!questionToDelete) return;

    setDeleteLoading(true);
    const { error } = await supabase.from('questions').delete().eq('id', questionToDelete.id);
    setDeleteLoading(false);

    if (error) {
      toast.error("Erreur lors de la suppression de la question: " + error.message);
    } else {
      toast.success("Question supprimée avec succès.");
      fetchQuestions();
      setIsDeleteConfirmOpen(false);
      setQuestionToDelete(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Validé': return 'bg-green-100 text-green-800';
      case 'En revue': return 'bg-yellow-100 text-yellow-800';
      case 'Proposition': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderListView = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Question</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Catégorie</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {questions.map((q) => (
            <tr key={q.id}>
              <td className="px-6 py-4 whitespace-pre-wrap text-sm font-medium text-gray-900 dark:text-white max-w-sm">{q.question_text}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{q.question_type}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{q.category || 'N/A'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(q.status)}`}>
                  {q.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                <button onClick={() => handleEditClick(q)} className="text-brand-DEFAULT hover:text-brand-dark"><Edit className="h-4 w-4" /></button>
                <button onClick={() => handleDeleteClick(q)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCardView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {questions.map((q) => (
        <div key={q.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 flex flex-col">
          <div className="flex-grow">
            <p className="text-sm font-medium text-gray-800 dark:text-white mb-3 h-20 overflow-hidden">{q.question_text}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{q.question_type} • {q.category || 'N/A'}</p>
          </div>
          <div className="flex justify-between items-center mt-4">
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(q.status)}`}>
              {q.status}
            </span>
            <div className="space-x-2">
              <button onClick={() => handleEditClick(q)} className="text-gray-400 hover:text-brand-DEFAULT"><Edit className="h-4 w-4" /></button>
              <button onClick={() => handleDeleteClick(q)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Banque de Questions</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{questions.length} question(s)</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
          <Button className="w-full sm:w-auto" onClick={() => setIsAddModalOpen(true)}>
            <PlusCircle className="h-5 w-5 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto text-brand-DEFAULT" /></div>
      ) : questions.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucune question</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Commencez par ajouter une question à la banque.</p>
        </div>
      ) : (
        viewMode === 'list' ? renderListView() : renderCardView()
      )}
      
      <AddQuestionModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchQuestions();
          toast.success("La question a été ajoutée.");
        }}
      />

      <EditQuestionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        question={questionToEdit}
        onSuccess={() => {
          fetchQuestions();
          toast.success("La question a été mise à jour.");
        }}
      />

      <ConfirmationDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer cette question ?`}
        loading={deleteLoading}
      />
    </>
  );
};

export default QuestionsPage;
