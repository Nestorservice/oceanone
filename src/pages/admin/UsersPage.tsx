import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { PlusCircle, Edit, Trash2, Loader2, User as UserIcon } from 'lucide-react';
import Button from '../../components/ui/Button';
import AddUserModal from '../../components/admin/AddUserModal';
import EditUserModal from '../../components/admin/EditUserModal';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import { toast } from 'sonner';
import { Profile } from '../../types/supabase';
import ViewToggle from '../../components/ui/ViewToggle';
import { useViewMode } from '../../hooks/useViewMode';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<Profile | null>(null);
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewMode, setViewMode] = useViewMode('users-view', 'card');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_details')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Erreur lors de la récupération des utilisateurs: " + error.message);
      console.error(error);
    } else if (data) {
      setUsers(data as Profile[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  const handleEditClick = (user: Profile) => {
    setUserToEdit(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (user: Profile) => {
    setUserToDelete(user);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    setDeleteLoading(true);
    const { error } = await supabase.rpc('delete_user', { user_id: userToDelete.id });
    setDeleteLoading(false);

    if (error) {
      toast.error("Erreur lors de la suppression de l'utilisateur: " + error.message);
    } else {
      toast.success("Utilisateur supprimé avec succès.");
      fetchUsers();
      setIsDeleteConfirmOpen(false);
      setUserToDelete(null);
    }
  };

  const getRoleClass = (role: string) => {
    switch (role) {
      case 'Admin':
      case 'Super Admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      case 'Manager':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
    }
  };

  const renderListView = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nom</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rôle</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date de création</th>
            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.first_name || ''} {user.last_name || ''}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.email}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleClass(user.role)}`}>
                  {user.role}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(user.created_at).toLocaleDateString()}</td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                <button onClick={() => handleEditClick(user)} className="text-brand-DEFAULT hover:text-brand-dark"><Edit className="h-4 w-4" /></button>
                <button onClick={() => handleDeleteClick(user)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCardView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {users.map((user) => (
        <div key={user.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 flex flex-col">
          <div className="flex-grow">
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 rounded-full bg-brand-light text-white flex items-center justify-center font-bold text-xl mr-4">
                {user.first_name?.[0] || ''}{user.last_name?.[0] || ''}
              </div>
              <div>
                <h2 className="text-md font-bold text-gray-800 dark:text-white truncate">{user.first_name} {user.last_name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleClass(user.role)}`}>
              {user.role}
            </span>
            <div className="space-x-2">
              <button onClick={() => handleEditClick(user)} className="text-gray-400 hover:text-brand-DEFAULT"><Edit className="h-4 w-4" /></button>
              <button onClick={() => handleDeleteClick(user)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
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
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gestion des Utilisateurs</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{users.length} utilisateur(s)</p>
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
      ) : users.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucun utilisateur</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Commencez par ajouter un utilisateur.</p>
        </div>
      ) : (
        viewMode === 'list' ? renderListView() : renderCardView()
      )}
      
      <AddUserModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onUserAdded={fetchUsers}
      />

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={userToEdit}
        onUserUpdated={fetchUsers}
      />

      <ConfirmationDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer l'utilisateur ${userToDelete?.first_name} ${userToDelete?.last_name}? Cette action est irréversible.`}
        loading={deleteLoading}
      />
    </>
  );
};

export default UsersPage;
