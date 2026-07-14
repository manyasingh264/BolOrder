// redux/slices/ordersSlice.js
//
// Responsibility: Manages order state for all roles.
//   - SALESMAN sees only their own orders (backend filters).
//   - ADMIN/SUPERVISOR see all orders.
//   - Status transitions: DRAFT → PENDING_CONFIRMATION → CONFIRMED → DISPATCHED → DELIVERED | CANCELLED
//   - Item add/remove only on DRAFT orders.

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as ordersApi from '../../services/orders.api';

export const fetchOrders = createAsyncThunk(
  'orders/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await ordersApi.getAllOrders();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load orders');
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'orders/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const res = await ordersApi.getOrderById(id);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Order not found');
    }
  }
);

export const createOrder = createAsyncThunk(
  'orders/create',
  async (orderData, { rejectWithValue }) => {
    try {
      const res = await ordersApi.createOrder(orderData);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create order');
    }
  }
);

export const addOrderItem = createAsyncThunk(
  'orders/addItem',
  async ({ orderId, itemData }, { rejectWithValue }) => {
    try {
      const res = await ordersApi.addItem(orderId, itemData);
      return { orderId, item: res.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add item');
    }
  }
);

export const removeOrderItem = createAsyncThunk(
  'orders/removeItem',
  async ({ orderId, itemId }, { rejectWithValue }) => {
    try {
      await ordersApi.removeItem(orderId, itemId);
      return { orderId, itemId };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to remove item');
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateStatus',
  async ({ orderId, status, remarks }, { rejectWithValue }) => {
    try {
      const res = await ordersApi.updateStatus(orderId, { status, remarks });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update status');
    }
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    orders:        [],
    selectedOrder: null,
    isLoading:     false,
    error:         null,
  },
  reducers: {
    setSelectedOrder:   (state, action) => { state.selectedOrder = action.payload; },
    clearSelectedOrder: (state)         => { state.selectedOrder = null; },
    clearOrdersError:   (state)         => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchOrders.fulfilled, (state, { payload }) => { state.isLoading = false; state.orders = payload; })
      .addCase(fetchOrders.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload; })

      .addCase(fetchOrderById.pending,   (state) => { state.isLoading = true; })
      .addCase(fetchOrderById.fulfilled, (state, { payload }) => { state.isLoading = false; state.selectedOrder = payload; })
      .addCase(fetchOrderById.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload; })

      .addCase(createOrder.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(createOrder.fulfilled, (state, { payload }) => { state.isLoading = false; state.orders.unshift(payload); })
      .addCase(createOrder.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload; })

      // After status update, replace in list and update selectedOrder
      .addCase(updateOrderStatus.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(updateOrderStatus.fulfilled, (state, { payload }) => {
        state.isLoading    = false;
        state.selectedOrder = payload;
        const idx = state.orders.findIndex((o) => o.id === payload.id);
        if (idx !== -1) state.orders[idx] = payload;
      })
      .addCase(updateOrderStatus.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload; });
  },
});

export const { setSelectedOrder, clearSelectedOrder, clearOrdersError } = ordersSlice.actions;

export const selectAllOrders     = (state) => state.orders.orders;
export const selectSelectedOrder = (state) => state.orders.selectedOrder;
export const selectOrdersLoading = (state) => state.orders.isLoading;
export const selectOrdersError   = (state) => state.orders.error;

export default ordersSlice.reducer;
