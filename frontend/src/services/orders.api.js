// services/orders.api.js — API calls for the orders module.
// Backend: /api/orders
// IMPORTANT: /voice must match before /:id (handled by Express — our frontend just calls the right URL).

import api from './axios.instance';

// ─── Main order CRUD ──────────────────────────────────────────────────────────
export const getAllOrders  = ()           => api.get('/orders');
export const getOrderById  = (id)        => api.get(`/orders/${id}`);

// POST /api/orders → body: { shopId, salesmanId?, items? }
export const createOrder   = (data)      => api.post('/orders', data);

// ─── Item operations (only on DRAFT orders) ───────────────────────────────────
// POST /api/orders/:id/items → body: { productVariantId, quantity }
export const addItem       = (orderId, data)          => api.post(`/orders/${orderId}/items`, data);
// DELETE /api/orders/:id/items/:itemId
export const removeItem    = (orderId, itemId)        => api.delete(`/orders/${orderId}/items/${itemId}`);

// ─── Status update (ADMIN + SUPERVISOR only) ──────────────────────────────────
// PATCH /api/orders/:id/status → body: { status, remarks? }
export const updateStatus  = (orderId, data)          => api.patch(`/orders/${orderId}/status`, data);
