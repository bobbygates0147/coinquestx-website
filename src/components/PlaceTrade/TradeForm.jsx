import PropTypes from "prop-types";

TradeForm.propTypes = {
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired,
  tradeType: PropTypes.string,
  tradeTypeOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  handleTradeTypeChange: PropTypes.func.isRequired,
  assets: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedAsset: PropTypes.string,
  handleAssetChange: PropTypes.func.isRequired,
  amount: PropTypes.string.isRequired,
  setAmount: PropTypes.func.isRequired,
  userData: PropTypes.shape({
    balance: PropTypes.number,
  }),
  lotSize: PropTypes.number.isRequired,
  setLotSize: PropTypes.func.isRequired,
  takeProfit: PropTypes.string,
  setTakeProfit: PropTypes.func.isRequired,
  stopLoss: PropTypes.string,
  setStopLoss: PropTypes.func.isRequired,
  duration: PropTypes.string.isRequired,
  durationOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  setDuration: PropTypes.func.isRequired,
  error: PropTypes.string,
  handlePlaceOrder: PropTypes.func.isRequired,
  formatCurrency: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  className: PropTypes.string,
};

const toNumber = (value = "") => {
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function TradeForm({
  activeTab,
  setActiveTab,
  tradeType,
  tradeTypeOptions,
  handleTradeTypeChange,
  assets,
  selectedAsset,
  handleAssetChange,
  amount,
  setAmount,
  userData,
  lotSize,
  setLotSize,
  takeProfit,
  setTakeProfit,
  stopLoss,
  setStopLoss,
  duration,
  durationOptions,
  setDuration,
  error,
  handlePlaceOrder,
  formatCurrency,
  isSubmitting = false,
  className = "",
}) {
  const numericAmount = toNumber(amount);
  const estimatedProfit = numericAmount * 0.0625;
  const potentialLoss = numericAmount * 0.0375;
  const riskReward =
    potentialLoss > 0 ? (estimatedProfit / potentialLoss).toFixed(2) : "0.00";

  const formatUsd = (value) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div
      className={`h-full overflow-hidden rounded-2xl border border-cq-border bg-cq-panel shadow-sm dark:border-cq-border-dark dark:bg-cq-panel-dark ${className}`}
    >
      <div className="grid grid-cols-2 border-b border-cq-border dark:border-cq-border-dark">
        {[
          { key: "buy", label: "Buy" },
          { key: "sell", label: "Sell" },
        ].map((tab) => {
          const active = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`py-3 text-sm font-display font-semibold tracking-wide transition ${
                active
                  ? tab.key === "buy"
                    ? "bg-cq-buy text-white"
                    : "bg-cq-sell text-white"
                  : "bg-cq-panel-muted dark:bg-cq-panel-muted-dark text-cq-muted dark:text-cq-muted-dark hover:text-cq-text dark:hover:text-cq-text-dark"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        <h3 className="text-lg font-display font-semibold text-cq-text dark:text-cq-text-dark">
          Place Order
        </h3>

        {error && (
          <div className="rounded-xl border border-cq-sell/30 bg-cq-sell/10 px-3 py-2.5 text-sm text-cq-sell">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-cq-muted dark:text-cq-muted-dark">
              Trade Type
            </label>
            <select
              className="w-full rounded-xl border border-cq-border dark:border-cq-border-dark bg-cq-panel-muted dark:bg-cq-panel-muted-dark px-3 py-2.5 text-sm text-cq-text dark:text-cq-text-dark outline-none focus:border-cq-accent"
              value={tradeType}
              onChange={handleTradeTypeChange}
            >
              <option value="">Select trade type</option>
              {tradeTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-cq-muted dark:text-cq-muted-dark">
              Asset
            </label>
            <select
              className="w-full rounded-xl border border-cq-border dark:border-cq-border-dark bg-cq-panel-muted dark:bg-cq-panel-muted-dark px-3 py-2.5 text-sm text-cq-text dark:text-cq-text-dark outline-none focus:border-cq-accent disabled:opacity-60"
              value={selectedAsset}
              onChange={handleAssetChange}
              disabled={!tradeType}
            >
              <option value="">Select asset</option>
              {assets.map((asset) => (
                <option key={asset} value={asset}>
                  {asset}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-cq-muted dark:text-cq-muted-dark">
                Amount
              </label>
              <span className="text-xs text-cq-muted dark:text-cq-muted-dark">
                Balance: $
                {userData?.balance?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || "0.00"}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cq-muted dark:text-cq-muted-dark">
                $
              </span>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(formatCurrency(e.target.value))}
                className="w-full rounded-xl border border-cq-border dark:border-cq-border-dark bg-cq-panel-muted dark:bg-cq-panel-muted-dark py-2.5 pl-8 pr-3 text-sm text-cq-text dark:text-cq-text-dark outline-none focus:border-cq-accent"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-cq-muted dark:text-cq-muted-dark">
              Lot Size
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[2, 5, 10, 15].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setLotSize(size)}
                  className={`rounded-lg py-2 text-sm font-semibold transition ${
                    lotSize === size
                      ? "bg-cq-info text-white"
                      : "bg-cq-panel-muted dark:bg-cq-panel-muted-dark text-cq-muted dark:text-cq-muted-dark hover:text-cq-text dark:hover:text-cq-text-dark"
                  }`}
                >
                  {size} LS
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-cq-muted dark:text-cq-muted-dark">
                Take Profit
              </label>
              <input
                type="text"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                className="w-full rounded-xl border border-cq-border dark:border-cq-border-dark bg-cq-panel-muted dark:bg-cq-panel-muted-dark px-3 py-2.5 text-sm text-cq-text dark:text-cq-text-dark outline-none focus:border-cq-accent"
                placeholder="1.1050"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-cq-muted dark:text-cq-muted-dark">
                Stop Loss
              </label>
              <input
                type="text"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className="w-full rounded-xl border border-cq-border dark:border-cq-border-dark bg-cq-panel-muted dark:bg-cq-panel-muted-dark px-3 py-2.5 text-sm text-cq-text dark:text-cq-text-dark outline-none focus:border-cq-accent"
                placeholder="1.0925"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-cq-muted dark:text-cq-muted-dark">
              Duration
            </label>
            <select
              className="w-full rounded-xl border border-cq-border dark:border-cq-border-dark bg-cq-panel-muted dark:bg-cq-panel-muted-dark px-3 py-2.5 text-sm text-cq-text dark:text-cq-text-dark outline-none focus:border-cq-accent"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            >
              {durationOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-cq-border dark:border-cq-border-dark bg-cq-panel-muted/80 dark:bg-cq-panel-muted-dark/80 p-3">
            <div className="flex items-center justify-between py-1 text-sm">
              <span className="text-cq-muted dark:text-cq-muted-dark">Estimated Profit</span>
              <span className="font-semibold text-cq-buy">+${formatUsd(estimatedProfit)}</span>
            </div>
            <div className="flex items-center justify-between py-1 text-sm">
              <span className="text-cq-muted dark:text-cq-muted-dark">Potential Loss</span>
              <span className="font-semibold text-cq-sell">-${formatUsd(potentialLoss)}</span>
            </div>
            <div className="flex items-center justify-between py-1 text-sm">
              <span className="text-cq-muted dark:text-cq-muted-dark">Risk / Reward</span>
              <span className="font-semibold text-cq-warning">1:{riskReward}</span>
            </div>
          </div>

          <div className="rounded-xl border border-cq-warning/35 bg-cq-warning/10 px-3 py-2 text-xs text-cq-warning">
            Active trades close automatically when duration expires if TP/SL does not trigger.
          </div>

          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={isSubmitting}
            className={`w-full rounded-xl py-3 text-sm font-display font-semibold text-white transition ${
              activeTab === "buy"
                ? "bg-gradient-to-r from-cq-buy to-emerald-700 hover:opacity-95"
                : "bg-gradient-to-r from-cq-sell to-rose-700 hover:opacity-95"
            } ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {isSubmitting
              ? "Submitting Order..."
              : activeTab === "buy"
                ? "Place Buy Order"
                : "Place Sell Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
