// services/auth.api.js — API calls for the auth module.
// Backend: POST /api/auth/login, POST /api/auth/send-otp, POST /api/auth/verify-otp

import api from './axios.instance';

export const loginApi = (credentials) =>
  api.post('/auth/login', credentials);

export const sendOtpApi = (email) =>
  api.post('/auth/send-otp', { email });

export const verifyOtpApi = ({ email, otp }) =>
  api.post('/auth/verify-otp', { email, otp });
