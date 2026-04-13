import PropTypes from "prop-types";

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatAmount = (value) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function TradeSuccessModal({
  isOpen,
  trade,
  onClose,
  onViewTrades,
}) {
  if (!isOpen || !trade) return null;

  const side = (trade.type || trade.direction || "buy").toLowerCase();
  const isBuy = side === "buy";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-cq-border dark:border-cq-border-dark bg-cq-panel dark:bg-cq-panel-dark shadow-2xl">
        <div className="bg-gradient-to-r from-cq-accent to-cyan-500 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/80">
                Order Confirmed
              </p>
              <h3 className="mt-1 text-xl font-display font-bold text-white">
                Trade Placed Successfully
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/30 bg-white/10 px-3 py-1 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-cq-panel-muted dark:bg-cq-panel-muted-dark px-3 py-1 text-xs font-semibold text-cq-muted dark:text-cq-muted-dark">
              {trade.tradeType || "Trade"}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white ${
                isBuy ? "bg-cq-buy" : "bg-cq-sell"
              }`}
            >
              {isBuy ? "BUY" : "SELL"}
            </span>
            <span className="inline-flex items-center rounded-full bg-cq-info/15 dark:bg-cq-info/25 px-3 py-1 text-xs font-semibold text-cq-info">
              {trade.status || "Active"}
            </span>
          </div>

          <div className="rounded-xl border border-cq-border dark:border-cq-border-dark bg-cq-panel-muted/60 dark:bg-cq-panel-muted-dark/60 p-4">
            <p className="text-sm text-cq-muted dark:text-cq-muted-dark">
              {trade.asset || "Asset"}
            </p>
            <p className="mt-1 text-2xl font-display font-bold text-cq-text dark:text-cq-text-dark">
              ${formatAmount(trade.amount)}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="rounded-lg border border-cq-border dark:border-cq-border-dark p-3">
              <p className="text-cq-muted dark:text-cq-muted-dark">Lot Size</p>
              <p className="font-semibold text-cq-text dark:text-cq-text-dark">
                {trade.lotSize || "N/A"}
              </p>
            </div>
            <div className="rounded-lg border border-cq-border dark:border-cq-border-dark p-3">
              <p className="text-cq-muted dark:text-cq-muted-dark">Duration</p>
              <p className="font-semibold text-cq-text dark:text-cq-text-dark">
                {trade.duration || "5 Minutes"}
              </p>
            </div>
            <div className="rounded-lg border border-cq-border dark:border-cq-border-dark p-3">
              <p className="text-cq-muted dark:text-cq-muted-dark">TP</p>
              <p className="font-semibold text-cq-text dark:text-cq-text-dark">
                {trade.takeProfit || "N/A"}
              </p>
            </div>
            <div className="rounded-lg border border-cq-border dark:border-cq-border-dark p-3">
              <p className="text-cq-muted dark:text-cq-muted-dark">SL</p>
              <p className="font-semibold text-cq-text dark:text-cq-text-dark">
                {trade.stopLoss || "N/A"}
              </p>
            </div>
          </div>

          <p className="text-xs text-cq-muted dark:text-cq-muted-dark">
            Created {formatDateTime(trade.date || trade.createdAt || Date.now())}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 p-5 pt-0 sm:p-6 sm:pt-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-cq-border dark:border-cq-border-dark px-4 py-2.5 text-sm font-semibold text-cq-text dark:text-cq-text-dark transition hover:bg-cq-panel-muted dark:hover:bg-cq-panel-muted-dark"
          >
            Continue Trading
          </button>
          <button
            type="button"
            onClick={onViewTrades}
            className="w-full rounded-xl bg-gradient-to-r from-cq-accent to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            View Trade History
          </button>
        </div>
      </div>
    </div>
  );
}

TradeSuccessModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  trade: PropTypes.shape({
    type: PropTypes.string,
    direction: PropTypes.string,
    tradeType: PropTypes.string,
    asset: PropTypes.string,
    amount: PropTypes.number,
    lotSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    duration: PropTypes.string,
    takeProfit: PropTypes.string,
    stopLoss: PropTypes.string,
    status: PropTypes.string,
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  onClose: PropTypes.func.isRequired,
  onViewTrades: PropTypes.func.isRequired,
};
