import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">{message}</p>
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <Button type="button" className="bg-gray-200 hover:bg-gray-300 text-gray-800 w-auto" onClick={onClose}>
          {cancelText}
        </Button>
        <Button
          type="button"
          className="bg-red-600 hover:bg-red-700 w-auto"
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Suppression...' : confirmText}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmationDialog;
