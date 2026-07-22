// dashboard.routes.js — route definitions for the dashboard module.
//
// Mounted at /api/dashboard in routes/index.js
//
// Access: ADMIN + SUPERVISOR only.
// SALESMAN does not have access to the dashboard — they use the orders module
// to see their own order history.
//
// All routes are GET (read-only — dashboards never mutate data).

const { Router } = require('express');

const dashboardController = require('./dashboard.controller');
const authenticate         = require('../../middleware/authenticate.middleware');
const authorize            = require('../../middleware/authorize.middleware');
const { ROLES }            = require('../../constants');

const router = Router();

// All dashboard routes: must be authenticated AND be ADMIN or SUPERVISOR
router.use(authenticate);
router.use(authorize(ROLES.ADMIN, ROLES.SUPERVISOR));

// GET /api/dashboard/summary
// Returns: order counts by status, total revenue, user/shop/product totals
router.get('/summary', dashboardController.getSummary);

// GET /api/dashboard/orders/recent
// Returns: 10 most recent orders with shop + salesman info
router.get('/orders/recent', dashboardController.getRecentOrders);

// GET /api/dashboard/top-products
// Returns: top 5 products by units ordered (with revenue)
router.get('/top-products', dashboardController.getTopProducts);

// GET /api/dashboard/salesman-performance
// Returns: per-salesman stats (total orders, delivered, revenue, shops)
router.get('/salesman-performance', dashboardController.getSalesmanPerformance);

// GET /api/dashboard/salesmen/:id/performance
// Returns: full performance data for a single salesman (profile, stats, shops, orders, insights)
router.get('/salesmen/:id/performance', dashboardController.getSalesmanPerformanceById);

module.exports = router;
