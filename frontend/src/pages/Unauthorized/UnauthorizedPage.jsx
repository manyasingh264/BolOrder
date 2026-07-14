// pages/Unauthorized/UnauthorizedPage.jsx
//
// Why it exists: When a user tries to access a page they don't have permission for,
//               they need a clear, friendly error page instead of a blank screen.
// Responsibility: Show 403 message with a "Go Back" button.
// Used by: RoleRoute (redirects here on role mismatch)

import { useNavigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import Button from '../../components/Button/Button';
import { ROUTES } from '../../constants';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-surface-50 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 rounded-2xl bg-red-100 flex items-center justify-center mb-6">
        <ShieldOff size={36} className="text-red-500" />
      </div>
      <h1 className="text-3xl font-bold text-surface-900 mb-2">Access Denied</h1>
      <p className="text-surface-500 mb-8 max-w-sm">
        You don't have permission to view this page. Please contact your administrator.
      </p>
      <Button onClick={() => navigate(ROUTES.DASHBOARD)} variant="primary">
        Back to Dashboard
      </Button>
    </div>
  );
};

export default UnauthorizedPage;
