// utils/getInitials.js — extract initials from a full name for avatar display
// e.g. "Priya Sharma" → "PS", "Admin" → "A"

export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase())
    .slice(0, 2)
    .join('');
};
