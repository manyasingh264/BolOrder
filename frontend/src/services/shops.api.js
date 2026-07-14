// services/shops.api.js — API calls for the shops module.
// Backend: /api/shops
// Access: READ all, WRITE ADMIN+SUPERVISOR (enforced by backend).

import api from './axios.instance';

export const getAllShops  = ()                  => api.get('/shops');
export const getShopById  = (id)               => api.get(`/shops/${id}`);
export const createShop   = (data)             => api.post('/shops', data);
export const updateShop   = (id, data)         => api.patch(`/shops/${id}`, data);
export const addAlias     = (shopId, alias)    => api.post(`/shops/${shopId}/aliases`, { alias });
