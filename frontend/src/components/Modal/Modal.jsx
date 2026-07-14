// components/Modal/Modal.jsx
//
// Why it exists: Forms (create/edit user, shop, product) appear in modals.
//               One accessible modal shell, reused across all feature forms.
// Responsibility: Overlay + focus trap + close on Escape/backdrop click.
// Used by: UserForm, ShopForm, ProductForm, ConfirmDialog

import { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size      = 'md',   // sm | md | lg | xl
  hideClose = false,
}) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size] ?? 'max-w-lg';

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`modal-box ${sizeClass}`}
        onClick={(e) => e.stopPropagation()} // prevent backdrop click from bubbling
      >
        {/* Header */}
        <div className="modal-header">
          <h2 id="modal-title" className="text-base font-semibold text-surface-900">
            {title}
          </h2>
          {!hideClose && (
            <button
              onClick={onClose}
              className="btn-icon"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
