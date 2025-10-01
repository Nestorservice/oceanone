import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { PlusCircle, Edit, Trash2, Loader2, Building } from 'lucide-react';
import Button from '../../components/ui/Button';
import AddEstablishmentModal from '../../components/admin/AddEstablishmentModal';
import EditEstablishmentModal from '../../components/admin/EditEstablishmentModal';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import { toast } from 'sonner';
import { Establishment } from '../../types/supabase';
import ViewToggle from '../../components/ui/ViewToggle';
import { useViewMode } from '../../hooks/useViewMode';

const EstablishmentsPage: React.FC = () => {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [establishmentToEdit, setEstablishmentToEdit] = useState<Establishment | null>(null);
  const [establishmentToDelete, setEstablishmentToDelete] = useState<Establishment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewMode, setViewMode] = useViewMode('establishments-view', 'card');

  const fetchEstablishments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('establishments').select('*').order('created_at', { ascending: false });

    if (error) {
      toast.error("Erreur lors de la récupération des établissements: " + error.message);
    } else {
      setEstablishments(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEstablishments();
  }, [fetchEstablishments]);

  const handleEditClick = (establishment: Establishment) => {
    setEstablishmentToEdit(establishment);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (establishment: Establishment) => {
    setEstablishmentToDelete(establishment);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!establishmentToDelete) return;

    setDeleteLoading(true);
    const { error } = await supabase.from('establishments').delete().eq('id', establishmentToDelete.id);
    setDeleteLoading(false);

    if (error) {
      toast.error("Erreur lors de la suppression de l'établissement: " + error.message);
    } else {
      toast.success("Établissement supprimé avec succès.");
      fetchEstablishments();
      setIsDeleteConfirmOpen(false);
      setEstablishmentToDelete(null);
    }
  };

  const renderListView = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nom</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Adresse</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Statut</th>
            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {establishments.map((est) => (
            <tr key={est.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{est.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{est.type}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{est.address}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  est.status === 'Actif' ? 'bg-green-100 text-green-800' : 
                  est.status === 'Inactif' ? 'bg-gray-100 text-gray-800' : 
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {est.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                <button onClick={() => handleEditClick(est)} className="text-brand-DEFAULT hover:text-brand-dark"><Edit className="h-4 w-4" /></button>
                <button onClick={() => handleDeleteClick(est)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCardView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {establishments.map((est) => (
        <div key={est.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 flex flex-col">
          <div className="flex-grow">
            <div className="flex items-center mb-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg mr-3">
                <Building className="h-5 w-5 text-brand-DEFAULT" />
              </div>
              <h2 className="text-md font-bold text-gray-800 dark:text-white truncate">{est.name}</h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{est.type}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{est.address}</p>
          </div>
          <div className="flex justify-between items-center mt-4">
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              est.status === 'Actif' ? 'bg-green-100 text-green-800' : 
              est.status === 'Inactif' ? 'bg-gray-100 text-gray-800' : 
              'bg-yellow-100 text-yellow-800'
            }`}>
              {est.status}
            </span>
            <div className="space-x-2">
              <button onClick={() => handleEditClick(est)} className="text-gray-400 hover:text-brand-DEFAULT"><Edit className="h-4 w-4" /></button>
              <button onClick={() => handleDeleteClick(est)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
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
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gestion des Établissements</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{establishments.length} établissement(s)</p>
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
      ) : establishments.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <Building className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucun établissement</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Commencez par ajouter un établissement.</p>
        </div>
      ) : (
        viewMode === 'list' ? renderListView() : renderCardView()
      )}
      
      <AddEstablishmentModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchEstablishments();
          toast.success("L'établissement a été ajouté.");
        }}
      />

      <EditEstablishmentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        establishment={establishmentToEdit}
        onSuccess={() => {
          fetchEstablishments();
          toast.success("L'établissement a été mis à jour.");
        }}
      />

      <ConfirmationDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer l'établissement ${establishmentToDelete?.name}?`}
        loading={deleteLoading}
      />
    </>
  );
};

export default EstablishmentsPage;
