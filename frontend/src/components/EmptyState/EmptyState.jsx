// components/EmptyState/EmptyState.jsx
//
// Why it exists: When a list is empty (no users, no orders, no shops),
//               we need a consistent friendly message instead of a blank page.
// Responsibility: Show an icon, heading, and optional action button.
// Used by: Every table page when data array is empty.

import { PackageOpen } from 'lucide-react';

const EmptyState = ({
  icon:     Icon    = PackageOpen,
  title               = 'Nothing here yet',
  description         = 'No data to display at the moment.',
  action,           // { label, onClick }
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
      <Icon size={28} className="text-surface-400" />
    </div>
    <h3 className="text-base font-semibold text-surface-700 mb-1">{title}</h3>
    <p className="text-sm text-surface-400 max-w-xs">{description}</p>
    {action && (
      <button
        onClick={action.onClick}
        className="btn-primary mt-5"
      >
        {action.label}
      </button>
    )}
  </div>
);

export default EmptyState;
