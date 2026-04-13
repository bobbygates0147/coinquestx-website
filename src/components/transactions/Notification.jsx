import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  Bell,
  BellRing,
  CheckCheck,
  ChevronRight,
  ReceiptText,
  ShieldAlert,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";

const getNotificationCategory = (notification = {}) => {
  const type = `${notification.type || ""}`.toLowerCase();
  const text = `${notification.text || ""}`.toLowerCase();

  if (type === "error" || text.includes("failed")) return "error";
  if (text.includes("withdrawal")) return "withdrawal";
  if (text.includes("deposit")) return "deposit";
  if (text.includes("subscription")) return "subscription";
  if (text.includes("signal")) return "signal";
  if (text.includes("bot")) return "bots";
  return type === "success" ? "success" : "general";
};

const getNotificationRoute = (notification = {}) => {
  const category = getNotificationCategory(notification);

  switch (category) {
    case "deposit":
      return "/Deposits";
    case "withdrawal":
      return "/Withdrawal";
    case "subscription":
      return "/Subscription";
    case "signal":
      return "/DailySignal";
    case "bots":
      return "/BuyBots";
    default:
      return "/Transactions";
  }
};

const CATEGORY_OPTIONS = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "deposit", label: "Deposits" },
  { value: "withdrawal", label: "Withdrawals" },
  { value: "subscription", label: "Plans" },
  { value: "signal", label: "Signals" },
  { value: "bots", label: "Bots" },
  { value: "error", label: "Errors" },
];

export default function NotificationsPage() {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    removeAllNotifications,
  } = useNotifications();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "unread") return !notification.read;
      return getNotificationCategory(notification) === activeFilter;
    });
  }, [activeFilter, notifications]);

  const unreadCount = notifications.filter((item) => !item.read).length;
  const summaryCards = [
    {
      label: "Total Alerts",
      value: notifications.length,
      icon: BellRing,
      tone: "text-teal-400",
    },
    {
      label: "Unread",
      value: unreadCount,
      icon: Sparkles,
      tone: "text-amber-400",
    },
    {
      label: "Actionable",
      value: notifications.filter((item) => getNotificationRoute(item)).length,
      icon: ReceiptText,
      tone: "text-cyan-400",
    },
  ];

  const surfaceClass = isDark
    ? "border-slate-700 bg-slate-900 text-slate-100"
    : "border-slate-200 bg-white text-slate-900";
  const mutedClass = isDark ? "text-slate-300" : "text-slate-600";

  return (
    <section className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className={`rounded-3xl border p-6 shadow-xl ${surfaceClass}`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-400">
                Alert Center
              </p>
              <h1 className="text-3xl font-semibold">Track account signals and critical updates.</h1>
              <p className={`max-w-3xl text-sm sm:text-base ${mutedClass}`}>
                Filter alerts by product, keep unread items visible, and jump straight to the
                module behind each notification.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={markAllAsRead}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300/20 px-4 py-2 text-sm font-semibold text-teal-400 hover:bg-teal-500/10"
              >
                <CheckCheck className="h-4 w-4" strokeWidth={2.2} />
                Mark all read
              </button>
              <button
                onClick={removeAllNotifications}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300/20 px-4 py-2 text-sm font-semibold text-rose-400 hover:bg-rose-500/10"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2.2} />
                Clear all
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className={`rounded-2xl border p-4 ${
                    isDark
                      ? "border-slate-700 bg-slate-800/70"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                        {card.label}
                      </p>
                      <p className={`mt-3 text-2xl font-semibold ${card.tone}`}>{card.value}</p>
                    </div>
                    <Icon className={`h-5 w-5 ${card.tone}`} strokeWidth={2.2} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`rounded-3xl border p-5 shadow-xl ${surfaceClass}`}>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setActiveFilter(option.value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeFilter === option.value
                    ? "bg-teal-500/15 text-teal-400"
                    : isDark
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="mt-5">
            {filteredNotifications.length === 0 ? (
              <div
                className={`rounded-2xl border border-dashed px-6 py-16 text-center ${
                  isDark ? "border-slate-700 text-slate-300" : "border-slate-300 text-slate-600"
                }`}
              >
                <Bell className="mx-auto h-10 w-10 text-slate-400" strokeWidth={2} />
                <p className="mt-4 text-lg font-semibold">No notifications in this view</p>
                <p className="mt-2 text-sm">
                  New deposits, withdrawals, plan activity, and system alerts will show up here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => {
                  const category = getNotificationCategory(notification);
                  const route = getNotificationRoute(notification);
                  const categoryLabel = category === "general" ? "general" : category;

                  return (
                    <article
                      key={notification.id}
                      className={`rounded-2xl border p-4 transition ${
                        !notification.read
                          ? isDark
                            ? "border-teal-500/30 bg-teal-500/10"
                            : "border-teal-200 bg-teal-50"
                          : isDark
                          ? "border-slate-700 bg-slate-800/60"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${
                                category === "error"
                                  ? "bg-rose-500/15 text-rose-400"
                                  : category === "success"
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : "bg-cyan-500/15 text-cyan-400"
                              }`}
                            >
                              {categoryLabel}
                            </span>
                            {!notification.read && (
                              <span className="rounded-full bg-amber-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-400">
                                unread
                              </span>
                            )}
                          </div>

                          <p className="mt-3 text-sm font-semibold">{notification.text}</p>
                          <p className={`mt-2 text-xs ${mutedClass}`}>
                            {notification.time} - {notification.date}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="rounded-full bg-teal-500/15 px-3 py-1.5 text-xs font-semibold text-teal-400"
                              >
                                Mark read
                              </button>
                            )}
                            <Link
                              to={route}
                              className="inline-flex items-center gap-1 rounded-full bg-slate-900/10 px-3 py-1.5 text-xs font-semibold text-slate-200 dark:bg-slate-700"
                            >
                              Open module
                              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.2} />
                            </Link>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {category === "error" ? (
                            <ShieldAlert className="h-5 w-5 text-rose-400" strokeWidth={2.2} />
                          ) : (
                            <ReceiptText className="h-5 w-5 text-teal-400" strokeWidth={2.2} />
                          )}
                          <button
                            onClick={() => removeNotification(notification.id)}
                            className="rounded-full p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400"
                            aria-label="Remove notification"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={2.2} />
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
