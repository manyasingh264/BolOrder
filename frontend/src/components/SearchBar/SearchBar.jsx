// components/SearchBar/SearchBar.jsx
//
// Why it exists: Search is needed on every list page (Users, Shops, Products, Orders).
//               One component avoids duplicating the same input + clear button.
// Responsibility: Render a search input with a clear button; emits onChange.
// Used by: UsersPage, ShopsPage, ProductsPage, OrdersPage

import { Search, X } from 'lucide-react';

const SearchBar = ({
  value,
  onChange,
  placeholder = 'Search...',
  className   = '',
}) => (
  <div className={`relative ${className}`}>
    <Search
      size={16}
      className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none"
    />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="input-base pl-9 pr-9 w-full"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange('')}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 transition-colors"
        aria-label="Clear search"
      >
        <X size={15} />
      </button>
    )}
  </div>
);

export default SearchBar;
