import { useEffect, useId, useRef } from "react";

const SYMBOL_MAP = {
  "BTC/USD": "BITSTAMP:BTCUSD",
  "ETH/USD": "BITSTAMP:ETHUSD",
  "SOL/USD": "BINANCE:SOLUSDT",
  "XRP/USD": "BINANCE:XRPUSDT",
  "DOGE/USD": "BINANCE:DOGEUSDT",
  "EUR/USD": "OANDA:EURUSD",
  "GBP/USD": "OANDA:GBPUSD",
  "USD/JPY": "OANDA:USDJPY",
  "AUD/USD": "OANDA:AUDUSD",
  "USD/CAD": "OANDA:USDCAD",
};

const resolveTradingViewSymbol = (value) => {
  if (!value) return "BITSTAMP:BTCUSD";
  if (value.includes(":")) return value;
  const normalized = value.toUpperCase().trim();
  return SYMBOL_MAP[normalized] || normalized.replace("/", "");
};

/**
 * TradingViewChart
 * @param {string} symbol - TradingView symbol (e.g., "HITBTC:AAVEUSD")
 * @param {number|string} width - Chart width (px or %)
 * @param {number|string} height - Chart height (px or %)
 * @param {string} interval - Chart interval ("1" = 1 minute, "60" = 1 hour, etc.)
 */
export default function TradingViewChart({
  symbol = "HITBTC:AAVEUSD",
  width = "100%",
  height = 500,
  interval = "60", // 1-hour intervals
  theme = "dark",
}) {
  const chartRef = useRef(null);
  const containerId = useId().replace(/:/g, "_");

  useEffect(() => {
    // If the TradingView script hasn't loaded for some reason, do nothing
    if (!window.TradingView) return;

    // Clean up any existing chart if re-rendered
    chartRef.current.innerHTML = "";

    // Create a new TradingView widget
    new window.TradingView.widget({
      // container_id should match the ID of the div we're about to render into
      container_id: containerId,
      // Basic chart settings
      symbol: resolveTradingViewSymbol(symbol), // e.g. "BITSTAMP:BTCUSD"
      interval, // e.g. "60" for 1-hour, "1" for 1-min
      width, // e.g. "100%" or a numeric pixel value
      height, // e.g. 500 or "500px"
      timezone: "Etc/UTC",
      theme: theme === "dark" ? "dark" : "light",
      style: "1", // "1" = line chart, "0" = candles, "9" = Heikin Ashi, etc.
      locale: "en",
      toolbar_bg: "#f1f3f6",
      enable_publishing: false,
      hide_side_toolbar: false,
      allow_symbol_change: true,
    });
  }, [symbol, interval, width, height, theme, containerId]);

  return (
    <div
      id={containerId}
      ref={chartRef}
      className="w-full overflow-hidden rounded-xl"
    />
  );
}
