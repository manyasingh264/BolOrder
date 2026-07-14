// components/Loader/Loader.jsx
//
// Why it exists: Every async operation needs a loading indicator.
//               Without this, each page would create its own spinner.
// Responsibility: Show a spinning loader — full-screen or inline.
// Used by: All pages while fetching data, Button component during API calls.

import { Loader2 } from 'lucide-react';

// Full-page centered loader
const Loader = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
    <Loader2 size={36} className="animate-spin text-primary-500" />
    <p className="text-sm text-surface-500">{message}</p>
  </div>
);

// Small inline loader (used inside cards/sections)
export const InlineLoader = ({ message }) => (
  <div className="flex items-center gap-2 py-4 justify-center">
    <Loader2 size={20} className="animate-spin text-primary-500" />
    {message && <p className="text-sm text-surface-500">{message}</p>}
  </div>
);

// Full screen overlay loader
export const PageLoader = () => (
  <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
    <div className="text-center">
      <Loader2 size={48} className="animate-spin text-primary-500 mx-auto" />
      <p className="text-surface-500 mt-3 text-sm">Loading...</p>
    </div>
  </div>
);

export default Loader;
