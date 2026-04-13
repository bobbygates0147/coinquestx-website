"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "react-toastify";
import { useUser } from "../../context/UserContext";
import { useNotifications } from "../../context/NotificationContext";
import { useTransactions } from "../../context/TransactionContext";
import { API_BASE_URL } from "../../config/api";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "../../components/ui/modal";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  Coins,
  LockKeyhole,
  Percent,
  RefreshCw,
  Wallet,
} from "lucide-react";

import cp1 from "../../pictures/cp1.avif";
import cp2 from "../../pictures/cp2.avif";
import cp3 from "../../pictures/cp3.avif";
import cp4 from "../../pictures/cp4.avif";
import cp5 from "../../pictures/cp5.avif";
import cp6 from "../../pictures/cp6.avif";
import cp7 from "../../pictures/cp7.avif";
import cp8 from "../../pictures/cp8.avif";
import cp9 from "../../pictures/cp9.avif";

const STAKING_STORAGE_KEY_PREFIX = "stakingPositionsV3";
const PRICE_REFRESH_MS = 30 * 1000;
const HEARTBEAT_MS = 1000;
const SETTLE_RETRY_MS = 15 * 1000;

const STAKE_ASSETS = [
  { name: "Bitcoin", symbol: "BTC", coingeckoId: "bitcoin", img: cp1, min: 0.001, max: 10, apy: 5.2, color: "bg-orange-500", basePrice: 68250, priceDrift: 0.012, pricePrecision: 2 },
  { name: "Ethereum", symbol: "ETH", coingeckoId: "ethereum", img: cp2, min: 0.01, max: 100, apy: 6.8, color: "bg-purple-500", basePrice: 3275, priceDrift: 0.014, pricePrecision: 2 },
  { name: "Cardano", symbol: "ADA", coingeckoId: "cardano", img: cp3, min: 10, max: 50000, apy: 4.5, color: "bg-blue-600", basePrice: 0.72, priceDrift: 0.02, pricePrecision: 4 },
  { name: "Solana", symbol: "SOL", coingeckoId: "solana", img: cp4, min: 0.1, max: 500, apy: 7.2, color: "bg-indigo-500", basePrice: 162.8, priceDrift: 0.017, pricePrecision: 2 },
  { name: "Polkadot", symbol: "DOT", coingeckoId: "polkadot", img: cp5, min: 1, max: 5000, apy: 8.1, color: "bg-pink-500", basePrice: 8.45, priceDrift: 0.019, pricePrecision: 3 },
  { name: "Avalanche", symbol: "AVAX", coingeckoId: "avalanche-2", img: cp6, min: 0.1, max: 5000, apy: 6.5, color: "bg-red-500", basePrice: 39.65, priceDrift: 0.018, pricePrecision: 2 },
  { name: "Chainlink", symbol: "LINK", coingeckoId: "chainlink", img: cp7, min: 1, max: 10000, apy: 5.9, color: "bg-sky-500", basePrice: 17.9, priceDrift: 0.018, pricePrecision: 2 },
  { name: "Litecoin", symbol: "LTC", coingeckoId: "litecoin", img: cp8, min: 0.1, max: 1000, apy: 4.8, color: "bg-gray-500", basePrice: 84.2, priceDrift: 0.015, pricePrecision: 2 },
  { name: "Ripple", symbol: "XRP", coingeckoId: "ripple", img: cp9, min: 10, max: 100000, apy: 3.7, color: "bg-black", basePrice: 0.63, priceDrift: 0.021, pricePrecision: 4 },
];

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toNumber(value));

const formatToken = (value, symbol) => `${toNumber(value).toFixed(6)} ${symbol}`;

const getStakeStorageKey = (userData = {}) => {
  const userIdentity =
    userData?.userId ||
    userData?.id ||
    userData?._id ||
    userData?.uid ||
    userData?.email ||
    "guest";

  return `${STAKING_STORAGE_KEY_PREFIX}:${`${userIdentity}`.trim().toLowerCase()}`;
};

const buildInternalPriceSnapshot = (timestamp = Date.now()) =>
  STAKE_ASSETS.reduce((prices, asset, index) => {
    const primaryWave = Math.sin(timestamp / 3600000 + index * 0.93);
    const secondaryWave = Math.cos(timestamp / 5400000 + index * 1.41);
    const driftMultiplier =
      1 +
      primaryWave * asset.priceDrift +
      secondaryWave * asset.priceDrift * 0.45;
    const nextPrice = Math.max(asset.basePrice * 0.42, asset.basePrice * driftMultiplier);
    prices[asset.symbol] = Number(nextPrice.toFixed(asset.pricePrecision));
    return prices;
  }, {});

const useLocalStorage = (key, defaultValue) => {
  const readStoredValue = useCallback(() => {
    if (!key) return defaultValue;
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  }, [defaultValue, key]);

  const [storedValue, setStoredValue] = useState(() => readStoredValue());

  useEffect(() => {
    setStoredValue(readStoredValue());
  }, [readStoredValue]);

  const setValue = useCallback((valueOrUpdater) => {
    setStoredValue((previous) => {
      const next =
        typeof valueOrUpdater === "function"
          ? valueOrUpdater(previous)
          : valueOrUpdater;
      try {
        if (key) {
          localStorage.setItem(key, JSON.stringify(next));
        }
      } catch {
        // ignore
      }
      return next;
    });
  }, [key]);

  return [storedValue, setValue];
};

const normalizePosition = (raw, assetMap) => {
  const asset = assetMap.get(raw?.asset) || null;
  const durationDays = Math.max(1, Math.floor(toNumber(raw?.durationDays, toNumber(raw?.duration, 30))));
  const startAt = toNumber(raw?.startAt, Date.parse(raw?.startDate || Date.now()));
  const endAt = toNumber(raw?.endAt, Date.parse(raw?.endDate || startAt + durationDays * 86400000));
  const principalUsd = Math.max(0, toNumber(raw?.principalUsd, toNumber(raw?.amountUSD, 0)));
  const apy = toNumber(raw?.apy, toNumber(asset?.apy, 0));
  const rewardUsdTotal = Math.max(
    0,
    toNumber(raw?.rewardUsdTotal, (principalUsd * apy * durationDays) / 36500)
  );

  return {
    id: raw?.id || `stake-${Date.now()}`,
    ref: raw?.ref || `REF-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    asset: raw?.asset || asset?.symbol || "BTC",
    coingeckoId: raw?.coingeckoId || asset?.coingeckoId || "bitcoin",
    amountToken: Math.max(0, toNumber(raw?.amountToken, toNumber(raw?.amount, 0))),
    principalUsd,
    apy,
    durationDays,
    startAt,
    endAt,
    rewardUsdTotal,
    status: `${raw?.status || "active"}`.toLowerCase(),
    settledAt: raw?.settledAt || null,
    payoutUsd: Math.max(0, toNumber(raw?.payoutUsd, 0)),
    retryAt: Math.max(0, toNumber(raw?.retryAt, 0)),
    lastError: raw?.lastError || "",
  };
};

export default function StakePage() {
  const { theme } = useTheme();
  const { userData, getAuthToken, isAuthenticated, refreshUser } = useUser();
  const { addNotification } = useNotifications();
  const { refreshTransactions } = useTransactions();
  const stakeStorageKey = getStakeStorageKey(userData);

  const [stakingPositions, setStakingPositions] = useLocalStorage(stakeStorageKey, []);
  const [isProcessingStake, setIsProcessingStake] = useState(false);
  const [activeTab, setActiveTab] = useState("pools");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [duration, setDuration] = useState(30);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [livePrices, setLivePrices] = useState(() => buildInternalPriceSnapshot());
  const [priceSyncAt, setPriceSyncAt] = useState(0);
  const [nowTick, setNowTick] = useState(Date.now());
  const [prefersDarkMode, setPrefersDarkMode] = useState(false);

  const settlingPositionsRef = useRef(new Set());
  const normalizedStorageKeyRef = useRef("");
  const assetMap = useMemo(
    () => new Map(STAKE_ASSETS.map((asset) => [asset.symbol, asset])),
    []
  );

  useEffect(() => {
    if (normalizedStorageKeyRef.current === stakeStorageKey) return;
    normalizedStorageKeyRef.current = stakeStorageKey;
    setStakingPositions((prev) =>
      Array.isArray(prev) ? prev.map((item) => normalizePosition(item, assetMap)) : []
    );
  }, [assetMap, setStakingPositions, stakeStorageKey]);

  const parseJsonSafely = async (response) => {
    const text = await response.text();
    try {
      return { json: JSON.parse(text), text };
    } catch {
      return { json: null, text };
    }
  };

  const getCleanToken = useCallback(() => {
    const token = getAuthToken?.();
    if (!token) return null;
    return token.replace(/^["']|["']$/g, "").trim();
  }, [getAuthToken]);

  const mapBackendStakeToPosition = useCallback(
    (row) => {
      const startedAt = row?.startedAt ? Date.parse(row.startedAt) : Date.now();
      const durationDays = Math.max(1, Math.floor(toNumber(row?.durationDays, 30)));
      const endAt = row?.endsAt
        ? Date.parse(row.endsAt)
        : startedAt + durationDays * 86400000;

      return normalizePosition(
        {
          id: String(row?._id || row?.id || `stake-${startedAt}`),
          ref: row?.reference || row?.ref,
          asset: row?.asset,
          coingeckoId: row?.coingeckoId,
          amountToken: toNumber(row?.amount),
          principalUsd: toNumber(row?.principalUsd),
          apy: toNumber(row?.apy),
          durationDays,
          startAt: startedAt,
          endAt,
          rewardUsdTotal: toNumber(row?.rewardUsdTotal),
          status: `${row?.status || "Active"}`.toLowerCase(),
          settledAt: row?.settledAt || null,
          payoutUsd: toNumber(row?.payoutUsd),
        },
        assetMap
      );
    },
    [assetMap]
  );

  const syncStakesFromBackend = useCallback(async () => {
    const token = getCleanToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/Stake`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const { json: result } = await parseJsonSafely(response);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Stake sync failed");
      }

      const rows = Array.isArray(result?.data) ? result.data : [];
      setStakingPositions(rows.map(mapBackendStakeToPosition));
    } catch (error) {
      console.error("Failed to sync stakes:", error);
    }
  }, [getCleanToken, mapBackendStakeToPosition, setStakingPositions]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event) => setPrefersDarkMode(event.matches);
    setPrefersDarkMode(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    syncStakesFromBackend();
  }, [isAuthenticated, syncStakesFromBackend, userData?.userId, userData?.uid]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const handleFocusSync = () => syncStakesFromBackend();
    window.addEventListener("focus", handleFocusSync);
    return () => window.removeEventListener("focus", handleFocusSync);
  }, [isAuthenticated, syncStakesFromBackend]);

  useEffect(() => {
    const refreshInternalPrices = () => {
      setLivePrices(buildInternalPriceSnapshot(Date.now()));
      setPriceSyncAt(Date.now());
    };

    refreshInternalPrices();
    const interval = setInterval(refreshInternalPrices, PRICE_REFRESH_MS);
    return () => clearInterval(interval);
  }, []);

  const computePositionLive = useCallback(
    (position) => {
      const durationMs = Math.max(1, position.durationDays * 86400000);
      const elapsed = Math.max(0, nowTick - position.startAt);
      const progress = Math.min(1, elapsed / durationMs);
      const accruedRewardUsd =
        position.status === "completed"
          ? position.rewardUsdTotal
          : position.rewardUsdTotal * progress;
      const payoutAtMaturity = position.principalUsd + position.rewardUsdTotal;
      const daysLeft = Math.max(0, Math.ceil((position.endAt - nowTick) / 86400000));
      return { progress, accruedRewardUsd, payoutAtMaturity, daysLeft };
    },
    [nowTick]
  );

  const settlePosition = useCallback(
    async (position) => {
      if (settlingPositionsRef.current.has(position.id)) return;
      settlingPositionsRef.current.add(position.id);

      const payoutUsd = position.principalUsd + position.rewardUsdTotal;
      const token = getCleanToken();
      try {
        if (!token) {
          throw new Error("Session expired during stake settlement.");
        }

        const response = await fetch(`${API_BASE_URL}/Stake/${position.id}/Complete`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
        const { json: result } = await parseJsonSafely(response);
        if (!response.ok || !result?.success) {
          throw new Error(
            result?.message || "Stake settlement failed in backend."
          );
        }

        setStakingPositions((prev) =>
          prev.map((item) =>
            item.id === position.id
              ? {
                  ...item,
                  status: "completed",
                  settledAt: new Date().toISOString(),
                  payoutUsd,
                  retryAt: 0,
                  lastError: "",
                }
              : item
          )
        );

        addNotification(
          `${position.asset} stake matured. ${formatCurrency(position.rewardUsdTotal)} profit credited.`,
          "success"
        );
        toast.success(
          `Stake payout completed: ${formatCurrency(payoutUsd)} credited.`
        );
        await Promise.all([
          refreshUser?.(),
          refreshTransactions?.(2, 500),
        ]);
      } catch (error) {
        console.error("Stake settlement failed:", error);
        setStakingPositions((prev) =>
          prev.map((item) =>
            item.id === position.id
                ? {
                    ...item,
                    status: "active",
                    retryAt: Date.now() + SETTLE_RETRY_MS,
                    lastError: error.message || "Settlement failed",
                }
              : item
          )
        );
      } finally {
        settlingPositionsRef.current.delete(position.id);
      }
    },
    [
      addNotification,
      getCleanToken,
      refreshTransactions,
      refreshUser,
      setStakingPositions,
    ]
  );

  useEffect(() => {
    const due = stakingPositions.filter(
      (position) =>
        position.status === "active" &&
        nowTick >= position.endAt &&
        (!position.retryAt || nowTick >= position.retryAt)
    );
    due.forEach((position) => settlePosition(position));
  }, [nowTick, settlePosition, stakingPositions]);

  const estimatedRewardUsd = useMemo(() => {
    if (!selectedAsset) return 0;
    const amountToken = toNumber(stakeAmount, 0);
    const tokenPrice = toNumber(livePrices[selectedAsset.symbol], 0);
    const principalUsd = amountToken * tokenPrice;
    return (principalUsd * selectedAsset.apy * duration) / 36500;
  }, [duration, livePrices, selectedAsset, stakeAmount]);

  const availableBalance = toNumber(userData?.balance, 0);
  const isDarkTheme = theme === "dark" || (theme === "system" && prefersDarkMode);

  const activePositions = useMemo(
    () => stakingPositions.filter((position) => position.status === "active"),
    [stakingPositions]
  );
  const totalStakedUsd = useMemo(
    () =>
      activePositions.reduce(
        (sum, position) => sum + toNumber(position.principalUsd),
        0
      ),
    [activePositions]
  );
  const totalAccruedProfitUsd = useMemo(
    () =>
      activePositions.reduce(
        (sum, position) => sum + computePositionLive(position).accruedRewardUsd,
        0
      ),
    [activePositions, computePositionLive]
  );

  const openStakeModal = (asset) => {
    setSelectedAsset(asset);
    setDuration(30);
    setStakeAmount("");
    setShowStakeModal(true);
  };
  const closeStakeModal = () => {
    setShowStakeModal(false);
    setSelectedAsset(null);
    setStakeAmount("");
  };

  const handleStake = async () => {
    if (isProcessingStake) return;
    if (!selectedAsset) return;

    const token = getCleanToken();
    const amountToken = toNumber(stakeAmount, 0);
    const tokenPrice = toNumber(livePrices[selectedAsset.symbol], 0);

    if (!tokenPrice) {
      toast.error("Price unavailable for this asset. Please retry.");
      return;
    }
    if (
      amountToken < selectedAsset.min ||
      amountToken > selectedAsset.max
    ) {
      toast.error(
        `Stake amount must be between ${selectedAsset.min} and ${selectedAsset.max} ${selectedAsset.symbol}.`
      );
      return;
    }

    const principalUsd = amountToken * tokenPrice;
    if (principalUsd > availableBalance) {
      toast.error(`Insufficient balance. You need ${formatCurrency(principalUsd)}.`);
      return;
    }

    const rewardUsdTotal = (principalUsd * selectedAsset.apy * duration) / 36500;
    const startAt = Date.now();
    const endAt = startAt + duration * 86400000;
    setIsProcessingStake(true);

    try {
      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      const payload = {
        asset: selectedAsset.symbol,
        coingeckoId: selectedAsset.coingeckoId,
        amount: amountToken,
        principalUsd,
        apy: selectedAsset.apy,
        durationDays: duration,
        rewardUsdTotal,
        reference: `REF-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        startedAt: new Date(startAt).toISOString(),
        endsAt: new Date(endAt).toISOString(),
        status: "Active",
      };

      let position = normalizePosition(
        {
          id: `stake-local-${startAt}`,
          ref: payload.reference,
          asset: payload.asset,
          coingeckoId: payload.coingeckoId,
          amountToken: payload.amount,
          principalUsd: payload.principalUsd,
          apy: payload.apy,
          durationDays: payload.durationDays,
          startAt,
          endAt,
          rewardUsdTotal: payload.rewardUsdTotal,
          status: "active",
        },
        assetMap
      );

      const response = await fetch(`${API_BASE_URL}/Stake/Create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const { json: result } = await parseJsonSafely(response);
      if (!response.ok || !result?.success || !result?.data) {
        throw new Error(result?.message || "Stake creation failed.");
      }
      position = mapBackendStakeToPosition(result.data);
      setStakingPositions((prev) => [position, ...prev]);

      addNotification(
        `Staked ${formatToken(amountToken, selectedAsset.symbol)} for ${duration} days.`,
        "success"
      );
      toast.success("Stake created successfully.");
      await Promise.all([
        refreshUser?.(),
        refreshTransactions?.(2, 500),
      ]);
      setShowStakeModal(false);
      setStakeAmount("");
    } catch (error) {
      console.error("Stake creation failed:", error);
      toast.error(error?.message || "Failed to place stake.");
    } finally {
      setIsProcessingStake(false);
    }
  };

  return (
    <div
      className={`min-h-screen px-4 py-10 sm:px-6 lg:px-8 ${
        isDarkTheme ? "bg-zinc-950" : "bg-gray-50"
      }`}
    >
      <div className="w-full space-y-8">
        <section
          className={`rounded-3xl p-6 ${
            isDarkTheme
              ? "bg-slate-900/70 border border-slate-700 text-white"
              : "bg-white border border-slate-200 text-slate-900"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div
              className={`rounded-2xl p-4 ${
                isDarkTheme ? "bg-slate-800" : "bg-slate-50"
              }`}
            >
              <div className="text-xs uppercase tracking-wide opacity-70">Balance</div>
              <div className="text-2xl font-bold text-emerald-500">
                {formatCurrency(availableBalance)}
              </div>
            </div>
            <div
              className={`rounded-2xl p-4 ${
                isDarkTheme ? "bg-slate-800" : "bg-slate-50"
              }`}
            >
              <div className="text-xs uppercase tracking-wide opacity-70">
                Active Stakes
              </div>
              <div className="text-2xl font-bold text-cyan-400">
                {activePositions.length}
              </div>
            </div>
            <div
              className={`rounded-2xl p-4 ${
                isDarkTheme ? "bg-slate-800" : "bg-slate-50"
              }`}
            >
              <div className="text-xs uppercase tracking-wide opacity-70">Total Staked</div>
              <div className="text-2xl font-bold text-violet-400">
                {formatCurrency(totalStakedUsd)}
              </div>
            </div>
            <div
              className={`rounded-2xl p-4 ${
                isDarkTheme ? "bg-slate-800" : "bg-slate-50"
              }`}
            >
              <div className="text-xs uppercase tracking-wide opacity-70">
                Live Accrued Profit
              </div>
              <div className="text-2xl font-bold text-amber-400">
                {formatCurrency(totalAccruedProfitUsd)}
              </div>
              <div className="text-xs mt-1 opacity-70 flex items-center gap-1">
                <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.3} />{" "}
                {priceSyncAt
                  ? `Auto-updated ${new Date(priceSyncAt).toLocaleTimeString()}`
                  : "Auto-updating"}
              </div>
            </div>
          </div>
        </section>

        <section className="flex gap-2 border-b border-teal-800/40 pb-2">
          <button
            onClick={() => setActiveTab("pools")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              activeTab === "pools"
                ? "bg-gradient-to-r from-teal-600 to-cyan-700 text-white"
                : isDarkTheme
                ? "bg-slate-800 text-slate-300"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            Staking Pools
          </button>
          <button
            onClick={() => setActiveTab("positions")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              activeTab === "positions"
                ? "bg-gradient-to-r from-teal-600 to-cyan-700 text-white"
                : isDarkTheme
                ? "bg-slate-800 text-slate-300"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            Your Positions
          </button>
        </section>

        {activeTab === "pools" && (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {STAKE_ASSETS.map((asset) => {
              const livePrice = toNumber(livePrices[asset.symbol], 0);
              return (
                <article
                  key={asset.symbol}
                  className={`rounded-2xl p-5 ${
                    isDarkTheme
                      ? "bg-slate-900/70 border border-slate-700"
                      : "bg-white border border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${asset.color}`}
                    >
                      <img src={asset.img} alt={asset.name} className="w-8 h-8 rounded-full" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{asset.name}</h3>
                      <div className="text-xs opacity-75">{asset.symbol}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div>
                      <div className="opacity-70 flex items-center gap-1">
                        <Percent className="h-3.5 w-3.5" strokeWidth={2.2} /> APY
                      </div>
                      <div className="font-bold text-cyan-400">{asset.apy}%</div>
                    </div>
                    <div>
                      <div className="opacity-70 flex items-center gap-1">
                        <Wallet className="h-3.5 w-3.5" strokeWidth={2.2} /> Live Price
                      </div>
                      <div className="font-bold">
                        {livePrice ? formatCurrency(livePrice) : "Unavailable"}
                      </div>
                    </div>
                    <div>
                      <div className="opacity-70 flex items-center gap-1">
                        <LockKeyhole className="h-3.5 w-3.5" strokeWidth={2.2} /> Min
                      </div>
                      <div className="font-bold">{asset.min} {asset.symbol}</div>
                    </div>
                    <div>
                      <div className="opacity-70 flex items-center gap-1">
                        <Coins className="h-3.5 w-3.5" strokeWidth={2.2} /> Max
                      </div>
                      <div className="font-bold">{asset.max} {asset.symbol}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => openStakeModal(asset)}
                    disabled={!livePrice}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${
                      livePrice
                        ? "bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-500 hover:to-cyan-600 text-white"
                        : "bg-slate-500/40 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    Stake Now <ChevronRight className="h-3.5 w-3.5 text-xs" strokeWidth={2.4} />
                  </button>
                </article>
              );
            })}
          </section>
        )}

        {activeTab === "positions" && (
          <section
            className={`rounded-2xl p-5 ${
              isDarkTheme
                ? "bg-slate-900/70 border border-slate-700"
                : "bg-white border border-slate-200"
            }`}
          >
            {stakingPositions.length === 0 ? (
              <div className="text-center py-16 opacity-80">
                <Coins className="mx-auto mb-3 h-10 w-10 text-cyan-400" strokeWidth={2.1} />
                <div className="text-lg font-semibold">No staking positions yet</div>
              </div>
            ) : (
              <div className="space-y-4">
                {stakingPositions.map((position) => {
                  const live = computePositionLive(position);
                  const progressPercent = Math.min(100, live.progress * 100);
                  const rewardToken =
                    toNumber(livePrices[position.asset], 0) > 0
                      ? live.accruedRewardUsd / toNumber(livePrices[position.asset], 1)
                      : 0;
                  return (
                    <div
                      key={position.id}
                      className={`rounded-xl p-4 ${
                        isDarkTheme ? "bg-slate-800" : "bg-slate-50"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                        <div>
                          <div className="text-sm opacity-70">Ref: {position.ref}</div>
                          <h3 className="text-lg font-bold">{position.asset} Stake</h3>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            position.status === "completed"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-cyan-500/20 text-cyan-400"
                          }`}
                        >
                          {position.status === "completed"
                            ? "Completed"
                            : `${live.daysLeft}d remaining`}
                        </span>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1 opacity-80">
                          <span>Progress</span>
                          <span>{progressPercent.toFixed(1)}%</span>
                        </div>
                        <div className={`h-2 rounded-full ${isDarkTheme ? "bg-slate-700" : "bg-slate-200"}`}>
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                        <div>
                          <div className="opacity-70">Principal</div>
                          <div className="font-bold">{formatCurrency(position.principalUsd)}</div>
                        </div>
                        <div>
                          <div className="opacity-70">Live Profit</div>
                          <div className="font-bold text-cyan-400">
                            {formatCurrency(live.accruedRewardUsd)}
                          </div>
                        </div>
                        <div>
                          <div className="opacity-70">Profit (Token)</div>
                          <div className="font-bold">{formatToken(rewardToken, position.asset)}</div>
                        </div>
                        <div>
                          <div className="opacity-70">Maturity Payout</div>
                          <div className="font-bold text-emerald-400">
                            {formatCurrency(live.payoutAtMaturity)}
                          </div>
                        </div>
                        <div>
                          <div className="opacity-70 flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" strokeWidth={2.2} /> End
                          </div>
                          <div className="font-bold">
                            {new Date(position.endAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {position.lastError && (
                        <div className="mt-2 text-xs text-rose-400">
                          Settlement retry queued: {position.lastError}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>

      <Modal isOpen={showStakeModal && !!selectedAsset} onClose={closeStakeModal}>
        <ModalContent
          theme={isDarkTheme ? "dark" : "light"}
          size="lg"
          onClose={closeStakeModal}
        >
          {selectedAsset ? (
            <>
              <ModalHeader
                theme={isDarkTheme ? "dark" : "light"}
                tone="cyan"
                eyebrow="Stake Position"
                title={`Stake ${selectedAsset.name}`}
                description={`Deploy ${selectedAsset.symbol} into a locked yield position and monitor rewards in real time.`}
                icon={<Coins className="h-8 w-8" strokeWidth={2.2} />}
                badge={
                  <span className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400">
                    {selectedAsset.symbol}
                  </span>
                }
              />
              <ModalBody className="space-y-5 pt-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div
                    className={`rounded-2xl border p-4 ${
                      isDarkTheme
                        ? "border-white/10 bg-white/[0.04]"
                        : "border-slate-200 bg-white/70"
                    }`}
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400/80">
                      Live Price
                    </div>
                    <div className="mt-3 text-lg font-semibold">
                      {formatCurrency(toNumber(livePrices[selectedAsset.symbol], 0))}
                    </div>
                  </div>
                  <div
                    className={`rounded-2xl border p-4 ${
                      isDarkTheme
                        ? "border-white/10 bg-white/[0.04]"
                        : "border-slate-200 bg-white/70"
                    }`}
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400/80">
                      APY
                    </div>
                    <div className="mt-3 text-lg font-semibold text-emerald-400">
                      {selectedAsset.apy}%
                    </div>
                  </div>
                  <div
                    className={`rounded-2xl border p-4 ${
                      isDarkTheme
                        ? "border-white/10 bg-white/[0.04]"
                        : "border-slate-200 bg-white/70"
                    }`}
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400/80">
                      Range
                    </div>
                    <div className="mt-3 text-lg font-semibold">
                      {selectedAsset.min} - {selectedAsset.max} {selectedAsset.symbol}
                    </div>
                  </div>
                </div>

                <div className="space-y-5 rounded-[24px] border border-white/10 bg-black/10 p-5 dark:bg-white/[0.02]">
                  <div>
                    <label className="text-sm font-medium opacity-85">
                      Amount ({selectedAsset.symbol})
                    </label>
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(event) => setStakeAmount(event.target.value)}
                      className={`mt-2 w-full rounded-2xl border px-4 py-3 ${
                        isDarkTheme
                          ? "border-slate-700 bg-slate-900/70"
                          : "border-slate-300 bg-slate-50"
                      }`}
                      placeholder={`${selectedAsset.min} - ${selectedAsset.max}`}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium opacity-85">
                      <Clock3 className="h-3.5 w-3.5" strokeWidth={2.2} />
                      Duration
                    </label>
                    <div className="mt-2 grid grid-cols-5 gap-2">
                      {[7, 14, 30, 60, 90].map((days) => (
                        <button
                          key={days}
                          onClick={() => setDuration(days)}
                          className={`rounded-2xl py-2.5 text-sm font-semibold transition ${
                            duration === days
                              ? "bg-gradient-to-r from-teal-600 to-cyan-700 text-white"
                              : isDarkTheme
                              ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {days}d
                        </button>
                      ))}
                    </div>
                  </div>

                  <div
                    className={`rounded-2xl border p-4 ${
                      isDarkTheme
                        ? "border-cyan-500/15 bg-cyan-500/8"
                        : "border-cyan-200 bg-cyan-50/80"
                    }`}
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400/80">
                      Estimated Reward
                    </div>
                    <div className="mt-3 text-3xl font-bold text-cyan-400">
                      {formatCurrency(estimatedRewardUsd)}
                    </div>
                    <div className="mt-2 text-sm opacity-75">
                      Principal is calculated from the current live asset price when the position opens.
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter theme={isDarkTheme ? "dark" : "light"}>
                <button
                  onClick={closeStakeModal}
                  className={`w-full rounded-2xl px-4 py-3 font-semibold ${
                    isDarkTheme
                      ? "bg-white/[0.06] text-white hover:bg-white/[0.1]"
                      : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleStake}
                  disabled={
                    isProcessingStake || !stakeAmount || toNumber(stakeAmount) <= 0
                  }
                  className={`w-full rounded-2xl px-4 py-3 font-semibold text-white transition ${
                    isProcessingStake || !stakeAmount || toNumber(stakeAmount) <= 0
                      ? "cursor-not-allowed bg-slate-500/40 text-slate-300"
                      : "bg-gradient-to-r from-teal-600 to-cyan-700 hover:opacity-95"
                  }`}
                >
                  {isProcessingStake ? "Processing..." : "Confirm Stake"}
                </button>
              </ModalFooter>
            </>
          ) : null}
        </ModalContent>
      </Modal>
    </div>
  );
}
