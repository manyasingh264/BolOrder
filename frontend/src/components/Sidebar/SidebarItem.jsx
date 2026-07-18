// components/Sidebar/SidebarItem.jsx
//
// Why it exists: Each nav link in the sidebar needs icon + label + active state.
//               Extracted so Sidebar.jsx stays clean and readable.
// Responsibility: Render one navigation link with active styling.
// Used by: Sidebar.jsx

import { NavLink } from 'react-router-dom';

const SidebarItem = ({ to, icon: Icon, label, collapsed, onClick }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      isActive ? 'sidebar-link-active' : 'sidebar-link'
    }
    title={collapsed ? label : undefined}
    onClick={onClick}
  >
    {Icon && (
      <Icon
        size={18}
        className="flex-shrink-0"
        aria-hidden="true"
      />
    )}
    {!collapsed && (
      <span className="truncate">{label}</span>
    )}
  </NavLink>
);

export default SidebarItem;
