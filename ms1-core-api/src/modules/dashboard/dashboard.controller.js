// dashboard.controller.js — handles HTTP requests for the dashboard module.

const dashboardService = require('./dashboard.service');
const sendResponse     = require('../../utils/sendResponse');

// GET /api/dashboard/summary
const getSummary = async (req, res, next) => {
  try {
    const data = await dashboardService.getSummary();
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return sendResponse(res, 200, true, 'Dashboard summary retrieved', data);
  } catch (error) { next(error); }
};

// GET /api/dashboard/orders/recent
const getRecentOrders = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const data = await dashboardService.getRecentOrders(limit ? parseInt(limit, 10) : 50);
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return sendResponse(res, 200, true, 'Recent orders retrieved', data);
  } catch (error) { next(error); }
};

// GET /api/dashboard/top-products
const getTopProducts = async (req, res, next) => {
  try {
    const data = await dashboardService.getTopProducts();
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return sendResponse(res, 200, true, 'Top products retrieved', data);
  } catch (error) { next(error); }
};

// GET /api/dashboard/salesman-performance
const getSalesmanPerformance = async (req, res, next) => {
  try {
    const data = await dashboardService.getSalesmanPerformance();
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return sendResponse(res, 200, true, 'Salesman performance retrieved', data);
  } catch (error) { next(error); }
};

// GET /api/dashboard/salesmen/:id/performance
const getSalesmanPerformanceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page, limit, status, shopId, startDate, endDate } = req.query;

    const filters = {
      page:      page      ? parseInt(page,  10) : 1,
      limit:     limit     ? parseInt(limit, 10) : 10,
      status:    status    || undefined,
      shopId:    shopId    || undefined,
      startDate: startDate || undefined,
      endDate:   endDate   || undefined,
    };

    const data = await dashboardService.getSalesmanPerformanceById(id, filters);
    if (!data) return sendResponse(res, 404, false, 'Salesman not found', null);

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return sendResponse(res, 200, true, 'Salesman performance retrieved', data);
  } catch (error) { next(error); }
};

module.exports = { getSummary, getRecentOrders, getTopProducts, getSalesmanPerformance, getSalesmanPerformanceById };
