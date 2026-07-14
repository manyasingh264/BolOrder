// services/auth.api.js — API calls for the auth module.
// Backend: POST /api/auth/login

import api from './axios.instance';

export const loginApi = (credentials) =>
  api.post('/auth/login', credentials);
