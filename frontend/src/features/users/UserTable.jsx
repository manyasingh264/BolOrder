// features/users/UserTable.jsx
import Table from '../../components/Table/Table';
import { RoleBadge, ActiveBadge } from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import { Edit2 } from 'lucide-react';
import { formatDate } from '../../utils';

const COLUMNS = (onEdit) => [
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
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<Edit2 size={14} />}
        onClick={(e) => { e.stopPropagation(); onEdit(row); }}
        id={`edit-user-${row.id}`}
      >
        Edit
      </Button>
    ),
  },
];

const UserTable = ({ users, isLoading, onEdit }) => (
  <Table
    columns={COLUMNS(onEdit)}
    data={users}
    isLoading={isLoading}
    emptyTitle="No users found"
    emptyMessage="Create a new user using the button above."
  />
);

export default UserTable;
