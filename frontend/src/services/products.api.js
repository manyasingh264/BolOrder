// services/products.api.js — API calls for the products module.
// Backend: /api/products
// Access: READ all roles, WRITE ADMIN only (enforced by backend).

import api from './axios.instance';

// ─── Products ─────────────────────────────────────────────────────────────────
export const getAllProducts  = ()           => api.get('/products');
export const getProductById  = (id)        => api.get(`/products/${id}`);
export const createProduct   = (data)      => api.post('/products', data);
export const updateProduct   = (id, data)  => api.patch(`/products/${id}`, data);

// ─── Variants ─────────────────────────────────────────────────────────────────
// POST /api/products/:id/variants
export const addVariant      = (productId, data)              => api.post(`/products/${productId}/variants`, data);
// PATCH /api/products/:id/variants/:variantId
export const updateVariant   = (productId, variantId, data)   => api.patch(`/products/${productId}/variants/${variantId}`, data);

// ─── Aliases ──────────────────────────────────────────────────────────────────
// POST /api/products/:id/aliases  (body: { alias: "string" })
export const addAlias        = (productId, alias) => api.post(`/products/${productId}/aliases`, { alias });
