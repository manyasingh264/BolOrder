// features/shops/ShopTable.jsx
import Table from '../../components/Table/Table';
import { ActiveBadge } from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import { Edit2, Trash2 } from 'lucide-react';

const COLUMNS = (onEdit, onDelete) => [
  {
    header: 'Shop Name',
    accessor: 'shopName',
    render: (v) => v || '—',
  },
  { header: 'Owner',   accessor: 'ownerName',   render: (v) => v ?? '—' },
  { header: 'Phone',   accessor: 'phone',        render: (v) => <span className="font-mono text-xs">{v ?? '—'}</span> },
  { header: 'Area',    accessor: 'area',         render: (v) => v ?? '—' },
  { header: 'Salesman', accessor: 'salesman', render: (v) => v?.name ?? '—' },
  { header: 'Status',  accessor: 'isVerified',     render: (v) => <ActiveBadge isActive={v} /> },
  {
    header: 'Action',
    render: (_, row) => (
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" leftIcon={<Edit2 size={14} />}
          onClick={(e) => { e.stopPropagation(); onEdit(row); }} id={`edit-shop-${row.id}`}>
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

const ShopTable = ({ shops, isLoading, onEdit, onDelete }) => (
  <Table columns={COLUMNS(onEdit, onDelete)} data={shops} isLoading={isLoading}
    emptyTitle="No shops found" emptyMessage="Add your first shop using the button above." />
);

export default ShopTable;
