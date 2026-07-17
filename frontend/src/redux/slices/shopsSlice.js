// redux/slices/shopsSlice.js
//
// Responsibility: Manages shop data for all roles.
//   SALESMAN sees only their assigned shops (backend handles filtering).
//   ADMIN/SUPERVISOR see all shops.

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as shopsApi from '../../services/shops.api';

export const fetchShops = createAsyncThunk(
  'shops/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await shopsApi.getAllShops();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load shops');
    }
  }
);

export const fetchShopById = createAsyncThunk(
  'shops/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const res = await shopsApi.getShopById(id);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Shop not found');
    }
  }
);

export const createShop = createAsyncThunk(
  'shops/create',
  async (shopData, { rejectWithValue }) => {
    try {
      const res = await shopsApi.createShop(shopData);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create shop');
    }
  }
);

export const updateShop = createAsyncThunk(
  'shops/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await shopsApi.updateShop(id, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update shop');
    }
  }
);

export const addShopAlias = createAsyncThunk(
  'shops/addAlias',
  async ({ shopId, alias }, { rejectWithValue }) => {
    try {
      const res = await shopsApi.addAlias(shopId, alias);
      return { shopId, alias: res.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add alias');
    }
  }
);

export const deleteShop = createAsyncThunk(
  'shops/delete',
  async (id, { rejectWithValue }) => {
    try {
      await shopsApi.deleteShop(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete shop');
    }
  }
);

const shopsSlice = createSlice({
  name: 'shops',
  initialState: {
    shops:        [],
    selectedShop: null,
    isLoading:    false,
    error:        null,
  },
  reducers: {
    setSelectedShop:   (state, action) => { state.selectedShop = action.payload; },
    clearSelectedShop: (state)         => { state.selectedShop = null; },
    clearShopsError:   (state)         => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShops.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchShops.fulfilled, (state, { payload }) => { state.isLoading = false; state.shops = payload; })
      .addCase(fetchShops.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload; })

      .addCase(fetchShopById.pending,   (state) => { state.isLoading = true; })
      .addCase(fetchShopById.fulfilled, (state, { payload }) => { state.isLoading = false; state.selectedShop = payload; })
      .addCase(fetchShopById.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload; })

      .addCase(createShop.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(createShop.fulfilled, (state, { payload }) => { state.isLoading = false; state.shops.unshift(payload); })
      .addCase(createShop.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload; })

      .addCase(updateShop.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(updateShop.fulfilled, (state, { payload }) => {
        state.isLoading   = false;
        state.selectedShop = payload;
        const idx = state.shops.findIndex((s) => s.id === payload.id);
        if (idx !== -1) state.shops[idx] = payload;
      })
      .addCase(updateShop.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload; })

      .addCase(deleteShop.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(deleteShop.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.shops = state.shops.filter((s) => s.id !== payload);
        if (state.selectedShop?.id === payload) state.selectedShop = null;
      })
      .addCase(deleteShop.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload; });
  },
});

export const { setSelectedShop, clearSelectedShop, clearShopsError } = shopsSlice.actions;

export const selectAllShops     = (state) => state.shops.shops;
export const selectSelectedShop = (state) => state.shops.selectedShop;
export const selectShopsLoading = (state) => state.shops.isLoading;
export const selectShopsError   = (state) => state.shops.error;

export default shopsSlice.reducer;
