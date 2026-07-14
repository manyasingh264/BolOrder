// services/axios.instance.js
//
// Responsibility: Creates a configured Axios instance used by ALL API service files.
//
// Features:
//   1. Base URL from environment variable (or fallback to localhost:5000)
//   2. Request interceptor → auto-attaches JWT token from Redux store
//   3. Response interceptor → handles 401 (token expired) → dispatches logout
//
// Why an instance instead of plain axios?
//   Every API call needs the same base URL and Authorization header.
//   With an instance, we configure it once and all service files inherit it.
//   Components never touch Axios directly — they call service functions.

import axios from 'axios';
import store from '../redux/store';
import { logout } from '../redux/slices/authSlice';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
// Runs before every request. Reads token from Redux store and attaches it.
axiosInstance.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
// Runs after every response. Handles global error cases:
//   401 → Token expired or invalid → force logout
//   All other errors → pass through to the calling service/thunk
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or tampered — clear auth state and redirect to login
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
