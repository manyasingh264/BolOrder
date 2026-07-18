// pages/Dashboard/DashboardPage.jsx — FULL IMPLEMENTATION
//
// Why it exists: Thin page container — composes dashboard features into a layout.
// Responsibility: Fetch all dashboard data on mount, render summary + tables + charts.
// Access: ADMIN + SUPERVISOR only. SALESMAN is redirected to voice order page.

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, LayoutDashboard } from 'lucide-react';

import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import SummaryCards from '../../features/dashboard/SummaryCards';
import RecentOrdersTable from '../../features/dashboard/RecentOrdersTable';
import TopProductsChart from '../../features/dashboard/TopProductsChart';
import SalesmanPerformance from '../../features/dashboard/SalesmanPerformance';

import {
  fetchDashboardSummary,
  fetchRecentOrders,
  fetchTopProducts,
  fetchSalesmanPerformance,
  selectDashboardSummary,
  selectRecentOrders,
  selectTopProducts,
  selectSalesmanPerformance,
  selectDashboardLoading,
} from '../../redux/slices/dashboardSlice';
import usePermissions from '../../hooks/usePermissions';
import useAuth from '../../hooks/useAuth';
import { formatDateTime } from '../../utils';
import { ROUTES } from '../../constants';

const DashboardPage = () => {
  const dispatch     = useDispatch();
  const navigate     = useNavigate();
  const { user }     = useAuth();
  const { isAdmin, isSupervisor, isSalesman } = usePermissions();
  const canViewFull  = isAdmin || isSupervisor;

  // Redirect salesmen to voice order page
  useEffect(() => {
    if (isSalesman) {
      navigate(ROUTES.VOICE_ORDER);
    }
  }, [isSalesman, navigate]);

  // Don't render if salesman (redirecting)
  if (isSalesman) return null;

  const summary      = useSelector(selectDashboardSummary);
  const recentOrders = useSelector(selectRecentOrders);
  const topProducts  = useSelector(selectTopProducts);
  const performance  = useSelector(selectSalesmanPerformance);
  const isLoading    = useSelector(selectDashboardLoading);

  const loadAll = () => {
    dispatch(fetchDashboardSummary());
    dispatch(fetchRecentOrders());
    if (canViewFull) {
      dispatch(fetchTopProducts());
      dispatch(fetchSalesmanPerformance());
    }
  };

  useEffect(() => { loadAll(); }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">

        {/* ── Page Header ──────────────────────────────────────────────── */}
        <div className="page-header">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <LayoutDashboard size={20} className="text-primary-500" />
              <h1 className="page-title">Dashboard</h1>
            </div>
            <p className="page-subtitle">
              Welcome back, <span className="font-medium text-surface-700">{user?.name}</span>
              {' '}· {formatDateTime(new Date().toISOString())}
            </p>
          </div>
          <Button
            variant="secondary"
            leftIcon={<RefreshCw size={15} />}
            onClick={loadAll}
            isLoading={isLoading}
            size="sm"
            id="dashboard-refresh-btn"
          >
            Refresh
          </Button>
        </div>

        {/* ── KPI Summary Cards ─────────────────────────────────────────── */}
        <SummaryCards summary={summary} />

        {/* ── Main content — two-column on large screens ────────────────── */}
        {canViewFull ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

            {/* Recent Orders — takes 2 columns on large screens */}
            <Card className="lg:col-span-2 xl:col-span-2">
              <Card.Header>
                <div>
                  <h2 className="text-base font-semibold text-surface-900">Recent Orders</h2>
                  <p className="text-xs text-surface-400 mt-0.5">Last 10 orders across all salesmen</p>
                </div>
              </Card.Header>
              <RecentOrdersTable orders={recentOrders} isLoading={isLoading} />
            </Card>

            {/* Right column: Top Products + Salesman Performance */}
            <div className="space-y-6">
              <Card>
                <Card.Header>
                  <div>
                    <h2 className="text-base font-semibold text-surface-900">Top Products</h2>
                    <p className="text-xs text-surface-400 mt-0.5">By revenue this month</p>
                  </div>
                </Card.Header>
                <Card.Body>
                  <TopProductsChart products={topProducts} isLoading={isLoading} />
                </Card.Body>
              </Card>

              <Card>
                <Card.Header>
                  <div>
                    <h2 className="text-base font-semibold text-surface-900">Salesman Performance</h2>
                    <p className="text-xs text-surface-400 mt-0.5">Ranked by revenue</p>
                  </div>
                </Card.Header>
                <Card.Body>
                  <SalesmanPerformance data={performance} isLoading={isLoading} />
                </Card.Body>
              </Card>
            </div>
          </div>
        ) : (
          /* Salesman view — only recent orders */
          <Card>
            <Card.Header>
              <div>
                <h2 className="text-base font-semibold text-surface-900">My Recent Orders</h2>
                <p className="text-xs text-surface-400 mt-0.5">Your last 10 orders</p>
              </div>
            </Card.Header>
            <RecentOrdersTable orders={recentOrders} isLoading={isLoading} />
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
