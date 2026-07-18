// components/Navbar/Navbar.jsx
//
// Why it exists: The top bar with toggle, breadcrumb, and user info is needed
//               on every authenticated page. Built once, used everywhere.
// Responsibility: Sidebar toggle, page title, user avatar + dropdown with logout.
// Used by: DashboardLayout.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Menu, LogOut, User, ChevronDown, Bell, Mic } from 'lucide-react';
import { toggleSidebar, selectSidebarOpen } from '../../redux/slices/uiSlice';
import { logout } from '../../redux/slices/authSlice';
import { ROUTES, ROLE_LABELS } from '../../constants';
import { getInitials } from '../../utils';
import useAuth from '../../hooks/useAuth';

const Navbar = ({ title }) => {
  const dispatch          = useDispatch();
  const navigate          = useNavigate();
  const { user, role }    = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const sidebarOpen       = useSelector(selectSidebarOpen);

  const handleLogout = () => {
    dispatch(logout());
    navigate(ROUTES.LOGIN);
  };

  return (
    <header className="h-16 bg-white border-b border-surface-200 shadow-navbar flex items-center px-4 gap-3 flex-shrink-0">

      {/* Sidebar toggle button - Mic icon on mobile/tablet, Menu on desktop */}
      <button
        onClick={() => dispatch(toggleSidebar())}
        className="btn-icon lg:hidden"
        aria-label="Toggle sidebar"
        aria-expanded={sidebarOpen}
        id="sidebar-toggle-btn"
      >
        <Mic size={20} className="text-primary-500" />
      </button>

      {/* Desktop sidebar toggle (for collapse functionality if needed) */}
      <button
        onClick={() => dispatch(toggleSidebar())}
        className="btn-icon hidden lg:block"
        aria-label="Toggle sidebar"
        id="sidebar-toggle-btn-desktop"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      {title && (
        <h2 className="text-base font-semibold text-surface-800 hidden sm:block">{title}</h2>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Notification bell (placeholder — future feature) */}
      <button className="btn-icon relative" aria-label="Notifications">
        <Bell size={18} />
      </button>

      {/* User avatar + dropdown */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen((p) => !p)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-surface-50 transition-colors"
          id="user-menu-btn"
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
        >
          {/* Avatar circle with initials */}
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {getInitials(user?.name)}
          </div>

          <div className="hidden sm:block text-left min-w-0">
            <p className="text-sm font-medium text-surface-800 truncate max-w-[120px]">
              {user?.name ?? 'User'}
            </p>
            <p className="text-2xs text-surface-400 leading-none">
              {ROLE_LABELS[role] ?? role}
            </p>
          </div>

          <ChevronDown
            size={14}
            className={`text-surface-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown menu */}
        {dropdownOpen && (
          <>
            {/* Backdrop to close dropdown */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setDropdownOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl border border-surface-200 shadow-card-md z-20 py-1 animate-slide-in">
              <div className="px-3 py-2.5 border-b border-surface-100">
                <p className="text-sm font-medium text-surface-900 truncate">{user?.name}</p>
                <p className="text-xs text-surface-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { setDropdownOpen(false); navigate(ROUTES.PROFILE); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors"
              >
                <User size={15} />
                My Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                id="logout-btn"
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
