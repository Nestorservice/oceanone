import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { PlusCircle, Edit, Trash2, Loader2, Library, ArrowRight, List, LayoutGrid } from 'lucide-react';
import Button from '../../components/ui/Button';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import { toast } from 'sonner';
import { QuestionTemplate } from '../../types/supabase';
import AddTemplateModal from '../../components/admin/AddTemplateModal';
import EditTemplateModal from '../../components/admin/EditTemplateModal';
import { Link } from 'react-router-dom';
import ViewToggle from '../../components/ui/ViewToggle';
import { useViewMode } from '../../hooks/useViewMode';

const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<QuestionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<QuestionTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<QuestionTemplate | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewMode, setViewMode] = useViewMode('templates-view', 'card');

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('question_templates').select('*').order('created_at', { ascending: false });

    if (error) {
      toast.error("Erreur lors de la récupération des modèles: " + error.message);
    } else {
      setTemplates(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleEditClick = (template: QuestionTemplate) => {
    setTemplateToEdit(template);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (template: QuestionTemplate) => {
    setTemplateToDelete(template);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;

    setDeleteLoading(true);
    const { error } = await supabase.from('question_templates').delete().eq('id', templateToDelete.id);
    setDeleteLoading(false);

    if (error) {
      toast.error("Erreur lors de la suppression du modèle: " + error.message);
    } else {
      toast.success("Modèle supprimé avec succès.");
      fetchTemplates();
      setIsDeleteConfirmOpen(false);
      setTemplateToDelete(null);
    }
  };

  const renderCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((template) => (
        <div key={template.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{template.title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 h-10 overflow-hidden">{template.description || 'Pas de description'}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Version {template.version}</p>
          </div>
          <div className="mt-6 flex justify-between items-center">
            <Link to={`/admin/templates/${template.id}`} className="inline-flex items-center text-sm font-medium text-brand-DEFAULT hover:text-brand-dark">
              Gérer les questions <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
            <div className="space-x-2">
              <button onClick={() => handleEditClick(template)} className="text-gray-400 hover:text-brand-DEFAULT"><Edit className="h-4 w-4" /></button>
              <button onClick={() => handleDeleteClick(template)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
     <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Titre</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Version</th>
            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {templates.map((template) => (
            <tr key={template.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                <Link to={`/admin/templates/${template.id}`} className="hover:underline">{template.title}</Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 max-w-md truncate">{template.description}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{template.version}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                <button onClick={() => handleEditClick(template)} className="text-brand-DEFAULT hover:text-brand-dark"><Edit className="h-4 w-4" /></button>
                <button onClick={() => handleDeleteClick(template)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Modèles de Questionnaires</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{templates.length} modèle(s)</p>
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
      ) : templates.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <Library className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucun modèle</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Commencez par créer votre premier modèle de questionnaire.</p>
        </div>
      ) : (
        viewMode === 'list' ? renderListView() : renderCardView()
      )}
      
      <AddTemplateModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchTemplates();
          toast.success("Le modèle a été ajouté.");
        }}
      />

      <EditTemplateModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        template={templateToEdit}
        onSuccess={() => {
          fetchTemplates();
          toast.success("Le modèle a été mis à jour.");
        }}
      />

      <ConfirmationDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer le modèle "${templateToDelete?.title}"?`}
        loading={deleteLoading}
      />
    </>
  );
};

export default TemplatesPage;
