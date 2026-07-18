// features/dashboard/SalesmanPerformance.jsx
//
// Why it exists: Supervisors/Admins need a quick view of each salesman's KPIs.
// Responsibility: Render a ranked list of salesmen with order count + revenue.
// Used by: DashboardPage.jsx (ADMIN + SUPERVISOR only)

import { TrendingUp, User } from 'lucide-react';
import { formatCurrency, getInitials } from '../../utils';

const SalesmanPerformance = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg animate-pulse">
            <div className="w-9 h-9 rounded-full bg-surface-200" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-surface-200 rounded w-28" />
              <div className="h-2.5 bg-surface-100 rounded w-20" />
            </div>
            <div className="h-4 bg-surface-200 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <TrendingUp size={28} className="text-surface-300 mb-2" />
        <p className="text-sm text-surface-400">No performance data yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((salesman, idx) => (
        <div
          key={salesman.id || idx}
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors"
        >
          {/* Rank + avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
              {getInitials(salesman.name)}
            </div>
            {idx < 3 && (
              <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-2xs font-bold flex items-center justify-center text-white ${
                idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-surface-400' : 'bg-orange-400'
              }`}>
                {idx + 1}
              </div>
            )}
          </div>

          {/* Name + order count */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-surface-800 truncate">{salesman.name}</p>
            <p className="text-2xs text-surface-400">
              {salesman.orders?.total ?? 0} orders
            </p>
          </div>

          {/* Revenue */}
          <p className="text-sm font-bold text-surface-800 flex-shrink-0">
            {formatCurrency(salesman.revenue ?? salesman.totalRevenue ?? 0)}
          </p>
        </div>
      ))}
    </div>
  );
};

export default SalesmanPerformance;
