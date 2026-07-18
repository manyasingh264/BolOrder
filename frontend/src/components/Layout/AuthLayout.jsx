// components/Layout/AuthLayout.jsx
//
// Why it exists: The Login page needs a different layout than dashboard pages.
//               Centered card on a gradient background — no Sidebar or Navbar.
// Responsibility: Provide the visual wrapper for unauthenticated pages.
// Used by: LoginPage only.

const AuthLayout = ({ children }) => (
  <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-primary-50 flex items-center justify-center p-4 sm:p-6">
    {/* Background decoration */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-64 sm:w-96 h-64 sm:h-96 rounded-full bg-primary-100 opacity-40 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-64 sm:w-96 h-64 sm:h-96 rounded-full bg-primary-50 opacity-60 blur-3xl" />
    </div>

    {/* Content card */}
    <div className="relative w-full max-w-md">
      {children}
    </div>
  </div>
);

export default AuthLayout;
