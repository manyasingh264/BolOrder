// components/Sidebar/Sidebar.jsx
//
// Why it exists: Navigation is needed on every authenticated page.
//               Without this, every page would duplicate the nav HTML.
// Responsibility: Render role-filtered nav links; collapse on mobile.
// Used by: DashboardLayout.jsx (once, wraps all authenticated pages)
//
// Navigation items are filtered by role:
//   ADMIN      → Dashboard, Users, Products, Shops, Orders, Voice Order, Profile
//   SUPERVISOR → Dashboard, Products, Shops, Orders, Voice Order, Profile
//   SALESMAN   → Dashboard, Shops (assigned), Orders (own), Voice Order, Profile

import { useSelector } from 'react-redux';
import {
  LayoutDashboard,
  Users,
  Package,
  Store,
  ClipboardList,
  Mic,
  User,
  X,
} from 'lucide-react';
import SidebarItem from './SidebarItem';
import { selectSidebarOpen, setSidebarOpen } from '../../redux/slices/uiSlice';
import { selectUserRole } from '../../redux/slices/authSlice';
import { ROLES, ROUTES } from '../../constants';
import { useDispatch } from 'react-redux';

// Full nav config — each item specifies which roles can see it
const NAV_ITEMS = [
  { to: ROUTES.DASHBOARD,   icon: LayoutDashboard, label: 'Dashboard',   roles: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SALESMAN] },
  { to: ROUTES.USERS,       icon: Users,           label: 'Users',       roles: [ROLES.ADMIN] },
  { to: ROUTES.PRODUCTS,    icon: Package,          label: 'Products',    roles: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SALESMAN] },
  { to: ROUTES.SHOPS,       icon: Store,            label: 'Shops',       roles: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SALESMAN] },
  { to: ROUTES.ORDERS,      icon: ClipboardList,    label: 'Orders',      roles: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SALESMAN] },
  { to: ROUTES.VOICE_ORDER, icon: Mic,              label: 'Voice Order', roles: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SALESMAN] },
  { to: ROUTES.PROFILE,     icon: User,             label: 'Profile',     roles: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SALESMAN] },
];

const Sidebar = () => {
  const dispatch    = useDispatch();
  const isOpen      = useSelector(selectSidebarOpen);
  const role        = useSelector(selectUserRole);

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  // Sidebar width: 240px when open, 64px when collapsed (icon-only)
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => dispatch(setSidebarOpen(false))}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-30 flex flex-col
          bg-white border-r border-surface-200 shadow-sidebar
          transition-all duration-250
          ${isOpen ? 'w-60' : 'w-16'}
          lg:relative lg:z-auto lg:shadow-none
        `}
      >
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-surface-100 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center flex-shrink-0">
            <Mic size={16} className="text-white" />
          </div>
          {isOpen && (
            <div className="min-w-0">
              <h1 className="font-bold text-surface-900 text-sm leading-none">
                Bol<span className="text-primary-500">Order</span>
              </h1>
              <p className="text-2xs text-surface-400 mt-0.5 truncate">Voice Order System</p>
            </div>
          )}
          {/* Mobile close button */}
          {isOpen && (
            <button
              onClick={() => dispatch(setSidebarOpen(false))}
              className="ml-auto btn-icon lg:hidden"
              aria-label="Close sidebar"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5 no-scrollbar">
          {visibleItems.map((item) => (
            <SidebarItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              collapsed={!isOpen}
            />
          ))}
        </nav>

        {/* Role indicator at bottom */}
        {isOpen && (
          <div className="px-4 py-3 border-t border-surface-100 flex-shrink-0">
            <p className="text-2xs text-surface-400 uppercase tracking-wider font-medium">
              Logged in as
            </p>
            <p className="text-xs font-semibold text-surface-600 mt-0.5">{role}</p>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
