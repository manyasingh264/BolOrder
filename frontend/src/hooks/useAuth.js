// hooks/useAuth.js
//
// Why it exists: Any component that needs to know who is logged in
//                uses this hook instead of calling useSelector directly.
// Responsibility: Returns the current user, role, and logout dispatcher.
// Used by: Navbar, Sidebar, ProtectedRoute, ProfileCard, usePermissions

import { useDispatch, useSelector } from 'react-redux';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectUserRole,
  selectAuthLoading,
  logout,
} from '../redux/slices/authSlice';

const useAuth = () => {
  const dispatch        = useDispatch();
  const user            = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const role            = useSelector(selectUserRole);
  const isLoading       = useSelector(selectAuthLoading);

  const handleLogout = () => dispatch(logout());

  return { user, isAuthenticated, role, isLoading, logout: handleLogout };
};

export default useAuth;
