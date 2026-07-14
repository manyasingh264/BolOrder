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
import { selectIsAuthenticated } from '../redux/slices/authSlice';

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

  return (
    <Routes>
      {/* ── Public Routes ─────────────────────────────────────────────── */}
      <Route
        path={ROUTES.LOGIN}
        element={
          // If already logged in, redirect to dashboard
          isAuthenticated
            ? <Navigate to={ROUTES.DASHBOARD} replace />
            : <LoginPage />
        }
      />

      {/* ── Utility ────────────────────────────────────────────────────── */}
      <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />

      {/* ── Protected Routes — all authenticated roles ─────────────────── */}
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedRoute allowedRoles={ALL_ROLES}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

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
          <ProtectedRoute allowedRoles={ALL_ROLES}>
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

      {/* ── ADMIN-only Route ───────────────────────────────────────────── */}
      <Route
        path={ROUTES.USERS}
        element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
            <UsersPage />
          </ProtectedRoute>
        }
      />

      {/* ── Root redirect ─────────────────────────────────────────────── */}
      <Route
        path="/"
        element={
          <Navigate
            to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN}
            replace
          />
        }
      />

      {/* ── 404 fallback ─────────────────────────────────────────────── */}
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN} replace />}
      />
    </Routes>
  );
};

export default AppRouter;
