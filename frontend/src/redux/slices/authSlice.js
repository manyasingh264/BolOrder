// redux/slices/authSlice.js
//
// Responsibility: Manages authentication state for the entire application.
//
// State shape:
//   user          → { id, name, email, role } from backend login response
//   token         → JWT string stored in localStorage + Redux
//   isAuthenticated → derived boolean
//   isLoading     → true while login API call is in progress
//   error         → login error message (wrong password, etc.)
//
// Why Redux for auth?
//   Every component in the app needs to know who is logged in and what role they have.
//   Redux gives us a single source of truth accessible from any component.

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginApi, sendOtpApi, verifyOtpApi } from '../../services/auth.api';

const STORAGE_KEY = 'bolorder_auth';

// ─── Load from localStorage on app boot ───────────────────────────────────────
// When user refreshes the page, Redux state is lost.
// We persist { token, user } to localStorage and reload them here.
const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { user: null, token: null };
  } catch {
    return { user: null, token: null };
  }
};

const saved = loadFromStorage();

// ─── Async Thunk — Login ───────────────────────────────────────────────────────
// Calls POST /api/auth/login
// On success: stores { token, user } in Redux state + localStorage
// On failure: stores error message in state
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await loginApi(credentials);
      // response.data.data = { token, user }
      return response.data.data;
    } catch (error) {
      const message =
        error.response?.data?.message || 'Login failed. Please try again.';
      return rejectWithValue(message);
    }
  }
);

// ─── Async Thunk — Send OTP ─────────────────────────────────────────────────────
// Calls POST /api/auth/send-otp
// On success: returns success message
// On failure: stores error message in state
export const sendOtp = createAsyncThunk(
  'auth/sendOtp',
  async (email, { rejectWithValue }) => {
    try {
      const response = await sendOtpApi(email);
      return response.data.message;
    } catch (error) {
      const message =
        error.response?.data?.message || 'Failed to send OTP. Please try again.';
      return rejectWithValue(message);
    }
  }
);

// ─── Async Thunk — Verify OTP ───────────────────────────────────────────────────
// Calls POST /api/auth/verify-otp
// On success: stores { token, user } in Redux state + localStorage
// On failure: stores error message in state
export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await verifyOtpApi({ email, otp });
      // response.data.data = { token, user }
      return response.data.data;
    } catch (error) {
      const message =
        error.response?.data?.message || 'Invalid or expired OTP.';
      return rejectWithValue(message);
    }
  }
);

// ─── Slice ─────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:            saved.user,
    token:           saved.token,
    isAuthenticated: !!saved.token,
    isLoading:       false,
    error:           null,
  },
  reducers: {
    // Called when user clicks "Logout" or gets a 401 from the server
    logout: (state) => {
      state.user            = null;
      state.token           = null;
      state.isAuthenticated = false;
      state.error           = null;
      localStorage.removeItem(STORAGE_KEY);
    },
    // Clear error message (e.g., when user starts typing again after a failed login)
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const { token, user } = action.payload;
        state.token           = token;
        state.user            = user;
        state.isAuthenticated = true;
        state.isLoading       = false;
        state.error           = null;
        // Persist to localStorage so page refresh doesn't log user out
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      })
      // Send OTP
      .addCase(sendOtp.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(sendOtp.fulfilled, (state) => {
        state.isLoading = false;
        state.error     = null;
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      })
      // Verify OTP
      .addCase(verifyOtp.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        const { token, user } = action.payload;
        state.token           = token;
        state.user            = user;
        state.isAuthenticated = true;
        state.isLoading       = false;
        state.error           = null;
        // Persist to localStorage so page refresh doesn't log user out
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;

// ─── Selectors ─────────────────────────────────────────────────────────────────
export const selectCurrentUser    = (state) => state.auth.user;
export const selectToken          = (state) => state.auth.token;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading    = (state) => state.auth.isLoading;
export const selectAuthError      = (state) => state.auth.error;
export const selectUserRole       = (state) => state.auth.user?.role;

export default authSlice.reducer;
