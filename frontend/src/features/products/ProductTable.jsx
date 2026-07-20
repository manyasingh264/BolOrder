// features/products/ProductTable.jsx
import Table from '../../components/Table/Table';
import { ActiveBadge } from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import { Edit2, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils';



const COLUMNS = (onEdit, onDelete) => [
  {
    header: 'Product',
    accessor: 'name',
    render: (val) => (
      <p className="font-semibold text-surface-800">{val}</p>
    ),
  },
  {
    header: 'Variants',
    accessor: 'variants',
    render: (variants) => (
      <div className="space-y-0.5">
        {variants?.slice(0,2).map((v, i) => (
          <p key={i} className="text-xs text-surface-600">{v.size ? `${v.size}${v.unit}` : v.unit} — {formatCurrency(v.price)}</p>
        ))}
        {variants?.length > 2 && <p className="text-2xs text-surface-400">+{variants.length - 2} more</p>}
      </div>
    ),
  },
  { header: 'Status',  accessor: 'isActive', render: (v) => <ActiveBadge isActive={v} /> },
  {
    header: 'Action',
    render: (_, row) => (
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" leftIcon={<Edit2 size={14} />}
          onClick={(e) => { e.stopPropagation(); onEdit(row); }} id={`edit-product-${row.id}`}>
          Edit
        </Button>
        <Button variant="ghost" size="sm" leftIcon={<Trash2 size={14} />} className="text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={(e) => { e.stopPropagation(); onDelete(row); }} id={`delete-product-${row.id}`}>
          Delete
        </Button>
      </div>
    ),
  },
];

const ProductTable = ({ products, isLoading, onEdit, onDelete }) => (
  <Table columns={COLUMNS(onEdit, onDelete)} data={products} isLoading={isLoading}
    emptyTitle="No products found" emptyMessage="Add your first product using the button above." />
);

export default ProductTable;
