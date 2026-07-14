// components/Badge/Badge.jsx
//
// Why it exists: Order statuses, user roles, and isActive flags all need
//               colored pill badges. One component, all cases handled.
// Responsibility: Map a value to the correct badge CSS class and render a pill.
// Used by: Every table row showing status/role, OrderDetail, UserTable, etc.

import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  ROLE_LABELS,
} from '../../constants';

// ─── Status Badge (for order statuses) ────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const label     = ORDER_STATUS_LABELS[status] ?? status;
  const className = ORDER_STATUS_STYLES[status]  ?? 'badge-draft';
  return <span className={className}>{label}</span>;
};

// ─── Role Badge (for user roles) ──────────────────────────────────────────────
export const RoleBadge = ({ role }) => {
  const label     = ROLE_LABELS[role] ?? role;
  const className = {
    ADMIN:      'badge badge-admin',
    SUPERVISOR: 'badge badge-supervisor',
    SALESMAN:   'badge badge-salesman',
  }[role] ?? 'badge badge-draft';
  return <span className={className}>{label}</span>;
};

// ─── Active Badge (for isActive boolean) ──────────────────────────────────────
export const ActiveBadge = ({ isActive }) => (
  <span className={isActive ? 'badge badge-active' : 'badge badge-inactive'}>
    {isActive ? 'Active' : 'Inactive'}
  </span>
);

// ─── Generic Badge ────────────────────────────────────────────────────────────
const Badge = ({ children, variant = 'default', className = '' }) => {
  const cls = {
    default:   'badge bg-surface-100 text-surface-600',
    primary:   'badge bg-primary-100 text-primary-700',
    success:   'badge badge-delivered',
    warning:   'badge badge-pending',
    danger:    'badge badge-cancelled',
    info:      'badge badge-confirmed',
  }[variant] ?? 'badge bg-surface-100 text-surface-600';

  return <span className={`${cls} ${className}`}>{children}</span>;
};

export default Badge;
