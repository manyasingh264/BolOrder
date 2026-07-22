// redux/store.js
//
// Responsibility: The central Redux store — the single source of truth for UI state.
//
// configureStore from Redux Toolkit automatically:
//   - Combines all reducers
//   - Enables Redux DevTools Extension (only in development)
//   - Adds thunk middleware (for createAsyncThunk)
//
// Why a centralized store?
//   Authentication, sidebar state, and shared data (users, shops, products)
//   are needed across many components. Centralized state prevents prop-drilling
//   and keeps components independent from each other.

import { configureStore } from '@reduxjs/toolkit';

import authReducer       from './slices/authSlice';
import uiReducer         from './slices/uiSlice';
import dashboardReducer  from './slices/dashboardSlice';
import usersReducer      from './slices/usersSlice';
import shopsReducer      from './slices/shopsSlice';
import productsReducer   from './slices/productsSlice';
import ordersReducer     from './slices/ordersSlice';

import voiceSettingsReducer from './slices/voiceSettingSlice';
import voiceOrderReducer    from './slices/voiceOrderSlice';

const store = configureStore({
  reducer: {
    auth:          authReducer,          // Authentication state
    ui:            uiReducer,            // Sidebar, toasts, modals
    dashboard:     dashboardReducer,     // Dashboard stats and charts
    users:         usersReducer,         // User management (ADMIN only)
    shops:         shopsReducer,         // Shop management
    products:      productsReducer,      // Product catalog
    orders:        ordersReducer,        // Order management
    voiceOrder:    voiceOrderReducer,    // AI voice order wizard state
    voiceSettings: voiceSettingsReducer, // Language + voice preferences
  },

  // Middleware: add custom middleware or keep the defaults (thunk + serializability check)
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Disable serializability check for audioBlob (Blob is not serializable)
      serializableCheck: {
        ignoredActions: [
          'voiceOrder/setAudioBlob',
          'voiceOrder/process/fulfilled',
        ],
        ignoredPaths: ['voiceOrder.audioBlob'],
      },
    }),
});

export default store;
