// components/Pagination/Pagination.jsx
//
// Why it exists: Tables across 4+ pages all need page navigation.
//               One component, plugged into usePagination hook everywhere.
// Responsibility: Render prev/next buttons + page numbers + "Showing X-Y of Z".
// Used by: UsersPage, ShopsPage, ProductsPage, OrdersPage

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  hasPrev,
  hasNext,
  goToPage,
  goToFirst,
  goToLast,
  goToPrev,
  goToNext,
}) => {
  if (totalItems === 0) return null;

  // Build page number array (max 5 visible pages)
  const getPageNumbers = () => {
    const pages = [];
    const delta = 2;
    const left  = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-3">
      {/* Showing X–Y of Z */}
      <p className="text-sm text-surface-500">
        Showing <span className="font-medium text-surface-700">{startIndex}</span>–
        <span className="font-medium text-surface-700">{endIndex}</span> of{' '}
        <span className="font-medium text-surface-700">{totalItems}</span> results
      </p>

      {/* Page controls */}
      <div className="flex items-center gap-1">
        <NavBtn onClick={goToFirst} disabled={!hasPrev} title="First page">
          <ChevronsLeft size={15} />
        </NavBtn>
        <NavBtn onClick={goToPrev} disabled={!hasPrev} title="Previous page">
          <ChevronLeft size={15} />
        </NavBtn>

        {getPageNumbers().map((page, idx) =>
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-surface-400 text-sm">…</span>
          ) : (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                page === currentPage
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-surface-600 hover:bg-surface-100'
              }`}
            >
              {page}
            </button>
          )
        )}

        <NavBtn onClick={goToNext} disabled={!hasNext} title="Next page">
          <ChevronRight size={15} />
        </NavBtn>
        <NavBtn onClick={goToLast} disabled={!hasNext} title="Last page">
          <ChevronsRight size={15} />
        </NavBtn>
      </div>
    </div>
  );
};

const NavBtn = ({ children, disabled, onClick, title }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-500
               hover:bg-surface-100 hover:text-surface-700
               disabled:opacity-30 disabled:cursor-not-allowed
               transition-colors"
  >
    {children}
  </button>
);

export default Pagination;
