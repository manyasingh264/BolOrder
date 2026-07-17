// redux/slices/productsSlice.js
//
// Responsibility: Manages product catalog state.
//   - Products have variants (size/unit/price) and aliases (for AI speech recognition).
//   - READ: all roles. WRITE: ADMIN only (enforced by backend).

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as productsApi from '../../services/products.api';

export const fetchProducts = createAsyncThunk(
  'products/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await productsApi.getAllProducts();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load products');
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const res = await productsApi.getProductById(id);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Product not found');
    }
  }
);

export const createProduct = createAsyncThunk(
  'products/create',
  async (productData, { rejectWithValue }) => {
    try {
      const res = await productsApi.createProduct(productData);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create product');
    }
  }
);

export const updateProduct = createAsyncThunk(
  'products/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await productsApi.updateProduct(id, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update product');
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'products/delete',
  async (id, { rejectWithValue }) => {
    try {
      await productsApi.deleteProduct(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete product');
    }
  }
);

export const addProductVariant = createAsyncThunk(
  'products/addVariant',
  async ({ productId, variantData }, { rejectWithValue }) => {
    try {
      const res = await productsApi.addVariant(productId, variantData);
      return { productId, variant: res.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add variant');
    }
  }
);

export const updateProductVariant = createAsyncThunk(
  'products/updateVariant',
  async ({ productId, variantId, data }, { rejectWithValue }) => {
    try {
      const res = await productsApi.updateVariant(productId, variantId, data);
      return { productId, variantId, variant: res.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update variant');
    }
  }
);

export const addProductAlias = createAsyncThunk(
  'products/addAlias',
  async ({ productId, alias }, { rejectWithValue }) => {
    try {
      const res = await productsApi.addAlias(productId, alias);
      return { productId, alias: res.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add alias');
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    products:        [],
    selectedProduct: null,
    isLoading:       false,
    error:           null,
  },
  reducers: {
    setSelectedProduct:   (state, action) => { state.selectedProduct = action.payload; },
    clearSelectedProduct: (state)         => { state.selectedProduct = null; },
    clearProductsError:   (state)         => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchProducts.fulfilled, (state, { payload }) => { state.isLoading = false; state.products = payload; })
      .addCase(fetchProducts.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload; })

      .addCase(fetchProductById.pending,   (state) => { state.isLoading = true; })
      .addCase(fetchProductById.fulfilled, (state, { payload }) => { state.isLoading = false; state.selectedProduct = payload; })
      .addCase(fetchProductById.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload; })

      .addCase(createProduct.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(createProduct.fulfilled, (state, { payload }) => { state.isLoading = false; state.products.unshift(payload); })
      .addCase(createProduct.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload; })

      .addCase(updateProduct.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(updateProduct.fulfilled, (state, { payload }) => {
        state.isLoading       = false;
        state.selectedProduct = payload;
        const idx = state.products.findIndex((p) => p.id === payload.id);
        if (idx !== -1) state.products[idx] = payload;
      })
      .addCase(updateProduct.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload; })

      .addCase(deleteProduct.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(deleteProduct.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.products = state.products.filter((p) => p.id !== payload);
      })
      .addCase(deleteProduct.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload; })

      // After adding a variant, refresh the selected product in place
      .addCase(addProductVariant.fulfilled, (state, { payload }) => {
        if (state.selectedProduct?.id === payload.productId) {
          state.selectedProduct.variants = [
            ...(state.selectedProduct.variants || []),
            payload.variant,
          ];
        }
      });
  },
});

export const {
  setSelectedProduct,
  clearSelectedProduct,
  clearProductsError,
} = productsSlice.actions;

export const selectAllProducts      = (state) => state.products.products;
export const selectSelectedProduct  = (state) => state.products.selectedProduct;
export const selectProductsLoading  = (state) => state.products.isLoading;
export const selectProductsError    = (state) => state.products.error;

export default productsSlice.reducer;
