import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  BellRing,
  CheckCheck,
  CreditCard,
  MessageSquare,
  Shield,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";

const MAX_ALERT_ITEMS = 40;

const getToken = () =>
  (localStorage.getItem("authToken") || "").replace(/^["']|["']$/g, "").trim();

const formatClock = (value) => {
  if (!value) return "starting...";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "starting...";
  return date.toLocaleTimeString();
};

const sumUnreadMessages = (rows = []) =>
  rows.reduce((sum, item) => sum + (Number(item?.unreadForAdmin) || 0), 0);

const makeAlert = ({ type, text }) => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  type,
  text,
  read: false,
  createdAt: new Date().toISOString(),
});

const getTone = (type, isDark) => {
  if (type === "message") {
    return isDark
      ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-200"
      : "border-cyan-200 bg-cyan-50 text-cyan-700";
  }
  if (type === "finance") {
    return isDark
      ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
      : "border-amber-200 bg-amber-50 text-amber-700";
  }
  return isDark
    ? "border-violet-500/30 bg-violet-500/10 text-violet-200"
    : "border-violet-200 bg-violet-50 text-violet-700";
};

export default function AdminNotificationBar({
  isDark,
  pendingRequestsCount,
  onOpenMessages,
  onOpenFinance,
  onOpenSecurity,
  onMessageCountChange,
}) {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingKyc, setPendingKyc] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [syncError, setSyncError] = useState("");
  const [lastSyncAt, setLastSyncAt] = useState(0);
  const [showPanel, setShowPanel] = useState(false);

  const panelRef = useRef(null);
  const prevRef = useRef({
    initialized: false,
    unreadMessages: 0,
    pendingFinance: 0,
    pendingKyc: 0,
  });

  const unreadAlerts = useMemo(
    () => alerts.filter((item) => !item.read).length,
    [alerts]
  );

  const authFetch = useCallback(async (urlOrUrls) => {
    const token = getToken();
    if (!token) throw new Error("Missing admin token");

    const urls = Array.isArray(urlOrUrls) ? urlOrUrls : [urlOrUrls];
    let lastError = null;

    for (const url of urls) {
      const response = await fetch(url, {
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

  const pushAlert = useCallback((type, text) => {
    setAlerts((prev) => [makeAlert({ type, text }), ...prev].slice(0, MAX_ALERT_ITEMS));
  }, []);

  const syncAdminNotifications = useCallback(async () => {
    try {
      const [messageResult, kycResult] = await Promise.all([
        authFetch([
          `${API_BASE_URL}/Admin/Messages?limit=120`,
          `${API_BASE_URL}/Admin/Message?limit=120`,
          `${API_BASE_URL}/admin/messages?limit=120`,
          `${API_BASE_URL}/admin/message?limit=120`,
        ]).catch((error) => {
          if (/\(404\)/.test(error?.message || "")) {
            return { success: true, data: [] };
          }
          throw error;
        }),
        authFetch(`${API_BASE_URL}/Admin/Kyc`).catch(() => ({ success: true, data: [] })),
      ]);

      const messageRows = Array.isArray(messageResult?.data) ? messageResult.data : [];
      const kycRows = Array.isArray(kycResult?.data) ? kycResult.data : [];
      const nextUnreadMessages = sumUnreadMessages(messageRows);
      const nextPendingKyc = kycRows.filter(
        (row) => `${row?.status || ""}`.toLowerCase() === "pending"
      ).length;

      setUnreadMessages(nextUnreadMessages);
      setPendingKyc(nextPendingKyc);
      setSyncError("");
      setLastSyncAt(Date.now());
      onMessageCountChange(nextUnreadMessages);

      const previous = prevRef.current;
      if (previous.initialized) {
        if (nextUnreadMessages > previous.unreadMessages) {
          const delta = nextUnreadMessages - previous.unreadMessages;
          pushAlert(
            "message",
            `${delta} new unread message${delta > 1 ? "s" : ""} from users`
          );
        }
        if (pendingRequestsCount > previous.pendingFinance) {
          const delta = pendingRequestsCount - previous.pendingFinance;
          pushAlert(
            "finance",
            `${delta} new pending transaction${delta > 1 ? "s" : ""} requires review`
          );
        }
        if (nextPendingKyc > previous.pendingKyc) {
          const delta = nextPendingKyc - previous.pendingKyc;
          pushAlert(
            "security",
            `${delta} new KYC submission${delta > 1 ? "s" : ""} is waiting`
          );
        }
      }

      prevRef.current = {
        initialized: true,
        unreadMessages: nextUnreadMessages,
        pendingFinance: pendingRequestsCount,
        pendingKyc: nextPendingKyc,
      };
    } catch (error) {
      setSyncError(error?.message || "Unable to sync admin notifications.");
    }
  }, [authFetch, onMessageCountChange, pendingRequestsCount, pushAlert]);

  useEffect(() => {
    syncAdminNotifications();
    const intervalId = setInterval(syncAdminNotifications, 15000);
    return () => clearInterval(intervalId);
  }, [syncAdminNotifications]);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (!showPanel) return;
      if (panelRef.current?.contains(event.target)) return;
      setShowPanel(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [showPanel]);

  const markRead = (id) => {
    setAlerts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  };

  const markAllRead = () => {
    setAlerts((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const openAlertContext = (alert) => {
    markRead(alert.id);
    if (alert.type === "message") onOpenMessages();
    if (alert.type === "finance") onOpenFinance();
    if (alert.type === "security") onOpenSecurity();
    setShowPanel(false);
  };

  return (
    <div
      className={`mt-3 rounded-2xl border p-3 ${
        isDark ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenMessages}
            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
              isDark
                ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              Messages
              <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {unreadMessages}
              </span>
            </span>
          </button>

          <button
            onClick={onOpenFinance}
            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
              isDark
                ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              Pending Finance
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {pendingRequestsCount}
              </span>
            </span>
          </button>

          <button
            onClick={onOpenSecurity}
            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
              isDark
                ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Pending KYC
              <span className="rounded-full bg-violet-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {pendingKyc}
              </span>
            </span>
          </button>
        </div>

        <div className="relative" ref={panelRef}>
          <button
            onClick={() => setShowPanel((prev) => !prev)}
            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
              isDark
                ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
            aria-label="Open admin alerts"
          >
            <span className="flex items-center gap-1.5">
              <BellRing className="h-3.5 w-3.5" />
              Alerts
              {unreadAlerts > 0 && (
                <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {unreadAlerts}
                </span>
              )}
            </span>
          </button>

          {showPanel && (
            <div
              className={`absolute right-0 top-10 z-50 w-80 rounded-xl border shadow-xl ${
                isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
              }`}
            >
              <div
                className={`flex items-center justify-between border-b px-3 py-2 ${
                  isDark ? "border-slate-700" : "border-slate-200"
                }`}
              >
                <p className="text-xs font-semibold">Admin Alerts</p>
                <button
                  onClick={markAllRead}
                  className="text-[11px] font-semibold text-teal-500 hover:text-teal-400"
                >
                  <span className="flex items-center gap-1">
                    <CheckCheck className="h-3 w-3" />
                    Mark all read
                  </span>
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto p-2">
                {alerts.length === 0 ? (
                  <p className="rounded-lg px-2 py-6 text-center text-xs text-slate-500">
                    No alerts yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {alerts.map((alert) => (
                      <button
                        key={alert.id}
                        onClick={() => openAlertContext(alert)}
                        className={`w-full rounded-lg border p-2 text-left ${
                          alert.read
                            ? isDark
                              ? "border-slate-700 bg-slate-900/60 text-slate-300"
                              : "border-slate-200 bg-slate-50 text-slate-700"
                            : getTone(alert.type, isDark)
                        }`}
                      >
                        <p className="text-xs font-semibold">{alert.text}</p>
                        <p className="mt-1 text-[10px] opacity-80">
                          {new Date(alert.createdAt).toLocaleString()}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-slate-500">Sync {formatClock(lastSyncAt)}</p>
        {syncError && <p className="text-[11px] text-rose-500">{syncError}</p>}
      </div>
    </div>
  );
}

AdminNotificationBar.propTypes = {
  isDark: PropTypes.bool,
  pendingRequestsCount: PropTypes.number,
  onOpenMessages: PropTypes.func,
  onOpenFinance: PropTypes.func,
  onOpenSecurity: PropTypes.func,
  onMessageCountChange: PropTypes.func,
};

AdminNotificationBar.defaultProps = {
  isDark: false,
  pendingRequestsCount: 0,
  onOpenMessages: () => {},
  onOpenFinance: () => {},
  onOpenSecurity: () => {},
  onMessageCountChange: () => {},
};
