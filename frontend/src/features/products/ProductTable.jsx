// features/products/ProductTable.jsx
import Table from '../../components/Table/Table';
import { ActiveBadge } from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import { Edit2 } from 'lucide-react';
import { formatCurrency } from '../../utils';

const COLUMNS = (onEdit) => [
  {
    header: 'Product',
    accessor: 'name',
    render: (val, row) => (
      <div>
        <p className="font-semibold text-surface-800">{val}</p>
        <p className="text-2xs text-surface-400 mt-0.5">{row.category ?? '—'}</p>
      </div>
    ),
  },
  {
    header: 'Variants',
    accessor: 'variants',
    render: (variants) => (
      <div className="space-y-0.5">
        {variants?.slice(0,2).map((v, i) => (
          <p key={i} className="text-xs text-surface-600">{v.size ?? v.unit} — {formatCurrency(v.price)}</p>
        ))}
        {variants?.length > 2 && <p className="text-2xs text-surface-400">+{variants.length - 2} more</p>}
      </div>
    ),
  },
  {
    header: 'Aliases',
    accessor: 'aliases',
    render: (aliases) => <span className="text-xs text-surface-500">{aliases?.length > 0 ? aliases.slice(0,2).join(', ') : '—'}</span>,
  },
  { header: 'Status',  accessor: 'isActive', render: (v) => <ActiveBadge isActive={v} /> },
  {
    header: 'Action',
    render: (_, row) => (
      <Button variant="ghost" size="sm" leftIcon={<Edit2 size={14} />}
        onClick={(e) => { e.stopPropagation(); onEdit(row); }} id={`edit-product-${row.id}`}>
        Edit
      </Button>
    ),
  },
];

const ProductTable = ({ products, isLoading, onEdit }) => (
  <Table columns={COLUMNS(onEdit)} data={products} isLoading={isLoading}
    emptyTitle="No products found" emptyMessage="Add your first product using the button above." />
);

export default ProductTable;
