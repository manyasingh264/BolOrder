// routes/AppRouter.jsx
//
// Why it exists: All route definitions belong in one place, not scattered across components.
// Responsibility: Define every route, wrap protected routes with ProtectedRoute,
//               and handle redirects (/ → /login or /dashboard).
// Used by: App.jsx (replaces the current verification screen in Step 4)

import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import ProtectedRoute from './ProtectedRoute';
import { ROUTES, ROLES } from '../constants';
import { selectIsAuthenticated, selectCurrentUser } from '../redux/slices/authSlice';

// Pages (lazy imports can be added later for code-splitting)
import LoginPage         from '../pages/Login/LoginPage';
import DashboardPage     from '../pages/Dashboard/DashboardPage';
import UsersPage         from '../pages/Users/UsersPage';
import ProductsPage      from '../pages/Products/ProductsPage';
import ShopsPage         from '../pages/Shops/ShopsPage';
import OrdersPage        from '../pages/Orders/OrdersPage';
import OrderDetailPage   from '../pages/Orders/OrderDetailPage';
import VoiceOrderPage    from '../pages/VoiceOrder/VoiceOrderPage';
import ProfilePage       from '../pages/Profile/ProfilePage';
import UnauthorizedPage  from '../pages/Unauthorized/UnauthorizedPage';

const ALL_ROLES = [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SALESMAN];

const AppRouter = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);

  // Determine default route based on role
  const getDefaultRoute = () => {
    if (!isAuthenticated) return ROUTES.LOGIN;
    if (currentUser?.role === ROLES.SALESMAN) return ROUTES.VOICE_ORDER;
    return ROUTES.DASHBOARD;
  };

  return (
    <Routes>
      {/* ── Public Routes ─────────────────────────────────────────────── */}
      <Route
        path={ROUTES.LOGIN}
        element={
          // If already logged in, redirect based on role
          isAuthenticated
            ? <Navigate to={getDefaultRoute()} replace />
            : <LoginPage />
        }
      />

      {/* ── Utility ────────────────────────────────────────────────────── */}
      <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />

      {/* ── ADMIN + SUPERVISOR only Route ─────────────────────────────── */}
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPERVISOR]}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* ── ADMIN-only Route ───────────────────────────────────────────── */}
      <Route
        path={ROUTES.USERS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <UsersPage />
          </ProtectedRoute>
        }
      />

      {/* ── Protected Routes — all authenticated roles ─────────────────── */}
      <Route
        path={ROUTES.PRODUCTS}
        element={
          <ProtectedRoute allowedRoles={ALL_ROLES}>
            <ProductsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.SHOPS}
        element={
          <ProtectedRoute allowedRoles={ALL_ROLES}>
            <ShopsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.ORDERS}
        element={
          <ProtectedRoute allowedRoles={ALL_ROLES}>
            <OrdersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.ORDER_DETAIL}
        element={
          <ProtectedRoute allowedRoles={ALL_ROLES}>
            <OrderDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.VOICE_ORDER}
        element={
          <ProtectedRoute allowedRoles={[ROLES.SALESMAN]}>
            <VoiceOrderPage />
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.PROFILE}
        element={
          <ProtectedRoute allowedRoles={ALL_ROLES}>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* ── Root redirect ─────────────────────────────────────────────── */}
      <Route
        path="/"
        element={
          <Navigate
            to={getDefaultRoute()}
            replace
          />
        }
      />

      {/* ── 404 fallback ─────────────────────────────────────────────── */}
      <Route
        path="*"
        element={<Navigate to={getDefaultRoute()} replace />}
      />
    </Routes>
  );
};

export default AppRouter;
