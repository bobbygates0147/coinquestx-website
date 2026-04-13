import PropTypes from "prop-types";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getVisiblePages = (currentPage, totalPages, maxVisible = 5) => {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [1];
  const sideCount = Math.max(1, Math.floor((maxVisible - 2) / 2));
  let start = Math.max(2, currentPage - sideCount);
  let end = Math.min(totalPages - 1, currentPage + sideCount);

  if (start <= 2) {
    end = Math.min(totalPages - 1, start + (maxVisible - 2) - 1);
  }

  if (end >= totalPages - 1) {
    start = Math.max(2, end - (maxVisible - 2) + 1);
  }

  if (start > 2) {
    pages.push("ellipsis-left");
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < totalPages - 1) {
    pages.push("ellipsis-right");
  }

  pages.push(totalPages);
  return pages;
};

export default function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  itemLabel = "items",
  className = "",
}) {
  if (!totalItems || totalPages <= 0) return null;

  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = clamp(currentPage, 1, safeTotalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(totalItems, safeCurrentPage * pageSize);
  const visiblePages = getVisiblePages(safeCurrentPage, safeTotalPages);

  return (
    <div
      className={`mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <p className="text-xs text-gray-500 dark:text-slate-400">
        Showing {startIndex}-{endIndex} of {totalItems} {itemLabel}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {typeof onPageSizeChange === "function" && (
          <select
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-8 rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            aria-label="Rows per page"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}/page
              </option>
            ))}
          </select>
        )}

        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1}
          className="h-8 rounded-md border border-gray-300 px-2 text-xs text-gray-700 transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
        >
          Prev
        </button>

        {visiblePages.map((page) =>
          typeof page === "number" ? (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`h-8 min-w-[2rem] rounded-md border px-2 text-xs transition ${
                page === safeCurrentPage
                  ? "border-teal-500 bg-teal-500 text-white"
                  : "border-gray-300 text-gray-700 dark:border-slate-700 dark:text-slate-200"
              }`}
            >
              {page}
            </button>
          ) : (
            <span
              key={page}
              className="h-8 min-w-[2rem] select-none px-2 text-center text-xs leading-8 text-gray-400 dark:text-slate-500"
            >
              ...
            </span>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= safeTotalPages}
          className="h-8 rounded-md border border-gray-300 px-2 text-xs text-gray-700 transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
        >
          Next
        </button>
      </div>
    </div>
  );
}

PaginationControls.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  totalItems: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onPageSizeChange: PropTypes.func,
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
  itemLabel: PropTypes.string,
  className: PropTypes.string,
};
