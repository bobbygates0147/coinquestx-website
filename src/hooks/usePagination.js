import { useEffect, useMemo, useState } from "react";

export default function usePagination(
  items = [],
  { initialPage = 1, initialPageSize = 10, resetDeps = [] } = {}
) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage, pageSize, ...resetDeps]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(items.length / pageSize)),
    [items.length, pageSize]
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [currentPage, items, pageSize]);

  return {
    currentPage,
    pageSize,
    totalPages,
    paginatedItems,
    setCurrentPage,
    setPageSize,
  };
}
