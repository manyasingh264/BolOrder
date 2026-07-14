// features/shops/ShopTable.jsx
import Table from '../../components/Table/Table';
import { ActiveBadge } from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import { Edit2 } from 'lucide-react';

const COLUMNS = (onEdit) => [
  {
    header: 'Shop Name',
    accessor: 'name',
    render: (val, row) => (
      <div>
        <p className="font-semibold text-surface-800">{val}</p>
        {row.aliases?.length > 0 && (
          <p className="text-2xs text-surface-400 mt-0.5">Aliases: {row.aliases.slice(0,3).join(', ')}</p>
        )}
      </div>
    ),
  },
  { header: 'Owner',   accessor: 'ownerName',   render: (v) => v ?? '—' },
  { header: 'Phone',   accessor: 'phone',        render: (v) => <span className="font-mono text-xs">{v ?? '—'}</span> },
  { header: 'Area',    accessor: 'area',         render: (v) => v ?? '—' },
  { header: 'Salesman', accessor: 'salesmanName', render: (v) => v ?? '—' },
  { header: 'Status',  accessor: 'isActive',     render: (v) => <ActiveBadge isActive={v} /> },
  {
    header: 'Action',
    render: (_, row) => (
      <Button variant="ghost" size="sm" leftIcon={<Edit2 size={14} />}
        onClick={(e) => { e.stopPropagation(); onEdit(row); }} id={`edit-shop-${row.id}`}>
        Edit
      </Button>
    ),
  },
];

const ShopTable = ({ shops, isLoading, onEdit }) => (
  <Table columns={COLUMNS(onEdit)} data={shops} isLoading={isLoading}
    emptyTitle="No shops found" emptyMessage="Add your first shop using the button above." />
);

export default ShopTable;
