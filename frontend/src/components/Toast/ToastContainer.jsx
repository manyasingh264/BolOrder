// components/Toast/ToastContainer.jsx
//
// Why it exists: Success/error notifications must appear from anywhere in the app.
//               They're dispatched via Redux (addToast) and rendered here once.
// Responsibility: Subscribe to Redux toasts[], render them, auto-dismiss after 4s.
// Used by: Mounted once in DashboardLayout — never placed in individual pages.

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { selectToasts, removeToast } from '../../redux/slices/uiSlice';

const ICONS = {
  success: <CheckCircle2  size={18} className="text-green-500 flex-shrink-0" />,
  error:   <XCircle       size={18} className="text-red-500   flex-shrink-0" />,
  info:    <Info          size={18} className="text-blue-500  flex-shrink-0" />,
  warning: <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />,
};

const Toast = ({ id, message, type }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const timer = setTimeout(() => dispatch(removeToast(id)), 4000);
    return () => clearTimeout(timer);
  }, [id, dispatch]);

  const typeClass = {
    success: 'toast-success',
    error:   'toast-error',
    info:    'toast-info',
    warning: 'toast-warning',
  }[type] ?? 'toast-info';

  return (
    <div className={typeClass} role="alert">
      {ICONS[type]}
      <p className="flex-1 text-sm leading-snug">{message}</p>
      <button
        onClick={() => dispatch(removeToast(id))}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity ml-1"
        aria-label="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  );
};

const ToastContainer = () => {
  const toasts = useSelector(selectToasts);

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
