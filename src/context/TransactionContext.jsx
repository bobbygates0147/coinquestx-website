"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "./UserContext";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "../config/api";

const TransactionContext = createContext();

export function TransactionProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [lastTransactionCount, setLastTransactionCount] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const [processedTransactionIds, setProcessedTransactionIds] = useState(new Set());
  const balanceRef = useRef(0);
  const latestTransactionIdRef = useRef("");
  const syncInFlightRef = useRef(false);
  
  const { getAuthToken, isAuthenticated, refreshUser, userData } = useUser();

  useEffect(() => {
    balanceRef.current = parseAmountValue(userData?.balance);
  }, [userData?.balance]);

  useEffect(() => {
    if (userData?.role === "admin") return;
    if (!transactions.length) return;

    setTransactions((previous) =>
      deriveBalanceSnapshots(previous, balanceRef.current)
    );
  }, [transactions.length, userData?.balance, userData?.role]);

  const TRANSACTION_STATUS = {
    PENDING: 1,
    COMPLETED: 2, 
    FAILED: 3,
    CANCELLED: 4
  };

  const TRANSACTION_TYPE_MAP = {
    deposit: "Deposit",
    withdrawal: "Withdrawal",
    trade: "Trade",
    copytrade: "CopyTrade",
    copy_trade: "CopyTrade",
    placetrade: "PlaceTrade",
    place_trade: "PlaceTrade",
    realestate: "RealEstate",
    "real estate": "RealEstate",
    signal: "Signal",
    signals: "Signal",
    subscription: "Subscription",
    subscriptions: "Subscription",
    mining: "Mining",
    stake: "Stake",
    buybot: "BuyBot",
    bot: "BuyBot",
    bots: "BuyBot",
    adjustment: "Adjustment",
    balanceadjustment: "Adjustment",
  };

  const normalizeTransactionType = (value, category) => {
    if (!value && !category) return null;
    const rawValue = `${value || ""}`.trim();
    const rawCategory = `${category || ""}`.trim();
    const loweredValue = rawValue.toLowerCase();

    const fallbackCategory =
      ["debit", "credit", "info"].includes(loweredValue) && rawCategory
        ? rawCategory
        : rawValue || rawCategory;

    const lowered = `${fallbackCategory}`.toLowerCase();
    if (TRANSACTION_TYPE_MAP[lowered]) return TRANSACTION_TYPE_MAP[lowered];
    const compact = lowered.replace(/[\s_-]+/g, "");
    if (TRANSACTION_TYPE_MAP[compact]) return TRANSACTION_TYPE_MAP[compact];
    return fallbackCategory;
  };

  const normalizeTransactionStatus = (value) => {
    if (!value) return "Completed";
    const lowered = `${value}`.trim().toLowerCase();
    if (lowered === "active") return "Completed";
    if (lowered === "completed") return "Completed";
    if (lowered === "pending") return "Pending";
    if (lowered === "failed") return "Failed";
    if (lowered === "cancelled" || lowered === "canceled") return "Cancelled";
    return "Completed";
  };

  const parseAmountValue = (value) => {
    if (typeof value === "number") return value;
    if (!value) return 0;
    const cleaned = `${value}`.replace(/[^0-9.-]+/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const parseOptionalNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const getTransactionTimestamp = (transaction) => {
    const source = transaction?.createdAt || transaction?.date;
    const parsed = Date.parse(source);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const getTransactionDirectionMultiplier = (transaction) => {
    const direction = `${transaction?.entryDirection || transaction?.metadata?.entryDirection || ""}`
      .trim()
      .toLowerCase();

    if (["credit", "deposit", "refund", "payout"].includes(direction)) return 1;
    if (["debit", "withdrawal", "charge"].includes(direction)) return -1;

    switch (normalizeTransactionType(transaction?.type, transaction?.category)) {
      case "Deposit":
      case "Mining":
        return 1;
      case "Withdrawal":
      case "Subscription":
      case "Signal":
      case "BuyBot":
      case "Stake":
      case "RealEstate":
      case "PlaceTrade":
      case "Trade":
      case "CopyTrade":
        return -1;
      case "Adjustment": {
        const signedAmount = Number(transaction?.amount);
        if (Number.isFinite(signedAmount) && signedAmount !== 0) {
          return signedAmount >= 0 ? 1 : -1;
        }
        return null;
      }
      default:
        return null;
    }
  };

  const getTransactionBalanceDelta = (transaction) => {
    if (normalizeTransactionStatus(transaction?.status) !== "Completed") {
      return 0;
    }

    const multiplier = getTransactionDirectionMultiplier(transaction);
    if (multiplier === null) return null;

    const amount = Math.abs(parseAmountValue(transaction?.amount));
    return amount * multiplier;
  };

  const deriveBalanceSnapshots = (items, currentBalance) => {
    if (!Array.isArray(items) || items.length === 0) return [];

    const sorted = [...items]
      .map((transaction, index) => ({
        ...transaction,
        _sortIndex: index,
      }))
      .sort((left, right) => {
        const timeDelta = getTransactionTimestamp(right) - getTransactionTimestamp(left);
        if (timeDelta !== 0) return timeDelta;
        return left._sortIndex - right._sortIndex;
      });

    let runningBalance = parseAmountValue(currentBalance);

    return sorted.map((transaction) => {
      const { _sortIndex, ...baseTransaction } = transaction;
      const explicitBefore = parseOptionalNumber(
        baseTransaction.rawBalanceBefore ?? baseTransaction.balanceBefore
      );
      const explicitAfter = parseOptionalNumber(
        baseTransaction.rawBalanceAfter ?? baseTransaction.balanceAfter
      );
      const delta = getTransactionBalanceDelta(baseTransaction);
      const isCompleted = normalizeTransactionStatus(baseTransaction?.status) === "Completed";

      let resolvedBefore = explicitBefore;
      let resolvedAfter = explicitAfter;
      let balanceDerived = false;

      if (resolvedBefore !== null || resolvedAfter !== null) {
        if (resolvedAfter === null && resolvedBefore !== null) {
          resolvedAfter = delta !== null ? resolvedBefore + delta : resolvedBefore;
          balanceDerived = true;
        }
        if (resolvedBefore === null && resolvedAfter !== null) {
          resolvedBefore = delta !== null ? resolvedAfter - delta : resolvedAfter;
          balanceDerived = true;
        }

        if (isCompleted && resolvedBefore !== null) {
          runningBalance = resolvedBefore;
        }
      } else if (isCompleted && delta !== null) {
        resolvedAfter = runningBalance;
        resolvedBefore = resolvedAfter - delta;
        runningBalance = resolvedBefore;
        balanceDerived = true;
      } else {
        resolvedBefore = runningBalance;
        resolvedAfter = runningBalance;
        balanceDerived = true;
      }

      return {
        ...baseTransaction,
        rawBalanceBefore: explicitBefore,
        rawBalanceAfter: explicitAfter,
        balanceBefore: resolvedBefore,
        balanceAfter: resolvedAfter,
        balanceDerived,
      };
    });
  };

  const buildTransactionPayload = (payload) => {
    if (!payload) return null;

    const normalizedType = normalizeTransactionType(
      payload.type,
      payload.category
    );
    const amountValue = parseAmountValue(payload.amount);
    const statusValue = normalizeTransactionStatus(payload.status);

    const metadata = {
      ...(payload.metadata || {}),
    };

    if (payload.type) {
      metadata.entryDirection = `${payload.type}`.trim().toLowerCase();
    }
    if (payload.sourceFeature) {
      metadata.sourceFeature = payload.sourceFeature;
    }
    if (payload.balanceBefore !== undefined) {
      metadata.balanceBefore = Number(payload.balanceBefore);
    }
    if (payload.balanceAfter !== undefined) {
      metadata.balanceAfter = Number(payload.balanceAfter);
    }

    if (payload.signalDetails) {
      metadata.signalDetails = payload.signalDetails;
    }
    if (payload.botDetails) {
      metadata.botDetails = payload.botDetails;
    }
    if (payload.subscriptionDetails) {
      metadata.subscriptionDetails = payload.subscriptionDetails;
    }

    return {
      type: normalizedType,
      amount: amountValue,
      currency: payload.currency || userData?.currencyCode || "USD",
      paymentMethod: payload.paymentMethod || payload.method || "",
      status: statusValue,
      details: payload.details || payload.description || "",
      metadata,
    };
  };

  // Update transaction status function
  const updateTransactionStatus = async (transactionId, newStatus) => {
    const token = getAuthToken();
    
    if (!token) {
      console.error("❌ No authentication token available");
      return { success: false, error: "Not authenticated" };
    }

    try {
      console.log(`🔄 Updating transaction ${transactionId} to status ${newStatus}`);
      
      const requestBody = {
        transactionId: transactionId,
        newStatus: newStatus
      };

      console.log("📦 Request body:", requestBody);

      const response = await fetch(`${API_BASE_URL}/Admin/UpdateTransactionStatus`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody),
      });

      console.log("📥 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Transaction status updated successfully:", result);
      
      // 🔄 CRITICAL: Force immediate refresh of transactions and user balance
      if (result.success && result.data) {
        // Update local state immediately
        setTransactions(prev => 
          prev.map(tx => 
            tx.id === transactionId 
              ? { ...tx, status: result.data.status } // Use the status from API response
              : tx
          )
        );
        
        // Refresh user balance immediately with retry
        let balanceUpdated = false;
        let retries = 3;
        
        while (retries > 0 && !balanceUpdated) {
          try {
            await refreshUser();
            console.log("✅ User balance refreshed after transaction approval");
            balanceUpdated = true;
          } catch (error) {
            console.warn(`⚠️ Balance refresh failed, retrying... (${retries} left)`);
            retries--;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // Force refresh transactions from API with cache busting
        await forceRefreshTransactions();
      }
      
      return { success: true, data: result.data };
      
    } catch (error) {
      console.error("💥 Error updating transaction status:", error);
      return { success: false, error: error.message };
    }
  };

  // Enhanced transaction fetch with cache busting
  const fetchTransactionsFromAPI = useCallback(async (forceRefresh = false, options = {}) => {
    const { silent = false } = options;
    const token = getAuthToken();
    if (!token) {
      console.log("❌ No token available for fetching transactions");
      return { success: false, count: 0 };
    }

    if (!silent) {
      setLoading(true);
    }
    try {
      console.log("📥 Fetching transactions from API...");
      
      const isAdmin = userData?.role === "admin";
      const baseUrl = isAdmin
        ? `${API_BASE_URL}/Admin/Transactions`
        : `${API_BASE_URL}/Transaction/History`;

      // Add cache-busting parameter for force refresh
      const url = forceRefresh
        ? `${baseUrl}?t=${Date.now()}`
        : baseUrl;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache"
        },
        cache: 'no-cache'
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Transactions fetched from API:", result);
        
        if (result.success && result.data) {
          const apiTransactions = result.data.map(tx => ({
            id: tx.id || tx._id,
            type: tx.type,
            amount: tx.amount,
            currency: tx.currency || userData?.currencyCode || "USD",
            method: tx.paymentMethod || tx.method,
            status: tx.status,
            date: tx.createdAt || tx.date,
            createdAt: tx.createdAt || tx.date,
            walletAddress: tx.walletAddress,
            network: tx.network,
            details:
              tx.details ||
              tx.description ||
              (tx.type === "Adjustment"
                ? ""
                : `${tx.type} ${tx.currency} via ${tx.paymentMethod}`),
            metadata: tx.metadata || {},
            sourceFeature: tx.sourceFeature || tx.metadata?.sourceFeature || "",
            rawBalanceBefore: tx.balanceBefore ?? tx.metadata?.balanceBefore ?? null,
            rawBalanceAfter: tx.balanceAfter ?? tx.metadata?.balanceAfter ?? null,
            balanceBefore: tx.balanceBefore ?? tx.metadata?.balanceBefore ?? null,
            balanceAfter: tx.balanceAfter ?? tx.metadata?.balanceAfter ?? null,
            entryDirection: tx.entryDirection || tx.metadata?.entryDirection || "",
            actorRole: tx.actorRole || "user",
            actorLabel: tx.actorLabel || "",
            workflow: tx.workflow || {},
            destination: tx.destination || tx.metadata?.destination || {},
            signalDetails: tx.metadata?.signalDetails,
            botDetails: tx.metadata?.botDetails,
            subscriptionDetails: tx.metadata?.subscriptionDetails,
            userId: tx.userId,
            userName: tx.userName,
            userEmail: tx.userEmail,
          }));
          const ledgerTransactions = deriveBalanceSnapshots(
            apiTransactions,
            balanceRef.current
          );
          
          console.log(`📊 Processed ${apiTransactions.length} transactions from API`);
          console.log("📋 Transaction statuses:", apiTransactions.map(tx => ({ id: tx.id, status: tx.status })));
          
          setTransactions(ledgerTransactions);
          
          // Calculate notification count for pending transactions
          const pendingCount = ledgerTransactions.filter(tx => tx.status === "Pending").length;
          setNotificationCount(pendingCount);
          
          // Update last refresh time
          setLastRefreshTime(Date.now());
          
          return { 
            success: true, 
            count: ledgerTransactions.length, 
            transactions: ledgerTransactions,
            pendingCount: pendingCount
          };
        }
      } else {
        console.error("❌ Failed to fetch transactions from API:", response.status);
        return { success: false, count: 0 };
      }
    } catch (error) {
      console.error("💥 Error fetching transactions:", error);
      return { success: false, count: 0 };
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [getAuthToken, userData?.role, userData?.currencyCode]);

  const syncTransactionFeed = useCallback(
    async ({ forceRefresh = true, refreshBalance = false, silent = false } = {}) => {
      if (!isAuthenticated) {
        return { success: false, count: 0 };
      }

      if (syncInFlightRef.current) {
        return { success: false, count: 0, skipped: true };
      }

      syncInFlightRef.current = true;

      try {
        const result = await fetchTransactionsFromAPI(forceRefresh, { silent });
        if (!result.success) {
          return result;
        }


        setLastTransactionCount(result.count);

        const newestTransactionId = result.transactions?.[0]?.id || "";
        const hadPreviousTransaction = Boolean(latestTransactionIdRef.current);
        const feedChanged =
          Boolean(newestTransactionId) &&
          newestTransactionId !== latestTransactionIdRef.current;

        if (newestTransactionId) {
          latestTransactionIdRef.current = newestTransactionId;
        }

        if (
          userData?.role !== "admin" &&
          (
            refreshBalance ||
            feedChanged ||
            (!hadPreviousTransaction && result.count > 0)
          )
        ) {
          try {
            await refreshUser();
            console.log("âœ… User balance refreshed after transaction feed update");
          } catch (error) {
            console.warn("âš ï¸ Could not refresh user balance after transaction sync");
          }
        }

        return result;
      } finally {
        syncInFlightRef.current = false;
      }
    },
    [fetchTransactionsFromAPI, isAuthenticated, refreshUser, userData?.role]
  );

  // Force refresh with aggressive cache busting
  const forceRefreshTransactions = async () => {
    console.log("🔄 Force refreshing transactions...");
    return await syncTransactionFeed({
      forceRefresh: true,
      refreshBalance: true,
    });
  };

  // Monitor for completed transactions and refresh balance
  useEffect(() => {
    if (transactions.length === 0) return;

    // Check for newly completed deposits
    const completedDeposits = transactions.filter(tx => 
      tx.status === "Completed" && 
      tx.type === "Deposit" &&
      !processedTransactionIds.has(tx.id)
    );

    if (completedDeposits.length > 0) {
      console.log(`🔄 Found ${completedDeposits.length} new completed deposits, refreshing balance...`);
      console.log("💰 Completed deposits:", completedDeposits);
      
      // Add to processed set to prevent duplicate processing
      const newIds = completedDeposits.map(tx => tx.id);
      setProcessedTransactionIds(prev => new Set([...prev, ...newIds]));
      
      // Refresh user balance with retry logic
      let balanceUpdated = false;
      let retries = 3;
      
      const refreshBalanceWithRetry = async () => {
        while (retries > 0 && !balanceUpdated) {
          try {
            await refreshUser();
            console.log("✅ Balance refreshed after detecting completed deposits");
            balanceUpdated = true;
          } catch (error) {
            console.warn(`⚠️ Balance refresh failed, retrying... (${retries} left)`);
            retries--;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      };
      
      refreshBalanceWithRetry();
    }
  }, [transactions, processedTransactionIds, refreshUser]);

  useEffect(() => {
    if (isAuthenticated) {
      console.log("🔄 Initial transaction fetch triggered");
      syncTransactionFeed({ forceRefresh: false }).then(result => {
        if (result.success) {
          setLastTransactionCount(result.count);
        }
      });
    } else {
      setTransactions([]);
      setNotificationCount(0);
      setLastTransactionCount(0);
      setProcessedTransactionIds(new Set());
      latestTransactionIdRef.current = "";
      syncInFlightRef.current = false;
    }
  }, [isAuthenticated, syncTransactionFeed]);

  useEffect(() => {
    if (!isAuthenticated || userData?.role === "admin") {
      return undefined;
    }

    const syncIfVisible = () => {
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }

      syncTransactionFeed({ forceRefresh: true, silent: true });
    };

    const intervalId = window.setInterval(syncIfVisible, 20000);

    const handleWindowFocus = () => {
      syncTransactionFeed({
        forceRefresh: true,
        refreshBalance: true,
        silent: true,
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) return;

      syncTransactionFeed({
        forceRefresh: true,
        refreshBalance: true,
        silent: true,
      });
    };

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated, syncTransactionFeed, userData?.role]);

  // Refresh transactions manually with enhanced retry logic
  const refreshTransactions = async (maxRetries = 3, delay = 2000) => {
    console.log("🔄 Manual transaction refresh triggered");
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`🔄 Refresh attempt ${attempt}/${maxRetries}`);
      
      const result = await syncTransactionFeed({
        forceRefresh: true,
        refreshBalance: true,
      });
      
      if (result.success) {
        try {
          await refreshUser();

          console.log("✅ User balance refreshed along with transactions");
        } catch (error) {
          console.warn("⚠️ Could not refresh user balance during transaction refresh");
        }
        
        return { 
          success: true, 
          newTransactions: result.count > lastTransactionCount,
          pendingCount: result.pendingCount 
        };
      } else {
        console.error(`❌ Refresh attempt ${attempt} failed`);
        if (attempt === maxRetries) {
          return { success: false, newTransactions: false };
        }
      }
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  const refreshAfterDeposit = async () => {
    console.log("🔄 Refreshing transactions after deposit creation...");
    await new Promise(resolve => setTimeout(resolve, 1000));
    return await refreshTransactions(5, 3000);
  };

  const parseJsonSafely = async (response) => {
    const text = await response.text();
    try {
      return { json: JSON.parse(text), text };
    } catch (error) {
      return { json: null, text };
    }
  };

  const createTransaction = async (payload) => {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const requestBody = buildTransactionPayload(payload);
    if (!requestBody || !requestBody.type) {
      return { success: false, error: "Invalid transaction payload" };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/Transaction/Create`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const { json: result } = await parseJsonSafely(response);
      if (!response.ok || !result?.success) {
        return {
          success: false,
          error: result?.message || `Transaction failed (${response.status})`,
        };
      }

      await forceRefreshTransactions();
      return { success: true, data: result.data };
    } catch (error) {
      console.error("Error creating transaction:", error);
      return { success: false, error: error.message || "Transaction failed" };
    }
  };

  const addTransaction = async (payload) => {
    if (payload) {
      return await createTransaction(payload);
    }

    console.log("🔄 Refreshing transaction list after deposit...");
    return await refreshAfterDeposit();
  };

  const approveTransaction = async (transactionId) => {
    console.log("Approving transaction:", transactionId);
    
    const result = await updateTransactionStatus(transactionId, TRANSACTION_STATUS.COMPLETED);
    if (result.success) {
      toast.success("Transaction approved successfully! Balance updated.");
      
      // Additional verification
      setTimeout(async () => {
        await forceRefreshTransactions();
        await refreshUser();
      }, 1000);
      
      return true;
    } else {
      toast.error(`Failed to approve transaction: ${result.error}`);
      return false;
    }
  };

  const rejectTransaction = async (transactionId) => {
    console.log("Rejecting transaction:", transactionId);
    
    const result = await updateTransactionStatus(transactionId, TRANSACTION_STATUS.FAILED);
    if (result.success) {
      toast.success("Transaction rejected successfully!");
      return true;
    } else {
      toast.error(`Failed to reject transaction: ${result.error}`);
      return false;
    }
  };

  const clearNotifications = () => {
    setNotificationCount(0);
  };

  // Memoize these derived values
  const pendingRequests = transactions.filter((tx) => tx.status === "Pending");
  const pendingDeposits = pendingRequests.filter((tx) => tx.type === "Deposit");
  const pendingWithdrawals = pendingRequests.filter((tx) => tx.type === "Withdrawal");
  const completedDeposits = transactions.filter((tx) => tx.status === "Completed" && tx.type === "Deposit");
  const totalCompletedDeposits = completedDeposits.reduce((total, tx) => total + (parseFloat(tx.amount) || 0), 0);

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        pendingRequests,
        pendingDeposits,
        pendingWithdrawals,
        completedDeposits,
        totalCompletedDeposits,
        loading,
        notificationCount,
        lastRefreshTime,
        addTransaction,
        approveTransaction,
        rejectTransaction,
        clearNotifications,
        refreshTransactions,
        refreshAfterDeposit,
        updateTransactionStatus,
        refreshUserBalance: refreshUser,
        forceRefreshTransactions,
        TRANSACTION_STATUS,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error("useTransactions must be used within a TransactionProvider");
  }
  return context;
}
