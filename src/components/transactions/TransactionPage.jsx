"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useTheme } from "next-themes";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Filter,
  RefreshCw,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { useTransactions } from "../../context/TransactionContext";
import PaginationControls from "../ui/PaginationControls";
import { formatCurrencyAmount } from "../../utils/currency";
import {
  formatTransactionAmount,
  getAdjustmentDelta,
  getAdjustmentReferenceLabel,
  getTransactionDestinationSummary,
  getTransactionDisplayDetails,
  getTransactionSourceLabel,
  getTransactionTypeLabel,
} from "../../utils/transactionPresentation";

const FILTER_STORAGE_KEY = "coinquestx:transaction-history-filter-v2";
const SEARCH_STORAGE_KEY = "coinquestx:transaction-history-search-v2";

const FILTER_OPTIONS = [
  { value: "all", label: "All activity" },
  { value: "Deposit", label: "Deposits" },
  { value: "Withdrawal", label: "Withdrawals" },
  { value: "Subscription", label: "Subscriptions" },
  { value: "Signal", label: "Signals" },
  { value: "BuyBot", label: "Bots" },
  { value: "Adjustment", label: "Credits & debits" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "Pending", label: "Pending" },
  { value: "Completed", label: "Completed" },
  { value: "Failed", label: "Failed" },
  { value: "Cancelled", label: "Cancelled" },
];

const safeReadStorage = (key, fallback = "") => {
  try {
    if (typeof window === "undefined") return fallback;
    return sessionStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};

const formatDate = (value) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleString();
};

const hasSnapshotValue = (value) =>
  value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));

const formatBalanceSnapshot = (value, currency = "USD") =>
  hasSnapshotValue(value) ? formatCurrencyAmount(Number(value), currency) : "N/A";

const downloadCsv = (rows) => {
  if (typeof window === "undefined" || rows.length === 0) return;
  const headers = [
    "Type",
    "Status",
    "Amount",
    "Currency",
    "Source",
    "Balance Before",
    "Balance After",
    "Reason",
    "Reference",
    "Admin Note",
    "Payment Method",
    "Destination",
    "Actor",
    "Created At",
    "Details",
  ];
  const body = rows.map((row) =>
    {
      const destinationSummary =
        getTransactionDestinationSummary(row) ||
        (row.type === "Withdrawal" ? row.details || "" : "");

      return [
        getTransactionTypeLabel(row),
        row.status,
        row.amount,
        row.currency,
        row.sourceFeature,
        row.balanceBefore,
        row.balanceAfter,
        row.metadata?.reasonLabel || "",
        row.metadata?.referenceName || "",
        row.metadata?.note || "",
        row.method || row.paymentMethod || "",
        destinationSummary,
        row.actorLabel || row.actorRole || "",
        row.createdAt || row.date || "",
        getTransactionDisplayDetails(row),
      ]
        .map((cell) => `"${`${cell ?? ""}`.replace(/"/g, '""')}"`)
        .join(",");
    }
  );

  const blob = new Blob([[headers.join(","), ...body].join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `coinquestx-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const getStatusTone = (status = "", isDark = false) => {
  switch (`${status}`.toLowerCase()) {
    case "completed":
      return isDark
        ? "bg-emerald-500/15 text-emerald-300"
        : "bg-emerald-100 text-emerald-700";
    case "pending":
      return isDark
        ? "bg-amber-500/15 text-amber-300"
        : "bg-amber-100 text-amber-700";
    case "failed":
    case "cancelled":
      return isDark ? "bg-rose-500/15 text-rose-300" : "bg-rose-100 text-rose-700";
    default:
      return isDark ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-700";
  }
};

const buildWorkflowSteps = (transaction = {}) => {
  const workflow = transaction.workflow || {};
  return [
    {
      key: "submittedAt",
      label: "Submitted",
      active: Boolean(workflow.submittedAt || transaction.createdAt),
      value: workflow.submittedAt || transaction.createdAt,
    },
    {
      key: "pendingAt",
      label: "Under Review",
      active: Boolean(workflow.pendingAt || `${transaction.status}` === "Pending"),
      value: workflow.pendingAt || null,
    },
    {
      key: "completedAt",
      label: "Completed",
      active: Boolean(workflow.completedAt || `${transaction.status}` === "Completed"),
      value: workflow.completedAt || null,
    },
    {
      key: "failedAt",
      label: "Failed",
      active: Boolean(workflow.failedAt || `${transaction.status}` === "Failed"),
      value: workflow.failedAt || null,
    },
    {
      key: "cancelledAt",
      label: "Cancelled",
      active: Boolean(workflow.cancelledAt || `${transaction.status}` === "Cancelled"),
      value: workflow.cancelledAt || null,
    },
  ];
};

export default function TransactionPage() {
  const { theme } = useTheme();
  const { transactions, loading, refreshTransactions, lastRefreshTime } = useTransactions();
  const isDark = theme === "dark";
  const requestedInitialRefreshRef = useRef(false);
  const [typeFilter, setTypeFilter] = useState(() =>
    safeReadStorage(FILTER_STORAGE_KEY, "all")
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState(() =>
    safeReadStorage(SEARCH_STORAGE_KEY, "")
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedTransactionId, setSelectedTransactionId] = useState("");

  useEffect(() => {
    if (requestedInitialRefreshRef.current) return;
    if (loading || transactions.length > 0) return;

    requestedInitialRefreshRef.current = true;
    refreshTransactions?.(1, 0);
  }, [loading, refreshTransactions, transactions.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(FILTER_STORAGE_KEY, typeFilter);
  }, [typeFilter]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(SEARCH_STORAGE_KEY, searchTerm);
  }, [searchTerm]);

  const filteredTransactions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return [...transactions].filter((tx) => {
      const matchesType = typeFilter === "all" || tx.type === typeFilter;
      const matchesStatus = statusFilter === "all" || tx.status === statusFilter;
      if (!matchesType || !matchesStatus) return false;
      if (!query) return true;

      const searchable = [
        tx.id,
        tx.type,
        tx.status,
        tx.currency,
        tx.method,
        tx.paymentMethod,
        tx.details,
        tx.sourceFeature,
        tx.actorLabel,
        tx.metadata?.reasonLabel,
        tx.metadata?.referenceName,
        tx.metadata?.note,
        tx.metadata?.userFacingSummary,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [transactions, typeFilter, statusFilter, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, statusFilter, searchTerm, pageSize, filteredTransactions.length]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  const selectedTransaction = useMemo(
    () =>
      filteredTransactions.find((item) => item.id === selectedTransactionId) ||
      paginatedTransactions[0] ||
      null,
    [filteredTransactions, paginatedTransactions, selectedTransactionId]
  );

  useEffect(() => {
    if (selectedTransaction?.id) {
      setSelectedTransactionId(selectedTransaction.id);
    }
  }, [selectedTransaction?.id]);

  const summary = useMemo(() => {
    return transactions.reduce(
      (accumulator, tx) => {
        accumulator.total += 1;
        if (tx.status === "Completed") accumulator.completed += 1;
        if (tx.status === "Pending") accumulator.pending += 1;
        if (tx.type === "Deposit" && tx.status === "Completed") {
          accumulator.inflow += Number(tx.amount) || 0;
        }
        if (tx.type === "Withdrawal" && tx.status === "Completed") {
          accumulator.outflow += Number(tx.amount) || 0;
        }
        if (tx.type === "Adjustment" && tx.status === "Completed") {
          if (hasSnapshotValue(tx.balanceBefore) && hasSnapshotValue(tx.balanceAfter)) {
            const before = Number(tx.balanceBefore);
            const after = Number(tx.balanceAfter);
            accumulator.adjustments += after - before;
          }
        }
        return accumulator;
      },
      { total: 0, completed: 0, pending: 0, inflow: 0, outflow: 0, adjustments: 0 }
    );
  }, [transactions]);

  const currentCurrency = selectedTransaction?.currency || "USD";
  const selectedDestinationSummary = selectedTransaction
    ? getTransactionDestinationSummary(selectedTransaction) ||
      (selectedTransaction.type === "Withdrawal"
        ? selectedTransaction.details || ""
        : "")
    : "";
  const emptyMessage = searchTerm.trim()
    ? `No ledger items matched "${searchTerm.trim()}".`
    : "Your account ledger will populate here as deposits, withdrawals, subscriptions, and product activity are recorded.";
  const topCardClass = isDark
    ? "border-slate-700 bg-slate-900 text-slate-100"
    : "border-slate-200 bg-white text-slate-900";
  const mutedClass = isDark ? "text-slate-300" : "text-slate-600";

  return (
    <section
      className={`min-h-screen w-full min-w-0 px-4 py-8 sm:px-6 lg:px-8 ${
        isDark ? "bg-zinc-950 text-slate-100" : "bg-gray-50 text-slate-900"
      }`}
    >
      <div className="mx-auto w-full max-w-[1600px] space-y-6">
        <div className={`rounded-3xl border p-6 shadow-xl ${topCardClass}`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-2">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-teal-400">
                <WalletCards className="h-4 w-4" strokeWidth={2.2} />
                Ledger & Audit Trail
              </p>
              <h1 className="text-3xl font-semibold">Every account movement in one timeline.</h1>
              <p className={`max-w-3xl text-sm sm:text-base ${mutedClass}`}>
                Review deposits, withdrawals, subscriptions, credits, debits, and product activity with
                balance before/after snapshots and workflow status.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => refreshTransactions?.()}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold ${
                  isDark
                    ? "border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                <RefreshCw className="h-4 w-4" strokeWidth={2.2} />
                Refresh
              </button>
              <button
                onClick={() => downloadCsv(filteredTransactions)}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:from-teal-500 hover:to-cyan-500"
              >
                <Download className="h-4 w-4" strokeWidth={2.2} />
                Export CSV
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 min-[1500px]:grid-cols-4">
            <MetricCard
              label="Total Records"
              value={`${summary.total}`}
              icon={ShieldCheck}
              accent="text-teal-400"
              isDark={isDark}
            />
            <MetricCard
              label="Completed"
              value={`${summary.completed}`}
              icon={ArrowUpRight}
              accent="text-emerald-400"
              isDark={isDark}
            />
            <MetricCard
              label="Pending Review"
              value={`${summary.pending}`}
              icon={Filter}
              accent="text-amber-400"
              isDark={isDark}
            />
            <MetricCard
              label="Net Wallet Flow"
              value={formatCurrencyAmount(
                summary.inflow - summary.outflow + summary.adjustments,
                currentCurrency
              )}
              icon={ArrowDownLeft}
              accent="text-cyan-400"
              isDark={isDark}
            />
          </div>
        </div>

        <div className="grid items-start gap-6 min-[1500px]:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.9fr)]">
          <div className={`min-w-0 rounded-3xl border p-5 shadow-xl ${topCardClass}`}>
            <div className="grid gap-3 md:grid-cols-2 min-[1500px]:grid-cols-3">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Activity Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm ${
                    isDark
                      ? "border-slate-700 bg-slate-950 text-slate-100"
                      : "border-slate-300 bg-white text-slate-900"
                  }`}
                >
                  {FILTER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm ${
                    isDark
                      ? "border-slate-700 bg-slate-950 text-slate-100"
                      : "border-slate-300 bg-white text-slate-900"
                  }`}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Search
                </label>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search entries"
                  className={`w-full rounded-2xl border px-4 py-3 text-sm ${
                    isDark
                      ? "border-slate-700 bg-slate-950 text-slate-100"
                      : "border-slate-300 bg-white text-slate-900"
                  }`}
                />
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="h-12 w-12 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div
                  className={`rounded-2xl border border-dashed px-6 py-16 text-center ${
                    isDark ? "border-slate-700 text-slate-300" : "border-slate-300 text-slate-600"
                  }`}
                >
                  <p className="text-lg font-semibold">No ledger entries yet</p>
                  <p className="mt-2 text-sm">{emptyMessage}</p>
                </div>
              ) : (
                <>
                  <table className="w-full min-w-[56rem]">
                    <thead>
                      <tr className={isDark ? "border-b border-slate-700" : "border-b border-slate-200"}>
                        <th className="p-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Activity
                        </th>
                        <th className="p-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Source
                        </th>
                        <th className="p-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Amount
                        </th>
                        <th className="p-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Balance After
                        </th>
                        <th className="p-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Status
                        </th>
                        <th className="p-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTransactions.map((tx) => (
                        <tr
                          key={tx.id}
                          onClick={() => setSelectedTransactionId(tx.id)}
                          className={`cursor-pointer border-b transition ${
                            isDark
                              ? tx.id === selectedTransactionId
                                ? "border-slate-700 bg-slate-800/70"
                                : "border-slate-800 hover:bg-slate-800/40"
                              : tx.id === selectedTransactionId
                              ? "border-slate-200 bg-teal-50"
                              : "border-slate-100 hover:bg-slate-50"
                          }`}
                        >
                          <td className="w-[28%] p-3 align-top">
                            <p className="text-sm font-semibold">
                              {getTransactionTypeLabel(tx)}
                            </p>
                            <p className={`mt-1 text-xs ${mutedClass}`}>
                              {getTransactionDisplayDetails(tx)}
                            </p>
                          </td>
                          <td className="p-3 text-sm align-top">{getTransactionSourceLabel(tx)}</td>
                          <td className="whitespace-nowrap p-3 text-sm font-semibold align-top">
                            {formatTransactionAmount(tx)}
                          </td>
                          <td className="whitespace-nowrap p-3 text-sm align-top">
                            {formatBalanceSnapshot(tx.balanceAfter, tx.currency || "USD")}
                          </td>
                          <td className="whitespace-nowrap p-3 align-top">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusTone(tx.status, isDark)}`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap p-3 text-xs align-top">
                            {formatDate(tx.createdAt || tx.date)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-4">
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={filteredTransactions.length}
                      pageSize={pageSize}
                      onPageChange={setCurrentPage}
                      onPageSizeChange={setPageSize}
                      pageSizeOptions={[10, 20, 50]}
                      itemLabel="ledger entries"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <aside className={`min-w-0 rounded-3xl border p-5 shadow-xl ${topCardClass}`}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-400">
                  Entry Details
                </p>
                <h2 className="mt-2 text-xl font-semibold leading-tight">
                  {selectedTransaction
                    ? getTransactionTypeLabel(selectedTransaction)
                    : "No entry selected"}
                </h2>
              </div>
              <p className={`max-w-full text-xs leading-5 lg:max-w-[12rem] lg:text-right ${mutedClass}`}>
                Last refresh: {lastRefreshTime ? formatDate(lastRefreshTime) : "Not synced yet"}
              </p>
            </div>

            {selectedTransaction ? (
              <div className="mt-5 space-y-5">
                <div className="grid gap-3 sm:grid-cols-2 min-[1500px]:grid-cols-1 min-[1800px]:grid-cols-2">
                  <DetailCard
                    label="Amount"
                    value={formatCurrencyAmount(
                      selectedTransaction.amount || 0,
                      selectedTransaction.currency || "USD"
                    )}
                    isDark={isDark}
                  />
                  <DetailCard
                    label="Source"
                    value={getTransactionSourceLabel(selectedTransaction)}
                    isDark={isDark}
                  />
                  <DetailCard
                    label="Balance Before"
                    value={formatBalanceSnapshot(
                      selectedTransaction.balanceBefore,
                      selectedTransaction.currency || "USD"
                    )}
                    isDark={isDark}
                  />
                  <DetailCard
                    label="Balance After"
                    value={formatBalanceSnapshot(
                      selectedTransaction.balanceAfter,
                      selectedTransaction.currency || "USD"
                    )}
                    isDark={isDark}
                  />
                  {selectedTransaction.type === "Adjustment" && (
                    <DetailCard
                      label="Amount Movement"
                      value={formatTransactionAmount(selectedTransaction)}
                      isDark={isDark}
                    />
                  )}
                </div>

                <div
                  className={`rounded-2xl border p-4 ${
                    isDark ? "border-slate-700 bg-slate-800/60" : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Workflow Timeline
                  </p>
                  <div className="mt-4 space-y-3">
                    {buildWorkflowSteps(selectedTransaction)
                      .filter((step) => step.active)
                      .map((step) => (
                        <div key={step.key} className="flex items-start gap-3">
                          <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-teal-400" />
                          <div>
                            <p className="text-sm font-semibold">{step.label}</p>
                            <p className={`text-xs ${mutedClass}`}>{formatDate(step.value)}</p>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>

                {selectedTransaction.type === "Adjustment" && (
                  <div
                    className={`rounded-2xl border p-4 ${
                      isDark ? "border-slate-700 bg-slate-800/60" : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Credit / Debit Context
                    </p>
                    <div className="mt-4 space-y-3 text-sm">
                      <AuditRow
                        label="Feature"
                        value={getTransactionSourceLabel(selectedTransaction)}
                      />
                      <AuditRow
                        label="Linked Record"
                        value={getAdjustmentReferenceLabel(selectedTransaction) || "N/A"}
                      />
                      <AuditRow
                        label="Record Type"
                        value={selectedTransaction.metadata?.relatedEntityType || "N/A"}
                      />
                      <AuditRow
                        label="Record Status"
                        value={selectedTransaction.metadata?.relatedEntityStatus || "N/A"}
                      />
                      <AuditRow
                        label="Record Summary"
                        value={selectedTransaction.metadata?.relatedEntitySummary || "N/A"}
                      />
                      {selectedTransaction.metadata?.adjustmentKind === "profit_history" && (
                        <>
                          <AuditRow
                            label={
                              selectedTransaction.metadata?.relatedEntityProfitLabel ||
                              "Previous Profit"
                            }
                            value={formatCurrencyAmount(
                              selectedTransaction.metadata?.relatedEntityProfitBefore || 0,
                              selectedTransaction.currency || "USD"
                            )}
                          />
                          <AuditRow
                            label="Updated Profit"
                            value={formatCurrencyAmount(
                              selectedTransaction.metadata?.relatedEntityProfitAfter || 0,
                              selectedTransaction.currency || "USD"
                            )}
                          />
                          <AuditRow
                            label="Profit Delta"
                            value={`${Number(selectedTransaction.metadata?.relatedEntityProfitDelta || 0) < 0 ? "-" : "+"}${formatCurrencyAmount(
                              Math.abs(
                                Number(
                                  selectedTransaction.metadata?.relatedEntityProfitDelta || 0
                                )
                              ),
                              selectedTransaction.currency || "USD"
                            )}`}
                          />
                        </>
                      )}
                      <AuditRow
                        label="Direction"
                        value={
                          getAdjustmentDelta(selectedTransaction) < 0
                            ? "Balance debited"
                            : "Balance credited"
                        }
                      />
                      <AuditRow
                        label="Admin Note"
                        value={selectedTransaction.metadata?.note || "No note"}
                      />
                      <AuditRow
                        label="Summary"
                        value={getTransactionDisplayDetails(selectedTransaction)}
                      />
                    </div>
                  </div>
                )}

                <div
                  className={`rounded-2xl border p-4 ${
                    isDark ? "border-slate-700 bg-slate-800/60" : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Audit Metadata
                  </p>
                  <div className="mt-4 space-y-3 text-sm">
                    <AuditRow label="Payment Method" value={selectedTransaction.method || selectedTransaction.paymentMethod || "N/A"} />
                    {selectedDestinationSummary && (
                      <AuditRow label="Destination" value={selectedDestinationSummary} />
                    )}
                    <AuditRow label="Actor" value={selectedTransaction.actorLabel || selectedTransaction.actorRole || "user"} />
                    <AuditRow label="Currency" value={selectedTransaction.currency || "USD"} />
                    <AuditRow label="Wallet / Network" value={[selectedTransaction.walletAddress, selectedTransaction.network].filter(Boolean).join(" / ") || "N/A"} />
                    <AuditRow label="Details" value={getTransactionDisplayDetails(selectedTransaction)} />
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`mt-5 rounded-2xl border border-dashed px-4 py-12 text-center text-sm ${
                  isDark ? "border-slate-700 text-slate-300" : "border-slate-300 text-slate-600"
                }`}
              >
                Select a ledger row to inspect workflow, balance movement, and audit details.
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}

function MetricCard({ label, value, icon: Icon, accent, isDark }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        isDark ? "border-slate-700 bg-slate-800/70" : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</p>
          <p className={`mt-3 text-2xl font-semibold ${accent}`}>{value}</p>
        </div>
        <div className={accent}>
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </div>
      </div>
    </div>
  );
}

function DetailCard({ label, value, isDark }) {
  return (
    <div
      className={`min-w-0 overflow-hidden rounded-2xl border p-4 ${
        isDark ? "border-slate-700 bg-slate-800/60" : "border-slate-200 bg-slate-50"
      }`}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 break-words text-base font-semibold leading-snug sm:text-lg">
        {value}
      </p>
    </div>
  );
}

function AuditRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-200/10 pb-3 last:border-b-0 last:pb-0">
      <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</span>
      <span className="break-words text-sm leading-snug">{value}</span>
    </div>
  );
}

MetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType.isRequired,
  accent: PropTypes.string.isRequired,
  isDark: PropTypes.bool.isRequired,
};

DetailCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  isDark: PropTypes.bool.isRequired,
};

AuditRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};
