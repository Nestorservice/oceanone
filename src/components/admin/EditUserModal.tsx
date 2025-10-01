import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { Profile } from '../../types/supabase';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
  user: Profile | null;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, onUserUpdated, user }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('Membre');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setRole(user.role);
    }
  }, [user]);

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        role: role,
      })
      .eq('id', user.id);

    setLoading(false);

    if (error) {
      toast.error(error.message || "Erreur lors de la mise à jour de l'utilisateur.");
    } else {
      toast.success('Utilisateur mis à jour avec succès !');
      onUserUpdated();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modifier l'utilisateur">
      <form onSubmit={handleUpdateUser} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="edit-first-name"
            placeholder="Prénom"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <Input
            id="edit-last-name"
            placeholder="Nom de famille"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <Input
          id="edit-email"
          type="email"
          placeholder="Adresse e-mail"
          value={user?.email || ''}
          disabled // Email is not editable from here for security reasons
        />
        <Select
          id="edit-role"
          label="Rôle"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
        >
          <option>Membre</option>
          <option>Manager</option>
          <option>Admin</option>
          <option>Observateur</option>
          <option>Super Admin</option>
        </Select>
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" className="bg-gray-200 hover:bg-gray-300 text-gray-800 w-auto" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading} className="w-auto">
            {loading ? 'Mise à jour...' : 'Sauvegarder les modifications'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditUserModal;
