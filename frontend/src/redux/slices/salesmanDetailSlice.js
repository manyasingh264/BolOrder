// redux/slices/salesmanDetailSlice.js
//
// Why it exists: Keeps salesman detail page state isolated from the main
//               dashboard slice, so navigating to/from the detail page
//               does not invalidate the dashboard cache.
// Responsibility: Fetch and cache one salesman's full performance data.
//
// Race-condition fix: The slice tracks `currentSalesmanId`. When a fetch
// completes, it is only applied if the salesman ID in the payload matches
// the current ID — stale in-flight responses are silently discarded.

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getSalesmanPerformanceById } from '../../services/dashboard.api';

// ─── Async Thunk ───────────────────────────────────────────────────────────────
// Passes the id through the return payload so the reducer can guard against
// stale responses.

export const fetchSalesmanDetail = createAsyncThunk(
  'salesmanDetail/fetch',
  async ({ id, filters = {} }, { rejectWithValue }) => {
    try {
      const res = await getSalesmanPerformanceById(id, filters);
      // Return id alongside data so reducer can check if it's still relevant
      return { id, data: res.data.data };
    } catch (err) {
      return rejectWithValue({
        id,
        message: err.response?.data?.message || 'Failed to load salesman details',
      });
    }
  }
);

// ─── Slice ─────────────────────────────────────────────────────────────────────

const salesmanDetailSlice = createSlice({
  name: 'salesmanDetail',
  initialState: {
    currentId: null,   // tracks which salesman is currently being shown
    data:      null,   // { salesman, stats, assignedShops, orders, insights }
    isLoading: false,
    error:     null,
  },
  reducers: {
    // Called when navigating to a new salesman — resets everything and sets
    // the new target ID so in-flight requests for the OLD id are discarded.
    setSalesmanId: (state, { payload: id }) => {
      state.currentId = id;
      state.data      = null;
      state.isLoading = true;
      state.error     = null;
    },
    clearSalesmanDetail: (state) => {
      state.currentId = null;
      state.data      = null;
      state.isLoading = false;
      state.error     = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesmanDetail.pending, (state) => {
        // Keep isLoading true; don't clear data here (avoids flash)
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(fetchSalesmanDetail.fulfilled, (state, { payload }) => {
        // Discard if this response is for a different salesman
        if (payload.id !== state.currentId) return;
        state.isLoading = false;
        state.data      = payload.data;
      })
      .addCase(fetchSalesmanDetail.rejected, (state, { payload }) => {
        // Discard if this rejection is for a different salesman
        if (payload?.id !== state.currentId) return;
        state.isLoading = false;
        state.error     = payload?.message ?? 'Failed to load salesman details';
      });
  },
});

export const { setSalesmanId, clearSalesmanDetail } = salesmanDetailSlice.actions;

// Selectors
export const selectSalesmanDetail        = (state) => state.salesmanDetail.data;
export const selectSalesmanDetailLoading = (state) => state.salesmanDetail.isLoading;
export const selectSalesmanDetailError   = (state) => state.salesmanDetail.error;
export const selectSalesmanCurrentId     = (state) => state.salesmanDetail.currentId;

export default salesmanDetailSlice.reducer;
