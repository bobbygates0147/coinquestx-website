import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { API_BASE_URL } from "../../config/api";
import PaginationControls from "../../components/ui/PaginationControls";
import usePagination from "../../hooks/usePagination";

const getToken = () =>
  (localStorage.getItem("authToken") || "").replace(/^["']|["']$/g, "").trim();

const num = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const money = (value = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num(value, 0));

const pct = (value = 0) => `${num(value, 0).toFixed(1)}%`;

const time = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
};

const defaultMetrics = {
  generatedAt: "",
  users: { total: 0, active: 0, suspended: 0 },
  emails: { sent24h: 0, failed24h: 0 },
  ledger: { entries24h: 0 },
  kyc: { pending: 0, completed: 0, rejected: 0 },
  transactions: { pending: 0, completed: 0, volume24h: 0 },
  support: { open: 0, pending: 0, unreadForAdmin: 0 },
  activeModules: {
    trades: 0,
    placeTrades: 0,
    signals: 0,
    subscriptions: 0,
    copyTrades: 0,
    mining: 0,
    stakes: 0,
  },
  funnel: {
    signedUp: 0,
    kycVerified: 0,
    deposited: 0,
    firstTrade: 0,
    withdrawn: 0,
    kycConversionRate: 0,
    depositConversionRate: 0,
    tradeConversionRate: 0,
    withdrawalConversionRate: 0,
  },
  retention: {
    matureUsers7d: 0,
    retainedUsers7d: 0,
    retention7dRate: 0,
    matureUsers30d: 0,
    retainedUsers30d: 0,
    retention30dRate: 0,
    churnRisk30dRate: 0,
  },
};

const statusTone = (type = "") => {
  const value = `${type}`.toLowerCase();
  if (["broadcast", "kyc_status", "transaction_status", "balance_adjustment"].includes(value)) {
    return "bg-emerald-500/15 text-emerald-500";
  }
  if (value.includes("failed") || value.includes("error")) {
    return "bg-rose-500/15 text-rose-500";
  }
  return "bg-sky-500/15 text-sky-500";
};

const deltaTone = (value) => {
  if (num(value, 0) > 0) return "text-emerald-500";
  if (num(value, 0) < 0) return "text-rose-500";
  return "text-slate-500";
};

const activeCount = (modules = {}) =>
  num(modules.trades) +
  num(modules.placeTrades) +
  num(modules.signals) +
  num(modules.subscriptions) +
  num(modules.copyTrades) +
  num(modules.mining) +
  num(modules.stakes);

const fallbackMetrics = (users = [], kyc = [], transactions = [], tickets = [], ledger = []) => {
  const normalUsers = users.filter((item) => `${item.role || "user"}`.toLowerCase() !== "admin");
  const signedUp = normalUsers.length;
  const kycVerified = new Set(
    kyc
      .filter((item) => `${item.status || ""}`.toLowerCase() === "verified")
      .map((item) => `${item.userId || item.email || ""}`)
      .filter(Boolean)
  ).size;
  const deposited = new Set(
    transactions
      .filter(
        (item) =>
          `${item.type || ""}`.toLowerCase() === "deposit" &&
          `${item.status || ""}`.toLowerCase() === "completed"
      )
      .map((item) => `${item.userId || item.userEmail || ""}`)
      .filter(Boolean)
  ).size;
  const firstTrade = new Set(
    transactions
      .filter((item) =>
        ["trade", "placetrade", "copytrade"].includes(`${item.type || ""}`.toLowerCase())
      )
      .map((item) => `${item.userId || item.userEmail || ""}`)
      .filter(Boolean)
  ).size;
  const withdrawn = new Set(
    transactions
      .filter((item) => `${item.type || ""}`.toLowerCase() === "withdrawal")
      .map((item) => `${item.userId || item.userEmail || ""}`)
      .filter(Boolean)
  ).size;
  const base = Math.max(signedUp, 1);

  return {
    ...defaultMetrics,
    generatedAt: new Date().toISOString(),
    users: {
      total: signedUp,
      active: normalUsers.filter((item) => `${item.status || ""}`.toLowerCase() === "active").length,
      suspended: normalUsers.filter((item) => `${item.status || ""}`.toLowerCase() === "suspended").length,
    },
    ledger: { entries24h: ledger.length },
    kyc: {
      pending: kyc.filter((item) => `${item.status || ""}`.toLowerCase() === "pending").length,
      completed: kyc.filter((item) => `${item.status || ""}`.toLowerCase() === "verified").length,
      rejected: kyc.filter((item) => `${item.status || ""}`.toLowerCase() === "rejected").length,
    },
    transactions: {
      pending: transactions.filter((item) => `${item.status || ""}`.toLowerCase() === "pending").length,
      completed: transactions.filter((item) => `${item.status || ""}`.toLowerCase() === "completed").length,
      volume24h: transactions.reduce((sum, item) => sum + num(item.amount, 0), 0),
    },
    support: {
      open: tickets.filter((item) => `${item.status || ""}`.toLowerCase() === "open").length,
      pending: tickets.filter((item) => `${item.status || ""}`.toLowerCase() === "pending").length,
      unreadForAdmin: tickets.filter((item) => num(item.unreadForAdmin, 0) > 0).length,
    },
    funnel: {
      signedUp,
      kycVerified,
      deposited,
      firstTrade,
      withdrawn,
      kycConversionRate: (kycVerified / base) * 100,
      depositConversionRate: (deposited / base) * 100,
      tradeConversionRate: (firstTrade / base) * 100,
      withdrawalConversionRate: (withdrawn / base) * 100,
    },
  };
};

const fallbackLedger = (transactions = []) =>
  transactions
    .filter((item) => item.balanceBefore !== undefined || item.balanceAfter !== undefined)
    .slice(0, 40)
    .map((item, index) => {
      const balanceBefore = num(item.balanceBefore, 0);
      const balanceAfter = num(item.balanceAfter, balanceBefore);
      return {
        id: item.id || `${item.createdAt}-${index}`,
        reasonLabel: item.type || "Transaction",
        delta: balanceAfter - balanceBefore,
        balanceBefore,
        balanceAfter,
        actorRole: item.actorRole || "system",
        actorLabel: item.actorLabel || "",
        details: item.details || "",
        status: item.status || "",
        sourceFeature: item.sourceFeature || "",
        user: {
          email: item.userEmail || "",
          name: item.userName || "",
        },
        createdAt: item.createdAt || new Date().toISOString(),
      };
    });

const fallbackLogs = (transactions = []) =>
  transactions.slice(0, 40).map((item) => ({
    id: item.id || `${item.createdAt}-${item.amount}`,
    type: "transaction_observed",
    message: `${item.type || "Transaction"} ${item.status || "Pending"} - ${money(item.amount)}`,
    actor: null,
    targetUser: { email: item.userEmail || "" },
    createdAt: item.createdAt || new Date().toISOString(),
  }));

export default function SystemTools() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const panelClass = isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white";
  const shellClass = isDark ? "border-slate-700 bg-slate-900/90" : "border-slate-200 bg-white";
  const mutedClass = isDark ? "text-slate-300" : "text-slate-600";

  const [metrics, setMetrics] = useState(defaultMetrics);
  const [logs, setLogs] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [broadcastError, setBroadcastError] = useState("");
  const [broadcastSuccess, setBroadcastSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(0);
  const [metricsMissing, setMetricsMissing] = useState(false);
  const [logsMissing, setLogsMissing] = useState(false);
  const [ledgerMissing, setLedgerMissing] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState("Platform Broadcast");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState("active_all");

  const authFetch = useCallback(async (urlOrUrls, options = {}) => {
    const token = getToken();
    if (!token) throw new Error("Missing admin token");

    const urls = Array.isArray(urlOrUrls) ? urlOrUrls : [urlOrUrls];
    let lastError = null;

    for (const url of urls) {
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          ...(options.headers || {}),
        },
      });
      const text = await response.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
      if (response.ok && json?.success) return json;
      const error = new Error(json?.message || `Request failed (${response.status})`);
      if (response.status === 404) {
        lastError = error;
        continue;
      }
      throw error;
    }

    throw lastError || new Error("Request failed");
  }, []);

  const loadSystemData = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      const metricsResult = await authFetch(`${API_BASE_URL}/Admin/SystemMetrics`).catch((error) => {
        if (/\(404\)/.test(error?.message || "")) {
          setMetricsMissing(true);
          return null;
        }
        throw error;
      });

      const [logsResult, ledgerResult, usersResult, kycResult, txResult, ticketResult] =
        await Promise.all([
          authFetch(`${API_BASE_URL}/Admin/Logs?limit=120`).catch((error) => {
            if (/\(404\)/.test(error?.message || "")) {
              setLogsMissing(true);
              return null;
            }
            throw error;
          }),
          authFetch(`${API_BASE_URL}/Admin/Ledger?limit=120`).catch((error) => {
            if (/\(404\)/.test(error?.message || "")) {
              setLedgerMissing(true);
              return null;
            }
            throw error;
          }),
          authFetch(`${API_BASE_URL}/Admin/Users`).catch(() => ({ success: true, data: [] })),
          authFetch(`${API_BASE_URL}/Admin/Kyc`).catch(() => ({ success: true, data: [] })),
          authFetch(`${API_BASE_URL}/Admin/Transactions`).catch(() => ({ success: true, data: [] })),
          authFetch([`${API_BASE_URL}/Admin/Messages?limit=120`, `${API_BASE_URL}/Admin/Message?limit=120`]).catch(
            () => ({ success: true, data: [] })
          ),
        ]);

      const txRows = Array.isArray(txResult?.data) ? txResult.data : [];
      const nextLedger = Array.isArray(ledgerResult?.data) ? ledgerResult.data : fallbackLedger(txRows);
      const nextMetrics = metricsResult?.data
        ? metricsResult.data
        : fallbackMetrics(usersResult?.data || [], kycResult?.data || [], txRows, ticketResult?.data || [], nextLedger);
      const nextLogs = Array.isArray(logsResult?.data) && logsResult.data.length
        ? logsResult.data
        : fallbackLogs(txRows);

      setMetrics(nextMetrics);
      setLogs(nextLogs);
      setLedger(nextLedger);
      setLastSyncAt(Date.now());
      setMetricsMissing(!metricsResult?.data);
      setLogsMissing(!logsResult?.data);
      setLedgerMissing(!ledgerResult?.data);
    } catch (error) {
      console.error("System tools sync failed:", error);
      setLoadError(error?.message || "Unable to sync system tools.");
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    loadSystemData();
    const timer = setInterval(loadSystemData, 20000);
    return () => clearInterval(timer);
  }, [loadSystemData]);

  const handleBroadcast = async () => {
    const message = `${broadcastMessage || ""}`.trim();
    if (!message) {
      setBroadcastError("Broadcast message cannot be empty.");
      setBroadcastSuccess("");
      return;
    }

    setBroadcastError("");
    setBroadcastSuccess("");
    setIsBroadcasting(true);

    const payload = {
      subject: `${broadcastSubject || "Platform Broadcast"}`.trim(),
      message,
      onlyActive: broadcastTarget !== "all_users",
      plans:
        broadcastTarget === "elite_only"
          ? ["Elite"]
          : broadcastTarget === "premium_plus"
          ? ["Premium", "Platinum", "Elite"]
          : broadcastTarget === "platinum_elite"
          ? ["Platinum", "Elite"]
          : [],
    };

    try {
      const result = await authFetch(`${API_BASE_URL}/Admin/Broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const recipients = num(result?.data?.recipients, 0);
      setBroadcastSuccess(`Broadcast sent successfully to ${recipients} user${recipients === 1 ? "" : "s"}.`);
      setBroadcastMessage("");
      await loadSystemData();
    } catch (error) {
      console.error("Broadcast failed:", error);
      setBroadcastError(error?.message || "Broadcast endpoint unavailable.");
    } finally {
      setIsBroadcasting(false);
    }
  };

  const summaryCards = useMemo(
    () => [
      { label: "Users", value: metrics.users.total, tone: "text-slate-900 dark:text-slate-100" },
      { label: "Active Users", value: metrics.users.active, tone: "text-emerald-500" },
      { label: "Pending KYC", value: metrics.kyc.pending, tone: "text-amber-500" },
      { label: "Completed Tx", value: metrics.transactions.completed, tone: "text-emerald-500" },
      { label: "Tx Volume (24h)", value: money(metrics.transactions.volume24h), tone: "text-sky-500" },
      { label: "Emails Failed", value: metrics.emails.failed24h, tone: "text-rose-500" },
      { label: "Ledger Entries", value: metrics.ledger.entries24h, tone: "text-cyan-500" },
      { label: "Retention 30d", value: pct(metrics.retention.retention30dRate), tone: "text-violet-500" },
    ],
    [metrics]
  );

  const funnelSteps = useMemo(
    () => [
      ["Signups", metrics.funnel.signedUp, 100],
      ["KYC Verified", metrics.funnel.kycVerified, metrics.funnel.kycConversionRate],
      ["Deposited", metrics.funnel.deposited, metrics.funnel.depositConversionRate],
      ["First Trade", metrics.funnel.firstTrade, metrics.funnel.tradeConversionRate],
      ["Withdrawn", metrics.funnel.withdrawn, metrics.funnel.withdrawalConversionRate],
    ],
    [metrics.funnel]
  );

  const retentionCards = useMemo(
    () => [
      ["Retained 7d", pct(metrics.retention.retention7dRate), `${metrics.retention.retainedUsers7d}/${metrics.retention.matureUsers7d} users returned.`],
      ["Retained 30d", pct(metrics.retention.retention30dRate), `${metrics.retention.retainedUsers30d}/${metrics.retention.matureUsers30d} users returned.`],
      ["Churn Risk 30d", pct(metrics.retention.churnRisk30dRate), "Mature users inactive during the last 30 days."],
    ],
    [metrics.retention]
  );

  const logsPagination = usePagination(logs, { initialPageSize: 8, resetDeps: [logs.length] });
  const ledgerPagination = usePagination(ledger, { initialPageSize: 6, resetDeps: [ledger.length] });

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className={`rounded-2xl border p-4 ${shellClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">System Tools</h3>
            <p className={`text-xs ${mutedClass}`}>
              Funnel analytics, delivery health, immutable ledger visibility, and admin audit activity.
            </p>
          </div>
          <button
            onClick={loadSystemData}
            className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-500"
            disabled={isLoading}
          >
            {isLoading ? "Syncing..." : "Refresh"}
          </button>
        </div>
        <p className={`mt-2 text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Last sync: {lastSyncAt ? time(lastSyncAt) : "starting..."}
        </p>
      </div>

      {loadError && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
          {loadError}
        </div>
      )}

      {(metricsMissing || logsMissing || ledgerMissing) && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          Some admin endpoints are missing on this deployment. Fallback live data is currently in use.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className={`rounded-xl border p-4 ${panelClass}`}>
            <p className="text-xs text-slate-500">{card.label}</p>
            <p className={`mt-2 text-2xl font-semibold ${card.tone}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className={`rounded-2xl border p-4 xl:col-span-5 ${panelClass}`}>
          <h4 className="text-sm font-semibold">Broadcast Message</h4>
          <p className="mt-1 text-xs text-slate-500">
            Send platform-wide updates directly into user support inboxes.
          </p>

          <div className="mt-3 space-y-3">
            <input
              type="text"
              value={broadcastSubject}
              onChange={(event) => setBroadcastSubject(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              placeholder="Broadcast subject"
              maxLength={120}
            />
            <textarea
              value={broadcastMessage}
              onChange={(event) => setBroadcastMessage(event.target.value)}
              rows={5}
              className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              placeholder="Write a platform update for users..."
              maxLength={4000}
            />
            <select
              value={broadcastTarget}
              onChange={(event) => setBroadcastTarget(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 [color-scheme:light] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:[color-scheme:dark]"
            >
              <option value="active_all">All Active Users</option>
              <option value="all_users">All Users</option>
              <option value="premium_plus">Premium+ Users</option>
              <option value="platinum_elite">Platinum + Elite</option>
              <option value="elite_only">Elite Only</option>
            </select>

            {broadcastError && (
              <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                {broadcastError}
              </p>
            )}
            {broadcastSuccess && (
              <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                {broadcastSuccess}
              </p>
            )}

            <button
              onClick={handleBroadcast}
              disabled={isBroadcasting}
              className={`w-full rounded-lg px-3 py-2 text-sm font-semibold text-white ${
                isBroadcasting ? "cursor-not-allowed bg-slate-500" : "bg-teal-600 hover:bg-teal-500"
              }`}
            >
              {isBroadcasting ? "Sending..." : "Send Broadcast"}
            </button>
          </div>
        </section>

        <section className={`rounded-2xl border p-4 xl:col-span-7 ${panelClass}`}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold">Operational Health</h4>
              <p className="text-xs text-slate-500">
                Email delivery, support load, active module footprint, and current ledger flow.
              </p>
            </div>
            <span className="rounded-full bg-teal-500/15 px-2 py-1 text-[10px] font-semibold text-teal-500">
              Live
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
              <p className="text-xs text-slate-500">Support unread</p>
              <p className="mt-2 text-2xl font-semibold text-amber-500">{metrics.support.unreadForAdmin}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
              <p className="text-xs text-slate-500">Emails sent</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-500">{metrics.emails.sent24h}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
              <p className="text-xs text-slate-500">Active modules</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-500">{activeCount(metrics.activeModules)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
              <p className="text-xs text-slate-500">Ledger entries</p>
              <p className="mt-2 text-2xl font-semibold text-violet-500">{metrics.ledger.entries24h}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              ["Trades", metrics.activeModules.trades],
              ["Place Trades", metrics.activeModules.placeTrades],
              ["Signals", metrics.activeModules.signals],
              ["Subscriptions", metrics.activeModules.subscriptions],
              ["Copy Trades", metrics.activeModules.copyTrades],
              ["Mining", metrics.activeModules.mining],
              ["Stakes", metrics.activeModules.stakes],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950/60"
              >
                <span className="text-slate-500">{label}</span>
                <span className="font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className={`rounded-2xl border p-4 ${panelClass}`}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold">User Funnel</h4>
            <p className="text-xs text-slate-500">
              Signup to KYC, first funding, first trade, and withdrawal conversion.
            </p>
          </div>
          <span className="text-xs text-slate-500">Base: {metrics.funnel.signedUp} users</span>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-5">
          {funnelSteps.map(([label, count, rate]) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold">{count}</p>
              <p className="mt-1 text-sm font-medium text-teal-500">{pct(rate)}</p>
              <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-2 rounded-full bg-teal-500"
                  style={{ width: `${Math.max(4, Math.min(100, num(rate, 0)))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={`rounded-2xl border p-4 ${panelClass}`}>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold">Retention & Churn</h4>
            <p className="text-xs text-slate-500">
              Rolling return behavior for mature users in 7-day and 30-day windows.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {retentionCards.map(([label, value, note]) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-semibold">{value}</p>
              <p className="mt-3 text-xs text-slate-500">{note}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className={`rounded-2xl border p-4 xl:col-span-6 ${panelClass}`}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold">Immutable Ledger</h4>
              <p className="text-xs text-slate-500">
                Recent balance changes with before/after values, actors, and reasons.
              </p>
            </div>
            {ledgerMissing && (
              <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-semibold text-amber-500">
                Fallback
              </span>
            )}
          </div>

          <div className="mt-3 space-y-2">
            {ledger.length === 0 ? (
              <p className="text-xs text-slate-500">No ledger rows available yet.</p>
            ) : (
              ledgerPagination.paginatedItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-950/60"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        {item.reasonLabel || "Ledger Event"}
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {item.user?.email || item.user?.name || "Unknown user"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${deltaTone(item.delta)}`}>
                        {num(item.delta, 0) > 0 ? "+" : ""}
                        {money(item.delta)}
                      </p>
                      <p className="text-[11px] text-slate-500">{time(item.createdAt)}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-500">
                    <span>Before: {money(item.balanceBefore)}</span>
                    <span>After: {money(item.balanceAfter)}</span>
                    <span>Actor: {item.actor?.email || item.actorLabel || item.actorRole || "system"}</span>
                  </div>
                  {(item.details || item.sourceFeature || item.status) && (
                    <p className="mt-2 text-xs text-slate-500">
                      {[item.details, item.sourceFeature, item.status].filter(Boolean).join(" | ")}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="mt-4 border-t pt-4">
            <PaginationControls
              currentPage={ledgerPagination.currentPage}
              totalPages={ledgerPagination.totalPages}
              totalItems={ledger.length}
              pageSize={ledgerPagination.pageSize}
              onPageChange={ledgerPagination.setCurrentPage}
              onPageSizeChange={ledgerPagination.setPageSize}
              pageSizeOptions={[6, 12, 24]}
              itemLabel="ledger rows"
            />
          </div>
        </section>

        <section className={`rounded-2xl border p-4 xl:col-span-6 ${panelClass}`}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold">Admin Logs</h4>
              <p className="text-xs text-slate-500">
                Recent admin-side actions across finance, security, and broadcasts.
              </p>
            </div>
            <span className="rounded-full bg-teal-500/15 px-2 py-1 text-[10px] font-semibold text-teal-500">
              Live
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {logs.length === 0 ? (
              <p className="text-xs text-slate-500">No admin logs yet.</p>
            ) : (
              logsPagination.paginatedItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-950/60"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusTone(item.type)}`}>
                      {item.type || "system"}
                    </span>
                    <span className="text-[11px] text-slate-500">{time(item.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold">{item.message || "System event"}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Actor: {item.actor?.email || "System"}
                    {item.targetUser?.email ? ` | Target: ${item.targetUser.email}` : ""}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 border-t pt-4">
            <PaginationControls
              currentPage={logsPagination.currentPage}
              totalPages={logsPagination.totalPages}
              totalItems={logs.length}
              pageSize={logsPagination.pageSize}
              onPageChange={logsPagination.setCurrentPage}
              onPageSizeChange={logsPagination.setPageSize}
              pageSizeOptions={[8, 16, 32]}
              itemLabel="logs"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
