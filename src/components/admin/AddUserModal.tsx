import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onUserAdded }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Membre');
  const [loading, setLoading] = useState(false);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // This assumes "Confirm email" is turned OFF in your Supabase project settings.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: role,
        },
      },
    });

    setLoading(false);

    if (error) {
      toast.error(error.message || "Erreur lors de la création de l'utilisateur.");
    } else if (data.user) {
      toast.success('Utilisateur créé avec succès.');
      onUserAdded();
      onClose();
      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setRole('Membre');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un nouvel utilisateur">
      <form onSubmit={handleAddUser} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="first-name"
            placeholder="Prénom"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <Input
            id="last-name"
            placeholder="Nom de famille"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <Input
          id="email"
          type="email"
          placeholder="Adresse e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          id="password"
          type="password"
          placeholder="Mot de passe (min. 6 caractères)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Select
          id="role"
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
            {loading ? 'Ajout en cours...' : 'Ajouter l\'utilisateur'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddUserModal;
