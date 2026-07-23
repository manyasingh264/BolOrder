// components/Navbar/Navbar.jsx
//
// Why it exists: The top bar with toggle, breadcrumb, and user info is needed
//               on every authenticated page. Built once, used everywhere.
// Responsibility: Sidebar toggle (hamburger), page title, user avatar + dropdown with logout.
// Used by: DashboardLayout.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { LogOut, User, ChevronDown, Menu, X } from 'lucide-react';
import { logout } from '../../redux/slices/authSlice';
import { selectSidebarOpen, setSidebarOpen } from '../../redux/slices/uiSlice';
import { ROUTES, ROLE_LABELS } from '../../constants';
import { getInitials } from '../../utils';
import useAuth from '../../hooks/useAuth';

const Navbar = ({ title }) => {
  const dispatch       = useDispatch();
  const navigate       = useNavigate();
  const { user, role } = useAuth();
  const isSidebarOpen  = useSelector(selectSidebarOpen);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate(ROUTES.LOGIN);
  };

  const toggleSidebar = () => dispatch(setSidebarOpen(!isSidebarOpen));

  return (
    <header className="h-16 bg-white border-b border-surface-200 shadow-navbar flex items-center px-4 gap-3 flex-shrink-0">

      {/* ── Hamburger / sidebar toggle — mobile/tablet only ────────────── */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-surface-500 hover:text-surface-800 hover:bg-surface-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400"
        aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
        id="sidebar-toggle-btn"
      >
        <span className="relative w-5 h-5 flex items-center justify-center">
          <Menu
            size={20}
            className={`absolute transition-all duration-200 ${isSidebarOpen ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'}`}
          />
          <X
            size={20}
            className={`absolute transition-all duration-200 ${isSidebarOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'}`}
          />
        </span>
      </button>

      {/* Page title — mobile/tablet only (desktop shows it in the sidebar) */}
      {title && (
        <h2 className="lg:hidden text-base font-semibold text-surface-800">{title}</h2>
      )}

      {/* Spacer */}
      <div className="flex-1" />

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
