// features/orders/OrderTable.jsx
import { useNavigate } from 'react-router-dom';
import Table from '../../components/Table/Table';
import { StatusBadge } from '../../components/Badge/Badge';
import Button from '../../components/Button/Button';
import { Trash2 } from 'lucide-react';
import { formatDate, formatCurrency } from '../../utils';
import { buildRoute } from '../../constants';

const COLUMNS = (onDelete) => [
  {
    header: 'Order ID',
    accessor: 'id',
    render: (val) => <span className="font-mono text-xs text-primary-600 font-medium">#{String(val).slice(0,8).toUpperCase()}</span>,
  },
  {
    header: 'Shop',
    accessor: 'shopName',
    render: (val) => <span className="font-medium text-surface-800">{val ?? '—'}</span>,
  },
  { header: 'Salesman', accessor: 'salesmanName' },
  {
    header: 'Date',
    accessor: 'createdAt',
    render: (val) => <span className="text-surface-400 text-xs">{formatDate(val)}</span>,
  },
  {
    header: 'Items',
    accessor: 'itemCount',
    render: (val) => <span className="text-center block">{val ?? '—'}</span>,
  },
  {
    header: 'Total',
    accessor: 'totalAmount',
    render: (val) => <span className="font-semibold">{formatCurrency(val)}</span>,
  },
  {
    header: 'Status',
    accessor: 'status',
    render: (val) => <StatusBadge status={val} />,
  },
  {
    header: 'Action',
    render: (_, row) => (
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<Trash2 size={14} />}
        className="text-red-500 hover:text-red-600 hover:bg-red-50"
        onClick={(e) => { e.stopPropagation(); onDelete(row); }}
      >
        Delete
      </Button>
    ),
  },
];

const OrderTable = ({ orders, isLoading, onDelete }) => {
  const navigate = useNavigate();
  return (
    <Table
      columns={COLUMNS(onDelete)}
      data={orders}
      isLoading={isLoading}
      emptyTitle="No orders found"
      emptyMessage="Orders placed by salesmen will appear here."
      onRowClick={(row) => navigate(buildRoute.orderDetail(row.id))}
    />
  );
};

export default OrderTable;
