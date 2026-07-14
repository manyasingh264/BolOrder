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

  return {
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
      // PostgreSQL returns NUMERIC as string — always parse before sending to client
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
};

// ─── GET /api/dashboard/orders/recent ─────────────────────────────────────────

const getRecentOrders = async () => {
  const rows = await dashboardRepository.getRecentOrders(10);

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

module.exports = { getSummary, getRecentOrders, getTopProducts, getSalesmanPerformance };
