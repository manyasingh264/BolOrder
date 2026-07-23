// features/users/UserTable.jsx
//
// Shows SALESMAN users only (non-salesmen are filtered out before this table).
// Each row is clickable — navigates to /admin/salesmen/:id (SalesmanDetailPage).
// Edit/Delete buttons still exist but stop propagation so they don't trigger row click.

import { useNavigate } from 'react-router-dom';
import Table from '../../components/Table/Table';
import { RoleBadge, ActiveBadge } from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import { Edit2, Trash2, ChevronRight } from 'lucide-react';
import { formatDate, getInitials } from '../../utils';
import { buildRoute } from '../../constants';

const COLUMNS = (onEdit, onDelete, navigate) => [
  {
    header:   'Salesman',
    accessor: 'name',
    render:   (val, row) => (
      <div className="flex items-center gap-3">
        {/* Avatar circle with initials */}
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold shrink-0">
          {getInitials(val)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-surface-800 truncate">{val}</p>
          <p className="text-xs text-surface-400 truncate">{row.email}</p>
        </div>
      </div>
    ),
  },
  {
    header:   'Phone',
    accessor: 'phone',
    render:   (val) => (
      <span className="text-sm text-surface-600">{val || '—'}</span>
    ),
  },
  {
    header:   'Status',
    accessor: 'isActive',
    render:   (val) => <ActiveBadge isActive={val} />,
  },
  {
    header:   'Joined',
    accessor: 'createdAt',
    render:   (val) => (
      <span className="text-xs text-surface-400">{formatDate(val)}</span>
    ),
  },
  {
    header: 'Actions',
    render: (_, row) => (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Edit2 size={13} />}
          onClick={(e) => { e.stopPropagation(); onEdit(row); }}
          id={`edit-user-${row.id}`}
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Trash2 size={13} />}
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={(e) => { e.stopPropagation(); onDelete(row); }}
          id={`delete-user-${row.id}`}
        >
          Delete
        </Button>
        <button
          onClick={(e) => { e.stopPropagation(); navigate(buildRoute.salesmanDetail(row.id)); }}
          className="p-1.5 rounded-lg text-surface-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
          title="View performance"
          id={`view-user-${row.id}`}
        >
          <ChevronRight size={15} />
        </button>
      </div>
    ),
  },
];

const UserTable = ({ users, isLoading, onEdit, onDelete }) => {
  const navigate = useNavigate();

  return (
    <Table
      columns={COLUMNS(onEdit, onDelete, navigate)}
      data={users}
      isLoading={isLoading}
      emptyTitle="No salesmen found"
      emptyMessage="Add a new salesman using the button above."
      onRowClick={(row) => navigate(buildRoute.salesmanDetail(row.id))}
      rowClassName="cursor-pointer hover:bg-surface-50 transition-colors"
    />
  );
};

export default UserTable;
