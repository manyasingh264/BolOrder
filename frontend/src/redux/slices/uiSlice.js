// redux/slices/uiSlice.js
//
// Responsibility: Global UI state — things that span multiple components.
//   - Sidebar open/collapsed
//   - Toast notifications (success, error, info, warning)
//   - Active modal tracking
//
// Why Redux for UI state?
//   Sidebar state needs to be shared between Navbar (toggle button) and Sidebar itself.
//   Toasts are triggered from anywhere (after an API call succeeds/fails).
//   Both need to be accessible without prop-drilling.

import { createSlice } from '@reduxjs/toolkit';

let toastId = 0; // simple incrementing ID for toasts

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    sidebarOpen: true,    // sidebar visible by default (desktop), hidden on mobile via CSS
    toasts:      [],      // [{ id, message, type: 'success'|'error'|'info'|'warning' }]
    activeModal: null,    // null or string identifier of the open modal
  },
  reducers: {
    // Toggle sidebar open/closed
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },

    // Add a toast notification
    // Usage: dispatch(addToast({ message: 'Saved!', type: 'success' }))
    addToast: (state, action) => {
      const { message, type = 'info' } = action.payload;
      state.toasts.push({ id: ++toastId, message, type });
    },

    // Remove a specific toast by ID (called after auto-dismiss timer)
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },

    // Modal management
    openModal:  (state, action) => { state.activeModal = action.payload; },
    closeModal: (state)         => { state.activeModal = null; },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  addToast,
  removeToast,
  openModal,
  closeModal,
} = uiSlice.actions;

// Selectors
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectToasts      = (state) => state.ui.toasts;
export const selectActiveModal = (state) => state.ui.activeModal;

export default uiSlice.reducer;
