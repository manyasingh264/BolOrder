// dashboard.repository.js — aggregation queries for the dashboard.
//
// All queries are READ-ONLY. This module never writes to the database.
// Uses Drizzle's `sql` template tag for complex aggregations that are
// cleaner as raw SQL than chained Drizzle builder calls.
//
// Every query is designed to run in a single DB round-trip.

const { sql } = require('drizzle-orm');
const { db }  = require('../../database/db');

// ─── Summary KPIs ─────────────────────────────────────────────────────────────
// Returns: order counts by status, total revenue from DELIVERED orders,
//          total users, shops, and products.

const getSummaryStats = async () => {
  // Order counts grouped by status in one query
  const orderCountsResult = await db.execute(sql`
    SELECT
      COUNT(*)                                                  AS total_orders,
      COUNT(*) FILTER (WHERE status = 'DRAFT')                 AS draft,
      COUNT(*) FILTER (WHERE status = 'PENDING_CONFIRMATION')  AS pending_confirmation,
      COUNT(*) FILTER (WHERE status = 'CONFIRMED')             AS confirmed,
      COUNT(*) FILTER (WHERE status = 'DISPATCHED')            AS dispatched,
      COUNT(*) FILTER (WHERE status = 'DELIVERED')             AS delivered,
      COUNT(*) FILTER (WHERE status = 'CANCELLED')             AS cancelled
    FROM orders
  `);

  // Revenue = sum of order_items subtotals for DELIVERED orders only
  const revenueResult = await db.execute(sql`
    SELECT COALESCE(SUM(oi.subtotal), 0) AS total_revenue
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    WHERE o.status = 'DELIVERED'
  `);

  // User counts by role
  const userCountsResult = await db.execute(sql`
    SELECT
      COUNT(*)                                      AS total_users,
      COUNT(*) FILTER (WHERE role = 'ADMIN')        AS admins,
      COUNT(*) FILTER (WHERE role = 'SUPERVISOR')   AS supervisors,
      COUNT(*) FILTER (WHERE role = 'SALESMAN')     AS salesmen,
      COUNT(*) FILTER (WHERE is_active = true)      AS active_users
    FROM users
  `);

  // Shop and product counts
  const catalogResult = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM customer_shops)               AS total_shops,
      (SELECT COUNT(*) FROM products WHERE is_active = true) AS total_products,
      (SELECT COUNT(*) FROM product_variants)             AS total_variants
  `);

  return {
    orders:  orderCountsResult.rows[0],
    revenue: revenueResult.rows[0],
    users:   userCountsResult.rows[0],
    catalog: catalogResult.rows[0],
  };
};

// ─── Recent Orders ────────────────────────────────────────────────────────────
// Returns the 10 most recent orders with shop name and salesman name.
// Used for the "Latest Activity" feed on the dashboard.

const getRecentOrders = async (limit = 10) => {
  const result = await db.execute(sql`
    SELECT
      o.id,
      o.status,
      o.created_at,
      o.confirmed_at,
      cs.shop_name,
      cs.owner_name,
      u.name  AS salesman_name,
      u.email AS salesman_email,
      (
        SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id
      )                     AS item_count,
      (
        SELECT COALESCE(SUM(oi.subtotal), 0)
        FROM order_items oi WHERE oi.order_id = o.id
      )                     AS order_total
    FROM orders o
    INNER JOIN customer_shops cs ON cs.id = o.shop_id
    INNER JOIN users u           ON u.id  = o.salesman_id
    ORDER BY o.created_at DESC
    LIMIT ${limit}
  `);

  return result.rows;
};

// ─── Top Products ─────────────────────────────────────────────────────────────
// Returns the top 5 products ranked by total units ordered.
// Aggregates across ALL order statuses (not just DELIVERED) — shows what's popular.

const getTopProducts = async (limit = 5) => {
  const result = await db.execute(sql`
    SELECT
      p.id,
      p.name,
      p.category,
      SUM(oi.quantity)  AS total_units_ordered,
      SUM(oi.subtotal)  AS total_revenue,
      COUNT(DISTINCT oi.order_id) AS times_ordered
    FROM order_items oi
    INNER JOIN product_variants pv ON pv.id = oi.product_variant_id
    INNER JOIN products p          ON p.id  = pv.product_id
    GROUP BY p.id, p.name, p.category
    ORDER BY total_units_ordered DESC
    LIMIT ${limit}
  `);

  return result.rows;
};

// ─── Salesman Performance ─────────────────────────────────────────────────────
// Returns per-salesman breakdown:
//   - total orders placed
//   - orders by status
//   - revenue from delivered orders
// Used for the leaderboard / performance table on the dashboard.

const getSalesmanPerformance = async () => {
  const result = await db.execute(sql`
    SELECT
      u.id,
      u.name,
      u.email,
      u.phone,
      COUNT(DISTINCT o.id)                                                    AS total_orders,
      COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'DELIVERED')              AS delivered_orders,
      COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'DISPATCHED')             AS dispatched_orders,
      COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'CONFIRMED')              AS confirmed_orders,
      COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'PENDING_CONFIRMATION')   AS pending_orders,
      COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'DRAFT')                  AS draft_orders,
      COALESCE(
        (SELECT SUM(oi.subtotal)
         FROM order_items oi
         INNER JOIN orders o2 ON o2.id = oi.order_id
         WHERE o2.salesman_id = u.id), 0
      )                                                                       AS total_revenue,
      COUNT(DISTINCT cs.id)                                                   AS assigned_shops
    FROM users u
    LEFT JOIN orders o          ON o.salesman_id = u.id
    LEFT JOIN customer_shops cs ON cs.salesman_id = u.id
    WHERE u.role = 'SALESMAN' AND u.is_active = true
    GROUP BY u.id, u.name, u.email, u.phone
    ORDER BY total_revenue DESC, total_orders DESC
  `);

  return result.rows;
};

module.exports = {
  getSummaryStats,
  getRecentOrders,
  getTopProducts,
  getSalesmanPerformance,
};
