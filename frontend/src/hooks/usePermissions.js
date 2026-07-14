// hooks/usePermissions.js
//
// Why it exists: UI elements (buttons, tabs, form actions) show/hide based on role.
//               Instead of writing role checks in every component, use this hook.
// Responsibility: Returns boolean flags for each action, based on the current role.
// Used by: UsersPage, ShopsPage, ProductsPage, OrdersPage, Sidebar

import { ROLES } from '../constants';
import useAuth from './useAuth';

const usePermissions = () => {
  const { role } = useAuth();

  return {
    // ─── User Management ────────────────────────────────────────────────────
    canManageUsers:    role === ROLES.ADMIN,

    // ─── Shop Management ────────────────────────────────────────────────────
    canCreateShop:     role === ROLES.ADMIN || role === ROLES.SUPERVISOR,
    canUpdateShop:     role === ROLES.ADMIN || role === ROLES.SUPERVISOR,
    canAddShopAlias:   role === ROLES.ADMIN || role === ROLES.SUPERVISOR,

    // ─── Product Management ─────────────────────────────────────────────────
    canCreateProduct:  role === ROLES.ADMIN,
    canUpdateProduct:  role === ROLES.ADMIN,
    canAddVariant:     role === ROLES.ADMIN,
    canAddProductAlias:role === ROLES.ADMIN,

    // ─── Order Management ───────────────────────────────────────────────────
    canUpdateOrderStatus: role === ROLES.ADMIN || role === ROLES.SUPERVISOR,
    canViewAllOrders:     role === ROLES.ADMIN || role === ROLES.SUPERVISOR,

    // ─── Dashboard ──────────────────────────────────────────────────────────
    canViewDashboard:  role === ROLES.ADMIN || role === ROLES.SUPERVISOR,

    // ─── Current role ───────────────────────────────────────────────────────
    isAdmin:      role === ROLES.ADMIN,
    isSupervisor: role === ROLES.SUPERVISOR,
    isSalesman:   role === ROLES.SALESMAN,
    role,
  };
};

export default usePermissions;
