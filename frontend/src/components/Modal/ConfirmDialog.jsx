// components/Modal/ConfirmDialog.jsx
//
// Why it exists: Delete/deactivate/status-change actions need a "Are you sure?" prompt.
//               One dialog component used everywhere instead of repeated confirm UI.
// Responsibility: Show a warning dialog with confirm + cancel buttons.
// Used by: UserForm (deactivate), StatusUpdater (cancel order), anywhere destructive.

import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from '../Button/Button';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title       = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  variant      = 'danger',   // 'danger' | 'warning' | 'primary'
  isLoading    = false,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="" size="sm" hideClose>
    <div className="text-center py-2">
      {/* Icon */}
      <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
        variant === 'danger'  ? 'bg-red-100'   :
        variant === 'warning' ? 'bg-amber-100' : 'bg-primary-100'
      }`}>
        <AlertTriangle size={26} className={
          variant === 'danger'  ? 'text-red-500'    :
          variant === 'warning' ? 'text-amber-500'  : 'text-primary-500'
        } />
      </div>

      <h3 className="text-base font-semibold text-surface-900 mb-2">{title}</h3>
      <p className="text-sm text-surface-500 mb-6">{description}</p>

      <div className="flex gap-3 justify-center">
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          {cancelLabel}
        </Button>
        <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} isLoading={isLoading}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  </Modal>
);

export default ConfirmDialog;
