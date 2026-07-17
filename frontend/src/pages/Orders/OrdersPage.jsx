// pages/Orders/OrdersPage.jsx — FULL IMPLEMENTATION
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ClipboardList } from 'lucide-react';

import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/Card/Card';
import SearchBar from '../../components/SearchBar/SearchBar';
import Pagination from '../../components/Pagination/Pagination';
import OrderTable from '../../features/orders/OrderTable';

import { fetchOrders, deleteOrder, selectAllOrders, selectOrdersLoading } from '../../redux/slices/ordersSlice';
import { addToast } from '../../redux/slices/uiSlice';
import { ORDER_STATUS_LABELS } from '../../constants';
import useDebounce from '../../hooks/useDebounce';
import usePagination from '../../hooks/usePagination';

const ALL_STATUSES = ['', ...Object.keys(ORDER_STATUS_LABELS)];

const OrdersPage = () => {
  const dispatch   = useDispatch();
  const orders     = useSelector(selectAllOrders);
  const isLoading  = useSelector(selectOrdersLoading);

  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => { dispatch(fetchOrders()); }, [dispatch]);

  const filtered = orders.filter((o) => {
    const q    = debouncedSearch.toLowerCase();
    const text = (o.shopName + ' ' + o.salesmanName).toLowerCase();
    return text.includes(q) && (statusFilter ? o.status === statusFilter : true);
  });

  const pagination = usePagination(filtered, 10);

  const handleDelete = (order) => {
    if (window.confirm(`Are you sure you want to delete order #${String(order.id).slice(0,8).toUpperCase()}? This action cannot be undone.`)) {
      dispatch(deleteOrder(order.id)).then((result) => {
        if (deleteOrder.fulfilled.match(result)) {
          dispatch(addToast({ message: 'Order deleted successfully', type: 'success' }));
        } else {
          dispatch(addToast({ message: result.payload || 'Failed to delete order', type: 'error' }));
        }
      });
    }
  };

  return (
    <DashboardLayout title="Orders">
      <div className="space-y-6">
        <div className="page-header">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <ClipboardList size={20} className="text-primary-500" />
              <h1 className="page-title">Orders</h1>
            </div>
            <p className="page-subtitle">{orders.length} orders total</p>
          </div>
        </div>

        <Card>
          <Card.Header>
            <div className="flex flex-wrap gap-3 flex-1">
              <SearchBar value={search} onChange={(v) => { setSearch(v); pagination.reset(); }}
                placeholder="Search by shop or salesman…" className="w-full max-w-xs" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatus(e.target.value); pagination.reset(); }}
                className="input-base w-auto min-w-[160px]"
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>{s ? ORDER_STATUS_LABELS[s] : 'All Statuses'}</option>
                ))}
              </select>
            </div>
            <span className="text-sm text-surface-400 flex-shrink-0">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </Card.Header>
          <OrderTable orders={pagination.paginatedItems} isLoading={isLoading} onDelete={handleDelete} />
          <div className="px-4 border-t border-surface-100"><Pagination {...pagination} /></div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default OrdersPage;
