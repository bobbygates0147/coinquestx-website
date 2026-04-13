import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import PaginationControls from "../ui/PaginationControls";

const statusClass = {
  Active: "text-cq-info bg-cq-info/15",
  Win: "text-cq-buy bg-cq-buy/15",
  Loss: "text-cq-sell bg-cq-sell/15",
  Completed: "text-cq-accent bg-cq-accent/15",
  Cancelled: "text-cq-warning bg-cq-warning/15",
};

const formatDate = (dateString) =>
  new Date(dateString).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatUsd = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function RecentTrades({
  recentTrades,
  calculateProgress,
  formatTimeRemaining,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    setCurrentPage(1);
  }, [recentTrades.length, pageSize]);

  const totalPages = Math.max(1, Math.ceil(recentTrades.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedTrades = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return recentTrades.slice(start, start + pageSize);
  }, [recentTrades, currentPage, pageSize]);

  return (
    <div className="mt-6 rounded-2xl border border-cq-border dark:border-cq-border-dark bg-cq-panel dark:bg-cq-panel-dark p-4 sm:p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-display font-semibold text-cq-text dark:text-cq-text-dark">
          Recent Trades
        </h3>
        <span className="inline-flex items-center rounded-full bg-cq-panel-muted dark:bg-cq-panel-muted-dark px-2.5 py-1 text-xs font-semibold text-cq-muted dark:text-cq-muted-dark">
          {recentTrades.length}
        </span>
      </div>

      {recentTrades.length > 0 ? (
        <div className="space-y-3">
          {paginatedTrades.map((trade) => {
            const progress = Math.floor(calculateProgress(trade));
            const isBuy = trade.type === "buy";
            const status = trade.status || "Active";

            return (
              <div
                key={trade.id}
                className="rounded-xl border border-cq-border dark:border-cq-border-dark bg-cq-panel-muted dark:bg-cq-panel-muted-dark p-3.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate text-sm sm:text-base font-display font-semibold text-cq-text dark:text-cq-text-dark">
                        {trade.asset}
                      </h4>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold text-white ${
                          isBuy ? "bg-cq-buy" : "bg-cq-sell"
                        }`}
                      >
                        {trade.type?.toUpperCase() || "BUY"}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          statusClass[status] || "text-cq-muted bg-cq-panel"
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-cq-muted dark:text-cq-muted-dark">
                      {formatDate(trade.date)}
                    </p>
                  </div>

                  <p className="text-base sm:text-lg font-display font-bold text-cq-text dark:text-cq-text-dark">
                    ${formatUsd(trade.amount)}
                  </p>
                </div>

                {status === "Active" && (
                  <div className="mt-3 space-y-1.5">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-cq-border dark:bg-cq-border-dark">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cq-info to-cq-accent transition-all duration-700"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-cq-muted dark:text-cq-muted-dark">
                      <span>{progress}%</span>
                      <span>{formatTimeRemaining(trade)}</span>
                    </div>
                  </div>
                )}

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg border border-cq-border dark:border-cq-border-dark bg-cq-panel dark:bg-cq-panel-dark px-2.5 py-2">
                    <p className="text-cq-muted dark:text-cq-muted-dark">TP</p>
                    <p className="font-semibold text-cq-text dark:text-cq-text-dark">
                      {trade.takeProfit || "N/A"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-cq-border dark:border-cq-border-dark bg-cq-panel dark:bg-cq-panel-dark px-2.5 py-2">
                    <p className="text-cq-muted dark:text-cq-muted-dark">SL</p>
                    <p className="font-semibold text-cq-text dark:text-cq-text-dark">
                      {trade.stopLoss || "N/A"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-cq-border dark:border-cq-border-dark bg-cq-panel dark:bg-cq-panel-dark px-2.5 py-2 col-span-2 sm:col-span-1">
                    <p className="text-cq-muted dark:text-cq-muted-dark">Duration</p>
                    <p className="font-semibold text-cq-text dark:text-cq-text-dark">
                      {trade.duration || "5 Minutes"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={recentTrades.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 15]}
            itemLabel="trades"
          />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-cq-border dark:border-cq-border-dark bg-cq-panel-muted/80 dark:bg-cq-panel-muted-dark/80 px-4 py-8 text-center">
          <h3 className="text-sm font-semibold text-cq-text dark:text-cq-text-dark">
            No recent trades yet
          </h3>
          <p className="mt-1 text-sm text-cq-muted dark:text-cq-muted-dark">
            Place your first order and trade activity will appear here.
          </p>
        </div>
      )}
    </div>
  );
}

RecentTrades.propTypes = {
  recentTrades: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      type: PropTypes.string,
      asset: PropTypes.string,
      amount: PropTypes.number,
      status: PropTypes.string,
      date: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      takeProfit: PropTypes.string,
      stopLoss: PropTypes.string,
      duration: PropTypes.string,
    })
  ).isRequired,
  calculateProgress: PropTypes.func.isRequired,
  formatTimeRemaining: PropTypes.func.isRequired,
};
