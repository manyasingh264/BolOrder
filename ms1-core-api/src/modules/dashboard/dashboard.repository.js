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
      (SELECT COUNT(*) FROM customer_shops WHERE is_active = true) AS total_shops,
      (SELECT COUNT(*) FROM products WHERE is_active = true)         AS total_products,
      (SELECT COUNT(*) FROM product_variants)                       AS total_variants
  `);

  return {
    orders:  orderCountsResult.rows[0],
    revenue: revenueResult.rows[0],
    users:   userCountsResult.rows[0],
    catalog: catalogResult.rows[0],
  };
};

// ─── Recent Orders ────────────────────────────────────────────────────────────
// Returns recent orders with shop name and salesman name.
// Used for the "Latest Activity" feed on the dashboard.

const getRecentOrders = async (limit = 50) => {
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

// ─── Salesman Performance by ID ───────────────────────────────────────────────
// Returns full performance data for a single salesman.
// Runs 5 focused queries — each aggregates in a single DB round-trip.

const getSalesmanPerformanceById = async (id, { page = 1, limit = 10, status, shopId, startDate, endDate } = {}) => {
  const offset = (page - 1) * limit;

  // 1. Salesman profile
  const salesmanResult = await db.execute(sql`
    SELECT id, name, email, phone, is_active, created_at
    FROM users
    WHERE id = ${id} AND role = 'SALESMAN'
  `);

  if (!salesmanResult.rows.length) return null;

  // 2. Aggregated stats
  // NOTE: customer_shops must NOT be joined into the main query here.
  // Joining it by salesman_id (not by order) creates a Cartesian product:
  // each order-item row is duplicated once per assigned shop, inflating
  // SUM(subtotal) and COUNT(*) FILTER results by the shop count.
  // The shop count is obtained cleanly via a correlated subquery instead.
  const statsResult = await db.execute(sql`
    SELECT
      COUNT(DISTINCT o.id)                                                      AS total_orders,
      COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'DELIVERED')               AS completed_orders,
      COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'PENDING_CONFIRMATION')    AS pending_orders,
      COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'CONFIRMED')               AS confirmed_orders,
      COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'CANCELLED')               AS cancelled_orders,
      COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'DISPATCHED')              AS dispatched_orders,
      COALESCE(SUM(oi.subtotal), 0)                                             AS total_revenue,
      (SELECT COUNT(*) FROM customer_shops WHERE salesman_id = ${id})          AS assigned_shops
    FROM users u
    LEFT JOIN orders o       ON o.salesman_id = u.id
    LEFT JOIN order_items oi ON oi.order_id   = o.id
    WHERE u.id = ${id}
  `);

  // 3. Assigned shops with per-shop totals
  const shopsResult = await db.execute(sql`
    SELECT
      cs.id            AS shop_id,
      cs.shop_name,
      cs.owner_name,
      cs.phone,
      cs.address,
      COUNT(DISTINCT o.id)              AS total_orders,
      COALESCE(SUM(oi.subtotal), 0)     AS total_revenue,
      MAX(o.created_at)                 AS last_order_date
    FROM customer_shops cs
    LEFT JOIN orders o       ON o.shop_id   = cs.id
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE cs.salesman_id = ${id} AND cs.is_active = true
    GROUP BY cs.id, cs.shop_name, cs.owner_name, cs.phone, cs.address
    ORDER BY total_revenue DESC
  `);

  // 4. Orders (paginated, with optional filters)
  // Build filter conditions dynamically
  let whereClause = sql`WHERE o.salesman_id = ${id}`;
  if (status)    whereClause = sql`${whereClause} AND o.status = ${status}`;
  if (shopId)    whereClause = sql`${whereClause} AND o.shop_id = ${shopId}`;
  if (startDate) whereClause = sql`${whereClause} AND o.created_at >= ${startDate}`;
  if (endDate)   whereClause = sql`${whereClause} AND o.created_at <= ${endDate}`;

  const ordersResult = await db.execute(sql`
    SELECT
      o.id,
      o.status,
      o.created_at,
      cs.shop_name,
      COUNT(oi.id)                  AS item_count,
      COALESCE(SUM(oi.subtotal), 0) AS order_total
    FROM orders o
    INNER JOIN customer_shops cs ON cs.id = o.shop_id
    LEFT  JOIN order_items oi    ON oi.order_id = o.id
    ${whereClause}
    GROUP BY o.id, o.status, o.created_at, cs.shop_name
    ORDER BY o.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  const totalOrdersResult = await db.execute(sql`
    SELECT COUNT(DISTINCT o.id) AS total
    FROM orders o
    ${whereClause}
  `);

  // 5. Insights — all computed from existing data
  const insightsResult = await db.execute(sql`
    SELECT
      -- Highest selling product by units
      (
        SELECT p.name
        FROM order_items oi
        INNER JOIN orders o2           ON o2.id = oi.order_id
        INNER JOIN product_variants pv ON pv.id = oi.product_variant_id
        INNER JOIN products p          ON p.id  = pv.product_id
        WHERE o2.salesman_id = ${id}
        GROUP BY p.id, p.name
        ORDER BY SUM(oi.quantity) DESC
        LIMIT 1
      ) AS highest_selling_product,
      -- Best performing month (by revenue)
      (
        SELECT TO_CHAR(DATE_TRUNC('month', o2.created_at), 'Mon YYYY')
        FROM order_items oi
        INNER JOIN orders o2 ON o2.id = oi.order_id
        WHERE o2.salesman_id = ${id}
        GROUP BY DATE_TRUNC('month', o2.created_at)
        ORDER BY SUM(oi.subtotal) DESC
        LIMIT 1
      ) AS best_month,
      -- Largest single order
      (
        SELECT COALESCE(SUM(oi.subtotal), 0)
        FROM orders o2
        INNER JOIN order_items oi ON oi.order_id = o2.id
        WHERE o2.salesman_id = ${id}
        GROUP BY o2.id
        ORDER BY SUM(oi.subtotal) DESC
        LIMIT 1
      ) AS largest_order,
      -- Most active shop (by order count)
      (
        SELECT cs.shop_name
        FROM orders o2
        INNER JOIN customer_shops cs ON cs.id = o2.shop_id
        WHERE o2.salesman_id = ${id}
        GROUP BY cs.id, cs.shop_name
        ORDER BY COUNT(o2.id) DESC
        LIMIT 1
      ) AS most_active_shop
  `);

  return {
    salesman:       salesmanResult.rows[0],
    stats:          statsResult.rows[0],
    assignedShops:  shopsResult.rows,
    orders:         ordersResult.rows,
    totalOrders:    parseInt(totalOrdersResult.rows[0]?.total ?? '0', 10),
    insights:       insightsResult.rows[0],
  };
};

module.exports = {
  getSummaryStats,
  getRecentOrders,
  getTopProducts,
  getSalesmanPerformance,
  getSalesmanPerformanceById,
};
