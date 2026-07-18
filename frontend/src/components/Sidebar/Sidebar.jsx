// components/Sidebar/Sidebar.jsx
//
// Why it exists: Navigation is needed on every authenticated page.
//               Without this, every page would duplicate the nav HTML.
// Responsibility: Render role-filtered nav links; collapse on mobile.
// Used by: DashboardLayout.jsx (once, wraps all authenticated pages)
//
// Navigation items are filtered by role:
//   ADMIN      → Dashboard, Users, Products, Shops, Orders, Profile
//   SUPERVISOR → Dashboard, Products, Shops, Orders, Profile
//   SALESMAN   → Products, Shops (assigned), Orders (own), Voice Order, Profile

import { useSelector } from 'react-redux';
import { useEffect, useRef } from 'react';
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
  { to: ROUTES.DASHBOARD,   icon: LayoutDashboard, label: 'Dashboard',   roles: [ROLES.ADMIN, ROLES.SUPERVISOR] },
  { to: ROUTES.USERS,       icon: Users,           label: 'Users',       roles: [ROLES.ADMIN] },
  { to: ROUTES.PRODUCTS,    icon: Package,          label: 'Products',    roles: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SALESMAN] },
  { to: ROUTES.SHOPS,       icon: Store,            label: 'Shops',       roles: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SALESMAN] },
  { to: ROUTES.ORDERS,      icon: ClipboardList,    label: 'Orders',      roles: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SALESMAN] },
  { to: ROUTES.VOICE_ORDER, icon: Mic,              label: 'Voice Order', roles: [ROLES.SALESMAN] },
  { to: ROUTES.PROFILE,     icon: User,             label: 'Profile',     roles: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.SALESMAN] },
];

const Sidebar = () => {
  const dispatch    = useDispatch();
  const isOpen      = useSelector(selectSidebarOpen);
  const role        = useSelector(selectUserRole);
  const sidebarRef  = useRef(null);

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  const handleItemClick = () => {
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      dispatch(setSidebarOpen(false));
    }
  };

  // Initialize sidebar state based on screen size on mount
  useEffect(() => {
    const isDesktop = window.innerWidth >= 1024;
    dispatch(setSidebarOpen(isDesktop));
  }, [dispatch]);

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        dispatch(setSidebarOpen(false));
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, dispatch]);

  // Focus trap when sidebar is open on mobile/tablet
  useEffect(() => {
    if (isOpen && window.innerWidth < 1024 && sidebarRef.current) {
      const focusableElements = sidebarRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      firstElement?.focus();

      const handleTab = (e) => {
        if (e.key !== 'Tab') return;
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      sidebarRef.current.addEventListener('keydown', handleTab);
      return () => sidebarRef.current?.removeEventListener('keydown', handleTab);
    }
  }, [isOpen]);

  // Desktop: permanent sidebar (w-60)
  // Mobile/Tablet: hidden by default, slides in as drawer
  return (
    <>
      {/* Mobile/Tablet overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-250"
          onClick={() => dispatch(setSidebarOpen(false))}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        ref={sidebarRef}
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          bg-white border-r border-surface-200 shadow-sidebar
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:shadow-none lg:z-auto lg:w-60
          w-60
        `}
        aria-label="Main navigation"
        role="navigation"
      >
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-surface-100 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center flex-shrink-0">
            <Mic size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-surface-900 text-sm leading-none">
              Bol<span className="text-primary-500">Order</span>
            </h1>
            <p className="text-2xs text-surface-400 mt-0.5 truncate">Voice Order System</p>
          </div>
          {/* Mobile close button */}
          <button
            onClick={() => dispatch(setSidebarOpen(false))}
            className="ml-auto btn-icon lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5 no-scrollbar" aria-label="Main menu">
          {visibleItems.map((item) => (
            <SidebarItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              collapsed={false}
              onClick={handleItemClick}
            />
          ))}
        </nav>

        {/* Role indicator at bottom */}
        <div className="px-4 py-3 border-t border-surface-100 flex-shrink-0">
          <p className="text-2xs text-surface-400 uppercase tracking-wider font-medium">
            Logged in as
          </p>
          <p className="text-xs font-semibold text-surface-600 mt-0.5">{role}</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
