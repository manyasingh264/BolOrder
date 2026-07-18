// features/dashboard/RecentOrdersTable.jsx
//
// Why it exists: The dashboard shows the 10 most recent orders in a compact table.
//               Uses the same reusable Table component but with dashboard-specific columns.
// Responsibility: Fetch + display recent orders; link each row to order detail.
// Used by: DashboardPage.jsx

import { useNavigate } from 'react-router-dom';
import Table from '../../components/Table/Table';
import { StatusBadge } from '../../components/Badge/Badge';
import { formatDate, formatCurrency } from '../../utils';
import { buildRoute } from '../../constants';

const COLUMNS = [
  {
    header:   'Order ID',
    accessor: 'id',
    render:   (val) => (
      <span className="text-primary-600 font-mono text-xs font-medium">
        #{String(val).slice(0, 8).toUpperCase()}
      </span>
    ),
  },
  {
    header:   'Shop',
    accessor: 'shopName',
    render:   (val) => <span className="font-medium text-surface-800">{val ?? '—'}</span>,
  },
  {
    header:   'Salesman',
    accessor: 'salesmanName',
  },
  {
    header:   'Date',
    accessor: 'createdAt',
    render:   (val) => <span className="text-surface-500 text-xs">{formatDate(val)}</span>,
  },
  {
    header:   'Amount',
    accessor: 'orderTotal',
    render:   (val) => <span className="font-semibold text-surface-800">{formatCurrency(val)}</span>,
  },
  {
    header:   'Status',
    accessor: 'status',
    render:   (val) => <StatusBadge status={val} />,
  },
];

const RecentOrdersTable = ({ orders, isLoading }) => {
  const navigate = useNavigate();

  return (
    <Table
      columns={COLUMNS}
      data={orders}
      isLoading={isLoading}
      emptyTitle="No recent orders"
      emptyMessage="Orders placed by salesmen will appear here."
      onRowClick={(row) => navigate(buildRoute.orderDetail(row.id))}
    />
  );
};

export default RecentOrdersTable;
