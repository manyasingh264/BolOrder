// hooks/usePagination.js
//
// Why it exists: Every table page needs pagination state.
//               One hook, reused across Users, Shops, Products, Orders.
// Responsibility: Calculates pagination slice and page navigation.
// Used by: UsersPage, ShopsPage, ProductsPage, OrdersPage

import { useState, useMemo } from 'react';

const usePagination = (items = [], pageSize = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Recalculate on items or pageSize change
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const goToFirst = () => setCurrentPage(1);
  const goToLast  = () => setCurrentPage(totalPages);
  const goToPrev  = () => goToPage(currentPage - 1);
  const goToNext  = () => goToPage(currentPage + 1);

  // Reset to page 1 whenever the filtered/total items change
  const reset = () => setCurrentPage(1);

  return {
    currentPage,
    totalPages,
    pageSize,
    paginatedItems,
    totalItems: items.length,
    startIndex: (currentPage - 1) * pageSize + 1,
    endIndex:   Math.min(currentPage * pageSize, items.length),
    goToPage,
    goToFirst,
    goToLast,
    goToPrev,
    goToNext,
    reset,
    hasPrev: currentPage > 1,
    hasNext: currentPage < totalPages,
  };
};

export default usePagination;
