import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { Establishment } from '../../types/supabase';

interface EditEstablishmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  establishment: Establishment | null;
}

const EditEstablishmentModal: React.FC<EditEstablishmentModalProps> = ({ isOpen, onClose, onSuccess, establishment }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Establishment>>({});

  useEffect(() => {
    if (establishment) {
      setFormData(establishment);
    }
  }, [establishment]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!establishment) return;

    setLoading(true);
    const { error } = await supabase
      .from('establishments')
      .update({ ...formData })
      .eq('id', establishment.id);

    setLoading(false);

    if (!error) {
      onSuccess();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Modifier l'établissement">
      <form onSubmit={handleUpdate} className="space-y-4">
        <Input
          name="name"
          placeholder="Nom de l'établissement"
          value={formData.name || ''}
          onChange={handleChange}
          required
        />
        <Select
          name="type"
          label="Type"
          value={formData.type || 'École'}
          onChange={handleChange}
          required
        >
          <option>École</option>
          <option>Lycée</option>
          <option>Université</option>
          <option>Centre de formation</option>
        </Select>
        <Input
          name="address"
          placeholder="Adresse"
          value={formData.address || ''}
          onChange={handleChange}
        />
         <Select
          name="status"
          label="Statut"
          value={formData.status || 'À vérifier'}
          onChange={handleChange}
          required
        >
          <option>À vérifier</option>
          <option>Actif</option>
          <option>Inactif</option>
        </Select>
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

export default EditEstablishmentModal;
