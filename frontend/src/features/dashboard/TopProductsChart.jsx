// features/dashboard/TopProductsChart.jsx
//
// Why it exists: The dashboard shows top 5 products by revenue as a visual bar chart.
//               No chart library needed — pure CSS bars keep the bundle lean.
// Responsibility: Render horizontal bar chart for top product revenue data.
// Used by: DashboardPage.jsx

import { formatCurrency } from '../../utils';

const TopProductsChart = ({ products, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="h-3 bg-surface-100 rounded animate-pulse w-32" />
            <div className="h-5 bg-surface-100 rounded-full animate-pulse" style={{ width: `${40 + i * 10}%` }} />
          </div>
        ))}
      </div>
    );
  }

  if (!products?.length) {
    return <p className="text-sm text-surface-400 py-4 text-center">No product data available.</p>;
  }

  // Calculate max value for proportional bar widths
  const maxRevenue = Math.max(...products.map((p) => parseFloat(p.revenue || p.totalRevenue || 0)));

  return (
    <div className="space-y-4">
      {products.map((product, idx) => {
        const revenue    = parseFloat(product.revenue || product.totalRevenue || 0);
        const barWidth   = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
        const barColors  = [
          'bg-primary-500',
          'bg-primary-400',
          'bg-primary-300',
          'bg-orange-400',
          'bg-orange-300',
        ];

        return (
          <div key={product.id || idx} className="space-y-1">
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-sm font-medium text-surface-700 truncate">
                {idx + 1}. {product.name || product.productName}
              </span>
              <span className="text-xs font-semibold text-surface-500 flex-shrink-0">
                {formatCurrency(revenue)}
              </span>
            </div>
            <div className="h-2.5 bg-surface-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${barColors[idx]} transition-all duration-500`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
            {product.unitsSold !== undefined && (
              <p className="text-2xs text-surface-400">{product.unitsSold} units sold</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TopProductsChart;
