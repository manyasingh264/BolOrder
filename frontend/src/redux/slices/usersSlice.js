// redux/slices/usersSlice.js
//
// Responsibility: Manages all user-related state (ADMIN only feature).
//   - users[]        → list of all users returned by GET /api/users
//   - selectedUser   → user being edited/viewed
//   - isLoading      → true during any API call
//   - error          → last API error message

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as usersApi from '../../services/users.api';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await usersApi.getAllUsers();
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load users');
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'users/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const res = await usersApi.getUserById(id);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'User not found');
    }
  }
);

export const createUser = createAsyncThunk(
  'users/create',
  async (userData, { rejectWithValue }) => {
    try {
      const res = await usersApi.createUser(userData);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create user');
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await usersApi.updateUser(id, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update user');
    }
  }
);

// ─── Slice ─────────────────────────────────────────────────────────────────────
const usersSlice = createSlice({
  name: 'users',
  initialState: {
    users:        [],
    selectedUser: null,
    isLoading:    false,
    error:        null,
  },
  reducers: {
    setSelectedUser:  (state, action) => { state.selectedUser = action.payload; },
    clearSelectedUser: (state)        => { state.selectedUser = null; },
    clearUsersError:  (state)         => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // fetchUsers
      .addCase(fetchUsers.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchUsers.fulfilled, (state, { payload }) => { state.isLoading = false; state.users = payload; })
      .addCase(fetchUsers.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload; })

      // fetchUserById
      .addCase(fetchUserById.pending,   (state) => { state.isLoading = true; })
      .addCase(fetchUserById.fulfilled, (state, { payload }) => { state.isLoading = false; state.selectedUser = payload; })
      .addCase(fetchUserById.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload; })

      // createUser — append to list on success
      .addCase(createUser.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(createUser.fulfilled, (state, { payload }) => { state.isLoading = false; state.users.unshift(payload); })
      .addCase(createUser.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload; })

      // updateUser — replace in list on success
      .addCase(updateUser.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(updateUser.fulfilled, (state, { payload }) => {
        state.isLoading   = false;
        state.selectedUser = payload;
        const idx         = state.users.findIndex((u) => u.id === payload.id);
        if (idx !== -1) state.users[idx] = payload;
      })
      .addCase(updateUser.rejected,  (state, { payload }) => { state.isLoading = false; state.error = payload; });
  },
});

export const { setSelectedUser, clearSelectedUser, clearUsersError } = usersSlice.actions;

// Selectors
export const selectAllUsers    = (state) => state.users.users;
export const selectSelectedUser = (state) => state.users.selectedUser;
export const selectUsersLoading = (state) => state.users.isLoading;
export const selectUsersError   = (state) => state.users.error;

export default usersSlice.reducer;
