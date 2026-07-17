// features/users/UserTable.jsx
import Table from '../../components/Table/Table';
import { RoleBadge, ActiveBadge } from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import { Edit2, Trash2 } from 'lucide-react';
import { formatDate } from '../../utils';

const COLUMNS = (onEdit, onDelete) => [
  {
    header:   'Name',
    accessor: 'name',
    render:   (val) => <span className="font-semibold text-surface-800">{val}</span>,
  },
  {
    header:   'Email',
    accessor: 'email',
    render:   (val) => <span className="text-surface-500 text-xs">{val}</span>,
  },
  {
    header:   'Role',
    accessor: 'role',
    render:   (val) => <RoleBadge role={val} />,
  },
  {
    header:   'Status',
    accessor: 'isActive',
    render:   (val) => <ActiveBadge isActive={val} />,
  },
  {
    header:   'Joined',
    accessor: 'createdAt',
    render:   (val) => <span className="text-surface-400 text-xs">{formatDate(val)}</span>,
  },
  {
    header: 'Action',
    render: (_, row) => (
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Edit2 size={14} />}
          onClick={(e) => { e.stopPropagation(); onEdit(row); }}
          id={`edit-user-${row.id}`}
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<Trash2 size={14} />}
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={(e) => { e.stopPropagation(); onDelete(row); }}
        >
          Delete
        </Button>
      </div>
    ),
  },
];

const UserTable = ({ users, isLoading, onEdit, onDelete }) => (
  <Table
    columns={COLUMNS(onEdit, onDelete)}
    data={users}
    isLoading={isLoading}
    emptyTitle="No users found"
    emptyMessage="Create a new user using the button above."
  />
);

export default UserTable;
