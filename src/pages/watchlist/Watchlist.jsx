"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useTheme } from "next-themes";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BellRing,
  CheckCircle2,
  Clock3,
  Coins,
  Eye,
  Flame,
  LayoutGrid,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useUser } from "../../context/UserContext";

const MARKET_ASSET_IDS = [
  "bitcoin",
  "ethereum",
  "tether",
  "ripple",
  "binancecoin",
  "solana",
  "usd-coin",
  "cardano",
  "dogecoin",
  "tron",
  "avalanche-2",
  "chainlink",
  "stellar",
  "litecoin",
  "bitcoin-cash",
  "uniswap",
  "filecoin",
  "monero",
  "polygon",
  "near",
  "cosmos",
  "aptos",
  "sui",
  "arbitrum",
];

const DEFAULT_WATCHLIST_IDS = [
  "bitcoin",
  "ethereum",
  "solana",
  "ripple",
  "dogecoin",
];

const WATCHLIST_STORAGE_PREFIX = "coinquestx:watchlist:v2";

const formatCoinId = (value = "") =>
  String(value)
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

const formatCoinSymbol = (value = "") =>
  String(value)
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 5)
    .toUpperCase();

const formatCurrency = (value, options = {}) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "$0.00";

  const maximumFractionDigits =
    options.maximumFractionDigits ??
    (Math.abs(numericValue) >= 1000
      ? 2
      : Math.abs(numericValue) >= 1
      ? 2
      : 4);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits,
  }).format(numericValue);
};

const formatCompactCurrency = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "$0";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(numericValue);
};

const formatPercent = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "0.00%";
  const sign = numericValue > 0 ? "+" : "";
  return `${sign}${numericValue.toFixed(2)}%`;
};

const formatRelativeTime = (value) => {
  const timestamp = new Date(value).getTime();
  if (!timestamp) return "Just now";

  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
};

const getWatchlistStorageKey = (identity = "guest") =>
  `${WATCHLIST_STORAGE_PREFIX}:${identity}`;

const createWatchlistEntry = (id, overrides = {}) => ({
  id,
  name: overrides.name || formatCoinId(id),
  symbol: overrides.symbol || formatCoinSymbol(id),
  image: overrides.image || "",
  direction: overrides.direction === "above" ? "above" : "below",
  targetPrice:
    Number.isFinite(Number(overrides.targetPrice)) &&
    Number(overrides.targetPrice) > 0
      ? Number(overrides.targetPrice)
      : "",
  note: typeof overrides.note === "string" ? overrides.note.slice(0, 180) : "",
  addedAt: overrides.addedAt || new Date().toISOString(),
});

const normalizeWatchlistEntries = (entries = []) => {
  const source = Array.isArray(entries) && entries.length ? entries : DEFAULT_WATCHLIST_IDS;
  const seen = new Set();

  return source
    .map((entry) => {
      if (typeof entry === "string") {
        return createWatchlistEntry(entry);
      }

      if (!entry || typeof entry !== "object" || !entry.id) {
        return null;
      }

      return createWatchlistEntry(String(entry.id), entry);
    })
    .filter((entry) => entry && !seen.has(entry.id) && seen.add(entry.id));
};

const readWatchlistEntries = (storageKey) => {
  if (typeof window === "undefined") {
    return normalizeWatchlistEntries();
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      return normalizeWatchlistEntries();
    }

    const parsed = JSON.parse(stored);
    return normalizeWatchlistEntries(parsed);
  } catch (error) {
    console.warn("Failed to read watchlist state:", error);
    return normalizeWatchlistEntries();
  }
};

const persistWatchlistEntries = (storageKey, entries) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify(normalizeWatchlistEntries(entries))
    );
  } catch (error) {
    console.warn("Failed to persist watchlist state:", error);
  }
};

const buildSparklinePoints = (values = [], width = 180, height = 64) => {
  if (!Array.isArray(values) || values.length < 2) {
    return "";
  }

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const normalized = (value - minValue) / range;
      const y = height - normalized * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");
};

const getAlertState = (entry, asset) => {
  const targetPrice = Number(entry?.targetPrice);
  if (!Number.isFinite(targetPrice) || targetPrice <= 0 || !asset) {
    return {
      triggered: false,
      hasTarget: false,
      label: "No alert target",
      helper: "Add a target price to track this asset automatically.",
      tone: "idle",
    };
  }

  const currentPrice = Number(asset.current_price);
  const direction = entry?.direction === "above" ? "above" : "below";
  const triggered =
    direction === "above"
      ? currentPrice >= targetPrice
      : currentPrice <= targetPrice;
  const differencePercent =
    targetPrice > 0 ? ((currentPrice - targetPrice) / targetPrice) * 100 : 0;

  return {
    triggered,
    hasTarget: true,
    label: triggered
      ? direction === "above"
        ? "Alert triggered above target"
        : "Alert triggered below target"
      : direction === "above"
      ? "Watching for upside breakout"
      : "Watching for downside retest",
    helper: `${formatCurrency(targetPrice)} target � ${formatPercent(
      differencePercent
    )} from trigger`,
    tone: triggered ? "triggered" : "armed",
  };
};

const sortExplorerAssets = (assets = [], sortMode = "market_cap") => {
  const items = [...assets];

  switch (sortMode) {
    case "change":
      return items.sort(
        (left, right) =>
          Number(right.price_change_percentage_24h) -
          Number(left.price_change_percentage_24h)
      );
    case "volume":
      return items.sort(
        (left, right) => Number(right.total_volume) - Number(left.total_volume)
      );
    case "name":
      return items.sort((left, right) => left.name.localeCompare(right.name));
    case "market_cap":
    default:
      return items.sort(
        (left, right) => Number(right.market_cap) - Number(left.market_cap)
      );
  }
};

function Sparkline({ values = [], positive = true, className = "" }) {
  const points = buildSparklinePoints(values);

  if (!points) {
    return (
      <div
        className={`rounded-2xl border border-dashed border-slate-300/70 bg-white/40 ${className}`}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 180 64"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="watchlistSparkFill" x1="0" x2="0" y1="0" y2="1">
          <stop
            offset="0%"
            stopColor={positive ? "rgba(20,184,166,0.42)" : "rgba(244,63,94,0.36)"}
          />
          <stop
            offset="100%"
            stopColor={positive ? "rgba(20,184,166,0.02)" : "rgba(244,63,94,0.02)"}
          />
        </linearGradient>
      </defs>
      <polyline
        points={`0,64 ${points} 180,64`}
        fill="url(#watchlistSparkFill)"
        stroke="none"
      />
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#14b8a6" : "#f43f5e"}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function WatchlistPage() {
  const { theme } = useTheme();
  const { userData } = useUser();

  const isDark = theme === "dark";
  const watchlistIdentity =
    userData?.uid || userData?.userId || userData?.email || "guest";
  const storageKey = useMemo(
    () => getWatchlistStorageKey(watchlistIdentity),
    [watchlistIdentity]
  );

  const [watchlist, setWatchlist] = useState([]);
  const [loadedStorageKey, setLoadedStorageKey] = useState("");
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("all");
  const [sortMode, setSortMode] = useState("market_cap");
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [directionDraft, setDirectionDraft] = useState("below");
  const [targetDraft, setTargetDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  useEffect(() => {
    const storedEntries = readWatchlistEntries(storageKey);
    setWatchlist(storedEntries);
    setLoadedStorageKey(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (loadedStorageKey !== storageKey) return;
    persistWatchlistEntries(storageKey, watchlist);
  }, [loadedStorageKey, storageKey, watchlist]);

  const fetchMarketData = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await axios.get(
        "https://api.coingecko.com/api/v3/coins/markets",
        {
          params: {
            vs_currency: "usd",
            ids: MARKET_ASSET_IDS.join(","),
            order: "market_cap_desc",
            per_page: MARKET_ASSET_IDS.length,
            page: 1,
            sparkline: true,
            price_change_percentage: "24h,7d",
          },
          timeout: 15000,
        }
      );

      const normalized = Array.isArray(response.data)
        ? response.data.map((asset) => ({
            ...asset,
            symbol: String(asset.symbol || "").toUpperCase(),
            sparkline: Array.isArray(asset?.sparkline_in_7d?.price)
              ? asset.sparkline_in_7d.price
              : [],
          }))
        : [];

      setMarketData(normalized);
      setLastSyncedAt(Date.now());
    } catch (requestError) {
      console.error("Failed to fetch watchlist market data:", requestError);
      setError(
        requestError?.message ||
          "Unable to load live market data right now. Try refreshing again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketData();

    const intervalId = window.setInterval(() => {
      fetchMarketData(true);
    }, 90000);

    return () => window.clearInterval(intervalId);
  }, [fetchMarketData]);

  const marketById = useMemo(
    () => new Map(marketData.map((asset) => [asset.id, asset])),
    [marketData]
  );

  const watchlistIds = useMemo(
    () => new Set(watchlist.map((entry) => entry.id)),
    [watchlist]
  );

  const primeAssetDesk = useCallback(
    (assetId, sourceEntries = watchlist) => {
      if (!assetId) return;

      const matchedEntry = sourceEntries.find((entry) => entry.id === assetId);
      const matchedAsset = marketById.get(assetId);
      const nextDirection = matchedEntry?.direction === "above" ? "above" : "below";

      setSelectedAssetId(assetId);
      setDirectionDraft(nextDirection);
      setNoteDraft(matchedEntry?.note || "");

      if (matchedEntry?.targetPrice) {
        setTargetDraft(String(matchedEntry.targetPrice));
        return;
      }

      if (matchedAsset?.current_price) {
        const suggestedTarget =
          nextDirection === "above"
            ? Number(matchedAsset.current_price) * 1.08
            : Number(matchedAsset.current_price) * 0.94;

        setTargetDraft(
          suggestedTarget >= 1
            ? suggestedTarget.toFixed(2)
            : suggestedTarget.toFixed(4)
        );
        return;
      }

      setTargetDraft("");
    },
    [watchlist, marketById]
  );

  useEffect(() => {
    const currentSelectionExists =
      !!selectedAssetId &&
      (watchlistIds.has(selectedAssetId) || marketById.has(selectedAssetId));

    if (currentSelectionExists) return;

    const fallbackId = watchlist[0]?.id || marketData[0]?.id || "";
    if (fallbackId) {
      primeAssetDesk(fallbackId, watchlist);
    }
  }, [selectedAssetId, watchlistIds, marketById, watchlist, marketData, primeAssetDesk]);

  const watchlistAssets = useMemo(
    () =>
      watchlist.map((entry) => {
        const asset = marketById.get(entry.id);
        return {
          ...entry,
          name: asset?.name || entry.name || formatCoinId(entry.id),
          symbol: asset?.symbol || entry.symbol || formatCoinSymbol(entry.id),
          image: asset?.image || entry.image || "",
          asset,
        };
      }),
    [watchlist, marketById]
  );

  const selectedAsset =
    marketById.get(selectedAssetId) ||
    watchlistAssets.find((entry) => entry.id === selectedAssetId)?.asset ||
    null;

  const selectedWatchlistEntry =
    watchlist.find((entry) => entry.id === selectedAssetId) || null;

  const triggeredWatchlistEntries = useMemo(
    () =>
      watchlistAssets.filter((entry) => getAlertState(entry, entry.asset).triggered),
    [watchlistAssets]
  );

  const watchlistAverageChange = useMemo(() => {
    const values = watchlistAssets
      .map((entry) => Number(entry?.asset?.price_change_percentage_24h))
      .filter((value) => Number.isFinite(value));

    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }, [watchlistAssets]);

  const strongestWatchlistAsset = useMemo(() => {
    return watchlistAssets.reduce((best, current) => {
      const currentChange = Number(current?.asset?.price_change_percentage_24h);
      const bestChange = Number(best?.asset?.price_change_percentage_24h);

      if (!Number.isFinite(currentChange)) return best;
      if (!best || !Number.isFinite(bestChange) || currentChange > bestChange) {
        return current;
      }

      return best;
    }, null);
  }, [watchlistAssets]);

  const filteredExplorerAssets = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filtered = marketData.filter((asset) => {
      if (normalizedQuery) {
        const haystack = [
          asset.name,
          asset.symbol,
          asset.id,
          asset.market_cap_rank,
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(normalizedQuery)) {
          return false;
        }
      }

      if (filterMode === "watching" && !watchlistIds.has(asset.id)) {
        return false;
      }

      if (
        filterMode === "gainers" &&
        Number(asset.price_change_percentage_24h) <= 0
      ) {
        return false;
      }

      if (
        filterMode === "losers" &&
        Number(asset.price_change_percentage_24h) >= 0
      ) {
        return false;
      }

      return true;
    });

    return sortExplorerAssets(filtered, sortMode);
  }, [filterMode, marketData, searchQuery, sortMode, watchlistIds]);

  const upAssetCount = watchlistAssets.filter(
    (entry) => Number(entry?.asset?.price_change_percentage_24h) >= 0
  ).length;

  const downAssetCount = Math.max(0, watchlistAssets.length - upAssetCount);

  const addAssetToWatchlist = (asset) => {
    if (!asset?.id) return;

    if (watchlistIds.has(asset.id)) {
      primeAssetDesk(asset.id, watchlist);
      toast.success(`${asset.name} is already on your watchlist.`);
      return;
    }

    const nextEntry = createWatchlistEntry(asset.id, {
      name: asset.name,
      symbol: asset.symbol,
      image: asset.image,
    });

    const nextWatchlist = [nextEntry, ...watchlist];
    setWatchlist(nextWatchlist);
    primeAssetDesk(asset.id, nextWatchlist);
    toast.success(`${asset.name} added to your watchlist.`);
  };

  const removeAssetFromWatchlist = (assetId) => {
    const nextWatchlist = watchlist.filter((entry) => entry.id !== assetId);
    const removedEntry = watchlist.find((entry) => entry.id === assetId);
    setWatchlist(nextWatchlist);

    if (selectedAssetId === assetId) {
      const fallbackId = nextWatchlist[0]?.id || marketData[0]?.id || "";
      if (fallbackId) {
        primeAssetDesk(fallbackId, nextWatchlist);
      } else {
        setSelectedAssetId("");
        setDirectionDraft("below");
        setTargetDraft("");
        setNoteDraft("");
      }
    }

    toast.success(
      `${removedEntry?.name || formatCoinId(assetId)} removed from watchlist.`
    );
  };

  const saveSelectedAssetConfig = () => {
    if (!selectedAssetId) {
      toast.error("Select an asset first.");
      return;
    }

    const parsedTarget = Number(targetDraft);
    const shouldStoreTarget = `${targetDraft}`.trim().length > 0;

    if (shouldStoreTarget && (!Number.isFinite(parsedTarget) || parsedTarget <= 0)) {
      toast.error("Enter a valid target price.");
      return;
    }

    const existingEntry = watchlist.find((entry) => entry.id === selectedAssetId);
    const nextEntry = createWatchlistEntry(selectedAssetId, {
      ...existingEntry,
      name: selectedAsset?.name || existingEntry?.name,
      symbol: selectedAsset?.symbol || existingEntry?.symbol,
      image: selectedAsset?.image || existingEntry?.image,
      direction: directionDraft,
      targetPrice: shouldStoreTarget ? parsedTarget : "",
      note: noteDraft.trim(),
    });

    const nextWatchlist = existingEntry
      ? watchlist.map((entry) =>
          entry.id === selectedAssetId ? nextEntry : entry
        )
      : [nextEntry, ...watchlist];

    setWatchlist(nextWatchlist);
    primeAssetDesk(selectedAssetId, nextWatchlist);
    toast.success(
      existingEntry
        ? "Watch settings updated."
        : `${selectedAsset?.name || formatCoinId(selectedAssetId)} added with alert settings.`
    );
  };

  const resetDefaults = () => {
    const nextWatchlist = normalizeWatchlistEntries();
    setWatchlist(nextWatchlist);
    primeAssetDesk(nextWatchlist[0]?.id, nextWatchlist);
    toast.success("Watchlist reset to default market picks.");
  };

  const page = isDark
    ? "bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.18),transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_46%,#020617_100%)] text-slate-100"
    : "bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.16),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#effaf8_44%,#f8fafc_100%)] text-slate-900";
  const shell = isDark
    ? "border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.88))]"
    : "border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.9))]";
  const panel = isDark
    ? "border-white/10 bg-white/[0.04]"
    : "border-slate-200/80 bg-white/90";
  const panelStrong = isDark
    ? "border-white/10 bg-slate-950/70"
    : "border-slate-200 bg-white";
  const accent = isDark
    ? "border-cyan-400/18 bg-cyan-400/10 text-cyan-300"
    : "border-cyan-200 bg-cyan-50 text-cyan-700";
  const label = isDark ? "text-slate-400" : "text-slate-600";
  const quiet = isDark ? "text-slate-500" : "text-slate-500";
  const searchInput = isDark
    ? "border-white/10 bg-slate-950/70 text-slate-100 placeholder:text-slate-500"
    : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400";

  const overviewCards = [
    {
      label: "Tracked Assets",
      value: watchlistAssets.length,
      helper:
        watchlistAssets.length > 0
          ? `${upAssetCount} rising � ${downAssetCount} soft`
          : "No saved assets yet",
      icon: LayoutGrid,
      tone: "neutral",
    },
    {
      label: "Triggered Alerts",
      value: triggeredWatchlistEntries.length,
      helper:
        triggeredWatchlistEntries.length > 0
          ? `${triggeredWatchlistEntries[0]?.symbol || "Asset"} needs review`
          : "All alert rules are calm",
      icon: BellRing,
      tone: triggeredWatchlistEntries.length > 0 ? "warn" : "positive",
    },
    {
      label: "24h Average",
      value: formatPercent(watchlistAverageChange),
      helper:
        watchlistAverageChange >= 0
          ? "Watchlist momentum is net positive"
          : "Watchlist momentum is under pressure",
      icon: watchlistAverageChange >= 0 ? TrendingUp : TrendingDown,
      tone: watchlistAverageChange >= 0 ? "positive" : "negative",
    },
    {
      label: "Best Performer",
      value: strongestWatchlistAsset?.symbol || "None",
      helper: strongestWatchlistAsset?.asset
        ? formatPercent(strongestWatchlistAsset.asset.price_change_percentage_24h)
        : "Waiting for market data",
      icon: Flame,
      tone: "highlight",
    },
  ];

  const heroSection = (
    <div className={`rounded-[1.8rem] border p-5 sm:p-6 ${panel}`}>
      <p
        className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${accent}`}
      >
        Market Watch Desk
      </p>
      <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-[2.7rem]">
        Build a sharper watchlist with live pricing and alert-ready tracking.
      </h1>
      <p className={`mt-3 max-w-3xl text-sm leading-6 ${label}`}>
        Save the assets you care about, sort the live market board, set price
        targets, and move straight into trading or funding when the setup looks
        right.
      </p>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row">
        <label
          className={`flex h-14 flex-1 items-center gap-3 rounded-[1.2rem] border px-4 transition ${searchInput}`}
        >
          <Search
            className={isDark ? "h-4.5 w-4.5 text-cyan-300" : "h-4.5 w-4.5 text-cyan-600"}
            strokeWidth={2.2}
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search bitcoin, solana, XRP, market cap rank..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => fetchMarketData(true)}
            className={`inline-flex h-14 items-center gap-2 rounded-[1.2rem] border px-4 text-sm font-semibold transition ${
              isDark
                ? "border-white/10 bg-slate-950/70 text-slate-100 hover:bg-slate-900"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <RefreshCw
              className={`h-4.5 w-4.5 ${refreshing ? "animate-spin" : ""}`}
              strokeWidth={2.2}
            />
            Refresh Feed
          </button>
          <button
            type="button"
            onClick={resetDefaults}
            className="inline-flex h-14 items-center gap-2 rounded-[1.2rem] bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 px-4 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(20,184,166,0.22)]"
          >
            <Star className="h-4.5 w-4.5 fill-current" strokeWidth={2.1} />
            Reset Defaults
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${accent}`}>
          <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
          {strongestWatchlistAsset?.name || "Market pulse loading"}
        </div>
        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${
          isDark
            ? "border-white/10 bg-slate-950/70 text-slate-300"
            : "border-slate-200 bg-white text-slate-600"
        }`}>
          <Clock3 className="h-3.5 w-3.5" strokeWidth={2.1} />
          {lastSyncedAt ? `Synced ${formatRelativeTime(lastSyncedAt)}` : "Syncing feed"}
        </div>
      </div>
    </div>
  );

  const overviewSection = (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {overviewCards.map((item) => {
        const Icon = item.icon;
        const toneClass =
          item.tone === "positive"
            ? isDark
              ? "border-emerald-400/18 bg-emerald-500/10 text-emerald-200"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
            : item.tone === "negative"
            ? isDark
              ? "border-rose-400/18 bg-rose-500/10 text-rose-200"
              : "border-rose-200 bg-rose-50 text-rose-700"
            : item.tone === "warn"
            ? isDark
              ? "border-amber-400/18 bg-amber-500/10 text-amber-200"
              : "border-amber-200 bg-amber-50 text-amber-700"
            : item.tone === "highlight"
            ? isDark
              ? "border-fuchsia-400/18 bg-fuchsia-500/10 text-fuchsia-200"
              : "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700"
            : isDark
            ? "border-cyan-400/18 bg-cyan-500/10 text-cyan-200"
            : "border-cyan-200 bg-cyan-50 text-cyan-700";

        return (
          <div key={item.label} className={`rounded-[1.45rem] border p-4 ${panel}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${quiet}`}>
                  {item.label}
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight">
                  {item.value}
                </p>
                <p className={`mt-2 text-sm leading-6 ${label}`}>{item.helper}</p>
              </div>
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${toneClass}`}>
                <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );

  const watchlistSection = (
    <div className={`rounded-[1.8rem] border p-5 sm:p-6 ${panel}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${quiet}`}>
            Saved Watchlist
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Track your chosen assets from one board.
          </h2>
        </div>
        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] ${accent}`}>
          <Eye className="h-3.5 w-3.5" strokeWidth={2.2} />
          {watchlistAssets.length} saved
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className={`h-[230px] animate-pulse rounded-[1.5rem] border ${panelStrong}`}
              />
            ))}
          </div>
        ) : watchlistAssets.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {watchlistAssets.map((entry) => {
              const asset = entry.asset;
              const priceChange = Number(asset?.price_change_percentage_24h);
              const alertState = getAlertState(entry, asset);
              const isPositive = priceChange >= 0;
              const isSelected = selectedAssetId === entry.id;

              return (
                <div
                  key={entry.id}
                  className={`rounded-[1.5rem] border p-4 transition ${
                    isSelected
                      ? isDark
                        ? "border-cyan-400/30 bg-cyan-400/10 shadow-[0_20px_40px_rgba(8,145,178,0.16)]"
                        : "border-cyan-300 bg-cyan-50/80 shadow-[0_20px_40px_rgba(45,212,191,0.12)]"
                      : panelStrong
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => primeAssetDesk(entry.id, watchlist)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      {entry.image ? (
                        <img
                          src={entry.image}
                          alt={entry.name}
                          className="h-12 w-12 shrink-0 rounded-2xl"
                        />
                      ) : (
                        <span
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                            isDark
                              ? "border-white/10 bg-slate-900 text-slate-200"
                              : "border-slate-200 bg-slate-50 text-slate-700"
                          }`}
                        >
                          {entry.symbol?.slice(0, 1) || "C"}
                        </span>
                      )}
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <p className="truncate text-lg font-semibold">{entry.name}</p>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                            isDark
                              ? "bg-slate-900 text-slate-400"
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            {entry.symbol}
                          </span>
                        </div>
                        <p className={`mt-1 text-xs ${quiet}`}>
                          Added {formatRelativeTime(entry.addedAt)}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => removeAssetFromWatchlist(entry.id)}
                      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition ${
                        isDark
                          ? "border-white/10 bg-slate-900/80 text-slate-400 hover:border-rose-400/30 hover:text-rose-200"
                          : "border-slate-200 bg-white text-slate-500 hover:border-rose-300 hover:text-rose-600"
                      }`}
                      aria-label={`Remove ${entry.name}`}
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2.1} />
                    </button>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_140px]">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-end gap-3">
                        <p className="text-3xl font-semibold tracking-tight">
                          {asset ? formatCurrency(asset.current_price) : "Market unavailable"}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            isPositive
                              ? isDark
                                ? "bg-emerald-500/10 text-emerald-200"
                                : "bg-emerald-50 text-emerald-700"
                              : isDark
                              ? "bg-rose-500/10 text-rose-200"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {isPositive ? (
                            <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.2} />
                          ) : (
                            <TrendingDown className="h-3.5 w-3.5" strokeWidth={2.2} />
                          )}
                          {asset ? formatPercent(priceChange) : "Awaiting feed"}
                        </span>
                      </div>

                      <p className={`mt-3 text-sm ${label}`}>{alertState.label}</p>
                      <p className={`mt-1 text-sm ${label}`}>{alertState.helper}</p>
                      {entry.note ? (
                        <p className={`mt-2 line-clamp-2 text-sm ${label}`}>
                          {entry.note}
                        </p>
                      ) : null}
                    </div>

                    <Sparkline
                      values={asset?.sparkline || []}
                      positive={isPositive}
                      className={`h-28 w-full rounded-[1.2rem] border ${
                        isDark
                          ? "border-white/10 bg-slate-950/80"
                          : "border-slate-200 bg-white"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`rounded-[1.5rem] border p-10 text-center ${panelStrong}`}>
            <Star
              className={`mx-auto h-10 w-10 ${
                isDark ? "text-slate-500" : "text-slate-400"
              }`}
              strokeWidth={1.9}
            />
            <p className="mt-4 text-lg font-semibold">Your watchlist is empty</p>
            <p className={`mt-2 text-sm leading-6 ${label}`}>
              Use the market explorer below to add assets and build
              alert-ready setups.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const explorerSection = (
    <div className={`rounded-[1.8rem] border p-5 sm:p-6 ${panel}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${quiet}`}>
            Market Explorer
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Add fresh assets and sort the board your way.
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { value: "all", label: "All" },
            { value: "watching", label: "Watching" },
            { value: "gainers", label: "Gainers" },
            { value: "losers", label: "Losers" },
          ].map((chip) => (
            <button
              key={chip.value}
              type="button"
              onClick={() => setFilterMode(chip.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                filterMode === chip.value
                  ? accent
                  : isDark
                  ? "border-white/10 bg-slate-950/70 text-slate-300 hover:border-cyan-400/20"
                  : "border-slate-200 bg-white text-slate-600 hover:border-cyan-300"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[
          { value: "market_cap", label: "Market Cap" },
          { value: "change", label: "24H Change" },
          { value: "volume", label: "Volume" },
          { value: "name", label: "Name" },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setSortMode(option.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              sortMode === option.value
                ? accent
                : isDark
                ? "border-white/10 bg-slate-950/70 text-slate-300"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              {option.value === "market_cap" ? (
                <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={2.2} />
              ) : null}
              {option.label}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className={`h-24 animate-pulse rounded-[1.3rem] border ${panelStrong}`}
            />
          ))
        ) : filteredExplorerAssets.length > 0 ? (
          filteredExplorerAssets.slice(0, 12).map((asset) => {
            const isWatching = watchlistIds.has(asset.id);
            const isPositive = Number(asset.price_change_percentage_24h) >= 0;

            return (
              <div
                key={asset.id}
                className={`rounded-[1.35rem] border p-4 ${panelStrong}`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <button
                    type="button"
                    onClick={() => primeAssetDesk(asset.id, watchlist)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <img
                      src={asset.image}
                      alt={asset.name}
                      className="h-12 w-12 shrink-0 rounded-2xl"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <p className="truncate text-base font-semibold">{asset.name}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                          isDark
                            ? "bg-slate-900 text-slate-400"
                            : "bg-slate-100 text-slate-500"
                        }`}>
                          {asset.symbol}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          isPositive
                            ? isDark
                              ? "bg-emerald-500/10 text-emerald-200"
                              : "bg-emerald-50 text-emerald-700"
                            : isDark
                            ? "bg-rose-500/10 text-rose-200"
                            : "bg-rose-50 text-rose-700"
                        }`}>
                          {formatPercent(asset.price_change_percentage_24h)}
                        </span>
                      </div>
                      <div className={`mt-2 flex flex-wrap items-center gap-4 text-sm ${label}`}>
                        <span>{formatCurrency(asset.current_price)}</span>
                        <span>Cap {formatCompactCurrency(asset.market_cap)}</span>
                        <span>Vol {formatCompactCurrency(asset.total_volume)}</span>
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        isWatching
                          ? removeAssetFromWatchlist(asset.id)
                          : addAssetToWatchlist(asset)
                      }
                      className={`inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
                        isWatching
                          ? isDark
                            ? "bg-slate-900 text-slate-100 hover:bg-slate-800"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          : "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-[0_16px_36px_rgba(20,184,166,0.2)]"
                      }`}
                    >
                      {isWatching ? (
                        <Star className="h-4 w-4 fill-current" strokeWidth={2.1} />
                      ) : (
                        <Plus className="h-4 w-4" strokeWidth={2.1} />
                      )}
                      {isWatching ? "Watching" : "Add"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className={`rounded-[1.5rem] border p-10 text-center ${panelStrong}`}>
            <Search
              className={`mx-auto h-10 w-10 ${
                isDark ? "text-slate-500" : "text-slate-400"
              }`}
              strokeWidth={1.9}
            />
            <p className="mt-4 text-lg font-semibold">No assets match this filter</p>
            <p className={`mt-2 text-sm leading-6 ${label}`}>
              Try a broader search term or switch back to all market assets to
              expand the board again.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const assetFocusSection = (
    <div className={`rounded-[1.8rem] border p-5 sm:p-6 ${panel}`}>
      <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${quiet}`}>
        Asset Focus
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">
        {selectedAsset?.name || selectedWatchlistEntry?.name || "Select an asset"}
      </h2>
      <p className={`mt-2 text-sm leading-6 ${label}`}>
        Review live levels, alert readiness, and direct paths into the rest of
        your trading workspace.
      </p>

      {selectedAsset ? (
        <>
          <div className="mt-5 flex items-center gap-3">
            <img
              src={selectedAsset.image}
              alt={selectedAsset.name}
              className="h-14 w-14 rounded-2xl"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  isDark
                    ? "bg-slate-950 text-slate-300"
                    : "bg-slate-100 text-slate-600"
                }`}>
                  {selectedAsset.symbol}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  Number(selectedAsset.price_change_percentage_24h) >= 0
                    ? isDark
                      ? "bg-emerald-500/10 text-emerald-200"
                      : "bg-emerald-50 text-emerald-700"
                    : isDark
                    ? "bg-rose-500/10 text-rose-200"
                    : "bg-rose-50 text-rose-700"
                }`}>
                  {formatPercent(selectedAsset.price_change_percentage_24h)}
                </span>
              </div>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {formatCurrency(selectedAsset.current_price)}
              </p>
              <p className={`mt-1 text-sm ${label}`}>
                Rank #{selectedAsset.market_cap_rank || "--"} � Cap{" "}
                {formatCompactCurrency(selectedAsset.market_cap)}
              </p>
            </div>
          </div>

          <Sparkline
            values={selectedAsset.sparkline}
            positive={Number(selectedAsset.price_change_percentage_24h) >= 0}
            className={`mt-5 h-36 w-full rounded-[1.4rem] border ${
              isDark
                ? "border-white/10 bg-slate-950/70"
                : "border-slate-200 bg-white"
            }`}
          />

          <div className="mt-5 grid gap-3">
            <Link
              to="/PlaceTrade"
              className="inline-flex items-center justify-between rounded-[1.15rem] border border-cyan-400/18 bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(20,184,166,0.22)]"
            >
              Open trading desk
              <ArrowUpRight className="h-4 w-4" strokeWidth={2.1} />
            </Link>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/Assets"
                className={`inline-flex items-center justify-between rounded-[1.15rem] border px-4 py-3 text-sm font-semibold ${
                  isDark
                    ? "border-white/10 bg-slate-950/70 text-slate-100"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                Market board
                <ArrowUpRight className="h-4 w-4" strokeWidth={2.1} />
              </Link>
              <Link
                to="/BuyCrypto"
                className={`inline-flex items-center justify-between rounded-[1.15rem] border px-4 py-3 text-sm font-semibold ${
                  isDark
                    ? "border-white/10 bg-slate-950/70 text-slate-100"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                Buy crypto
                <ArrowUpRight className="h-4 w-4" strokeWidth={2.1} />
              </Link>
            </div>
          </div>
        </>
      ) : (
        <div className={`mt-5 rounded-[1.4rem] border p-8 text-center ${panelStrong}`}>
          <Coins
            className={`mx-auto h-10 w-10 ${
              isDark ? "text-slate-500" : "text-slate-400"
            }`}
            strokeWidth={1.9}
          />
          <p className="mt-4 text-lg font-semibold">No asset selected</p>
          <p className={`mt-2 text-sm leading-6 ${label}`}>
            Choose a saved asset or use the explorer to open a live asset
            profile here.
          </p>
        </div>
      )}
    </div>
  );

  const alertSection = (
    <div className={`rounded-[1.8rem] border p-5 sm:p-6 ${panel}`}>
      <div className="flex items-start gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
            isDark
              ? "border-cyan-400/18 bg-cyan-400/10 text-cyan-300"
              : "border-cyan-200 bg-cyan-50 text-cyan-700"
          }`}
        >
          <Target className="h-5 w-5" strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${quiet}`}>
            Alert Configuration
          </p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight">
            Save a target and note for this asset.
          </h3>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {[
          { value: "below", label: "Below target" },
          { value: "above", label: "Above target" },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setDirectionDraft(option.value)}
            className={`rounded-[1.15rem] border px-4 py-3 text-sm font-semibold transition ${
              directionDraft === option.value
                ? accent
                : isDark
                ? "border-white/10 bg-slate-950/70 text-slate-300"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <label className={`block text-sm font-semibold ${label}`}>Target price</label>
        <div className="relative mt-2">
          <span className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm ${quiet}`}>
            $
          </span>
          <input
            type="number"
            min="0"
            step="0.0001"
            value={targetDraft}
            onChange={(event) => setTargetDraft(event.target.value)}
            placeholder="Enter target price"
            className={`w-full rounded-[1.15rem] border px-4 py-3 pl-8 text-sm outline-none transition ${
              isDark
                ? "border-white/10 bg-slate-950/70 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/25"
                : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-300"
            }`}
          />
        </div>
      </div>

      <div className="mt-4">
        <label className={`block text-sm font-semibold ${label}`}>Watch note</label>
        <textarea
          value={noteDraft}
          onChange={(event) => setNoteDraft(event.target.value.slice(0, 180))}
          rows={4}
          placeholder="Watching for a clean reclaim before adding more exposure."
          className={`mt-2 w-full rounded-[1.15rem] border px-4 py-3 text-sm outline-none transition ${
            isDark
              ? "border-white/10 bg-slate-950/70 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/25"
              : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-300"
          }`}
        />
      </div>

      <button
        type="button"
        onClick={saveSelectedAssetConfig}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[1.2rem] bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(20,184,166,0.24)]"
      >
        <BellRing className="h-4.5 w-4.5" strokeWidth={2.2} />
        {watchlistIds.has(selectedAssetId) ? "Update watch settings" : "Save to watchlist"}
      </button>

      <div className="mt-5 space-y-3">
        {triggeredWatchlistEntries.length > 0 ? (
          triggeredWatchlistEntries.slice(0, 4).map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => primeAssetDesk(entry.id, watchlist)}
              className={`flex w-full items-center gap-3 rounded-[1.2rem] border px-4 py-3 text-left ${panelStrong}`}
            >
              {entry.image ? (
                <img
                  src={entry.image}
                  alt={entry.name}
                  className="h-11 w-11 rounded-2xl"
                />
              ) : (
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${
                    isDark
                      ? "border-white/10 bg-slate-900 text-slate-200"
                      : "border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                >
                  {entry.symbol?.slice(0, 1) || "C"}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{entry.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                    isDark
                      ? "bg-slate-900 text-slate-400"
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    {entry.symbol}
                  </span>
                </span>
                <span className={`mt-1 block text-xs ${label}`}>
                  {getAlertState(entry, entry.asset).helper}
                </span>
              </span>
              <ArrowUpRight
                className={isDark ? "h-4 w-4 text-slate-500" : "h-4 w-4 text-slate-400"}
                strokeWidth={2.1}
              />
            </button>
          ))
        ) : (
          <div className={`rounded-[1.3rem] border p-5 text-center ${panelStrong}`}>
            <p className="text-sm font-semibold">No alerts are firing right now</p>
            <p className={`mt-2 text-sm leading-6 ${label}`}>
              Set more target prices to turn this panel into a live alert queue
              for your best trade ideas.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <section className={`relative min-h-screen overflow-x-hidden ${page}`}>
      <div className="pointer-events-none absolute left-[-7rem] top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-6rem] bottom-12 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div
          className={`overflow-hidden rounded-[2.2rem] border p-5 shadow-[0_26px_80px_rgba(15,23,42,0.16)] sm:p-6 ${shell}`}
        >
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_380px]">
            <div className="min-w-0 space-y-6">
              {heroSection}

              {error ? (
                <div
                  className={`rounded-[1.45rem] border px-4 py-3 ${
                    isDark
                      ? "border-rose-500/25 bg-rose-500/10 text-rose-100"
                      : "border-rose-200 bg-rose-50 text-rose-700"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <TriangleAlert className="mt-0.5 h-4.5 w-4.5 shrink-0" strokeWidth={2.2} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">Live market feed is delayed</p>
                      <p className="mt-1 text-sm opacity-90">{error}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              {overviewSection}
              {watchlistSection}
              {explorerSection}
            </div>

            <aside className="min-w-0 space-y-5">
              {assetFocusSection}
              {alertSection}
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}

