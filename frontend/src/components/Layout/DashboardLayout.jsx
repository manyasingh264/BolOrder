// components/Layout/DashboardLayout.jsx
//
// Why it exists: Every authenticated page needs Sidebar + Navbar + main content.
//               Without this layout, those three elements would be re-created in
//               every single page — that is the exact duplication we must avoid.
// Responsibility: Compose Sidebar + Navbar + page content + ToastContainer into
//               a single reusable shell.
// Used by: DashboardPage, UsersPage, ShopsPage, ProductsPage, OrdersPage,
//          VoiceOrderPage, ProfilePage — ALL authenticated pages.

import Sidebar from '../Sidebar/Sidebar';
import Navbar from '../Navbar/Navbar';
import ToastContainer from '../Toast/ToastContainer';

const DashboardLayout = ({ children, title }) => (
  <div className="flex h-screen bg-surface-50 overflow-hidden">

    {/* ── Left: Sidebar (fixed on mobile, static on desktop) ─────────── */}
    <Sidebar />

    {/* ── Right: Navbar + Scrollable Content ───────────────────────── */}
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden w-full">

      {/* Top navigation bar */}
      <Navbar title={title} />

      {/* Main scrollable content area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 page-enter">
        {children}
      </main>
    </div>

    {/* Global toast notifications — rendered once here, triggered from anywhere */}
    <ToastContainer />
  </div>
);

export default DashboardLayout;
