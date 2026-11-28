import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy bỏ',
  variant = 'danger',
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm" title={title} description={message} closeDisabled={isLoading}>
      <div className="flex flex-col items-start gap-4">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
          variant === 'danger'
            ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
            : 'bg-[var(--color-orange-soft)] text-[var(--color-orange-ink)]'
          }`}
        >
          <AlertTriangle className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="flex w-full flex-wrap items-center justify-end gap-2 border-t border-[var(--border-color)] pt-4">
          <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="md"
            onClick={onConfirm}
            isLoading={isLoading}
            type="button"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
