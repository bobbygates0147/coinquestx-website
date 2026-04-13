import { useEffect, useState } from "react";

const DEFAULT_MARKET_PAIRS = [
  { pair: "BTC/USD", change: "--", price: "$--", isPositive: true },
  { pair: "ETH/USD", change: "--", price: "$--", isPositive: true },
  { pair: "SOL/USD", change: "--", price: "$--", isPositive: true },
  { pair: "XRP/USD", change: "--", price: "$--", isPositive: true },
];

const formatterUSD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const formatPercent = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "--";
  }
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

export default function MarketData() {
  const [marketPairs, setMarketPairs] = useState(DEFAULT_MARKET_PAIRS);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const fetchMarketSnapshot = async () => {
      const cryptoUrl =
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ripple&vs_currencies=usd&include_24hr_change=true";

      try {
        const cryptoRes = await fetch(cryptoUrl, { signal: controller.signal });

        if (!isActive) return;

        const cryptoData = cryptoRes.ok ? await cryptoRes.json() : {};

        const nextPairs = [];

        if (cryptoData.bitcoin) {
          const change = cryptoData.bitcoin.usd_24h_change;
          nextPairs.push({
            pair: "BTC/USD",
            change: formatPercent(change),
            price: formatterUSD.format(cryptoData.bitcoin.usd),
            isPositive: change >= 0,
          });
        }

        if (cryptoData.ethereum) {
          const change = cryptoData.ethereum.usd_24h_change;
          nextPairs.push({
            pair: "ETH/USD",
            change: formatPercent(change),
            price: formatterUSD.format(cryptoData.ethereum.usd),
            isPositive: change >= 0,
          });
        }

        if (cryptoData.solana) {
          const change = cryptoData.solana.usd_24h_change;
          nextPairs.push({
            pair: "SOL/USD",
            change: formatPercent(change),
            price: formatterUSD.format(cryptoData.solana.usd),
            isPositive: change >= 0,
          });
        }

        if (cryptoData.ripple) {
          const change = cryptoData.ripple.usd_24h_change;
          nextPairs.push({
            pair: "XRP/USD",
            change: formatPercent(change),
            price: formatterUSD.format(cryptoData.ripple.usd),
            isPositive: change >= 0,
          });
        }

        if (nextPairs.length > 0) {
          setMarketPairs(nextPairs);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Market overview fetch failed", error);
        }
      }
    };

    fetchMarketSnapshot();
    const refreshId = setInterval(fetchMarketSnapshot, 30000);

    return () => {
      isActive = false;
      controller.abort();
      clearInterval(refreshId);
    };
  }, []);

  return (
    <div className="mt-6 rounded-2xl border border-cq-border dark:border-cq-border-dark bg-cq-panel dark:bg-cq-panel-dark p-5 sm:p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-display font-semibold text-cq-text dark:text-cq-text-dark">
          Market Overview
        </h3>
        <span className="rounded-full bg-cq-accent-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-cq-accent">
          Live
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {marketPairs.map(({ pair, change, price, isPositive }) => (
          <div
            key={pair}
            className="rounded-xl border border-cq-border dark:border-cq-border-dark bg-cq-panel-muted dark:bg-cq-panel-muted-dark p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold tracking-wide text-cq-muted dark:text-cq-muted-dark">
                {pair}
              </span>
              <span
                className={`text-xs font-semibold ${
                  isPositive ? "text-cq-buy" : "text-cq-sell"
                }`}
              >
                {change}
              </span>
            </div>
            <div className="mt-2 text-xl font-display font-bold text-cq-text dark:text-cq-text-dark">
              {price}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
