// utils/formatCurrency.js — currency formatting for Indian Rupees

/**
 * Format a number as Indian Rupees.
 * e.g. 12500.50 → "₹12,500.50"
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0.00';
  const num = parseFloat(amount);
  if (isNaN(num)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style:                 'currency',
    currency:              'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

/**
 * Format as compact number — e.g. 12500 → "₹12.5K"
 */
export const formatCompactCurrency = (amount) => {
  const num = parseFloat(amount);
  if (isNaN(num)) return '₹0';
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000)   return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${num.toFixed(0)}`;
};
