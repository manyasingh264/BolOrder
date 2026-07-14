// pages/Profile/ProfilePage.jsx — FULL IMPLEMENTATION
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/Card/Card';
import { RoleBadge, ActiveBadge } from '../../components/Badge/Badge';
import { User } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { getInitials, formatDate } from '../../utils';
import { ROLE_LABELS } from '../../constants';

const ProfilePage = () => {
  const { user, role } = useAuth();

  return (
    <DashboardLayout title="My Profile">
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-2 mb-0.5">
          <User size={20} className="text-primary-500" />
          <h1 className="page-title">My Profile</h1>
        </div>

        {/* Profile card */}
        <Card>
          <Card.Body>
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-2xl bg-primary-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-card-md">
                {getInitials(user?.name)}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-surface-900">{user?.name}</h2>
                <p className="text-surface-500 text-sm mt-0.5">{user?.email}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <RoleBadge role={role} />
                  <ActiveBadge isActive={true} />
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Details */}
        <Card>
          <Card.Header><h2 className="text-base font-semibold">Account Details</h2></Card.Header>
          <Card.Body>
            <dl className="space-y-4">
              {[
                ['Full Name',   user?.name],
                ['Email',       user?.email],
                ['Role',        ROLE_LABELS[role]],
                ['User ID',     user?.id ? `#${String(user.id).slice(0,8).toUpperCase()}` : '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-surface-100 last:border-0">
                  <dt className="text-sm text-surface-500">{label}</dt>
                  <dd className="text-sm font-medium text-surface-800">{value ?? '—'}</dd>
                </div>
              ))}
            </dl>
          </Card.Body>
        </Card>

        {/* Role Permissions info */}
        <Card>
          <Card.Header><h2 className="text-base font-semibold">Your Permissions</h2></Card.Header>
          <Card.Body>
            <div className="space-y-2 text-sm">
              {[
                { label: 'View Dashboard',     allowed: ['ADMIN','SUPERVISOR'].includes(role) },
                { label: 'Manage Users',        allowed: role === 'ADMIN' },
                { label: 'Manage Products',     allowed: role === 'ADMIN' },
                { label: 'Manage Shops',        allowed: ['ADMIN','SUPERVISOR'].includes(role) },
                { label: 'Update Order Status', allowed: ['ADMIN','SUPERVISOR'].includes(role) },
                { label: 'Record Voice Orders', allowed: true },
                { label: 'View All Orders',     allowed: ['ADMIN','SUPERVISOR'].includes(role) },
              ].map(({ label, allowed }) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-surface-50 last:border-0">
                  <span className="text-surface-600">{label}</span>
                  <span className={`text-xs font-medium ${allowed ? 'text-green-600' : 'text-surface-400'}`}>
                    {allowed ? '✓ Allowed' : '✗ Restricted'}
                  </span>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
