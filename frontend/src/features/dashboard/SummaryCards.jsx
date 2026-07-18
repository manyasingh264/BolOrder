// features/dashboard/SummaryCards.jsx
//
// Why it exists: The 4 top stat cards (Total Orders, Revenue, Shops, Products)
//               have identical structure but different data. Extracted to keep
//               DashboardPage thin and cards reusable.
// Responsibility: Render a grid of KPI cards from the dashboard summary data.
// Used by: DashboardPage.jsx

import { ShoppingCart, IndianRupee, Store, Package, Users, TrendingUp } from 'lucide-react';
import { formatCompactCurrency } from '../../utils';

const CARD_CONFIG = [
  {
    key:     'totalOrders',
    label:   'Total Orders',
    icon:    ShoppingCart,
    color:   'text-blue-600',
    bg:      'bg-blue-50',
    prefix:  '',
    suffix:  '',
  },
  {
    key:     'totalRevenue',
    label:   'Total Revenue',
    icon:    IndianRupee,
    color:   'text-green-600',
    bg:      'bg-green-50',
    format:  'currency',
  },
  {
    key:     'totalShops',
    label:   'Active Shops',
    icon:    Store,
    color:   'text-violet-600',
    bg:      'bg-violet-50',
  },
  {
    key:     'totalProducts',
    label:   'Products',
    icon:    Package,
    color:   'text-orange-600',
    bg:      'bg-orange-50',
  },
  {
    key:     'totalUsers',
    label:   'Team Members',
    icon:    Users,
    color:   'text-primary-600',
    bg:      'bg-primary-50',
  },
  {
    key:     'pendingOrders',
    label:   'Pending Orders',
    icon:    TrendingUp,
    color:   'text-amber-600',
    bg:      'bg-amber-50',
  },
];

const SummaryCards = ({ summary }) => {
  if (!summary) {
    // Skeleton state
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-4 sm:p-5 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-surface-100 animate-pulse" />
            <div className="h-6 bg-surface-100 rounded animate-pulse w-16" />
            <div className="h-3 bg-surface-100 rounded animate-pulse w-24" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {CARD_CONFIG.map(({ key, label, icon: Icon, color, bg, format }) => {
        const value = summary[key] ?? 0;
        const displayValue = format === 'currency'
          ? formatCompactCurrency(value)
          : value.toLocaleString('en-IN');

        return (
          <div key={key} className="card p-4 sm:p-5 hover:shadow-card-md transition-shadow duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm text-surface-500 font-medium mb-1.5">{label}</p>
                <p className="text-xl sm:text-2xl font-bold text-surface-900">{displayValue}</p>
              </div>
              <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={20} className={color} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SummaryCards;
