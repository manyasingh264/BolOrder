// pages/Orders/OrderDetailPage.jsx — FULL IMPLEMENTATION
import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, ClipboardList } from 'lucide-react';

import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import { StatusBadge } from '../../components/Badge/Badge';
import Loader from '../../components/Loader/Loader';
import StatusUpdater from '../../features/orders/StatusUpdater';

import { fetchOrderById, selectSelectedOrder, selectOrdersLoading } from '../../redux/slices/ordersSlice';
import { formatDateTime, formatCurrency } from '../../utils';
import usePermissions from '../../hooks/usePermissions';
import { ROUTES } from '../../constants';

const OrderDetailPage = () => {
  const { id }     = useParams();
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const order      = useSelector(selectSelectedOrder);
  const isLoading  = useSelector(selectOrdersLoading);
  const { canUpdateOrderStatus } = usePermissions();

  useEffect(() => { if (id) dispatch(fetchOrderById(id)); }, [id, dispatch]);

  if (isLoading || !order) return (
    <DashboardLayout title="Order Detail">
      <Loader message="Loading order…" />
    </DashboardLayout>
  );

  return (
    <DashboardLayout title={`Order #${String(order.id).slice(0,8).toUpperCase()}`}>
      <div className="space-y-6 max-w-4xl">
        {/* Back button */}
        <button onClick={() => navigate(ROUTES.ORDERS)} className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-800 transition-colors">
          <ArrowLeft size={16} /> Back to Orders
        </button>

        {/* Header */}
        <div className="page-header">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <ClipboardList size={20} className="text-primary-500" />
              <h1 className="page-title font-mono text-xl">#{String(order.id).slice(0,8).toUpperCase()}</h1>
            </div>
            <p className="page-subtitle">{formatDateTime(order.createdAt)}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Details card */}
            <Card>
              <Card.Header><h2 className="text-base font-semibold">Order Details</h2></Card.Header>
              <Card.Body>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {[
                    ['Shop',      order.shopName],
                    ['Salesman',  order.salesmanName],
                    ['Area',      order.shopArea],
                    ['AI Transcript', order.rawTranscript ? `${order.rawTranscript.slice(0,60)}…` : 'N/A'],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <dt className="text-surface-400 text-xs font-medium uppercase tracking-wider">{label}</dt>
                      <dd className="text-surface-800 font-medium mt-0.5">{val ?? '—'}</dd>
                    </div>
                  ))}
                </dl>
              </Card.Body>
            </Card>

            {/* Items card */}
            <Card>
              <Card.Header>
                <h2 className="text-base font-semibold">Order Items</h2>
                <span className="text-sm text-surface-400">{order.items?.length ?? 0} items</span>
              </Card.Header>
              <div className="divide-y divide-surface-100">
                {order.items?.map((item, i) => (
                  <div key={i} className="px-6 py-3.5 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-surface-800">{item.productName}</p>
                      <p className="text-xs text-surface-400 mt-0.5">{item.variantSize ?? item.unit} · {formatCurrency(item.unitPrice)} each</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-surface-500">×{item.quantity}</p>
                      <p className="text-sm font-semibold text-surface-900">{formatCurrency(item.subtotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 border-t border-surface-200 flex justify-between">
                <span className="font-semibold text-surface-700">Total</span>
                <span className="font-bold text-lg text-surface-900">{formatCurrency(order.totalAmount)}</span>
              </div>
            </Card>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Status update */}
            {canUpdateOrderStatus && (
              <Card>
                <Card.Header><h2 className="text-base font-semibold">Update Status</h2></Card.Header>
                <Card.Body><StatusUpdater order={order} /></Card.Body>
              </Card>
            )}

            {/* Status History (if available) */}
            {order.statusHistory?.length > 0 && (
              <Card>
                <Card.Header><h2 className="text-base font-semibold">Status History</h2></Card.Header>
                <Card.Body>
                  <div className="space-y-3">
                    {order.statusHistory.map((h, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary-400 flex-shrink-0 mt-1.5" />
                        <div>
                          <p className="font-medium text-surface-700">{h.status}</p>
                          <p className="text-xs text-surface-400">{formatDateTime(h.changedAt)}</p>
                          {h.remarks && <p className="text-xs text-surface-500 italic mt-0.5">{h.remarks}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrderDetailPage;
