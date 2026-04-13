import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { API_BASE_URL } from "../../config/api";
import PaginationControls from "../../components/ui/PaginationControls";
import usePagination from "../../hooks/usePagination";

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toCsv = (rows, headers) => {
  const escape = (value) => {
    const text = `${value ?? ""}`.replace(/"/g, '""');
    return `"${text}"`;
  };
  const lines = [
    headers.map((header) => escape(header.label)).join(","),
    ...rows.map((row) =>
      headers.map((header) => escape(row[header.key])).join(",")
    ),
  ];
  return lines.join("\n");
};

const downloadCsv = (filename, csvContent) => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

const normalizeToken = () =>
  (localStorage.getItem("authToken") || "").replace(/^["']|["']$/g, "").trim();

export default function OptionalFeatures() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [usersSummary, setUsersSummary] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [ticketThreads, setTicketThreads] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [referralTotals, setReferralTotals] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    totalRewardAmount: 0,
    paidRewards: 0,
  });
  const [lastSyncAt, setLastSyncAt] = useState(0);

  const authFetch = useCallback(async (urlOrUrls) => {
    const token = normalizeToken();
    if (!token) {
      throw new Error("Missing admin token");
    }

    const urls = Array.isArray(urlOrUrls) ? urlOrUrls : [urlOrUrls];
    let lastError = null;

    for (const url of urls) {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const text = await response.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }

      if (response.ok && json?.success) {
        return json;
      }

      const error = new Error(json?.message || `Request failed (${response.status})`);
      if (response.status === 404) {
        lastError = error;
        continue;
      }
      throw error;
    }

    throw lastError || new Error("Request failed");
  }, []);

  const loadFeatureData = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const [usersResult, transactionsResult, ticketsResult, referralsResult] =
        await Promise.all([
          authFetch(`${API_BASE_URL}/Admin/Users/ActivitySummary`),
          authFetch(`${API_BASE_URL}/Admin/Transactions`),
          authFetch([
            `${API_BASE_URL}/Admin/Messages?limit=120`,
            `${API_BASE_URL}/Admin/Message?limit=120`,
          ]),
          authFetch(`${API_BASE_URL}/Admin/Referrals`).catch(() => ({
            success: true,
            data: { referrals: [], totals: {} },
          })),
        ]);

      const nextUsers = usersResult?.data?.users || [];
      const nextTransactions = transactionsResult?.data || [];
      const nextTickets = ticketsResult?.data || [];
      const nextReferrals = referralsResult?.data?.referrals || [];
      const nextReferralTotals = referralsResult?.data?.totals || {};

      setUsersSummary(nextUsers);
      setTransactions(nextTransactions);
      setTicketThreads(nextTickets);
      setReferrals(nextReferrals);
      setReferralTotals({
        totalReferrals: toNumber(nextReferralTotals.totalReferrals, 0),
        activeReferrals: toNumber(nextReferralTotals.activeReferrals, 0),
        totalRewardAmount: toNumber(nextReferralTotals.totalRewardAmount, 0),
        paidRewards: toNumber(nextReferralTotals.paidRewards, 0),
      });
      setLastSyncAt(Date.now());
    } catch (error) {
      console.error("Optional admin features load failed:", error);
      setLoadError(error?.message || "Unable to load optional feature data.");
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    loadFeatureData();
    const intervalId = setInterval(loadFeatureData, 20000);
    return () => clearInterval(intervalId);
  }, [loadFeatureData]);

  const ticketStats = useMemo(() => {
    const open = ticketThreads.filter((item) => item.status === "open").length;
    const pending = ticketThreads.filter((item) => item.status === "pending").length;
    const unresolved = open + pending;
    return {
      total: ticketThreads.length,
      open,
      pending,
      unresolved,
    };
  }, [ticketThreads]);

  const topReferrers = useMemo(() => {
    const map = new Map();
    referrals.forEach((item) => {
      const key = item.referrerId || item.referrerEmail || item.referrerName || "unknown";
      const current = map.get(key) || {
        referrerName: item.referrerName || "Unknown",
        referrerEmail: item.referrerEmail || "",
        referrals: 0,
        rewards: 0,
      };
      current.referrals += 1;
      current.rewards += toNumber(item.rewardAmount, 0);
      map.set(key, current);
    });

    return Array.from(map.values())
      .sort((a, b) => b.referrals - a.referrals || b.rewards - a.rewards);
  }, [referrals]);
  const {
    currentPage: ticketsPage,
    pageSize: ticketsPageSize,
    totalPages: ticketsTotalPages,
    paginatedItems: paginatedTicketThreads,
    setCurrentPage: setTicketsPage,
    setPageSize: setTicketsPageSize,
  } = usePagination(ticketThreads, {
    initialPageSize: 6,
  });
  const {
    currentPage: referralsPage,
    pageSize: referralsPageSize,
    totalPages: referralsTotalPages,
    paginatedItems: paginatedReferrers,
    setCurrentPage: setReferralsPage,
    setPageSize: setReferralsPageSize,
  } = usePagination(topReferrers, {
    initialPageSize: 8,
  });

  const exportUsersCsv = () => {
    const rows = usersSummary.map((user) => ({
      fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      email: user.email || "",
      status: user.status || "",
      balance: toNumber(user.balance, 0).toFixed(2),
      subscriptionsActive: toNumber(user.metrics?.subscriptionsActive, 0),
      signalsActive: toNumber(user.metrics?.signalsActive, 0),
      copyTradesActive: toNumber(user.metrics?.copyTradesActive, 0),
      pendingTransactions: toNumber(user.metrics?.pendingTransactions, 0),
      lastActivityAt: user.lastActivityAt || "",
    }));
    const headers = [
      { key: "fullName", label: "Full Name" },
      { key: "email", label: "Email" },
      { key: "status", label: "Status" },
      { key: "balance", label: "Balance" },
      { key: "subscriptionsActive", label: "Active Subscriptions" },
      { key: "signalsActive", label: "Active Signals" },
      { key: "copyTradesActive", label: "Active Copy Trades" },
      { key: "pendingTransactions", label: "Pending Transactions" },
      { key: "lastActivityAt", label: "Last Activity" },
    ];
    downloadCsv("admin-users-summary.csv", toCsv(rows, headers));
  };

  const exportTransactionsCsv = () => {
    const rows = transactions.map((item) => ({
      id: item.id || "",
      type: item.type || "",
      amount: toNumber(item.amount, 0).toFixed(2),
      currency: item.currency || "USD",
      status: item.status || "",
      paymentMethod: item.paymentMethod || "",
      userEmail: item.userEmail || "",
      createdAt: item.createdAt || "",
    }));
    const headers = [
      { key: "id", label: "Transaction ID" },
      { key: "type", label: "Type" },
      { key: "amount", label: "Amount" },
      { key: "currency", label: "Currency" },
      { key: "status", label: "Status" },
      { key: "paymentMethod", label: "Payment Method" },
      { key: "userEmail", label: "User Email" },
      { key: "createdAt", label: "Created At" },
    ];
    downloadCsv("admin-transactions.csv", toCsv(rows, headers));
  };

  const exportReferralsCsv = () => {
    const rows = referrals.map((item) => ({
      id: item.id || "",
      referrerName: item.referrerName || "",
      referrerEmail: item.referrerEmail || "",
      referredEmail: item.referredEmail || "",
      status: item.status || "",
      rewardAmount: toNumber(item.rewardAmount, 0).toFixed(2),
      rewardStatus: item.rewardStatus || "",
      createdAt: item.createdAt || "",
    }));
    const headers = [
      { key: "id", label: "Referral ID" },
      { key: "referrerName", label: "Referrer Name" },
      { key: "referrerEmail", label: "Referrer Email" },
      { key: "referredEmail", label: "Referred Email" },
      { key: "status", label: "Referral Status" },
      { key: "rewardAmount", label: "Reward Amount" },
      { key: "rewardStatus", label: "Reward Status" },
      { key: "createdAt", label: "Created At" },
    ];
    downloadCsv("admin-referrals.csv", toCsv(rows, headers));
  };

  const exportTicketsCsv = () => {
    const rows = ticketThreads.map((item) => ({
      id: item.id || "",
      subject: item.subject || "",
      status: item.status || "",
      userEmail: item.user?.email || "",
      unreadForAdmin: toNumber(item.unreadForAdmin, 0),
      messageCount: toNumber(item.messageCount, 0),
      lastMessageAt: item.lastMessageAt || "",
    }));
    const headers = [
      { key: "id", label: "Thread ID" },
      { key: "subject", label: "Subject" },
      { key: "status", label: "Status" },
      { key: "userEmail", label: "User Email" },
      { key: "unreadForAdmin", label: "Unread For Admin" },
      { key: "messageCount", label: "Message Count" },
      { key: "lastMessageAt", label: "Last Message At" },
    ];
    downloadCsv("admin-support-tickets.csv", toCsv(rows, headers));
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div
        className={`rounded-2xl border p-4 ${
          isDark ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold">Extra Features</h3>
            <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Live support tickets, data exports, referral tracking, and admin operations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadFeatureData}
              className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-500"
              disabled={isLoading}
            >
              {isLoading ? "Syncing..." : "Refresh"}
            </button>
            <span className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Sync {lastSyncAt ? new Date(lastSyncAt).toLocaleTimeString() : "starting..."}
            </span>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className={`rounded-xl border p-4 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <p className="text-xs text-slate-500">Support Tickets</p>
          <p className="mt-2 text-2xl font-semibold">{ticketStats.total}</p>
          <p className="text-xs text-amber-500 mt-1">{ticketStats.unresolved} unresolved</p>
        </div>
        <div className={`rounded-xl border p-4 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <p className="text-xs text-slate-500">Referrals</p>
          <p className="mt-2 text-2xl font-semibold">{referralTotals.totalReferrals}</p>
          <p className="text-xs text-emerald-500 mt-1">{referralTotals.activeReferrals} active</p>
        </div>
        <div className={`rounded-xl border p-4 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <p className="text-xs text-slate-500">Reward Pool</p>
          <p className="mt-2 text-2xl font-semibold">${referralTotals.totalRewardAmount.toFixed(2)}</p>
          <p className="text-xs text-sky-500 mt-1">${referralTotals.paidRewards.toFixed(2)} paid</p>
        </div>
        <div className={`rounded-xl border p-4 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <p className="text-xs text-slate-500">Connected Users</p>
          <p className="mt-2 text-2xl font-semibold">{usersSummary.length}</p>
          <p className="text-xs text-slate-500 mt-1">{transactions.length} tx records</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className={`xl:col-span-5 rounded-2xl border p-4 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <h4 className="text-sm font-semibold">Support Tickets (Live)</h4>
          <p className="text-xs text-slate-500 mt-1">
            Thread stream from user portal support conversations.
          </p>
          <div className="mt-3 space-y-2">
            {ticketThreads.length === 0 ? (
              <p className="text-xs text-slate-500">No ticket threads available.</p>
            ) : (
              paginatedTicketThreads.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-lg border px-3 py-2 ${
                    isDark ? "border-slate-700 bg-slate-950/60" : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="line-clamp-1 text-xs font-semibold">{item.subject || "Support Request"}</p>
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
                      {item.status || "open"}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{item.user?.email || "Unknown user"}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Unread: {toNumber(item.unreadForAdmin, 0)} | Messages: {toNumber(item.messageCount, 0)}
                  </p>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 border-t pt-4">
            <PaginationControls
              currentPage={ticketsPage}
              totalPages={ticketsTotalPages}
              totalItems={ticketThreads.length}
              pageSize={ticketsPageSize}
              onPageChange={setTicketsPage}
              onPageSizeChange={setTicketsPageSize}
              pageSizeOptions={[6, 12, 24]}
              itemLabel="tickets"
            />
          </div>
        </section>

        <section className={`xl:col-span-7 rounded-2xl border p-4 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
          <h4 className="text-sm font-semibold">Referral Tracking</h4>
          <p className="text-xs text-slate-500 mt-1">
            Top referrers and reward performance synced to backend.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead className={isDark ? "text-slate-400" : "text-slate-500"}>
                <tr>
                  <th className="px-2 py-2 text-left">Referrer</th>
                  <th className="px-2 py-2 text-left">Email</th>
                  <th className="px-2 py-2 text-right">Referrals</th>
                  <th className="px-2 py-2 text-right">Rewards</th>
                </tr>
              </thead>
              <tbody>
                {topReferrers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-2 py-4 text-center text-slate-500">
                      No referral records available.
                    </td>
                  </tr>
                ) : (
                  paginatedReferrers.map((item) => (
                    <tr key={`${item.referrerEmail}-${item.referrerName}`} className="border-t border-slate-200/20">
                      <td className="px-2 py-2">{item.referrerName}</td>
                      <td className="px-2 py-2">{item.referrerEmail || "-"}</td>
                      <td className="px-2 py-2 text-right">{item.referrals}</td>
                      <td className="px-2 py-2 text-right">${item.rewards.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 border-t pt-4">
            <PaginationControls
              currentPage={referralsPage}
              totalPages={referralsTotalPages}
              totalItems={topReferrers.length}
              pageSize={referralsPageSize}
              onPageChange={setReferralsPage}
              onPageSizeChange={setReferralsPageSize}
              pageSizeOptions={[8, 16, 32]}
              itemLabel="referrers"
            />
          </div>
        </section>
      </div>

      <section className={`rounded-2xl border p-4 ${isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
        <h4 className="text-sm font-semibold">Data Export</h4>
        <p className="text-xs text-slate-500 mt-1">
          Export current admin datasets to CSV for audit and reporting.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <button onClick={exportUsersCsv} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
            Export Users
          </button>
          <button onClick={exportTransactionsCsv} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
            Export Transactions
          </button>
          <button onClick={exportReferralsCsv} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
            Export Referrals
          </button>
          <button onClick={exportTicketsCsv} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
            Export Tickets
          </button>
        </div>
      </section>
    </div>
  );
}
