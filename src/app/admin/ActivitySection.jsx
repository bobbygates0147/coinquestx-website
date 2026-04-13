import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../../config/api";
import PaginationControls from "../../components/ui/PaginationControls";
import usePagination from "../../hooks/usePagination";

const ACTIVITY_TYPE_OPTIONS = [
  "All",
  "Subscription",
  "Signal",
  "CopyTrade",
  "PlaceTrade",
  "Trade",
  "Deposit",
  "Withdrawal",
  "BuyBot",
  "Mining",
  "Stake",
  "RealEstate",
];

const formatCurrency = (value = 0, currency = "USD") => {
  const amount = Number(value) || 0;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
};

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusClassName = (status = "") => {
  const normalized = `${status}`.toLowerCase();
  if (["completed", "win", "active", "verified", "paid"].includes(normalized)) {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  }
  if (["pending", "processing", "paused"].includes(normalized)) {
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  }
  if (["failed", "rejected", "cancelled", "suspended", "loss", "expired"].includes(normalized)) {
    return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300";
  }
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
};

const getToken = () =>
  (localStorage.getItem("authToken") || "")
    .replace(/^['"]|['"]$/g, "")
    .trim();

const numberOrZero = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

export default function ActivitySection() {
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [search, setSearch] = useState("");
  const [activitySearch, setActivitySearch] = useState("");
  const [activityTypeFilter, setActivityTypeFilter] = useState("All");
  const [users, setUsers] = useState([]);
  const [totals, setTotals] = useState({
    totalUsers: 0,
    totalBalance: 0,
    activeSubscriptions: 0,
    activeSignals: 0,
    activeCopyTrades: 0,
    activePlaceTrades: 0,
    pendingTransactions: 0,
  });
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserActivity, setSelectedUserActivity] = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      setSummaryError("");
      setSummaryLoading(true);
      const token = getToken();
      if (!token) {
        setUsers([]);
        setTotals((prev) => ({ ...prev, totalUsers: 0 }));
        setSummaryError("Missing admin session token.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/Admin/Users/ActivitySummary`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Failed to load admin activity summary.");
      }

      const nextUsers = result?.data?.users || [];
      setUsers(nextUsers);
      setTotals(result?.data?.totals || {});

      setSelectedUserId((prev) => {
        if (!nextUsers.length) return "";
        if (prev && nextUsers.some((item) => item.id === prev)) {
          return prev;
        }
        return nextUsers[0].id;
      });
    } catch (error) {
      console.error("Failed to load activity summary", error);
      setSummaryError(error?.message || "Unable to load activity summary.");
      setUsers([]);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const fetchUserActivities = useCallback(async (userId) => {
    if (!userId) {
      setSelectedUserActivity(null);
      return;
    }

    try {
      setDetailError("");
      setDetailLoading(true);

      const token = getToken();
      if (!token) {
        setSelectedUserActivity(null);
        setDetailError("Missing admin session token.");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/Admin/Users/${userId}/Activities?limit=180`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Failed to load user activities.");
      }

      setSelectedUserActivity(result?.data || null);
    } catch (error) {
      console.error("Failed to load user activities", error);
      setSelectedUserActivity(null);
      setDetailError(error?.message || "Unable to load user activities.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    const intervalId = setInterval(fetchSummary, 30000);
    return () => clearInterval(intervalId);
  }, [fetchSummary]);

  useEffect(() => {
    fetchUserActivities(selectedUserId);
  }, [selectedUserId, fetchUserActivities]);

  useEffect(() => {
    if (!selectedUserId) return undefined;
    const intervalId = setInterval(() => {
      fetchUserActivities(selectedUserId);
    }, 20000);

    return () => clearInterval(intervalId);
  }, [selectedUserId, fetchUserActivities]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) => {
      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
      return (
        fullName.includes(query) ||
        `${user.email || ""}`.toLowerCase().includes(query) ||
        `${user.status || ""}`.toLowerCase().includes(query)
      );
    });
  }, [users, search]);

  const filteredActivities = useMemo(() => {
    const activities = selectedUserActivity?.activities || [];
    const textQuery = activitySearch.trim().toLowerCase();

    return activities.filter((activity) => {
      if (activityTypeFilter !== "All" && activity.type !== activityTypeFilter) {
        return false;
      }

      if (!textQuery) return true;

      return [
        activity.type,
        activity.status,
        activity.title,
        activity.description,
        activity.asset,
        activity.direction,
      ]
        .filter(Boolean)
        .some((value) => `${value}`.toLowerCase().includes(textQuery));
    });
  }, [selectedUserActivity?.activities, activityTypeFilter, activitySearch]);

  const {
    currentPage: summaryPage,
    pageSize: summaryPageSize,
    totalPages: summaryTotalPages,
    paginatedItems: paginatedUsers,
    setCurrentPage: setSummaryPage,
    setPageSize: setSummaryPageSize,
  } = usePagination(filteredUsers, {
    initialPageSize: 10,
    resetDeps: [search],
  });
  const {
    currentPage: activityPage,
    pageSize: activityPageSize,
    totalPages: activityTotalPages,
    paginatedItems: paginatedActivities,
    setCurrentPage: setActivityPage,
    setPageSize: setActivityPageSize,
  } = usePagination(filteredActivities, {
    initialPageSize: 8,
    resetDeps: [activitySearch, activityTypeFilter, selectedUserId],
  });

  const selectedUser = selectedUserActivity?.user || null;
  const metrics = selectedUserActivity?.metrics || null;
  const selectedCurrency = selectedUser?.currencyCode || "USD";

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        <div className="rounded-xl border p-4 bg-white dark:bg-slate-900">
          <p className="text-xs text-gray-500">Users</p>
          <p className="mt-2 text-2xl font-semibold">{numberOrZero(totals.totalUsers)}</p>
        </div>
        <div className="rounded-xl border p-4 bg-white dark:bg-slate-900">
          <p className="text-xs text-gray-500">Total Balance</p>
          <p className="mt-2 text-2xl font-semibold">{formatCurrency(totals.totalBalance)}</p>
        </div>
        <div className="rounded-xl border p-4 bg-white dark:bg-slate-900">
          <p className="text-xs text-gray-500">Active Subscriptions</p>
          <p className="mt-2 text-2xl font-semibold">{numberOrZero(totals.activeSubscriptions)}</p>
        </div>
        <div className="rounded-xl border p-4 bg-white dark:bg-slate-900">
          <p className="text-xs text-gray-500">Active Signals</p>
          <p className="mt-2 text-2xl font-semibold">{numberOrZero(totals.activeSignals)}</p>
        </div>
        <div className="rounded-xl border p-4 bg-white dark:bg-slate-900">
          <p className="text-xs text-gray-500">Active Copy Trades</p>
          <p className="mt-2 text-2xl font-semibold">{numberOrZero(totals.activeCopyTrades)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-7 rounded-xl border bg-white dark:bg-slate-900">
          <div className="p-4 border-b flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <h3 className="font-semibold">User Activity Summary</h3>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users..."
              className="w-full sm:w-64 rounded-md border px-3 py-2 text-sm bg-transparent"
            />
          </div>

          {summaryLoading ? (
            <div className="p-6 text-sm text-gray-500">Loading users...</div>
          ) : summaryError ? (
            <div className="p-6 text-sm text-red-500">{summaryError}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No users found.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-800/60">
                  <tr>
                    <th className="p-3 text-left">User</th>
                    <th className="p-3 text-left">Balance</th>
                    <th className="p-3 text-left">Signals</th>
                    <th className="p-3 text-left">Subscription</th>
                    <th className="p-3 text-left">Copy Trades</th>
                    <th className="p-3 text-left">Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => {
                    const isSelected = user.id === selectedUserId;
                    return (
                      <tr
                        key={user.id}
                        onClick={() => setSelectedUserId(user.id)}
                        className={`cursor-pointer border-t hover:bg-gray-50 dark:hover:bg-slate-800/50 ${
                          isSelected ? "bg-indigo-50 dark:bg-indigo-950/30" : ""
                        }`}
                      >
                        <td className="p-3">
                          <p className="font-medium">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </td>
                        <td className="p-3 font-medium">
                          {formatCurrency(user.balance, user.currencyCode || "USD")}
                        </td>
                        <td className="p-3">
                          {numberOrZero(user.metrics?.signalsActive)} / {numberOrZero(user.metrics?.signalsTotal)}
                        </td>
                        <td className="p-3">
                          {numberOrZero(user.metrics?.subscriptionsActive)} / {numberOrZero(user.metrics?.subscriptionsTotal)}
                        </td>
                        <td className="p-3">
                          {numberOrZero(user.metrics?.copyTradesActive)} / {numberOrZero(user.metrics?.copyTradesTotal)}
                        </td>
                        <td className="p-3 text-xs text-gray-500">
                          {formatDateTime(user.lastActivityAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

              <div className="p-3 border-t">
                <PaginationControls
                  currentPage={summaryPage}
                  totalPages={summaryTotalPages}
                  totalItems={filteredUsers.length}
                  pageSize={summaryPageSize}
                  onPageChange={setSummaryPage}
                  onPageSizeChange={setSummaryPageSize}
                  pageSizeOptions={[10, 20, 50]}
                  itemLabel="users"
                />
              </div>
            </>
          )}
        </div>

        <div className="xl:col-span-5 rounded-xl border bg-white dark:bg-slate-900">
          <div className="p-4 border-b">
            <h3 className="font-semibold">User Activity Details</h3>
          </div>

          {detailLoading ? (
            <div className="p-6 text-sm text-gray-500">Loading activity details...</div>
          ) : detailError ? (
            <div className="p-6 text-sm text-red-500">{detailError}</div>
          ) : !selectedUser ? (
            <div className="p-6 text-sm text-gray-500">Select a user to inspect all activity.</div>
          ) : (
            <div className="p-4 space-y-4">
              <div className="rounded-lg border p-3">
                <p className="font-semibold">
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
                <p className="text-xs text-gray-500 mt-1">{selectedUser.email}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Current Balance</span>
                  <span className="font-semibold">
                    {formatCurrency(selectedUser.balance, selectedCurrency)}
                  </span>
                </div>
              </div>

              {metrics && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md border p-2">
                    <p className="text-gray-500">Signals</p>
                    <p className="font-semibold">
                      {numberOrZero(metrics.signalsActive)} / {numberOrZero(metrics.signalsTotal)}
                    </p>
                  </div>
                  <div className="rounded-md border p-2">
                    <p className="text-gray-500">Subscriptions</p>
                    <p className="font-semibold">
                      {numberOrZero(metrics.subscriptionsActive)} / {numberOrZero(metrics.subscriptionsTotal)}
                    </p>
                  </div>
                  <div className="rounded-md border p-2">
                    <p className="text-gray-500">Copy Trades</p>
                    <p className="font-semibold">
                      {numberOrZero(metrics.copyTradesActive)} / {numberOrZero(metrics.copyTradesTotal)}
                    </p>
                  </div>
                  <div className="rounded-md border p-2">
                    <p className="text-gray-500">Place Trades</p>
                    <p className="font-semibold">
                      {numberOrZero(metrics.placeTradesActive)} / {numberOrZero(metrics.placeTradesTotal)}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={activityTypeFilter}
                  onChange={(event) => setActivityTypeFilter(event.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 [color-scheme:light] focus:outline-none focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:[color-scheme:dark]"
                >
                  {ACTIVITY_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type} className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                      {type}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={activitySearch}
                  onChange={(event) => setActivitySearch(event.target.value)}
                  placeholder="Search activity..."
                  className="rounded-md border px-3 py-2 text-sm bg-transparent"
                />
              </div>

              <div className="space-y-2">
                {filteredActivities.length === 0 ? (
                  <p className="text-sm text-gray-500">No activity found for selected filters.</p>
                ) : (
                  paginatedActivities.map((activity) => (
                    <div key={`${activity.type}-${activity.id}`} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                              {activity.type}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClassName(activity.status)}`}>
                              {activity.status || "N/A"}
                            </span>
                          </div>
                          <p className="mt-2 text-sm font-medium break-words">{activity.title || "Activity"}</p>
                          {activity.description ? (
                            <p className="text-xs text-gray-500 mt-1 break-words">{activity.description}</p>
                          ) : null}
                          <p className="text-[11px] text-gray-500 mt-1">{formatDateTime(activity.createdAt)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold">
                            {formatCurrency(activity.amount, selectedCurrency)}
                          </p>
                          {activity.asset ? (
                            <p className="text-[11px] text-gray-500 mt-1">{activity.asset}</p>
                          ) : null}
                          {activity.direction ? (
                            <p className="text-[11px] text-gray-500 mt-0.5 uppercase">{activity.direction}</p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t pt-4">
                <PaginationControls
                  currentPage={activityPage}
                  totalPages={activityTotalPages}
                  totalItems={filteredActivities.length}
                  pageSize={activityPageSize}
                  onPageChange={setActivityPage}
                  onPageSizeChange={setActivityPageSize}
                  pageSizeOptions={[8, 16, 32]}
                  itemLabel="activities"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
