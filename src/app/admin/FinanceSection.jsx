import React, { useEffect, useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import AdminTransactions from "./AdminTransaction";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { useTransactions } from "../../context/TransactionContext";
import { useUser } from "../../context/UserContext";
import { Button } from "../../components/ui/button";
import { toast } from "react-hot-toast";
import { API_BASE_URL } from "../../config/api";
import PaginationControls from "../../components/ui/PaginationControls";
import usePagination from "../../hooks/usePagination";
import PaymentProofReview from "./PaymentProofReview";
import {
  ADMIN_BALANCE_ADJUSTMENT_OPTIONS,
  getAdminBalanceAdjustmentOption,
} from "../../constants/adminBalanceAdjustmentOptions";
import { getTransactionDestinationSummary } from "../../utils/transactionPresentation";

const buildAdjustmentPreview = ({ mode, reasonLabel, referenceName, note }) => {
  const prefix = mode === "deduct" ? "Debited for" : "Credited from";
  const referenceSuffix = referenceName ? ` - ${referenceName}` : "";
  const noteText = `${note || ""}`.trim();

  return `${prefix} ${reasonLabel}${referenceSuffix}${noteText ? `. ${noteText}` : ""}`;
};

const toSentenceCaseWords = (value = "") =>
  `${value || ""}`
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) =>
      index === 0
        ? `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`
        : word.toLowerCase()
    )
    .join(" ");

const getProfitAdjustmentDisplayLabel = ({ reasonKey, reasonLabel }) => {
  const normalizedReasonLabel = toSentenceCaseWords(reasonLabel || "Account");

  switch (`${reasonKey || ""}`.trim().toLowerCase()) {
    case "mining":
      return `${normalizedReasonLabel} reward`;
    case "stake":
      return `${normalizedReasonLabel} payout`;
    case "referral":
      return `${normalizedReasonLabel} reward`;
    default:
      return `${normalizedReasonLabel} profit`;
  }
};

const buildProfitAdjustmentPreview = ({
  reasonKey,
  reasonLabel,
  referenceName,
  previousProfit,
  nextProfit,
}) => {
  const referenceText = `${referenceName || ""}`.trim();
  const delta = Number(nextProfit) - Number(previousProfit);
  const displayLabel = getProfitAdjustmentDisplayLabel({
    reasonKey,
    reasonLabel,
  });

  if (delta < 0) {
    return `${displayLabel} updated${
      referenceText ? ` for ${referenceText}` : ""
    }: -${formatLinkedSourceAmount(Math.abs(delta))}`;
  }

  if (delta > 0) {
    return `${displayLabel} credited${
      referenceText ? ` from ${referenceText}` : ""
    }: ${formatLinkedSourceAmount(Math.abs(delta))}`;
  }

  return `${displayLabel} recorded${
    referenceText ? ` for ${referenceText}` : ""
  }`;
};

const buildLegacyProfitAdjustmentNote = ({
  reasonKey,
  reasonLabel,
  referenceName,
  previousProfit,
  nextProfit,
}) => {
  return buildProfitAdjustmentPreview({
    reasonKey,
    reasonLabel,
    referenceName,
    previousProfit,
    nextProfit,
  });
};

const PROFIT_ADJUSTMENT_REASON_KEYS = new Set([
  "copy_trade",
  "mining",
  "buy_bot",
  "daily_signal",
  "subscription",
  "stake",
  "place_trade",
  "trades_roi",
  "real_estate",
  "referral",
]);

const PROFIT_ADJUSTMENT_OPTIONS = ADMIN_BALANCE_ADJUSTMENT_OPTIONS.filter(
  (option) => PROFIT_ADJUSTMENT_REASON_KEYS.has(option.value)
);

const LEGACY_ACTIVITY_TYPE_MAP = {
  copy_trade: ["CopyTrade"],
  mining: ["Mining"],
  buy_bot: ["BuyBot"],
  daily_signal: ["Signal"],
  subscription: ["Subscription"],
  stake: ["Stake"],
  place_trade: ["PlaceTrade"],
  trades_roi: ["Trade"],
  real_estate: ["RealEstate"],
  deposit: ["Deposit"],
  withdrawal: ["Withdrawal"],
};

const formatLinkedSourceAmount = (value) => `$${Number(value || 0).toFixed(2)}`;

const readApiResponsePayload = async (response) => {
  const raw = await response.text();

  if (!raw) {
    return { body: null, raw: "" };
  }

  try {
    return {
      body: JSON.parse(raw),
      raw,
    };
  } catch {
    return {
      body: null,
      raw,
    };
  }
};

const getApiErrorMessage = (payload, fallbackMessage) => {
  const message = `${payload?.body?.message || payload?.body?.error || ""}`.trim();
  if (message) {
    return message;
  }

  const raw = `${payload?.raw || ""}`.trim();
  if (raw && !raw.startsWith("<")) {
    return raw;
  }

  return fallbackMessage;
};

const buildLegacySourceSummary = (activity = {}) => {
  const metadata = activity.metadata || {};
  const parts = [
    `${activity.description || ""}`.trim(),
    metadata.provider ? `Provider ${metadata.provider}` : "",
    metadata.winRate ? `Win Rate ${metadata.winRate}` : "",
    Number(metadata.dailySignals) > 0 ? `Signals ${Number(metadata.dailySignals)}` : "",
    Number.isFinite(Number(metadata.performance))
      ? `Performance ${Number(metadata.performance).toFixed(2)}%`
      : "",
    metadata.duration ? `Duration ${metadata.duration}` : "",
    Number.isFinite(Number(metadata.profitLoss)) && Number(metadata.profitLoss) !== 0
      ? `PnL ${formatLinkedSourceAmount(metadata.profitLoss)}`
      : "",
    Number.isFinite(Number(metadata.profitAmount)) && Number(metadata.profitAmount) !== 0
      ? `Profit ${formatLinkedSourceAmount(metadata.profitAmount)}`
      : "",
    Number.isFinite(Number(metadata.payoutUsd)) && Number(metadata.payoutUsd) !== 0
      ? `Payout ${formatLinkedSourceAmount(metadata.payoutUsd)}`
      : "",
    Number.isFinite(Number(metadata.rewardBalance)) && Number(metadata.rewardBalance) !== 0
      ? `Reward ${formatLinkedSourceAmount(metadata.rewardBalance)}`
      : "",
    Number.isFinite(Number(metadata.roi)) && Number(metadata.roi) !== 0
      ? `ROI ${Number(metadata.roi).toFixed(2)}%`
      : "",
    Number.isFinite(Number(metadata.apy)) && Number(metadata.apy) !== 0
      ? `APY ${Number(metadata.apy).toFixed(2)}%`
      : "",
    metadata.paymentMethod ? `Method ${metadata.paymentMethod}` : "",
    metadata.network ? `Network ${metadata.network}` : "",
  ].filter(Boolean);

  return parts.join(" / ") || activity.status || "Linked activity";
};

const getLegacyActivityProfit = (reasonKey, activity = {}) => {
  const metadata = activity.metadata || {};

  switch (reasonKey) {
    case "copy_trade":
      return Number(
        metadata.realizedProfit ?? metadata.settledProfit ?? metadata.profitAmount ?? 0
      );
    case "mining":
      return Number(
        metadata.rewardBalance ?? metadata.profitAmount ?? activity.amount ?? 0
      );
    case "buy_bot":
      return Number(metadata.generatedProfit ?? metadata.profitAmount ?? 0);
    case "daily_signal":
      return Number(metadata.payoutUsd ?? metadata.profitAmount ?? 0);
    case "subscription":
      return Number(metadata.payoutUsd ?? metadata.profitAmount ?? 0);
    case "stake":
      return Number(
        metadata.payoutUsd ??
          metadata.rewardUsdTotal ??
          metadata.profitAmount ??
          0
      );
    case "place_trade":
    case "trades_roi":
      return Number(metadata.profitLoss ?? metadata.profitAmount ?? 0);
    case "real_estate":
      return Number(
        metadata.payoutUsd ??
          metadata.expectedPayoutUsd ??
          metadata.profitAmount ??
          0
      );
    case "referral":
      return Number(metadata.rewardAmount ?? metadata.profitAmount ?? activity.amount ?? 0);
    default:
      return 0;
  }
};

const buildLegacyAdjustmentSources = (
  reasonKey,
  activities = [],
  scope = "balance"
) => {
  const matchingTypes = LEGACY_ACTIVITY_TYPE_MAP[reasonKey] || [];
  const reasonOption = getAdminBalanceAdjustmentOption(reasonKey);

  if (!matchingTypes.length) {
    return [];
  }

  return activities
    .filter((activity) => matchingTypes.includes(activity.type))
    .map((activity) => {
      const sourceAmount = Number(activity.amount || 0);
      const profitAmount = getLegacyActivityProfit(reasonKey, activity);
      const amount = scope === "profit" ? profitAmount : sourceAmount;

      return {
        id: activity.id,
        reasonKey,
        reasonLabel: reasonOption?.label || "Linked Activity",
        sourceFeature: reasonKey,
        entityType: activity.type || "Activity",
        referenceName:
          `${activity.title || ""}`.trim() ||
          reasonOption?.referencePlaceholder ||
          "Linked activity",
        status: `${activity.status || "Recorded"}`.trim(),
        amount,
        displayAmount: formatLinkedSourceAmount(amount),
        sourceAmount,
        displaySourceAmount: formatLinkedSourceAmount(sourceAmount),
        profitAmount,
        displayProfitAmount: formatLinkedSourceAmount(profitAmount),
        profitLabel: "Profit",
        scope,
        createdAt: activity.createdAt || null,
        summary: buildLegacySourceSummary(activity),
      };
    });
};

const downloadCsv = (filename, rows) => {
  if (typeof window === "undefined" || !Array.isArray(rows) || rows.length === 0) {
    return;
  }

  const headers = Object.keys(rows[0] || {});
  const body = rows.map((row) =>
    headers
      .map((header) => `"${`${row[header] ?? ""}`.replace(/"/g, '""')}"`)
      .join(",")
  );

  const blob = new Blob([[headers.join(","), ...body].join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export default function FinanceSection() {
  const {
    transactions,
    pendingRequests,
    pendingDeposits,
    pendingWithdrawals,
    notificationCount,
    clearNotifications,
    loading: transactionsLoading,
    approveTransaction,
    rejectTransaction,
  } = useTransactions();

  const { userData, refreshUser } = useUser();
  const [activeTab, setActiveTab] = useState("transactions");
  const [processingId, setProcessingId] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [adjustmentKind, setAdjustmentKind] = useState("balance");
  const [adjustMode, setAdjustMode] = useState("increase");
  const [adjustReasonKey, setAdjustReasonKey] = useState("copy_trade");
  const [adjustReference, setAdjustReference] = useState("");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [adjustLinkedRecordId, setAdjustLinkedRecordId] = useState("");
  const [adjustmentSources, setAdjustmentSources] = useState([]);
  const [adjustmentSourcesLoading, setAdjustmentSourcesLoading] = useState(false);
  const [adjustmentSourcesError, setAdjustmentSourcesError] = useState("");
  const [adjustingBalance, setAdjustingBalance] = useState(false);
  const adminSelectClassName =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 [color-scheme:light] focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:[color-scheme:dark]";
  const adminOptionClassName =
    "bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100";
  const {
    currentPage: depositPage,
    pageSize: depositPageSize,
    totalPages: depositTotalPages,
    paginatedItems: paginatedDeposits,
    setCurrentPage: setDepositPage,
    setPageSize: setDepositPageSize,
  } = usePagination(pendingDeposits, {
    initialPageSize: 6,
    resetDeps: [activeTab],
  });
  const {
    currentPage: withdrawalPage,
    pageSize: withdrawalPageSize,
    totalPages: withdrawalTotalPages,
    paginatedItems: paginatedWithdrawals,
    setCurrentPage: setWithdrawalPage,
    setPageSize: setWithdrawalPageSize,
  } = usePagination(pendingWithdrawals, {
    initialPageSize: 6,
    resetDeps: [activeTab],
  });

  // Refresh data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refreshUser();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshUser]);

  // Calculate totals
  const totalDeposits = transactions
    .filter((tx) => tx.type === "Deposit" && tx.status === "Completed")
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  const totalWithdrawals = transactions
    .filter((tx) => tx.type === "Withdrawal" && tx.status === "Completed")
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  const selectedUser = users.find((user) => user.id === selectedUserId) || null;
  const isProfitAdjustmentMode = adjustmentKind === "profit";
  const availableAdjustmentOptions = isProfitAdjustmentMode
    ? PROFIT_ADJUSTMENT_OPTIONS
    : ADMIN_BALANCE_ADJUSTMENT_OPTIONS;
  const selectedReasonOption = getAdminBalanceAdjustmentOption(adjustReasonKey);
  const selectedLinkedRecord =
    adjustmentSources.find((source) => source.id === adjustLinkedRecordId) || null;
  const selectedReferenceName =
    selectedLinkedRecord?.referenceName || adjustReference.trim();
  const adjustmentPreview = isProfitAdjustmentMode
    ? buildProfitAdjustmentPreview({
        reasonKey: adjustReasonKey,
        reasonLabel: selectedReasonOption?.label || "Linked Profit",
        referenceName: selectedReferenceName,
        previousProfit: Number(selectedLinkedRecord?.profitAmount || 0),
        nextProfit: adjustAmount,
      })
    : buildAdjustmentPreview({
        mode: adjustMode,
        reasonLabel: selectedReasonOption?.label || "Manual Adjustment",
        referenceName: selectedReferenceName,
        note: adjustNote,
      });

  const getToken = () =>
    (localStorage.getItem("authToken") || "").replace(/^["']|["']$/g, "").trim();

  const fetchAdminUsers = async () => {
    try {
      setUsersLoading(true);
      const token = getToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/Admin/Users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setUsers(result.data || []);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Failed to load admin users", error);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  useEffect(() => {
    if (!isProfitAdjustmentMode) return;
    if (PROFIT_ADJUSTMENT_REASON_KEYS.has(adjustReasonKey)) return;

    setAdjustReasonKey(PROFIT_ADJUSTMENT_OPTIONS[0]?.value || "copy_trade");
  }, [adjustReasonKey, isProfitAdjustmentMode]);

  useEffect(() => {
    let cancelled = false;

    const fetchAdjustmentSources = async () => {
      setAdjustLinkedRecordId("");
      setAdjustReference("");
      setAdjustmentSources([]);
      setAdjustmentSourcesError("");
      setAdjustmentSourcesLoading(false);

      if (!selectedUserId || !adjustReasonKey) {
        return;
      }

      try {
        setAdjustmentSourcesLoading(true);
        const token = getToken();
        if (!token) {
          throw new Error("Missing admin session token.");
        }

        const response = await fetch(
          `${API_BASE_URL}/Admin/Users/${selectedUserId}/AdjustmentSources?reasonKey=${encodeURIComponent(
            adjustReasonKey
          )}&limit=80&scope=${isProfitAdjustmentMode ? "profit" : "balance"}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        const payload = await readApiResponsePayload(response);
        if (response.ok && payload?.body?.success) {
          if (!cancelled) {
            setAdjustmentSources(payload.body?.data?.sources || []);
          }
          return;
        }

        if (response.status === 404) {
          const fallbackResponse = await fetch(
            `${API_BASE_URL}/Admin/Users/${selectedUserId}/Activities?limit=180`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            }
          );

          const fallbackPayload = await readApiResponsePayload(fallbackResponse);
          if (fallbackResponse.ok && fallbackPayload?.body?.success) {
            if (!cancelled) {
              setAdjustmentSources(
                buildLegacyAdjustmentSources(
                  adjustReasonKey,
                  fallbackPayload.body?.data?.activities || [],
                  isProfitAdjustmentMode ? "profit" : "balance"
                )
              );
            }
            return;
          }

          throw new Error(
            getApiErrorMessage(
              fallbackPayload,
              "Unable to load linked feature records."
            )
          );
        }

        throw new Error(
          getApiErrorMessage(payload, "Failed to load linked balance sources.")
        );
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load adjustment sources", error);
          setAdjustmentSources([]);
          setAdjustmentSourcesError(
            error?.message || "Unable to load linked feature records."
          );
        }
      } finally {
        if (!cancelled) {
          setAdjustmentSourcesLoading(false);
        }
      }
    };

    fetchAdjustmentSources();

    return () => {
      cancelled = true;
    };
  }, [selectedUserId, adjustReasonKey, isProfitAdjustmentMode]);

  const handleLinkedRecordChange = (event) => {
    const nextId = event.target.value;
    setAdjustLinkedRecordId(nextId);

    if (!nextId) {
      setAdjustReference("");
      return;
    }

    const matchedSource =
      adjustmentSources.find((source) => source.id === nextId) || null;
    setAdjustReference(matchedSource?.referenceName || "");
  };

  const handleAdjustBalance = async () => {
    if (!selectedUserId) {
      toast.error("Select a user first.");
      return;
    }
    if (!adjustReasonKey) {
      toast.error(
        isProfitAdjustmentMode
          ? "Select the feature for this profit correction."
          : "Select the feature or reason for this balance adjustment."
      );
      return;
    }

    const amountValue = Number(adjustAmount);
    if (!Number.isFinite(amountValue)) {
      toast.error(
        isProfitAdjustmentMode
          ? "Enter a valid profit amount."
          : "Enter a valid amount."
      );
      return;
    }

    if (!isProfitAdjustmentMode && amountValue <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }

    if (isProfitAdjustmentMode && !adjustLinkedRecordId) {
      toast.error("Select the linked record whose profit you want to revise.");
      return;
    }

    try {
      setAdjustingBalance(true);
      const token = getToken();
      const endpoint = isProfitAdjustmentMode
        ? `${API_BASE_URL}/Admin/AdjustFeatureProfit`
        : `${API_BASE_URL}/Admin/AdjustBalance`;
      const previousProfitValue = Number(selectedLinkedRecord?.profitAmount || 0);
      const requestBody = isProfitAdjustmentMode
        ? {
            userId: selectedUserId,
            reasonKey: adjustReasonKey,
            relatedEntityId: adjustLinkedRecordId,
            profitAmount: amountValue,
            note: adjustNote.trim(),
          }
        : {
            userId: selectedUserId,
            amount: amountValue,
            operation: adjustMode,
            reasonKey: adjustReasonKey,
            referenceName: adjustReference.trim(),
            relatedEntityId: adjustLinkedRecordId,
            note: adjustNote.trim(),
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      let result = await readApiResponsePayload(response);
      if (
        isProfitAdjustmentMode &&
        response.status === 404
      ) {
        const deltaValue = amountValue - previousProfitValue;
        const absoluteDelta = Math.abs(deltaValue);

        if (absoluteDelta <= 0.000001) {
          result = {
            body: {
              success: true,
              data: {
                unchanged: true,
                updatedProfit: amountValue,
                previousProfit: previousProfitValue,
                delta: 0,
                balance: Number(selectedUser?.balance || 0),
                referenceName: selectedReferenceName,
                usedLegacyFallback: true,
              },
            },
          };
        } else {
          const fallbackResponse = await fetch(`${API_BASE_URL}/Admin/AdjustBalance`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              userId: selectedUserId,
              amount: absoluteDelta,
              operation: deltaValue < 0 ? "deduct" : "increase",
              reasonKey: adjustReasonKey,
              referenceName: selectedReferenceName,
              relatedEntityId: adjustLinkedRecordId,
              note: buildLegacyProfitAdjustmentNote({
                reasonKey: adjustReasonKey,
                reasonLabel: selectedReasonOption?.label || "Linked Profit",
                referenceName: selectedReferenceName,
                previousProfit: previousProfitValue,
                nextProfit: amountValue,
              }),
            }),
          });

          const fallbackPayload = await readApiResponsePayload(fallbackResponse);
          if (!fallbackResponse.ok || !fallbackPayload?.body?.success) {
            throw new Error(
              getApiErrorMessage(
                fallbackPayload,
                "The deployed backend is missing the profit adjustment endpoint."
              )
            );
          }

          result = {
            body: {
              ...fallbackPayload.body,
              data: {
                ...fallbackPayload.body?.data,
                updatedProfit: amountValue,
                previousProfit: previousProfitValue,
                delta: deltaValue,
                referenceName:
                  fallbackPayload.body?.data?.referenceName || selectedReferenceName,
                usedLegacyFallback: true,
              },
            },
          };
        }
      }

      if (!response.ok && !(isProfitAdjustmentMode && response.status === 404)) {
        throw new Error(
          getApiErrorMessage(result, `Request failed (${response.status})`)
        );
      }

      if (!result?.body?.success) {
        throw new Error(getApiErrorMessage(result, "Request failed."));
      }

      const responseData = result.body?.data || {};
      const updatedBalance = Number(responseData?.balance || 0).toFixed(2);
      if (isProfitAdjustmentMode) {
        if (responseData?.unchanged) {
          toast.success(
            `Profit already set at ${formatLinkedSourceAmount(
              responseData?.updatedProfit || 0
            )} for ${responseData?.referenceName || selectedReferenceName}.`
          );
        } else {
          const deltaValue = Number(responseData?.delta || 0);
          toast.success(
            `Profit updated to ${formatLinkedSourceAmount(
              responseData?.updatedProfit || 0
            )} for ${responseData?.referenceName || selectedReferenceName}. Balance ${
              deltaValue >= 0 ? "credited" : "debited"
            } by ${formatLinkedSourceAmount(Math.abs(deltaValue))}. New balance: $${updatedBalance}`
          );
        }
      } else {
        toast.success(
          `${adjustMode === "increase" ? "Credited" : "Deducted"} $${amountValue.toFixed(
            2
          )} for ${responseData?.reasonLabel || selectedReasonOption?.label}. New balance: $${updatedBalance}`
        );
      }
      setAdjustAmount("");
      setAdjustLinkedRecordId("");
      setAdjustReference("");
      setAdjustNote("");
      await Promise.all([fetchAdminUsers(), refreshUser()]);
    } catch (error) {
      toast.error(error.message || "Failed to adjust balance.");
    } finally {
      setAdjustingBalance(false);
    }
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    if (value === "deposits") {
      clearNotifications();
    }
  };

  const handleApprove = async (transactionId) => {
    try {
      setProcessingId(transactionId);
      await approveTransaction(transactionId);
      toast.success("Transaction approved successfully");
      refreshUser();
    } catch (error) {
      toast.error("Failed to approve transaction: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (transactionId) => {
    try {
      setProcessingId(transactionId);
      await rejectTransaction(transactionId);
      toast.success("Transaction rejected");
      refreshUser();
    } catch (error) {
      toast.error("Failed to reject transaction: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleExportTransactions = () => {
    downloadCsv(
      `coinquestx-admin-transactions-${new Date().toISOString().slice(0, 10)}.csv`,
      transactions.map((tx) => ({
        id: tx.id,
        userName: tx.userName || "",
        userEmail: tx.userEmail || "",
        type: tx.type,
        status: tx.status,
        amount: tx.amount,
        currency: tx.currency,
        paymentMethod: tx.method || tx.paymentMethod || "",
        destination:
          getTransactionDestinationSummary(tx) ||
          (tx.type === "Withdrawal" ? tx.details || "" : ""),
        sourceFeature: tx.sourceFeature || "",
        balanceBefore: tx.balanceBefore ?? "",
        balanceAfter: tx.balanceAfter ?? "",
        actorRole: tx.actorRole || "",
        actorLabel: tx.actorLabel || "",
        adjustmentReason: tx.metadata?.reasonLabel || "",
        linkedRecord: tx.metadata?.referenceName || "",
        linkedRecordType: tx.metadata?.relatedEntityType || "",
        linkedRecordStatus: tx.metadata?.relatedEntityStatus || "",
        linkedRecordId: tx.metadata?.relatedEntityId || "",
        adminNote: tx.metadata?.note || "",
        userFacingSummary: tx.metadata?.userFacingSummary || "",
        createdAt: tx.createdAt || tx.date || "",
        details: tx.details || "",
      }))
    );
    toast.success("Transactions exported.");
  };

  const handleExportPending = (kind) => {
    const rows = kind === "withdrawals" ? pendingWithdrawals : pendingDeposits;
    downloadCsv(
      `coinquestx-admin-${kind}-${new Date().toISOString().slice(0, 10)}.csv`,
      rows.map((tx) => ({
        id: tx.id,
        userName: tx.userName || "",
        userEmail: tx.userEmail || "",
        amount: tx.amount,
        currency: tx.currency,
        method: tx.method || tx.paymentMethod || "",
        destination:
          getTransactionDestinationSummary(tx) ||
          (tx.type === "Withdrawal" ? tx.details || "" : ""),
        status: tx.status,
        createdAt: tx.createdAt || tx.date || "",
        details: tx.details || "",
      }))
    );
    toast.success(`${kind === "withdrawals" ? "Withdrawals" : "Deposits"} exported.`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Financial Overview</h3>
              <p className="text-sm text-gray-500">
                Monitor pending requests, export audit-ready transaction data, and review balance movement.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleExportTransactions}>
                Export Transactions CSV
              </Button>
              <Button variant="outline" onClick={() => handleExportPending("deposits")}>
                Export Pending Deposits
              </Button>
              <Button variant="outline" onClick={() => handleExportPending("withdrawals")}>
                Export Pending Withdrawals
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-50 dark:bg-blue-900/20">
              <CardContent className="p-4">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Total Balance
                </h4>
                <p className="text-2xl font-bold mt-2">
                  ${userData?.balance?.toFixed(2) || "0.00"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-900/20">
              <CardContent className="p-4">
                <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Total Deposits
                </h4>
                <p className="text-2xl font-bold mt-2">
                  ${totalDeposits.toFixed(2)}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 dark:bg-yellow-900/20">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Pending Deposits
                  </h4>
                  {pendingDeposits.length > 0 && (
                    <span className="inline-flex h-6 items-center rounded-full bg-yellow-500 px-2 text-xs font-semibold text-white">
                      {pendingDeposits.length} new
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold mt-2">
                  {pendingDeposits.length}
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Admin Balance Controls</h3>
          <p className="text-sm text-gray-500 mb-5">
            Credit or deduct balance directly, or revise a completed feature profit so the linked ledger entry explains exactly what changed.
          </p>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">Correction Type</label>
              <select
                value={adjustmentKind}
                onChange={(e) => setAdjustmentKind(e.target.value)}
                className={adminSelectClassName}
              >
                <option value="balance" className={adminOptionClassName}>
                  Balance Adjustment
                </option>
                <option value="profit" className={adminOptionClassName}>
                  Profit History Correction
                </option>
              </select>
              <p className="mt-2 text-xs text-gray-500">
                {isProfitAdjustmentMode
                  ? "Set a new profit amount for a linked feature record. The system will credit or debit only the difference."
                  : "Apply a direct balance movement and attach it to a real feature record for clean ledger history."}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">User</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className={adminSelectClassName}
                disabled={usersLoading}
              >
                <option value="" className={adminOptionClassName}>
                  {usersLoading ? "Loading users..." : "Select a user"}
                </option>
                {users.map((user) => (
                  <option key={user.id} value={user.id} className={adminOptionClassName}>
                    {user.firstName} {user.lastName} ({user.email})
                  </option>
                ))}
              </select>
              {selectedUser && (
                <p className="text-xs text-gray-500 mt-2">
                  Current Balance: ${Number(selectedUser.balance || 0).toFixed(2)}
                </p>
              )}
            </div>

            {!isProfitAdjustmentMode && (
              <div>
                <label className="block text-sm font-medium mb-2">Operation</label>
                <select
                  value={adjustMode}
                  onChange={(e) => setAdjustMode(e.target.value)}
                  className={adminSelectClassName}
                >
                  <option value="increase" className={adminOptionClassName}>
                    Increase Balance
                  </option>
                  <option value="deduct" className={adminOptionClassName}>
                    Deduct Balance
                  </option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Feature / Reason</label>
              <select
                value={adjustReasonKey}
                onChange={(e) => setAdjustReasonKey(e.target.value)}
                className={adminSelectClassName}
              >
                {availableAdjustmentOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className={adminOptionClassName}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-500">
                {selectedReasonOption?.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {isProfitAdjustmentMode ? "New Profit Amount (USD)" : "Amount (USD)"}
              </label>
              <input
                type="number"
                min={isProfitAdjustmentMode ? undefined : "0.01"}
                step="0.01"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder={
                  isProfitAdjustmentMode
                    ? "Enter the revised settled profit"
                    : "Enter amount"
                }
                className="w-full rounded-md border px-3 py-2 bg-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {isProfitAdjustmentMode
                  ? "Linked profit record"
                  : "Linked feature record"}
              </label>
              <select
                value={adjustLinkedRecordId}
                onChange={handleLinkedRecordChange}
                className={adminSelectClassName}
                disabled={!selectedUserId || adjustmentSourcesLoading}
              >
                <option value="" className={adminOptionClassName}>
                  {adjustmentSourcesLoading
                    ? "Loading linked records..."
                    : adjustmentSources.length > 0
                    ? "Use manual reference"
                    : "No linked records for this reason"}
                </option>
                {adjustmentSources.map((source) => (
                  <option
                    key={source.id}
                    value={source.id}
                    className={adminOptionClassName}
                  >
                    {source.referenceName} ({source.status || "Recorded"} /{" "}
                    {source.displayAmount || "$0.00"})
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-500">
                {isProfitAdjustmentMode
                  ? "Pick the exact product record whose settled profit should be revised."
                  : "Pick the exact product or record the user is using so the ledger and notification can show the real source of the credit or debit."}
              </p>
              {adjustmentSourcesError ? (
                <p className="mt-2 text-xs text-rose-500">{adjustmentSourcesError}</p>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {selectedLinkedRecord
                  ? "Linked record label"
                  : selectedReasonOption?.referenceLabel || "Reference"}
              </label>
              <input
                type="text"
                value={adjustReference}
                onChange={(e) => setAdjustReference(e.target.value)}
                placeholder={
                  selectedLinkedRecord
                    ? selectedLinkedRecord.referenceName
                    :
                  selectedReasonOption?.referencePlaceholder || "Enter a linked record"
                }
                className="w-full rounded-md border px-3 py-2 bg-transparent disabled:opacity-70"
                disabled={Boolean(selectedLinkedRecord)}
              />
            </div>

            <div className="xl:col-span-2">
              <label className="block text-sm font-medium mb-2">Admin note (optional)</label>
              <textarea
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                placeholder="Add a short explanation that the user should see in their activity history"
                rows={3}
                className="w-full rounded-md border px-3 py-2 bg-transparent"
              />
            </div>

            {selectedLinkedRecord && (
              <div className="xl:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-500">
                  {isProfitAdjustmentMode ? "Profit Source Preview" : "Linked Source Preview"}
                </p>
                <div className="mt-3 grid gap-3 text-sm md:grid-cols-4">
                  <div>
                    <p className="text-xs text-gray-500">Record</p>
                    <p className="mt-1 font-medium">{selectedLinkedRecord.referenceName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="mt-1 font-medium">{selectedLinkedRecord.status || "Recorded"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Source Amount</p>
                    <p className="mt-1 font-medium">
                      {selectedLinkedRecord.displaySourceAmount ||
                        selectedLinkedRecord.displayAmount ||
                        "$0.00"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">
                      {selectedLinkedRecord.profitLabel || "Profit"}
                    </p>
                    <p className="mt-1 font-medium">
                      {selectedLinkedRecord.displayProfitAmount || "$0.00"}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-600 dark:text-slate-300">
                  {selectedLinkedRecord.summary}
                </p>
                {isProfitAdjustmentMode && Number.isFinite(Number(adjustAmount)) ? (
                  <p className="mt-3 text-sm text-teal-600 dark:text-teal-300">
                    Balance delta after revision:{" "}
                    {formatLinkedSourceAmount(
                      Math.abs(
                        Number(adjustAmount || 0) -
                          Number(selectedLinkedRecord.profitAmount || 0)
                      )
                    )}{" "}
                    {Number(adjustAmount || 0) >=
                    Number(selectedLinkedRecord.profitAmount || 0)
                      ? "credit"
                      : "debit"}
                  </p>
                ) : null}
              </div>
            )}
          </div>

          <div className="mt-5 rounded-xl border border-teal-500/20 bg-teal-500/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-500">
              {isProfitAdjustmentMode
                ? "User-facing profit revision preview"
                : "User-facing entry preview"}
            </p>
            <p className="mt-2 text-sm font-medium">{adjustmentPreview}</p>
          </div>

          <div className="mt-5 flex justify-end">
            <Button
              onClick={handleAdjustBalance}
              disabled={adjustingBalance || usersLoading || !selectedUserId}
            >
              {adjustingBalance
                ? "Applying..."
                : isProfitAdjustmentMode
                ? "Update Profit History"
                : adjustMode === "increase"
                ? "Increase Balance"
                : "Deduct Balance"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="transactions">All Transactions</TabsTrigger>
          <TabsTrigger value="deposits">
            <div className="flex items-center gap-2">
              Pending Deposits
              {pendingDeposits.length > 0 && (
                <span className="w-5 h-5 flex items-center justify-center bg-yellow-500 text-white text-xs rounded-full">
                  {pendingDeposits.length}
                </span>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger value="withdrawals">
            <div className="flex items-center gap-2">
              Pending Withdrawals
              {pendingWithdrawals.length > 0 && (
                <span className="w-5 h-5 flex items-center justify-center bg-yellow-500 text-white text-xs rounded-full">
                  {pendingWithdrawals.length}
                </span>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger value="payment-proofs">Payment Proofs</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <AdminTransactions
            transactions={transactions}
            loading={transactionsLoading}
          />
        </TabsContent>

        <TabsContent value="deposits">
          <Card>
            <CardContent className="pt-6">
              {pendingDeposits.length === 0 ? (
                <p className="text-center py-4 text-gray-500">
                  No pending deposits
                </p>
              ) : (
                <div className="space-y-4">
                  {paginatedDeposits.map((deposit) => (
                    <div
                      key={deposit.id}
                      className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <h4 className="font-medium">{deposit.userName}</h4>
                        <p className="text-sm text-gray-500">
                          ${deposit.amount} via {deposit.method}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(deposit.date).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(deposit.id)}
                          disabled={
                            processingId === deposit.id || transactionsLoading
                          }
                        >
                          {processingId === deposit.id
                            ? "Processing..."
                            : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(deposit.id)}
                          disabled={
                            processingId === deposit.id || transactionsLoading
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="border-t pt-4">
                    <PaginationControls
                      currentPage={depositPage}
                      totalPages={depositTotalPages}
                      totalItems={pendingDeposits.length}
                      pageSize={depositPageSize}
                      onPageChange={setDepositPage}
                      onPageSizeChange={setDepositPageSize}
                      pageSizeOptions={[6, 12, 24]}
                      itemLabel="deposits"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
          <Card>
            <CardContent className="pt-6">
              {pendingWithdrawals.length === 0 ? (
                <p className="text-center py-4 text-gray-500">
                  No pending withdrawals
                </p>
              ) : (
                <div className="space-y-4">
                  {paginatedWithdrawals.map((withdrawal) => {
                    const destinationSummary =
                      getTransactionDestinationSummary(withdrawal) ||
                      withdrawal.details ||
                      "";

                    return (
                    <div
                      key={withdrawal.id}
                      className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <h4 className="font-medium">{withdrawal.userName}</h4>
                        <p className="text-xs text-gray-500">
                          {withdrawal.userEmail || "No email on file"}
                        </p>
                        <p className="text-sm text-gray-500">
                          ${withdrawal.amount} via {withdrawal.method}
                        </p>
                        {destinationSummary && (
                          <p className="text-xs text-gray-500 break-words">
                            {destinationSummary}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          {new Date(withdrawal.date).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(withdrawal.id)}
                          disabled={
                            processingId === withdrawal.id ||
                            transactionsLoading
                          }
                        >
                          {processingId === withdrawal.id
                            ? "Processing..."
                            : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(withdrawal.id)}
                          disabled={
                            processingId === withdrawal.id ||
                            transactionsLoading
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                    );
                  })}

                  <div className="border-t pt-4">
                    <PaginationControls
                      currentPage={withdrawalPage}
                      totalPages={withdrawalTotalPages}
                      totalItems={pendingWithdrawals.length}
                      pageSize={withdrawalPageSize}
                      onPageChange={setWithdrawalPage}
                      onPageSizeChange={setWithdrawalPageSize}
                      pageSizeOptions={[6, 12, 24]}
                      itemLabel="withdrawals"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment-proofs">
          <PaymentProofReview />
        </TabsContent>
      </Tabs>
    </div>
  );
}
