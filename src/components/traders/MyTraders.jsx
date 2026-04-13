import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "react-toastify";
import { TraderCard } from "./TraderCard";
import { useCopyTraders } from "../../context/CopyTraderContext";
import { useUser } from "../../context/UserContext";
import { COPY_TRADERS_SEED } from "../../data/copyTradersSeed";

const PRICE_FILTERS = [
  { value: "all", label: "All prices" },
  { value: "under-250", label: "Under $250" },
  { value: "250-750", label: "$250 - $750" },
  { value: "750-1500", label: "$750 - $1,500" },
  { value: "1500-plus", label: "$1,500+" },
];

const WIN_RATE_FILTERS = [
  { value: "all", label: "All win rates" },
  { value: "70", label: "70% and above" },
  { value: "80", label: "80% and above" },
  { value: "90", label: "90% and above" },
];

const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "win-rate", label: "Best Win Rate" },
  { value: "profit-share", label: "Best Profit Share" },
  { value: "volume", label: "Most Total Trades" },
];

const matchesPriceFilter = (price, filter) => {
  switch (filter) {
    case "under-250":
      return price < 250;
    case "250-750":
      return price >= 250 && price <= 750;
    case "750-1500":
      return price > 750 && price <= 1500;
    case "1500-plus":
      return price > 1500;
    default:
      return true;
  }
};

const sortTraders = (traders, sortBy) => {
  const ranked = [...traders];

  ranked.sort((left, right) => {
    const leftPrice = Number(left.copyPrice) || 0;
    const rightPrice = Number(right.copyPrice) || 0;
    const leftTrades = Number(left.wins || 0) + Number(left.losses || 0);
    const rightTrades = Number(right.wins || 0) + Number(right.losses || 0);

    switch (sortBy) {
      case "price-low":
        return leftPrice - rightPrice;
      case "price-high":
        return rightPrice - leftPrice;
      case "win-rate":
        return Number(right.winRate || 0) - Number(left.winRate || 0);
      case "profit-share":
        return Number(right.profitShare || 0) - Number(left.profitShare || 0);
      case "volume":
        return rightTrades - leftTrades;
      default:
        return (
          Number(right.winRate || 0) * 2 +
          Number(right.profitShare || 0) +
          rightTrades / 30 -
          (Number(left.winRate || 0) * 2 +
            Number(left.profitShare || 0) +
            leftTrades / 30)
        );
    }
  });

  return ranked;
};

export default function MyTraderPage() {
  const { theme } = useTheme();
  const [search, setSearch] = useState("");
  const [strategyFilter, setStrategyFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [winRateFilter, setWinRateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recommended");
  const [loadingId, setLoadingId] = useState(null);
  const { copiedTraders, addCopiedTrader } = useCopyTraders();
  const { userData } = useUser();

  const traders = COPY_TRADERS_SEED;
  const userBalance = Number(userData?.balance) || 0;
  const availableStrategies = useMemo(
    () => ["all", ...new Set(traders.map((trader) => trader.strategy).filter(Boolean))],
    [traders]
  );

  const marketplaceSummary = useMemo(() => {
    const prices = traders.map((trader) => Number(trader.copyPrice) || 0);
    const averagePrice = prices.length
      ? prices.reduce((sum, price) => sum + price, 0) / prices.length
      : 0;
    const topWinRate = traders.reduce(
      (best, trader) => Math.max(best, Number(trader.winRate) || 0),
      0
    );
    const topProfitShare = traders.reduce(
      (best, trader) => Math.max(best, Number(trader.profitShare) || 0),
      0
    );

    return {
      averagePrice,
      topWinRate,
      topProfitShare,
    };
  }, [traders]);

  const filteredTraders = useMemo(() => {
    const term = search.trim().toLowerCase();
    const minimumWinRate =
      winRateFilter === "all" ? 0 : Number.parseInt(winRateFilter, 10) || 0;

    const filtered = traders.filter((trader) => {
      const matchesSearch =
        !term ||
        trader.name.toLowerCase().includes(term) ||
        trader.strategy.toLowerCase().includes(term);
      const matchesStrategy =
        strategyFilter === "all" || trader.strategy === strategyFilter;
      const matchesPrice = matchesPriceFilter(
        Number(trader.copyPrice) || 0,
        priceFilter
      );
      const matchesWinRate = Number(trader.winRate || 0) >= minimumWinRate;

      return matchesSearch && matchesStrategy && matchesPrice && matchesWinRate;
    });

    return sortTraders(filtered, sortBy);
  }, [priceFilter, search, sortBy, strategyFilter, traders, winRateFilter]);

  const clearFilters = () => {
    setSearch("");
    setStrategyFilter("all");
    setPriceFilter("all");
    setWinRateFilter("all");
    setSortBy("recommended");
  };

  const hasActiveFilters =
    search.trim() ||
    strategyFilter !== "all" ||
    priceFilter !== "all" ||
    winRateFilter !== "all" ||
    sortBy !== "recommended";

  const handleCopy = async (id) => {
    if (userBalance <= 0) {
      toast.error("Insufficient balance. Deposit funds to copy traders.");
      return;
    }

    if (copiedTraders.some((trader) => trader.id === id)) {
      toast.error("You are already copying this trader.");
      return;
    }

    const traderToCopy = traders.find((trader) => trader.id === id);
    if (!traderToCopy) {
      toast.error("Trader profile not found.");
      return;
    }

    setLoadingId(id);
    const investmentAmount =
      Number(traderToCopy.copyPrice) || Number(traderToCopy.balance) || 100;

    try {
      await addCopiedTrader(traderToCopy, investmentAmount);
      toast.success(`Now copying ${traderToCopy.name}.`);
    } catch (error) {
      toast.error(error?.message || "Failed to copy trader.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <section
      className={`min-h-screen px-4 py-10 sm:px-6 lg:px-8 ${
        theme === "dark" ? "bg-zinc-950 text-white" : "bg-gray-50 text-gray-800"
      }`}
    >
      <div
        className={`mb-6 rounded-[1.8rem] border p-5 shadow-[0_24px_70px_rgba(15,23,42,0.12)] sm:p-6 ${
          theme === "dark"
            ? "border-slate-800 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.88))]"
            : "border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.95))]"
        }`}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p
              className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                theme === "dark"
                  ? "border-teal-400/15 bg-teal-400/10 text-teal-300"
                  : "border-teal-200 bg-teal-50 text-teal-700"
              }`}
            >
              Copy Trader Desk
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-[2.4rem]">
              Filter traders by price, edge, and strategy.
            </h1>
            <p
              className={`mt-3 max-w-2xl text-sm leading-6 ${
                theme === "dark" ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Narrow the marketplace by entry price, win rate, and trading style
              so you can find a trader that fits your balance and risk appetite.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div
              className={`rounded-2xl border px-4 py-3 ${
                theme === "dark"
                  ? "border-white/10 bg-white/[0.03]"
                  : "border-slate-200 bg-white"
              }`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Average Price
              </p>
              <p className="mt-2 text-lg font-semibold">
                $
                {marketplaceSummary.averagePrice.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <div
              className={`rounded-2xl border px-4 py-3 ${
                theme === "dark"
                  ? "border-white/10 bg-white/[0.03]"
                  : "border-slate-200 bg-white"
              }`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Top Win Rate
              </p>
              <p className="mt-2 text-lg font-semibold text-emerald-500">
                {marketplaceSummary.topWinRate}%
              </p>
            </div>
            <div
              className={`rounded-2xl border px-4 py-3 ${
                theme === "dark"
                  ? "border-white/10 bg-white/[0.03]"
                  : "border-slate-200 bg-white"
              }`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Best Profit Share
              </p>
              <p className="mt-2 text-lg font-semibold text-cyan-500">
                {marketplaceSummary.topProfitShare}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`mb-6 rounded-[1.6rem] border p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-5 ${
          theme === "dark"
            ? "border-slate-800 bg-slate-900/90"
            : "border-slate-200 bg-white"
        }`}
      >
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))]">
          <input
            type="text"
            placeholder="Search by trader or strategy..."
            className={`w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 ${
              theme === "dark"
                ? "border-slate-700 bg-slate-950 text-white focus:ring-teal-500/50"
                : "border-slate-300 bg-white text-slate-800 focus:ring-teal-500/40"
            }`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            value={priceFilter}
            onChange={(event) => setPriceFilter(event.target.value)}
            className={`w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 ${
              theme === "dark"
                ? "border-slate-700 bg-slate-950 text-white focus:ring-teal-500/50"
                : "border-slate-300 bg-white text-slate-800 focus:ring-teal-500/40"
            }`}
          >
            {PRICE_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={strategyFilter}
            onChange={(event) => setStrategyFilter(event.target.value)}
            className={`w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 ${
              theme === "dark"
                ? "border-slate-700 bg-slate-950 text-white focus:ring-teal-500/50"
                : "border-slate-300 bg-white text-slate-800 focus:ring-teal-500/40"
            }`}
          >
            {availableStrategies.map((strategy) => (
              <option key={strategy} value={strategy}>
                {strategy === "all" ? "All strategies" : strategy}
              </option>
            ))}
          </select>

          <select
            value={winRateFilter}
            onChange={(event) => setWinRateFilter(event.target.value)}
            className={`w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 ${
              theme === "dark"
                ? "border-slate-700 bg-slate-950 text-white focus:ring-teal-500/50"
                : "border-slate-300 bg-white text-slate-800 focus:ring-teal-500/40"
            }`}
          >
            {WIN_RATE_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className={`w-full rounded-2xl border px-4 py-3 focus:outline-none focus:ring-2 ${
              theme === "dark"
                ? "border-slate-700 bg-slate-950 text-white focus:ring-teal-500/50"
                : "border-slate-300 bg-white text-slate-800 focus:ring-teal-500/40"
            }`}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div
            className={`rounded-2xl border px-4 py-2 text-sm font-semibold ${
              theme === "dark"
                ? "border-slate-700 bg-slate-950 text-slate-200"
                : "border-slate-200 bg-slate-50 text-slate-700"
            }`}
          >
            Showing {filteredTraders.length} of {traders.length} traders
          </div>

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              hasActiveFilters
                ? theme === "dark"
                  ? "bg-white/10 text-white hover:bg-white/15"
                  : "bg-slate-900 text-white hover:bg-slate-800"
                : "cursor-not-allowed bg-slate-300 text-white"
            }`}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {userBalance <= 0 && (
        <div
          className={`mb-6 rounded-xl border p-4 text-sm ${
            theme === "dark"
              ? "border-rose-800 bg-rose-900/30 text-rose-200"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          You need to deposit funds to start copying traders.
        </div>
      )}

      {filteredTraders.length === 0 ? (
        <div
          className={`rounded-[1.8rem] border p-10 text-center ${
            theme === "dark"
              ? "border-slate-800 bg-slate-900/90 text-slate-300"
              : "border-slate-200 bg-white text-slate-600"
          }`}
        >
          <p className="text-lg font-semibold">No traders match these filters.</p>
          <p className="mt-2 text-sm">
            Widen the price range or reset the filters to see more traders.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTraders.map((trader) => (
            <TraderCard
              key={trader.id}
              trader={trader}
              theme={theme}
              onCopy={handleCopy}
              isCopying={loadingId === trader.id}
              isCopied={copiedTraders.some((entry) => entry.id === trader.id)}
              userBalance={userBalance}
            />
          ))}
        </div>
      )}
    </section>
  );
}
