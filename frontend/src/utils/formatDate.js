// utils/formatDate.js — date formatting utilities

/**
 * Format an ISO date string to a readable format.
 * e.g. "2024-01-15T10:30:00Z" → "15 Jan 2024"
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  });
};

/**
 * Format an ISO date string with time.
 * e.g. "2024-01-15T10:30:00Z" → "15 Jan 2024, 4:00 PM"
 */
export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day:    'numeric',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
};

/**
 * Relative time — "2 hours ago", "3 days ago"
 */
export const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '—';
  const now  = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours   = Math.floor(minutes / 60);
  const days    = Math.floor(hours   / 24);

  if (days   > 0)    return `${days} day${days   > 1 ? 's' : ''} ago`;
  if (hours  > 0)    return `${hours} hr${hours  > 1 ? 's' : ''} ago`;
  if (minutes > 0)   return `${minutes} min ago`;
  return 'just now';
};
