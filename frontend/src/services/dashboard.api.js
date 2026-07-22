// services/dashboard.api.js — API calls for the dashboard module.
// Backend: GET /api/dashboard/*
// Access: ADMIN + SUPERVISOR only (enforced by backend).

import api from './axios.instance';

export const getSummary             = () => api.get('/dashboard/summary');
export const getRecentOrders        = () => api.get('/dashboard/orders/recent?limit=20');
export const getTopProducts         = () => api.get('/dashboard/top-products');
export const getSalesmanPerformance = () => api.get('/dashboard/salesman-performance');
export const checkAiHealth          = () => api.get('/health/ai');

export const getSalesmanPerformanceById = (id, params = {}) =>
  api.get(`/dashboard/salesmen/${id}/performance`, { params });

