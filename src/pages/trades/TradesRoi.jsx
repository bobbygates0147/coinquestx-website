import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { API_BASE_URL } from "../../config/api";
import { useUser } from "../../context/UserContext";
import { formatCurrencyAmount } from "../../utils/currency";
import PaginationControls from "../../components/ui/PaginationControls";

const STATUS_FILTERS = ["All", "Active", "Win", "Loss", "Completed"];

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeStatus = (status, result) => {
  const rawStatus = `${status || ""}`.trim().toLowerCase();
  const rawResult = `${result || ""}`.trim().toLowerCase();

  if (rawStatus === "active") return "Active";
  if (rawResult === "win" || rawStatus === "win") return "Win";
  if (rawResult === "loss" || rawStatus === "loss") return "Loss";
  if (rawStatus === "completed") return "Completed";
  return "Completed";
};

const normalizePlaceTrade = (trade = {}) => ({
  id: trade.id || trade._id || `pt-${Date.now()}-${Math.random()}`,
  source: "Place Trade",
  type: (trade.direction || trade.type || "buy").toString().toUpperCase(),
  tradeType: trade.tradeType || "Market",
  asset: trade.asset || "N/A",
  amount: toNumber(trade.amount),
  lotSize: trade.lotSize ?? "N/A",
  takeProfit: trade.takeProfit || "N/A",
  stopLoss: trade.stopLoss || "N/A",
  entryPrice: trade.entryPrice || "Market",
  duration: trade.duration || "5 Minutes",
  status: normalizeStatus(trade.status, trade.result),
  date: trade.createdAt || trade.date || trade.startedAt || new Date().toISOString(),
  profitLoss: toNumber(trade.profitLoss),
});

const normalizeTrade = (trade = {}) => ({
  id: trade.id || trade._id || `tr-${Date.now()}-${Math.random()}`,
  source: "Trade",
  type: (trade.direction || "buy").toString().toUpperCase(),
  tradeType: trade.leverage ? `${trade.leverage}x` : "Standard",
  asset: trade.asset || "N/A",
  amount: toNumber(trade.amount),
  lotSize: "N/A",
  takeProfit: "N/A",
  stopLoss: "N/A",
  entryPrice: "Market",
  duration: trade.duration || "N/A",
  status: normalizeStatus(trade.status, trade.result),
  date: trade.createdAt || trade.startedAt || new Date().toISOString(),
  profitLoss: toNumber(trade.profitLoss),
});

export default function TradesRoiPage() {
  const { theme } = useTheme();
  const { isAuthenticated, getAuthToken, userData } = useUser();

  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const currencyCode = userData?.currencyCode || "USD";

  const fetchTrades = useCallback(
    async ({ silent = false } = {}) => {
      if (!isAuthenticated) {
        setTrades([]);
        setError("");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const token = getAuthToken?.();
      if (!token) {
        setTrades([]);
        setError("Authentication required.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError("");

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Cache-Control": "no-cache",
        };

        const [placeTradeResponse, tradeResponse] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/PlaceTrade`, { method: "GET", headers }),
          fetch(`${API_BASE_URL}/Trade`, { method: "GET", headers }),
        ]);

        const parseResponse = async (responseResult, normalize) => {
          if (responseResult.status !== "fulfilled") return [];
          const response = responseResult.value;
          const payload = await response.json().catch(() => null);
          if (!response.ok || !payload?.success) return [];
          return Array.isArray(payload?.data) ? payload.data.map(normalize) : [];
        };

        const placeTrades = await parseResponse(
          placeTradeResponse,
          normalizePlaceTrade
        );
        const regularTrades = await parseResponse(tradeResponse, normalizeTrade);

        const merged = [...placeTrades, ...regularTrades].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setTrades(merged);
      } catch (fetchError) {
        console.error("Failed to fetch trades/ROI data", fetchError);
        setTrades([]);
        setError("Unable to sync trades right now. Please retry.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getAuthToken, isAuthenticated]
  );

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchTrades({ silent: true });
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchTrades]);

  const filteredTrades = useMemo(() => {
    if (activeFilter === "All") return trades;
    return trades.filter((trade) => trade.status === activeFilter);
  }, [activeFilter, trades]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, trades.length, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredTrades.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedTrades = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTrades.slice(start, start + pageSize);
  }, [filteredTrades, currentPage, pageSize]);

  const metrics = useMemo(() => {
    const totalTrades = trades.length;
    const activeTrades = trades.filter((trade) => trade.status === "Active").length;
    const wins = trades.filter((trade) => trade.status === "Win").length;
    const losses = trades.filter((trade) => trade.status === "Loss").length;
    const completed = wins + losses;
    const totalVolume = trades.reduce((sum, trade) => sum + toNumber(trade.amount), 0);
    const netPnl = trades.reduce((sum, trade) => sum + toNumber(trade.profitLoss), 0);
    const roiPercent = totalVolume > 0 ? (netPnl / totalVolume) * 100 : 0;
    const winRate = completed > 0 ? (wins / completed) * 100 : 0;

    return {
      totalTrades,
      activeTrades,
      wins,
      losses,
      totalVolume,
      netPnl,
      roiPercent,
      winRate,
    };
  }, [trades]);

  const cardClass =
    theme === "dark"
      ? "bg-slate-900 border-slate-700 text-white"
      : "bg-white border-slate-200 text-slate-900";

  const mutedClass = theme === "dark" ? "text-slate-300" : "text-slate-600";

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusPill = (status) => {
    if (status === "Win") {
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    }
    if (status === "Loss") {
      return "bg-rose-500/15 text-rose-400 border-rose-500/30";
    }
    if (status === "Active") {
      return "bg-sky-500/15 text-sky-400 border-sky-500/30";
    }
    return "bg-slate-500/15 text-slate-400 border-slate-500/30";
  };

  return (
    <section
      className={`min-h-screen overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8 ${
        theme === "dark" ? "bg-zinc-950" : "bg-gray-50"
      }`}
    >
      <div className="w-full space-y-6">
        <div className={`rounded-2xl border p-5 sm:p-6 ${cardClass}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className={`text-sm font-medium ${mutedClass}`}>
                Trade performance
              </p>
            </div>
            <button
              onClick={() => fetchTrades({ silent: true })}
              disabled={refreshing}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                refreshing
                  ? "cursor-not-allowed bg-slate-500/40 text-slate-300"
                  : "bg-teal-600 text-white hover:bg-teal-500"
              }`}
            >
              {refreshing ? "Refreshing..." : "Refresh Data"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className={`rounded-2xl border p-4 ${cardClass}`}>
            <p className={`text-xs uppercase tracking-wide ${mutedClass}`}>Total Trades</p>
            <p className="mt-2 text-2xl font-bold">{metrics.totalTrades}</p>
            <p className="mt-1 text-xs text-sky-400">{metrics.activeTrades} active</p>
          </div>
          <div className={`rounded-2xl border p-4 ${cardClass}`}>
            <p className={`text-xs uppercase tracking-wide ${mutedClass}`}>Win Rate</p>
            <p className="mt-2 text-2xl font-bold text-emerald-400">
              {metrics.winRate.toFixed(1)}%
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {metrics.wins} wins / {metrics.losses} losses
            </p>
          </div>
          <div className={`rounded-2xl border p-4 ${cardClass}`}>
            <p className={`text-xs uppercase tracking-wide ${mutedClass}`}>Total Volume</p>
            <p className="mt-2 text-2xl font-bold break-words">
              {formatCurrencyAmount(metrics.totalVolume, currencyCode, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
          <div className={`rounded-2xl border p-4 ${cardClass}`}>
            <p className={`text-xs uppercase tracking-wide ${mutedClass}`}>Net ROI</p>
            <p
              className={`mt-2 text-2xl font-bold ${
                metrics.roiPercent >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {metrics.roiPercent >= 0 ? "+" : ""}
              {metrics.roiPercent.toFixed(2)}%
            </p>
            <p
              className={`mt-1 text-xs ${
                metrics.netPnl >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {metrics.netPnl >= 0 ? "+" : ""}
              {formatCurrencyAmount(metrics.netPnl, currencyCode)}
            </p>
          </div>
        </div>

        <div className={`rounded-2xl border p-5 sm:p-6 ${cardClass}`}>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  activeFilter === filter
                    ? "bg-teal-600 text-white"
                    : theme === "dark"
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className={`py-12 text-center text-sm ${mutedClass}`}>Loading trades...</div>
          ) : filteredTrades.length === 0 ? (
            <div className={`py-12 text-center text-sm ${mutedClass}`}>
              No trades found for this filter.
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {paginatedTrades.map((trade) => (
                  <article
                    key={`${trade.source}-${trade.id}`}
                    className={`rounded-xl border p-4 ${
                      theme === "dark"
                        ? "border-slate-700 bg-slate-800/60"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {trade.asset} ({trade.type})
                        </p>
                        <p className={`text-xs ${mutedClass}`}>
                          {trade.source} • {formatDate(trade.date)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusPill(
                          trade.status
                        )}`}
                      >
                        {trade.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className={mutedClass}>Amount</p>
                        <p className="font-semibold">
                          {formatCurrencyAmount(trade.amount, currencyCode)}
                        </p>
                      </div>
                      <div>
                        <p className={mutedClass}>P/L</p>
                        <p
                          className={`font-semibold ${
                            trade.profitLoss > 0
                              ? "text-emerald-400"
                              : trade.profitLoss < 0
                              ? "text-rose-400"
                              : mutedClass
                          }`}
                        >
                          {trade.profitLoss === 0
                            ? "-"
                            : `${trade.profitLoss > 0 ? "+" : ""}${formatCurrencyAmount(
                                trade.profitLoss,
                                currencyCode
                              )}`}
                        </p>
                      </div>
                      <div>
                        <p className={mutedClass}>Duration</p>
                        <p className="font-semibold">{trade.duration}</p>
                      </div>
                      <div>
                        <p className={mutedClass}>Type</p>
                        <p className="font-semibold">{trade.tradeType}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[920px] text-left text-sm">
                  <thead
                    className={`border-b ${
                      theme === "dark"
                        ? "border-slate-700 text-slate-400"
                        : "border-slate-200 text-slate-500"
                    }`}
                  >
                    <tr>
                      <th className="px-3 py-3 font-semibold">Trade</th>
                      <th className="px-3 py-3 font-semibold">Source</th>
                      <th className="px-3 py-3 font-semibold">Amount</th>
                      <th className="px-3 py-3 font-semibold">Duration</th>
                      <th className="px-3 py-3 font-semibold">Status</th>
                      <th className="px-3 py-3 font-semibold">P/L</th>
                      <th className="px-3 py-3 font-semibold">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTrades.map((trade) => (
                      <tr
                        key={`${trade.source}-${trade.id}`}
                        className={`border-b ${
                          theme === "dark"
                            ? "border-slate-800 hover:bg-slate-800/60"
                            : "border-slate-100 hover:bg-slate-50"
                        }`}
                      >
                        <td className="px-3 py-3">
                          <div className="min-w-0">
                            <p className="font-semibold">
                              {trade.asset} ({trade.type})
                            </p>
                            <p className={`text-xs ${mutedClass}`}>{trade.tradeType}</p>
                          </div>
                        </td>
                        <td className="px-3 py-3">{trade.source}</td>
                        <td className="px-3 py-3">
                          {formatCurrencyAmount(trade.amount, currencyCode)}
                        </td>
                        <td className="px-3 py-3">{trade.duration}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusPill(
                              trade.status
                            )}`}
                          >
                            {trade.status}
                          </span>
                        </td>
                        <td
                          className={`px-3 py-3 font-semibold ${
                            trade.profitLoss > 0
                              ? "text-emerald-400"
                              : trade.profitLoss < 0
                              ? "text-rose-400"
                              : mutedClass
                          }`}
                        >
                          {trade.profitLoss === 0
                            ? "-"
                            : `${trade.profitLoss > 0 ? "+" : ""}${formatCurrencyAmount(
                                trade.profitLoss,
                                currencyCode
                              )}`}
                        </td>
                        <td className={`px-3 py-3 ${mutedClass}`}>
                          {formatDate(trade.date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredTrades.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[10, 20, 50]}
                itemLabel="trades"
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
