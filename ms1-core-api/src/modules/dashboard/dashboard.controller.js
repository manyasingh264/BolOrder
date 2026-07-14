// dashboard.controller.js — handles HTTP requests for the dashboard module.

const dashboardService = require('./dashboard.service');
const sendResponse     = require('../../utils/sendResponse');

// GET /api/dashboard/summary
const getSummary = async (req, res, next) => {
  try {
    const data = await dashboardService.getSummary();
    return sendResponse(res, 200, true, 'Dashboard summary retrieved', data);
  } catch (error) { next(error); }
};

// GET /api/dashboard/orders/recent
const getRecentOrders = async (req, res, next) => {
  try {
    const data = await dashboardService.getRecentOrders();
    return sendResponse(res, 200, true, 'Recent orders retrieved', data);
  } catch (error) { next(error); }
};

// GET /api/dashboard/top-products
const getTopProducts = async (req, res, next) => {
  try {
    const data = await dashboardService.getTopProducts();
    return sendResponse(res, 200, true, 'Top products retrieved', data);
  } catch (error) { next(error); }
};

// GET /api/dashboard/salesman-performance
const getSalesmanPerformance = async (req, res, next) => {
  try {
    const data = await dashboardService.getSalesmanPerformance();
    return sendResponse(res, 200, true, 'Salesman performance retrieved', data);
  } catch (error) { next(error); }
};

module.exports = { getSummary, getRecentOrders, getTopProducts, getSalesmanPerformance };
