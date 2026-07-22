// dashboard.service.js — formats and transforms raw DB aggregation results.
//
// Responsibility:
//   - Call repository functions
//   - Parse numeric strings from PostgreSQL (NUMERIC columns come back as strings)
//   - Shape the final response object so the controller is just one line

const dashboardRepository = require('./dashboard.repository');

// ─── GET /api/dashboard/summary ───────────────────────────────────────────────

const getSummary = async () => {
  const { orders, revenue, users, catalog } = await dashboardRepository.getSummaryStats();

  const result = {
    // Flat structure for frontend SummaryCards component
    totalOrders: parseInt(orders.total_orders, 10),
    totalRevenue: parseFloat(revenue.total_revenue).toFixed(2),
    totalShops: parseInt(catalog.total_shops, 10),
    totalProducts: parseInt(catalog.total_products, 10),
    totalUsers: parseInt(users.active_users, 10),
    pendingOrders: parseInt(orders.pending_confirmation, 10),

    // Keep nested structure for other uses
    orders: {
      total:               parseInt(orders.total_orders,        10),
      draft:               parseInt(orders.draft,               10),
      pendingConfirmation: parseInt(orders.pending_confirmation, 10),
      confirmed:           parseInt(orders.confirmed,            10),
      dispatched:          parseInt(orders.dispatched,           10),
      delivered:           parseInt(orders.delivered,            10),
      cancelled:           parseInt(orders.cancelled,            10),
    },
    revenue: {
      totalRevenue: parseFloat(revenue.total_revenue).toFixed(2),
    },
    users: {
      total:       parseInt(users.total_users,   10),
      admins:      parseInt(users.admins,         10),
      supervisors: parseInt(users.supervisors,    10),
      salesmen:    parseInt(users.salesmen,       10),
      activeUsers: parseInt(users.active_users,   10),
    },
    catalog: {
      totalShops:    parseInt(catalog.total_shops,    10),
      totalProducts: parseInt(catalog.total_products, 10),
      totalVariants: parseInt(catalog.total_variants, 10),
    },
  };

  return result;
};

// ─── GET /api/dashboard/orders/recent ─────────────────────────────────────────

const getRecentOrders = async (limit = 20) => {
  const rows = await dashboardRepository.getRecentOrders(limit);

  return rows.map(row => ({
    id:            row.id,
    status:        row.status,
    createdAt:     row.created_at,
    confirmedAt:   row.confirmed_at,
    shopName:      row.shop_name,
    ownerName:     row.owner_name,
    salesmanName:  row.salesman_name,
    salesmanEmail: row.salesman_email,
    itemCount:     parseInt(row.item_count,    10),
    orderTotal:    parseFloat(row.order_total).toFixed(2),
  }));
};

// ─── GET /api/dashboard/top-products ─────────────────────────────────────────

const getTopProducts = async () => {
  const rows = await dashboardRepository.getTopProducts(5);

  return rows.map(row => ({
    id:                row.id,
    name:              row.name,
    category:          row.category,
    totalUnitsOrdered: parseInt(row.total_units_ordered, 10),
    totalRevenue:      parseFloat(row.total_revenue).toFixed(2),
    timesOrdered:      parseInt(row.times_ordered,       10),
  }));
};

// ─── GET /api/dashboard/salesman-performance ──────────────────────────────────

const getSalesmanPerformance = async () => {
  const rows = await dashboardRepository.getSalesmanPerformance();

  return rows.map(row => ({
    id:               row.id,
    name:             row.name,
    email:            row.email,
    phone:            row.phone,
    assignedShops:    parseInt(row.assigned_shops,    10),
    orders: {
      total:     parseInt(row.total_orders,     10),
      delivered: parseInt(row.delivered_orders, 10),
      dispatched: parseInt(row.dispatched_orders, 10),
      confirmed: parseInt(row.confirmed_orders, 10),
      pending:   parseInt(row.pending_orders,   10),
      draft:     parseInt(row.draft_orders,     10),
    },
    totalRevenue:   parseFloat(row.total_revenue).toFixed(2),
  }));
};

// ─── GET /api/dashboard/salesmen/:id/performance ─────────────────────────────

const getSalesmanPerformanceById = async (id, filters = {}) => {
  const data = await dashboardRepository.getSalesmanPerformanceById(id, filters);

  if (!data) return null;

  const { salesman, stats, assignedShops, orders, totalOrders, insights } = data;

  const totalOrders_   = parseInt(stats.total_orders,     10);
  const totalRevenue_  = parseFloat(stats.total_revenue ?? 0);

  return {
    salesman: {
      id:       salesman.id,
      name:     salesman.name,
      email:    salesman.email,
      phone:    salesman.phone,
      isActive: salesman.is_active,
      joinedAt: salesman.created_at,
    },
    stats: {
      totalOrders:       totalOrders_,
      completedOrders:   parseInt(stats.completed_orders || 0, 10),
      pendingOrders:     parseInt(stats.pending_orders || 0,   10),
      confirmedOrders:   parseInt(stats.confirmed_orders || 0, 10),
      cancelledOrders:   parseInt(stats.cancelled_orders || 0, 10),
      totalRevenue:      totalRevenue_.toFixed(2),
      averageOrderValue: totalOrders_ > 0
        ? (totalRevenue_ / totalOrders_).toFixed(2)
        : '0.00',
      assignedShops:     parseInt(stats.assigned_shops || 0,   10),
    },
    assignedShops: assignedShops.map(s => ({
      shopId:        s.shop_id,
      shopName:      s.shop_name,
      owner:         s.owner_name,
      phone:         s.phone,
      address:       s.address,
      totalOrders:   parseInt(s.total_orders,  10),
      totalRevenue:  parseFloat(s.total_revenue ?? 0).toFixed(2),
      lastOrderDate: s.last_order_date,
    })),
    orders: {
      data: orders.map(o => ({
        orderId:     o.id,
        date:        o.created_at,
        shop:        o.shop_name,
        items:       parseInt(o.item_count, 10),
        amount:      parseFloat(o.order_total ?? 0).toFixed(2),
        status:      o.status,
      })),
      pagination: {
        page:       filters.page  || 1,
        limit:      filters.limit || 10,
        total:      totalOrders,
        totalPages: Math.ceil(totalOrders / (filters.limit || 10)),
      },
    },
    insights: {
      highestSellingProduct: insights.highest_selling_product ?? null,
      bestMonth:             insights.best_month             ?? null,
      largestOrder:          insights.largest_order
        ? parseFloat(insights.largest_order).toFixed(2)
        : null,
      mostActiveShop:        insights.most_active_shop       ?? null,
      completionRate:        totalOrders_ > 0
        ? ((parseInt(stats.completed_orders, 10) / totalOrders_) * 100).toFixed(1)
        : '0.0',
      avgRevenuePerShop:     parseInt(stats.assigned_shops, 10) > 0
        ? (totalRevenue_ / parseInt(stats.assigned_shops, 10)).toFixed(2)
        : '0.00',
    },
  };
};

module.exports = { getSummary, getRecentOrders, getTopProducts, getSalesmanPerformance, getSalesmanPerformanceById };
