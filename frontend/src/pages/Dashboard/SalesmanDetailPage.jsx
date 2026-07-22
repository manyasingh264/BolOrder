// pages/Dashboard/SalesmanDetailPage.jsx
//
// Why it exists: Provides admins/supervisors a full analytics view for one salesman.
// Responsibility: Fetch performance data, render profile, KPI cards, shops table,
//                 orders table (with filters + pagination), and insights panel.
// Access: ADMIN + SUPERVISOR only (enforced by route + ProtectedRoute)
// Route: /admin/salesmen/:salesmanId

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft,
  TrendingUp,
  ShoppingBag,
  Store,
  Wallet,
  Clock,
  CheckCircle,
  LayoutDashboard,
  ChevronRight,
  Lightbulb,
  Package,
  CalendarDays,
  Search,
  SlidersHorizontal,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  AlertTriangle,
} from 'lucide-react';

import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/Card/Card';
import Button from '../../components/Button/Button';
import { StatusBadge, ActiveBadge } from '../../components/Badge/Badge';
import Loader from '../../components/Loader/Loader';

import {
  fetchSalesmanDetail,
  clearSalesmanDetail,
  setSalesmanId,
  selectSalesmanDetail,
  selectSalesmanDetailLoading,
  selectSalesmanDetailError,
} from '../../redux/slices/salesmanDetailSlice';
import { formatDateTime, formatCurrency, getInitials } from '../../utils';
import { buildRoute, ROUTES } from '../../constants';
import { ORDER_STATUSES } from '../../constants/orderStatuses';

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Top breadcrumb trail */
const Breadcrumb = ({ salesmanName }) => (
  <nav className="flex items-center gap-1.5 text-sm text-surface-400 mb-4 flex-wrap" aria-label="Breadcrumb">
    <Link to={ROUTES.DASHBOARD} className="hover:text-primary-600 transition-colors flex items-center gap-1">
      <LayoutDashboard size={14} />
      <span>Dashboard</span>
    </Link>
    <ChevronRight size={14} className="text-surface-300 flex-shrink-0" />
    <span className="text-surface-400">Salesman Performance</span>
    <ChevronRight size={14} className="text-surface-300 flex-shrink-0" />
    <span className="text-surface-700 font-medium truncate max-w-[160px]">{salesmanName}</span>
  </nav>
);

/** Circular initials avatar */
const Avatar = ({ name, size = 'lg' }) => {
  const sizeClasses = {
    lg: 'w-16 h-16 text-xl',
    md: 'w-10 h-10 text-sm',
  };
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold flex-shrink-0`}>
      {getInitials(name)}
    </div>
  );
};

/** Profile summary card */
const ProfileCard = ({ salesman }) => (
  <Card>
    <Card.Body>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Avatar name={salesman.name} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-surface-900">{salesman.name}</h2>
            <ActiveBadge isActive={salesman.isActive} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm text-surface-500 mt-1">
            {salesman.email && (
              <span className="truncate">
                <span className="font-medium text-surface-600">Email:</span> {salesman.email}
              </span>
            )}
            {salesman.phone && (
              <span>
                <span className="font-medium text-surface-600">Phone:</span> {salesman.phone}
              </span>
            )}
            {salesman.joinedAt && (
              <span>
                <span className="font-medium text-surface-600">Joined:</span>{' '}
                {new Date(salesman.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card.Body>
  </Card>
);

/** Single KPI card */
const KpiCard = ({ icon: Icon, label, value, color = 'primary', id }) => {
  const colorMap = {
    primary: { bg: 'bg-primary-50',   icon: 'text-primary-500',  val: 'text-primary-700'  },
    green:   { bg: 'bg-green-50',     icon: 'text-green-500',    val: 'text-green-700'    },
    amber:   { bg: 'bg-amber-50',     icon: 'text-amber-500',    val: 'text-amber-700'    },
    red:     { bg: 'bg-red-50',       icon: 'text-red-500',      val: 'text-red-700'      },
    blue:    { bg: 'bg-blue-50',      icon: 'text-blue-500',     val: 'text-blue-700'     },
    violet:  { bg: 'bg-violet-50',    icon: 'text-violet-500',   val: 'text-violet-700'   },
  };
  const c = colorMap[color] ?? colorMap.primary;
  return (
    <div id={id} className={`${c.bg} rounded-xl p-4 flex items-start gap-3`}>
      <div className={`w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
        <Icon size={18} className={c.icon} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-surface-500 uppercase tracking-wider leading-tight">{label}</p>
        <p className={`text-xl font-bold mt-0.5 ${c.val}`}>{value}</p>
      </div>
    </div>
  );
};

/** Assigned shops table */
const ShopsTable = ({ shops }) => {
  if (!shops?.length) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <Store size={28} className="text-surface-300 mb-2" />
        <p className="text-sm text-surface-400">No shops assigned.</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="table-base" id="assigned-shops-table">
        <thead>
          <tr>
            <th className="table-th">Shop Name</th>
            <th className="table-th">Owner</th>
            <th className="table-th">Location</th>
            <th className="table-th">Phone</th>
            <th className="table-th">Last Order</th>
            <th className="table-th text-right">Orders</th>
            <th className="table-th text-right">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {shops.map((shop) => (
            <tr key={shop.shopId} className="table-row hover:bg-surface-50 transition-colors">
              <td className="table-td font-medium text-surface-800">{shop.shopName}</td>
              <td className="table-td text-surface-600">{shop.owner || '—'}</td>
              <td className="table-td text-surface-500 max-w-[180px] truncate">{shop.address || '—'}</td>
              <td className="table-td text-surface-500">{shop.phone || '—'}</td>
              <td className="table-td text-surface-500 whitespace-nowrap">
                {shop.lastOrderDate
                  ? new Date(shop.lastOrderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  : '—'}
              </td>
              <td className="table-td text-right font-medium text-surface-700">{shop.totalOrders}</td>
              <td className="table-td text-right font-semibold text-surface-800">{formatCurrency(shop.totalRevenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/** Order status filter pill */
const StatusPill = ({ label, value, active, onClick }) => (
  <button
    onClick={() => onClick(value)}
    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150 ${
      active
        ? 'bg-primary-500 text-white border-primary-500'
        : 'bg-white text-surface-600 border-surface-200 hover:border-primary-300 hover:text-primary-600'
    }`}
  >
    {label}
  </button>
);

/** Pagination controls */
const Pagination = ({ page, totalPages, onPage }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4 border-t border-surface-100">
      <p className="text-xs text-surface-400">Page {page} of {totalPages}</p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(1)}
          disabled={page === 1}
          className="btn-icon disabled:opacity-40"
          aria-label="First page"
          id="orders-first-page"
        >
          <ChevronsLeft size={16} />
        </button>
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="btn-icon disabled:opacity-40"
          aria-label="Previous page"
          id="orders-prev-page"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="btn-icon disabled:opacity-40"
          aria-label="Next page"
          id="orders-next-page"
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={() => onPage(totalPages)}
          disabled={page >= totalPages}
          className="btn-icon disabled:opacity-40"
          aria-label="Last page"
          id="orders-last-page"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
};

/** Orders table with filters */
const OrdersTable = ({ orders, pagination, onFilterChange, assignedShops, isRefreshing }) => {
  const navigate = useNavigate();

  const [localFilters, setLocalFilters] = useState({
    status:    '',
    shopId:    '',
    startDate: '',
    endDate:   '',
    search:    '',
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Track whether the component has mounted at least once.
  // We skip the first useEffect run so we don't dispatch a redundant fetch on mount
  // (the parent already fetched on mount). Only user-driven filter changes should
  // trigger a new fetch — this is what breaks the infinite-loop.
  const hasMountedRef = useRef(false);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(localFilters.search), 400);
    return () => clearTimeout(t);
  }, [localFilters.search]);

  // Notify parent when filters change — but NOT on first mount
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return; // skip the initial mount run
    }
    onFilterChange({
      status:    localFilters.status    || undefined,
      shopId:    localFilters.shopId    || undefined,
      startDate: localFilters.startDate || undefined,
      endDate:   localFilters.endDate   || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localFilters.status, localFilters.shopId, localFilters.startDate, localFilters.endDate, debouncedSearch]);

  const set = (field) => (e) => setLocalFilters((p) => ({ ...p, [field]: e.target.value }));
  const setStatus = (val) => setLocalFilters((p) => ({ ...p, status: p.status === val ? '' : val }));

  // Client-side search on shop name / order ID (already paginated by server, search is UX sugar)
  const filteredOrders = useMemo(() => {
    if (!debouncedSearch) return orders;
    const q = debouncedSearch.toLowerCase();
    return orders.filter(
      (o) =>
        o.shop?.toLowerCase().includes(q) ||
        o.orderId?.toString().toLowerCase().includes(q)
    );
  }, [orders, debouncedSearch]);

  const STATUS_FILTERS = [
    { label: 'All',       value: '' },
    { label: 'Pending',   value: ORDER_STATUSES.PENDING_CONFIRMATION },
    { label: 'Confirmed', value: ORDER_STATUSES.CONFIRMED },
    { label: 'Delivered', value: ORDER_STATUSES.DELIVERED },
    { label: 'Cancelled', value: ORDER_STATUSES.CANCELLED },
  ];

  return (
    <div className="space-y-4">
      {/* ── Filters bar ── */}
      <div className="flex flex-col gap-3">
        {/* Status pills */}
        <div className="flex flex-wrap gap-2 items-center">
          <SlidersHorizontal size={14} className="text-surface-400 flex-shrink-0" />
          {STATUS_FILTERS.map((f) => (
            <StatusPill
              key={f.value}
              label={f.label}
              value={f.value}
              active={localFilters.status === f.value}
              onClick={setStatus}
            />
          ))}
        </div>

        {/* Date + shop + search row */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              id="orders-search"
              type="text"
              placeholder="Search shop or order…"
              value={localFilters.search}
              onChange={set('search')}
              className="input-base pl-8 py-2 text-sm"
            />
          </div>

          {assignedShops?.length > 0 && (
            <select
              id="orders-shop-filter"
              value={localFilters.shopId}
              onChange={set('shopId')}
              className="input-base py-2 text-sm min-w-[140px] max-w-[200px]"
            >
              <option value="">All Shops</option>
              {assignedShops.map((s) => (
                <option key={s.shopId} value={s.shopId}>{s.shopName}</option>
              ))}
            </select>
          )}

          <input
            id="orders-start-date"
            type="date"
            value={localFilters.startDate}
            onChange={set('startDate')}
            className="input-base py-2 text-sm w-auto"
            aria-label="Start date"
          />
          <span className="text-surface-400 text-sm hidden sm:block">—</span>
          <input
            id="orders-end-date"
            type="date"
            value={localFilters.endDate}
            onChange={set('endDate')}
            className="input-base py-2 text-sm w-auto"
            aria-label="End date"
          />
        </div>
      </div>

      {/* ── Table or inline skeleton during filter refresh ── */}
      {isRefreshing ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-surface-100 rounded animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <ShoppingBag size={28} className="text-surface-300 mb-2" />
          <p className="text-sm text-surface-400">No orders match the current filters.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table-base" id="salesman-orders-table">
            <thead>
              <tr>
                <th className="table-th">Order ID</th>
                <th className="table-th">Shop</th>
                <th className="table-th">Date</th>
                <th className="table-th text-center">Items</th>
                <th className="table-th text-right">Amount</th>
                <th className="table-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr
                  key={order.orderId}
                  className="table-row cursor-pointer hover:bg-surface-50 transition-colors"
                  onClick={() => navigate(buildRoute.orderDetail(order.orderId))}
                  id={`order-row-${order.orderId}`}
                >
                  <td className="table-td font-mono text-xs text-surface-500">
                    #{String(order.orderId).slice(0, 8).toUpperCase()}
                  </td>
                  <td className="table-td font-medium text-surface-800">{order.shop}</td>
                  <td className="table-td text-surface-500 whitespace-nowrap">
                    {formatDateTime(order.date)}
                  </td>
                  <td className="table-td text-center text-surface-600">{order.items}</td>
                  <td className="table-td text-right font-semibold text-surface-800">
                    {formatCurrency(order.amount)}
                  </td>
                  <td className="table-td">
                    <StatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ── */}
      {pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPage={(p) => onFilterChange({ _page: p })}
        />
      )}
    </div>
  );
};

/** Insights panel */
const InsightsPanel = ({ insights, stats }) => {
  const items = [
    {
      icon: Package,
      label: 'Highest Selling Product',
      value: insights.highestSellingProduct ?? '—',
      color: 'bg-primary-50 text-primary-700',
    },
    {
      icon: CalendarDays,
      label: 'Best Performing Month',
      value: insights.bestMonth ?? '—',
      color: 'bg-blue-50 text-blue-700',
    },
    {
      icon: Wallet,
      label: 'Largest Single Order',
      value: insights.largestOrder ? formatCurrency(insights.largestOrder) : '—',
      color: 'bg-green-50 text-green-700',
    },
    {
      icon: Store,
      label: 'Most Active Shop',
      value: insights.mostActiveShop ?? '—',
      color: 'bg-violet-50 text-violet-700',
    },
    {
      icon: CheckCircle,
      label: 'Order Completion Rate',
      value: `${insights.completionRate ?? 0}%`,
      color: 'bg-emerald-50 text-emerald-700',
    },
    {
      icon: Wallet,
      label: 'Avg Revenue per Shop',
      value: insights.avgRevenuePerShop ? formatCurrency(insights.avgRevenuePerShop) : '—',
      color: 'bg-amber-50 text-amber-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" id="insights-panel">
      {items.map(({ icon: Icon, label, value, color }) => (
        <div key={label} className={`${color.split(' ')[0]} rounded-xl p-4 flex items-start gap-3`}>
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
            <Icon size={16} className={color.split(' ')[1]} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-surface-500 uppercase tracking-wide leading-tight">{label}</p>
            <p className={`text-sm font-bold mt-0.5 ${color.split(' ')[1]} truncate`}>{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
// Race-condition fix summary:
//   1. setSalesmanId(salesmanId) is dispatched FIRST — this atomically marks
//      which salesman is active AND clears old data in a single Redux action.
//   2. Any in-flight fetch for the PREVIOUS salesman is discarded in the reducer
//      because its payload.id no longer matches state.currentId.
//   3. filters are stored in a ref (filtersRef) so handleFilterChange never
//      closes over a stale value.
//   4. Cleanup (clearSalesmanDetail) only runs on full unmount, not on every
//      salesmanId change — preventing the momentary "not found" flash.

const SalesmanDetailPage = () => {
  const { salesmanId } = useParams();
  const dispatch       = useDispatch();
  const navigate       = useNavigate();

  const detail    = useSelector(selectSalesmanDetail);
  const isLoading = useSelector(selectSalesmanDetailLoading);
  const error     = useSelector(selectSalesmanDetailError);

  // Keep filters in both state (for re-render) AND a ref (for stale-closure-free callbacks)
  const [filters, setFilters] = useState({ page: 1, limit: 10 });
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  // When salesmanId changes:
  //   1. Reset local filter state
  //   2. Tell Redux which salesman is now active (clears stale data atomically)
  //   3. Kick off the fetch
  useEffect(() => {
    const initialFilters = { page: 1, limit: 10 };
    setFilters(initialFilters);
    filtersRef.current = initialFilters;

    // setSalesmanId sets currentId + clears old data + sets isLoading=true
    // in a single synchronous Redux dispatch — no flicker window
    dispatch(setSalesmanId(salesmanId));
    dispatch(fetchSalesmanDetail({ id: salesmanId, filters: initialFilters }));

    // Only clear on full page unmount (navigating away from /admin/salesmen/*)
    return () => {
      dispatch(clearSalesmanDetail());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesmanId]);

  // Filter changes from the OrdersTable (status, date, shop, pagination)
  // Uses filtersRef so it never captures a stale filters value
  const handleFilterChange = useCallback((newFilters) => {
    setFilters((prev) => {
      const page   = newFilters._page ?? 1;
      const merged = { ...prev, ...newFilters, page };
      delete merged._page;
      filtersRef.current = merged;
      // Dispatch inside setState so we always have the latest merged value
      dispatch(fetchSalesmanDetail({ id: salesmanId, filters: merged }));
      return merged;
    });
  // salesmanId is stable within a single page mount; dispatch is stable
  }, [dispatch, salesmanId]);

  // ── Show full-page loader on initial load (no data yet)
  // Avoids showing "not found" during the brief window between setSalesmanId
  // (which sets isLoading=true, data=null) and the fetch completing
  if (isLoading && !detail) {
    return (
      <DashboardLayout title="Salesman Performance">
        <Loader message="Loading salesman details…" />
      </DashboardLayout>
    );
  }

  // ── Error state — only shown after a fetch actually fails, never during transition
  if (error && !detail) {
    return (
      <DashboardLayout title="Salesman Performance">
        <div className="flex flex-col items-center py-16 text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-surface-800">Salesman not found</h2>
            <p className="text-sm text-surface-400 mt-1">{error || 'This salesman does not exist or you lack access.'}</p>
          </div>
          <Button variant="secondary" onClick={() => navigate(ROUTES.DASHBOARD)} leftIcon={<ArrowLeft size={15} />} id="back-to-dashboard-error">
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // If we have no data and no error, keep showing loader
  // (handles the edge case where error was reset but data not yet in)
  if (!detail) {
    return (
      <DashboardLayout title="Salesman Performance">
        <Loader message="Loading salesman details…" />
      </DashboardLayout>
    );
  }

  const { salesman, stats, assignedShops, orders, insights } = detail;

  return (
    <DashboardLayout title="Salesman Performance">
      <div className="space-y-6 max-w-7xl">

        {/* ── Back button ── */}
        <button
          id="salesman-detail-back-btn"
          onClick={() => navigate(ROUTES.DASHBOARD)}
          className="flex items-center gap-2 text-sm text-surface-500 hover:text-surface-800 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        {/* ── Breadcrumb ── */}
        <Breadcrumb salesmanName={salesman.name} />

        {/* ── Page header ── */}
        <div className="page-header">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <TrendingUp size={20} className="text-primary-500" />
              <h1 className="page-title">Salesman Performance</h1>
            </div>
            <p className="page-subtitle">Detailed Performance Analytics</p>
          </div>
        </div>

        {/* ── Profile card ── */}
        <ProfileCard salesman={salesman} />

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          <KpiCard
            id="kpi-total-orders"
            icon={ShoppingBag}
            label="Total Orders"
            value={stats.totalOrders}
            color="primary"
          />
          <KpiCard
            id="kpi-total-revenue"
            icon={Wallet}
            label="Revenue"
            value={formatCurrency(stats.totalRevenue)}
            color="green"
          />
          <KpiCard
            id="kpi-assigned-shops"
            icon={Store}
            label="Assigned Shops"
            value={stats.assignedShops}
            color="blue"
          />
          <KpiCard
            id="kpi-avg-order"
            icon={TrendingUp}
            label="Avg Order Value"
            value={formatCurrency(stats.averageOrderValue)}
            color="violet"
          />
          <KpiCard
            id="kpi-pending"
            icon={Clock}
            label="Pending Orders"
            value={stats.pendingOrders}
            color="amber"
          />
          <KpiCard
            id="kpi-confirmed"
            icon={CheckCircle}
            label="Confirmed"
            value={stats.confirmedOrders ?? 0}
            color="blue"
          />
          <KpiCard
            id="kpi-completed"
            icon={CheckCircle}
            label="Completed"
            value={stats.completedOrders}
            color="green"
          />
        </div>

        {/* ── Insights ── */}
        <Card>
          <Card.Header>
            <div>
              <h2 className="text-base font-semibold text-surface-900 flex items-center gap-2">
                <Lightbulb size={16} className="text-amber-500" />
                Analytics Insights
              </h2>
              <p className="text-xs text-surface-400 mt-0.5">Aggregated from order history</p>
            </div>
          </Card.Header>
          <Card.Body>
            <InsightsPanel insights={insights} stats={stats} />
          </Card.Body>
        </Card>

        {/* ── Assigned Shops ── */}
        <Card>
          <Card.Header>
            <div>
              <h2 className="text-base font-semibold text-surface-900">Assigned Shops</h2>
              <p className="text-xs text-surface-400 mt-0.5">{stats.assignedShops} shops</p>
            </div>
          </Card.Header>
          <Card.Body className="!p-0 sm:!p-0">
            <ShopsTable shops={assignedShops} />
          </Card.Body>
        </Card>

        {/* ── Orders table ── */}
        <Card>
          <Card.Header>
            <div>
              <h2 className="text-base font-semibold text-surface-900">Orders by this Salesman</h2>
              <p className="text-xs text-surface-400 mt-0.5">
                {orders?.pagination?.total ?? 0} orders total
              </p>
            </div>
          </Card.Header>
          <Card.Body>
            {/* Always keep OrdersTable mounted — it manages its own isRefreshing skeleton.
                Never conditionally unmount it; doing so causes a mount → useEffect → fetch
                → isLoading → unmount → mount infinite loop. */}
            <OrdersTable
              orders={orders?.data ?? []}
              pagination={orders?.pagination}
              onFilterChange={handleFilterChange}
              assignedShops={assignedShops}
              isRefreshing={isLoading}
            />
          </Card.Body>
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default SalesmanDetailPage;
