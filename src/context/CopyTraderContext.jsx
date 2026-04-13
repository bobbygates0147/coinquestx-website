"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "./UserContext";
import { useTransactions } from "./TransactionContext";
import { API_BASE_URL } from "../config/api";
import { COPY_TRADERS_SEED } from "../data/copyTradersSeed";
import { getCopyTradeMetrics, toNumber } from "../utils/investmentMetrics";
import {
  ensureUniqueCopyTraderNames,
  resolveCopyTraderDisplayName,
} from "../utils/copyTraderIdentity";

const CopyTradersContext = createContext();

const COPY_TRADE_REFRESH_MS = 5 * 1000;
const COPY_TRADE_SETTLEMENT_THRESHOLD_USD = 0.25;
const COPY_TRADE_SETTLEMENT_COOLDOWN_MS = 15 * 1000;
const COPY_TRADE_SETTLEMENT_STORAGE_PREFIX = "copyTradeSettlements";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizeTraderId = (value) => {
  if (value === undefined || value === null || value === "") return "";
  const numeric = Number(value);
  if (Number.isFinite(numeric) && String(numeric) === String(value)) {
    return numeric;
  }
  return value;
};

const seedTraderMap = new Map(
  COPY_TRADERS_SEED.map((trader) => [normalizeTraderId(trader.id), trader])
);

const parseJsonSafely = async (response) => {
  const text = await response.text();
  try {
    return { json: JSON.parse(text), text };
  } catch (error) {
    return { json: null, text };
  }
};

const resetTradingStats = {
  liveTrades: 0,
  lastProfit: 0,
  capital: 0,
  rewards: 0,
};

const getCopyTradeSettlementStorageKey = (identity) =>
  `${COPY_TRADE_SETTLEMENT_STORAGE_PREFIX}:${identity || "guest"}`;

const normalizeSettlementBook = (value) => {
  if (!value || typeof value !== "object") return {};

  return Object.entries(value).reduce((accumulator, [rawKey, entry]) => {
    const key = `${rawKey || ""}`.trim();
    if (!key) return accumulator;

    accumulator[key] = {
      settledProfit: Math.max(0, toNumber(entry?.settledProfit, entry)),
      lastProfitSettledAt: entry?.lastProfitSettledAt || null,
    };
    return accumulator;
  }, {});
};

const readSettlementBook = (identity) => {
  try {
    const stored = localStorage.getItem(
      getCopyTradeSettlementStorageKey(identity)
    );
    if (!stored) return {};
    return normalizeSettlementBook(JSON.parse(stored));
  } catch (error) {
    console.warn("Failed to read copy trade settlement state:", error);
    return {};
  }
};

const writeSettlementBook = (identity, book) => {
  try {
    localStorage.setItem(
      getCopyTradeSettlementStorageKey(identity),
      JSON.stringify(normalizeSettlementBook(book))
    );
  } catch (error) {
    console.warn("Failed to persist copy trade settlement state:", error);
  }
};

const getTraderSettlementKeys = (trader) =>
  [...new Set([trader?.backendId, trader?.sourceTraderId, trader?.id].map((value) => `${value || ""}`.trim()).filter(Boolean))];

const mergeSettlementIntoTrader = (trader, settlementBook) => {
  const settlementEntry = getTraderSettlementKeys(trader)
    .map((key) => settlementBook?.[key])
    .find(Boolean);

  return {
    ...trader,
    settledProfit: Math.max(
      0,
      toNumber(settlementEntry?.settledProfit, trader?.settledProfit)
    ),
    lastProfitSettledAt:
      settlementEntry?.lastProfitSettledAt || trader?.lastProfitSettledAt || null,
  };
};

const getPriceBasedPerformance = (price) => {
  const value = Math.max(0, toNumber(price, 0));
  const normalizedPrice = clamp(value / 250, 0, 6);
  return Number((10.5 + Math.expm1(normalizedPrice * 0.23) * 11.1).toFixed(2));
};

const mapRecordToTrader = (record) => {
  const snapshot =
    record?.traderData && typeof record.traderData === "object"
      ? record.traderData
      : {};
  const sourceId = normalizeTraderId(
    record?.sourceTraderId ?? snapshot?.id ?? record?._id ?? ""
  );
  const seededTrader = seedTraderMap.get(sourceId) || null;
  const amount = toNumber(record?.amount, toNumber(snapshot?.investmentAmount, 0));
  const backendId = String(record?._id || record?.id || snapshot?.backendId || "");
  const displayName = resolveCopyTraderDisplayName({
    preferredName: seededTrader?.name || snapshot?.name,
    traderName: record?.traderName,
    sourceId,
    backendId,
    strategy: seededTrader?.strategy || snapshot?.strategy,
  });
  const realizedProfit = toNumber(
    record?.realizedProfit,
    toNumber(snapshot?.realizedProfit, toNumber(snapshot?.settledProfit, 0))
  );
  const settledProfit = Math.max(
    realizedProfit,
    toNumber(record?.settledProfit, toNumber(snapshot?.settledProfit, 0))
  );

  return {
    ...snapshot,
    id: sourceId || backendId,
    sourceTraderId: sourceId || backendId,
    backendId,
    traderName: displayName,
    name: displayName,
    strategy: seededTrader?.strategy || snapshot?.strategy || "Managed Strategy",
    investmentAmount: amount,
    amount,
    performance: toNumber(record?.performance, toNumber(snapshot?.performance, 0)),
    status: record?.status || "Active",
    copiedAt: record?.createdAt || snapshot?.copiedAt || new Date().toISOString(),
    createdAt: record?.createdAt || snapshot?.copiedAt || new Date().toISOString(),
    cycleDays: toNumber(record?.traderData?.cycleDays, toNumber(snapshot?.cycleDays, 30)),
    image: seededTrader?.image || snapshot?.image || "",
    fallbackImage: seededTrader?.fallbackImage || snapshot?.fallbackImage || "",
    profitShare: toNumber(snapshot?.profitShare, toNumber(seededTrader?.profitShare, 0)),
    winRate: toNumber(snapshot?.winRate, toNumber(seededTrader?.winRate, 0)),
    wins: toNumber(snapshot?.wins, toNumber(seededTrader?.wins, 0)),
    losses: toNumber(snapshot?.losses, toNumber(seededTrader?.losses, 0)),
    balance: toNumber(snapshot?.balance, amount),
    copyPrice: toNumber(snapshot?.copyPrice, amount),
    realizedProfit,
    settledProfit,
    lastProfitSettledAt:
      record?.lastProfitSettledAt || snapshot?.lastProfitSettledAt || null,
  };
};

const hydrateTraderMetrics = (trader, now = Date.now()) => {
  const metrics = getCopyTradeMetrics(trader, now);
  return {
    ...trader,
    liveProfit: metrics.accruedProfit,
    projectedProfit: metrics.projectedProfit,
    currentValue: metrics.currentValue,
    pendingProfit: metrics.pendingProfit,
    settledProfit: metrics.settledProfit,
    progress: metrics.progress,
    daysLeft: metrics.daysLeft,
    cycleDays: metrics.cycleDays,
  };
};

export function CopyTradersProvider({ children }) {
  const [copiedTraders, setCopiedTraders] = useState([]);
  const [tradeVolumes, setTradeVolumes] = useState([]);
  const [settlementBook, setSettlementBook] = useState({});
  const [tradingStats, setTradingStats] = useState(resetTradingStats);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    avgTradeSize: 0,
    winRate: 0,
    profitFactor: 1,
    maxDrawdown: 0,
  });

  const { userData, isAuthenticated, getAuthToken, refreshUser } = useUser();
  const { refreshTransactions } = useTransactions();
  const settlementLockRef = useRef(false);
  const lastSettlementAtRef = useRef(0);
  const settlementIdentity =
    userData?.userId || userData?.uid || userData?.email || "guest";

  const getCleanToken = useCallback(() => {
    const token = getAuthToken?.();
    if (!token) return null;
    return token.replace(/^["']|["']$/g, "").trim();
  }, [getAuthToken]);

  useEffect(() => {
    if (!isAuthenticated) {
      setSettlementBook({});
      return;
    }

    setSettlementBook(readSettlementBook(settlementIdentity));
  }, [isAuthenticated, settlementIdentity]);

  const persistSettlementBook = useCallback(
    (valueOrUpdater) => {
      setSettlementBook((previous) => {
        const nextValue =
          typeof valueOrUpdater === "function"
            ? valueOrUpdater(previous)
            : valueOrUpdater;
        const normalized = normalizeSettlementBook(nextValue);
        writeSettlementBook(settlementIdentity, normalized);
        return normalized;
      });
    },
    [settlementIdentity]
  );

  const updateStatsFromTraders = useCallback((traders) => {
    const enriched = traders.map((trader) => hydrateTraderMetrics(trader));
    const totalCapital = traders.reduce(
      (sum, trader) =>
        sum +
        toNumber(
          trader.investmentAmount ?? trader.balance ?? trader.amount ?? 0,
          0
        ),
      0
    );
    const totalRewards = enriched.reduce(
      (sum, trader) => sum + toNumber(trader.liveProfit, 0),
      0
    );

    setTradingStats({
      liveTrades: enriched.length,
      lastProfit: totalRewards,
      capital: totalCapital,
      rewards: totalRewards,
    });
  }, []);

  const applyLoadedTraders = useCallback(
    (traders) => {
      const hydrated = ensureUniqueCopyTraderNames(
        traders.map((trader) =>
          hydrateTraderMetrics(mergeSettlementIntoTrader(trader, settlementBook))
        )
      );
      setCopiedTraders(hydrated);
      const volumes = hydrated
        .map((trader) => toNumber(trader.investmentAmount, 0))
        .filter((amount) => amount > 0)
        .slice(-10);
      setTradeVolumes(volumes);
      updateStatsFromTraders(hydrated);
    },
    [settlementBook, updateStatsFromTraders]
  );

  const loadCopiedTraders = useCallback(async () => {
    if (!isAuthenticated) return;

    const token = getCleanToken();
    if (!token) {
      applyLoadedTraders([]);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/CopyTrade`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const { json: result } = await parseJsonSafely(response);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || `Failed to load copy trades (${response.status})`);
      }

      const records = Array.isArray(result?.data) ? result.data : [];
      const traders = records
        .map(mapRecordToTrader)
        .filter((trader) =>
          ["Active", "Paused"].includes(trader.status || "Active")
        );

      applyLoadedTraders(traders);
    } catch (error) {
      console.error("Failed to load copy trades:", error);
      applyLoadedTraders([]);
    }
  }, [isAuthenticated, getCleanToken, applyLoadedTraders]);

  useEffect(() => {
    if (!isAuthenticated) {
      applyLoadedTraders([]);
    }
  }, [isAuthenticated, applyLoadedTraders]);

  useEffect(() => {
    if (!isAuthenticated || !userData?.userId) return;
    loadCopiedTraders();
  }, [isAuthenticated, userData?.userId, loadCopiedTraders]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCopiedTraders((prev) => {
        const next = prev.map((trader) =>
          hydrateTraderMetrics(mergeSettlementIntoTrader(trader, settlementBook))
        );
        updateStatsFromTraders(next);
        return next;
      });
    }, COPY_TRADE_REFRESH_MS);
    return () => window.clearInterval(interval);
  }, [settlementBook, updateStatsFromTraders]);

  const settleCopiedTraderProfits = useCallback(async () => {
    if (!isAuthenticated || copiedTraders.length === 0) return;
    if (settlementLockRef.current) return;

    const now = Date.now();
    const settlementRows = copiedTraders
      .map((rawTrader) => {
        const trader = mergeSettlementIntoTrader(rawTrader, settlementBook);
        const metrics = getCopyTradeMetrics(trader, now);
        const settlementDelta = Math.max(
          0,
          metrics.accruedProfit - toNumber(trader.settledProfit, 0)
        );

        if (settlementDelta <= 0 || !trader.backendId) {
          return null;
        }

        return {
          key: String(trader.backendId || trader.id),
          trader,
          totalAccruedProfit: metrics.accruedProfit,
          settlementDelta,
          forceSettlement: metrics.progress >= 1,
        };
      })
      .filter(Boolean);

    if (settlementRows.length === 0) return;

    const totalSettlement = settlementRows.reduce(
      (sum, row) => sum + row.settlementDelta,
      0
    );
    const payoutAmount = Number(totalSettlement.toFixed(6));
    const shouldForceSettlement = settlementRows.some((row) => row.forceSettlement);

    if (payoutAmount <= 0) return;
    if (
      !shouldForceSettlement &&
      payoutAmount < COPY_TRADE_SETTLEMENT_THRESHOLD_USD
    ) {
      return;
    }
    if (
      !shouldForceSettlement &&
      now - lastSettlementAtRef.current < COPY_TRADE_SETTLEMENT_COOLDOWN_MS
    ) {
      return;
    }

    settlementLockRef.current = true;

    try {
      const token = getCleanToken();
      if (!token) {
        throw new Error("Authentication required. Please log in again.");
      }

      const response = await fetch(`${API_BASE_URL}/CopyTrade/Claim`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          tradeIds: settlementRows.map((row) => row.key),
        }),
      });

      const { json: result } = await parseJsonSafely(response);
      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message || `Copy trader claim failed (${response.status})`
        );
      }

      const claimedTrades = Array.isArray(result?.data?.trades)
        ? result.data.trades
        : [];
      const claimedMap = new Map(
        claimedTrades.map((row) => [String(row.id || ""), row])
      );

      const settledAt = new Date(now).toISOString();
      const settlementMap = new Map(
        settlementRows.map((row) => [row.key, row])
      );
      const nextTraders = copiedTraders.map((rawTrader) => {
        const trader = mergeSettlementIntoTrader(rawTrader, settlementBook);
        const settlementRow = settlementMap.get(String(trader.backendId || trader.id));
        if (!settlementRow) {
          return hydrateTraderMetrics(trader, now);
        }

        const claimedRow = claimedMap.get(String(trader.backendId || trader.id));
        const settledProfit = toNumber(
          claimedRow?.settledProfit,
          settlementRow.totalAccruedProfit
        );
        const lastProfitSettledAt =
          claimedRow?.lastProfitSettledAt || settledAt;

        return hydrateTraderMetrics(
          {
            ...trader,
            settledProfit,
            lastProfitSettledAt,
          },
          now
        );
      });

      setCopiedTraders(nextTraders);
      updateStatsFromTraders(nextTraders);
      persistSettlementBook((previous) => {
        const next = { ...previous };
        settlementRows.forEach((row) => {
          const claimedRow = claimedMap.get(String(row.trader.backendId || row.trader.id));
          const settlementEntry = {
            settledProfit: toNumber(
              claimedRow?.settledProfit,
              row.totalAccruedProfit
            ),
            lastProfitSettledAt:
              claimedRow?.lastProfitSettledAt || settledAt,
          };

          getTraderSettlementKeys(row.trader).forEach((key) => {
            next[key] = settlementEntry;
          });
        });
        return next;
      });

      lastSettlementAtRef.current = now;
      await Promise.all([
        refreshUser?.(),
        refreshTransactions?.(2, 500),
      ]);
    } catch (error) {
      console.error("Failed to settle copy trader profits:", error);
    } finally {
      settlementLockRef.current = false;
    }
  }, [
    copiedTraders,
    getCleanToken,
    isAuthenticated,
    persistSettlementBook,
    refreshTransactions,
    refreshUser,
    settlementBook,
    updateStatsFromTraders,
  ]);

  useEffect(() => {
    settleCopiedTraderProfits();
  }, [settleCopiedTraderProfits]);

  const addCopiedTrader = async (trader, investmentAmount = 100) => {
    const traderId = normalizeTraderId(trader?.id ?? trader?.sourceTraderId);
    if (!traderId) {
      throw new Error("Invalid trader selection.");
    }

    if (copiedTraders.some((t) => t.id === traderId)) {
      return false;
    }

    const amount = toNumber(investmentAmount, 0);
    const traderPrice = toNumber(
      trader?.copyPrice ?? trader?.investmentAmount ?? trader?.amount ?? amount,
      amount
    );
    const basePerformance = toNumber(trader?.performance, 0);
    const derivedPerformance = Math.max(
      basePerformance,
      getPriceBasedPerformance(traderPrice)
    );
    const currentBalance = toNumber(userData?.balance, 0);
    if (currentBalance < amount) {
      throw new Error(
        `Insufficient balance. You need $${amount} but only have $${currentBalance}`
      );
    }

    const token = getCleanToken();
    if (!token) {
      throw new Error("Authentication required. Please log in again.");
    }

    const copiedAt = new Date().toISOString();
    const displayName = resolveCopyTraderDisplayName({
      preferredName: trader?.name,
      traderName: trader?.traderName,
      sourceId: traderId,
      backendId: trader?.backendId,
      strategy: trader?.strategy,
    });

    try {
      const payload = {
        sourceTraderId: String(traderId),
        traderName: displayName,
        amount,
        status: "Active",
        performance: derivedPerformance,
        traderData: {
          ...trader,
          id: traderId,
          name: displayName,
          investmentAmount: amount,
          copyPrice: traderPrice,
          performance: derivedPerformance,
          cycleDays: 30,
          copiedAt,
          settledProfit: 0,
        },
      };

      const response = await fetch(`${API_BASE_URL}/CopyTrade/Create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const { json: result } = await parseJsonSafely(response);
      if (!response.ok || !result?.success) {
        throw new Error(
          result?.message || `Failed to save copied trader (${response.status})`
        );
      }

      const created = result?.data || {};
      const traderWithInvestment = {
        ...trader,
        id: traderId,
        sourceTraderId: traderId,
        backendId: String(created?._id || created?.id || ""),
        traderName: displayName,
        name: displayName,
        investmentAmount: amount,
        amount,
        status: created?.status || "Active",
        performance: toNumber(created?.performance, derivedPerformance),
        copyPrice: traderPrice,
        copiedAt: created?.createdAt || copiedAt,
        createdAt: created?.createdAt || copiedAt,
        cycleDays: 30,
        settledProfit: 0,
        lastProfitSettledAt: null,
      };

      const updatedTraders = ensureUniqueCopyTraderNames([
        ...copiedTraders,
        hydrateTraderMetrics(traderWithInvestment),
      ]);
      setCopiedTraders(updatedTraders);
      setTradeVolumes((prev) => {
        const newVolumes = [...prev];
        if (newVolumes.length >= 10) newVolumes.shift();
        newVolumes.push(amount);
        return newVolumes;
      });
      updateStatsFromTraders(updatedTraders);
      await Promise.all([
        refreshUser?.(),
        refreshTransactions?.(2, 500),
      ]);

      return true;
    } catch (error) {
      throw error;
    }
  };

  const removeCopiedTrader = async (id, refundAmount = null) => {
    const traderToRemove = copiedTraders.find((trader) => trader.id === id);
    if (!traderToRemove) {
      return { success: false, error: "Copied trader not found" };
    }

    const traderWithSettlement = mergeSettlementIntoTrader(
      traderToRemove,
      settlementBook
    );

    const token = getCleanToken();
    if (!token) {
      return { success: false, error: "Authentication required. Please log in again." };
    }

    if (!traderToRemove.backendId) {
      return {
        success: false,
        error:
          "This copied trader is not synced with the secured backend flow yet.",
      };
    }

    let backendSettlement = null;
    try {
      const response = await fetch(
        `${API_BASE_URL}/CopyTrade/${traderToRemove.backendId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const { json: result } = await parseJsonSafely(response);
      if (!response.ok || !result?.success) {
        return {
          success: false,
          error: result?.message || `Failed to close copy trade (${response.status})`,
        };
      }
      backendSettlement = result?.data || null;
    } catch (error) {
      return { success: false, error: error.message || "Failed to close copy trade" };
    }

    const updatedTraders = copiedTraders.filter((trader) => trader.id !== id);
    setCopiedTraders(updatedTraders);
    updateStatsFromTraders(updatedTraders);

    const principal = toNumber(
      traderWithSettlement.investmentAmount ??
        traderWithSettlement.balance ??
        traderWithSettlement.amount,
      0
    );
    const liveMetrics = getCopyTradeMetrics(traderWithSettlement);
    const autoSettlement = Math.max(0, liveMetrics.currentValue);
    const hasCustomRefund = refundAmount !== null && refundAmount !== undefined;
    const settlementAmount = hasCustomRefund
      ? Math.max(0, toNumber(refundAmount, 0))
      : backendSettlement?.settlementAmount !== undefined
      ? Math.max(0, toNumber(backendSettlement.settlementAmount, 0))
      : autoSettlement;

    persistSettlementBook((previous) => {
      const next = { ...previous };
      getTraderSettlementKeys(traderWithSettlement).forEach((key) => {
        delete next[key];
      });
      return next;
    });

    await Promise.all([
      refreshUser?.(),
      refreshTransactions?.(2, 500),
    ]);

    return {
      success: true,
      settlementAmount,
      principal,
      profitLoss:
        backendSettlement?.profitLoss !== undefined
          ? toNumber(backendSettlement.profitLoss, settlementAmount - principal)
          : settlementAmount - principal,
    };
  };

  const updateTradeStats = (amount, isWin) => {
    setTradingStats((prev) => {
      const profit = isWin ? amount * 0.75 : -amount * 0.15;
      return {
        liveTrades: prev.liveTrades + 1,
        lastProfit: profit,
        capital: prev.capital + amount,
        rewards: prev.rewards + (isWin ? amount * 0.1 : 0),
      };
    });
  };

  const getTotalInvested = () => {
    return copiedTraders.reduce(
      (total, trader) =>
        total + toNumber(trader.investmentAmount ?? trader.balance, 0),
      0
    );
  };

  useEffect(() => {
    const totalVolume = tradeVolumes.reduce((sum, value) => sum + value, 0);
    const avgTradeSize = tradeVolumes.length ? totalVolume / tradeVolumes.length : 0;
    const capital = tradingStats.capital || 0;
    const rewards = tradingStats.rewards || 0;
    const profitFactor =
      capital > 0 ? Math.max(0, rewards / Math.max(1, capital - rewards)) : 1;
    const winRate =
      copiedTraders.length > 0
        ? Math.min(99, Math.max(45, (rewards / Math.max(1, capital)) * 100))
        : 67;
    const maxDrawdown = Math.max(
      3,
      Math.min(25, 15 - (tradingStats.lastProfit || 0) * 0.05 + 5)
    );

    setPerformanceMetrics({
      avgTradeSize,
      winRate,
      profitFactor,
      maxDrawdown,
    });
  }, [
    copiedTraders.length,
    tradeVolumes,
    tradingStats.capital,
    tradingStats.rewards,
    tradingStats.lastProfit,
  ]);

  return (
    <CopyTradersContext.Provider
      value={{
        copiedTraders,
        tradeVolumes,
        totalCopiedTrades: copiedTraders.length,
        tradingStats,
        performanceMetrics,
        totalInvested: getTotalInvested(),
        addCopiedTrader,
        removeCopiedTrader,
        updateTradeStats,
        refreshCopiedTraders: loadCopiedTraders,
      }}
    >
      {children}
    </CopyTradersContext.Provider>
  );
}

export function useCopyTraders() {
  return useContext(CopyTradersContext);
}
