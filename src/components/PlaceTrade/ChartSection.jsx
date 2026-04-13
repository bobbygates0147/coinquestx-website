import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import TradingViewChart from "../coinapi/Tradingview";

const TIMEFRAME_OPTIONS = [
  { label: "1H", interval: "60" },
  { label: "4H", interval: "240" },
  { label: "1D", interval: "D" },
  { label: "1W", interval: "W" },
];

export default function ChartSection({ theme, selectedAsset, className = "" }) {
  const [activeTimeframe, setActiveTimeframe] = useState(TIMEFRAME_OPTIONS[0]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateSize = () => setIsMobile(window.innerWidth < 768);
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const chartHeight = isMobile ? 420 : 540;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex h-full flex-col rounded-2xl border border-cq-border bg-cq-panel p-3 shadow-sm dark:border-cq-border-dark dark:bg-cq-panel-dark sm:p-4">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-lg sm:text-xl font-display font-semibold text-cq-text dark:text-cq-text-dark">
              {selectedAsset || "BTC/USD"}
            </span>
            <span className="rounded-full bg-cq-buy/15 px-2.5 py-1 text-xs font-semibold text-cq-buy">
              Live Feed
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {TIMEFRAME_OPTIONS.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setActiveTimeframe(option)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  activeTimeframe.label === option.label
                    ? "bg-cq-info text-white shadow-sm"
                    : "bg-cq-panel-muted dark:bg-cq-panel-muted-dark text-cq-muted dark:text-cq-muted-dark hover:text-cq-text dark:hover:text-cq-text-dark"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full flex-1 overflow-hidden rounded-xl">
          <TradingViewChart
            symbol={selectedAsset || "BTC/USD"}
            interval={activeTimeframe.interval}
            width="100%"
            height={chartHeight}
            theme={theme}
          />
        </div>
      </div>
    </div>
  );
}

ChartSection.propTypes = {
  theme: PropTypes.string.isRequired,
  selectedAsset: PropTypes.string,
  className: PropTypes.string,
};
