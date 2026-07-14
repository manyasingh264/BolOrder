// redux/slices/dashboardSlice.js
//
// Responsibility: Caches all dashboard API data in Redux.
//   - summary     → order counts, revenue, user/shop/product totals
//   - recentOrders → 10 most recent orders
//   - topProducts  → top 5 products by revenue
//   - salesmanPerformance → per-salesman stats
//
// API Access: ADMIN + SUPERVISOR only (enforced by backend)

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as dashboardApi from '../../services/dashboard.api';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchDashboardSummary = createAsyncThunk(
  'dashboard/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const res = await dashboardApi.getSummary();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load summary');
    }
  }
);

export const fetchRecentOrders = createAsyncThunk(
  'dashboard/fetchRecentOrders',
  async (_, { rejectWithValue }) => {
    try {
      const res = await dashboardApi.getRecentOrders();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load recent orders');
    }
  }
);

export const fetchTopProducts = createAsyncThunk(
  'dashboard/fetchTopProducts',
  async (_, { rejectWithValue }) => {
    try {
      const res = await dashboardApi.getTopProducts();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load top products');
    }
  }
);

export const fetchSalesmanPerformance = createAsyncThunk(
  'dashboard/fetchSalesmanPerformance',
  async (_, { rejectWithValue }) => {
    try {
      const res = await dashboardApi.getSalesmanPerformance();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load performance data');
    }
  }
);

// ─── Slice ─────────────────────────────────────────────────────────────────────
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    summary:             null,
    recentOrders:        [],
    topProducts:         [],
    salesmanPerformance: [],
    isLoading:           false,
    error:               null,
  },
  reducers: {
    clearDashboard: (state) => {
      state.summary             = null;
      state.recentOrders        = [];
      state.topProducts         = [];
      state.salesmanPerformance = [];
    },
  },
  extraReducers: (builder) => {
    const pending   = (state) => { state.isLoading = true;  state.error = null; };
    const rejected  = (state, action) => { state.isLoading = false; state.error = action.payload; };

    builder
      .addCase(fetchDashboardSummary.pending,       pending)
      .addCase(fetchDashboardSummary.fulfilled,     (state, { payload }) => { state.isLoading = false; state.summary = payload; })
      .addCase(fetchDashboardSummary.rejected,      rejected)

      .addCase(fetchRecentOrders.pending,           pending)
      .addCase(fetchRecentOrders.fulfilled,         (state, { payload }) => { state.isLoading = false; state.recentOrders = payload; })
      .addCase(fetchRecentOrders.rejected,          rejected)

      .addCase(fetchTopProducts.pending,            pending)
      .addCase(fetchTopProducts.fulfilled,          (state, { payload }) => { state.isLoading = false; state.topProducts = payload; })
      .addCase(fetchTopProducts.rejected,           rejected)

      .addCase(fetchSalesmanPerformance.pending,    pending)
      .addCase(fetchSalesmanPerformance.fulfilled,  (state, { payload }) => { state.isLoading = false; state.salesmanPerformance = payload; })
      .addCase(fetchSalesmanPerformance.rejected,   rejected);
  },
});

export const { clearDashboard } = dashboardSlice.actions;

// Selectors
export const selectDashboardSummary      = (state) => state.dashboard.summary;
export const selectRecentOrders          = (state) => state.dashboard.recentOrders;
export const selectTopProducts           = (state) => state.dashboard.topProducts;
export const selectSalesmanPerformance   = (state) => state.dashboard.salesmanPerformance;
export const selectDashboardLoading      = (state) => state.dashboard.isLoading;
export const selectDashboardError        = (state) => state.dashboard.error;

export default dashboardSlice.reducer;
