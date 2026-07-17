// services/users.api.js — API calls for the users module.
// Backend: /api/users
// Access: ADMIN only (enforced by backend).

import api from './axios.instance';

export const getAllUsers  = ()           => api.get('/users');
export const getUserById  = (id)         => api.get(`/users/${id}`);
export const createUser   = (data)       => api.post('/users', data);
export const updateUser   = (id, data)   => api.patch(`/users/${id}`, data);
export const deleteUser   = (id)         => api.delete(`/users/${id}`);
