// routes/ProtectedRoute.jsx
//
// Why it exists: Every authenticated page must check if the user is logged in.
//               Without this, users could navigate directly to /dashboard without logging in.
// Responsibility:
//   1. If not authenticated → redirect to /login
//   2. If authenticated but wrong role → redirect to /unauthorized
//   3. If authenticated + correct role → render the page
// Used by: AppRouter.jsx — wraps every protected route.

import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUserRole } from '../redux/slices/authSlice';
import { ROUTES } from '../constants';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const role            = useSelector(selectUserRole);

  // Not logged in → send to login
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // Logged in but role not allowed → send to unauthorized
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  // All good → render the protected page
  return children;
};

export default ProtectedRoute;
