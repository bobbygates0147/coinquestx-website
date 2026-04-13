import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  Bell,
  CircleAlert,
  ChevronDown,
  CheckCheck,
  Info,
  LogOut,
  Menu,
  MessageSquareMore,
  MoonStar,
  ReceiptText,
  Sparkles,
  SunMedium,
  UserRound,
  X,
} from "lucide-react";
import { useUser } from "../../../context/UserContext";
import { useNotifications } from "../../../context/NotificationContext";
import PropTypes from "prop-types";
import { getDashboardPageMeta } from "../../../constants/dashboardPageMeta";
import GlobalSearchControl from "./GlobalSearchControl";
import LanguageSelectControl from "../../ui/LanguageSelectControl";

const getPanelSurface = (theme) =>
  `absolute right-0 mt-3 z-50 w-[22rem] overflow-hidden rounded-[1.35rem] border shadow-[0_24px_80px_rgba(2,8,23,0.32)] ${
    theme === "dark"
      ? "border-slate-800 bg-slate-950"
      : "border-slate-200 bg-white"
  }`;

const getNotificationPanelSurface = (theme) =>
  `fixed left-3 right-3 top-[calc(env(safe-area-inset-top)+4.75rem)] z-50 flex max-h-[min(78vh,32rem)] flex-col overflow-hidden rounded-[1.35rem] border shadow-[0_24px_80px_rgba(2,8,23,0.32)] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-[22rem] sm:max-h-[32rem] ${
    theme === "dark"
      ? "border-slate-800 bg-slate-950"
      : "border-slate-200 bg-white"
  }`;

const getControlButtonClass = (theme) =>
  theme === "dark"
    ? "border-slate-800 bg-slate-900/85 text-slate-300 hover:border-teal-400/30 hover:bg-slate-900 hover:text-teal-200"
    : "border-slate-200 bg-white text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.06)] hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700";

const getNotificationVisual = (notification = {}) => {
  switch (notification.type) {
    case "success":
      return { icon: BadgeCheck };
    case "error":
      return { icon: CircleAlert };
    case "transaction":
      return { icon: ReceiptText };
    case "info":
    default:
      return { icon: Info };
  }
};

const NotificationPanel = ({ theme }) => {
  const {
    notifications,
    unreadCount,
    showPanel,
    setShowPanel,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotifications();
  const panelRef = useRef(null);
  const buttonRef = useRef(null);
  const isDark = theme === "dark";
  const panelSurface = getNotificationPanelSurface(theme);
  const controlButtonClass = getControlButtonClass(theme);

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (!showPanel) return;
      if (
        panelRef.current?.contains(event.target) ||
        buttonRef.current?.contains(event.target)
      ) {
        return;
      }
      setShowPanel(false);
    };

    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, [showPanel, setShowPanel]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setShowPanel(!showPanel)}
        className={`group relative flex h-11 w-11 items-center justify-center rounded-2xl border transition-all ${controlButtonClass}`}
        aria-label="Notifications"
      >
        <Bell className="h-4.5 w-4.5" strokeWidth={2.2} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 px-1 text-[10px] font-black text-slate-950 shadow-[0_0_16px_rgba(45,212,191,0.45)]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {showPanel && (
        <div ref={panelRef} className={panelSurface}>
          <div
            className={`border-b px-4 py-4 ${
              isDark
                ? "border-slate-800 bg-gradient-to-r from-teal-500/12 via-slate-950 to-cyan-500/10"
                : "border-slate-200 bg-gradient-to-r from-teal-50 via-white to-cyan-50"
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-teal-300/80">
                  Alert Feed
                </p>
                <h3 className={`mt-1 text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                  Notifications
                </h3>
              </div>
              <button
                onClick={markAllAsRead}
                className={`inline-flex w-full items-center justify-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-medium transition sm:w-auto ${
                  isDark
                    ? "border-teal-400/20 bg-teal-500/10 text-teal-200 hover:bg-teal-500/16"
                    : "border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100"
                }`}
              >
                <CheckCheck className="h-3.5 w-3.5" strokeWidth={2.3} />
                Mark all
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2.5 sm:p-3">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <Bell
                  className={`mb-3 h-10 w-10 ${isDark ? "text-slate-600" : "text-slate-300"}`}
                  strokeWidth={1.7}
                />
                <p className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                  No fresh alerts
                </p>
                <p className={`mt-1 text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                  System notices, trade updates, and confirmations will land here.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    className={`w-full rounded-[1.35rem] border px-3 py-3 text-left transition sm:rounded-[1.5rem] sm:px-4 sm:py-4 ${
                      !notification.read
                        ? isDark
                          ? "border-teal-500/20 bg-teal-500/10 hover:bg-teal-500/14"
                          : "border-teal-200 bg-teal-50 hover:bg-teal-100"
                        : isDark
                          ? "border-slate-800 bg-slate-900/82 hover:bg-slate-900"
                          : "border-slate-200 bg-slate-50 hover:bg-white"
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border sm:h-10 sm:w-10 ${
                          notification.type === "transaction"
                            ? isDark
                              ? "border-teal-400/20 bg-teal-500/12 text-teal-200"
                              : "border-teal-200 bg-teal-50 text-teal-700"
                            : notification.type === "success"
                              ? isDark
                                ? "border-emerald-400/20 bg-emerald-500/12 text-emerald-200"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : notification.type === "error"
                                ? isDark
                                  ? "border-rose-400/20 bg-rose-500/12 text-rose-200"
                                  : "border-rose-200 bg-rose-50 text-rose-700"
                                : isDark
                                  ? "border-slate-800 bg-slate-900 text-slate-300"
                                  : "border-slate-200 bg-slate-100 text-slate-600"
                        }`}
                      >
                        {(() => {
                          const { icon: NotificationIcon } =
                            getNotificationVisual(notification);
                          return (
                            <NotificationIcon
                              className="h-4.5 w-4.5"
                              strokeWidth={2.2}
                            />
                          );
                        })()}
                      </span>

                      <div className="min-w-0 flex-1 pr-1">
                        <p className={`break-words text-sm font-medium leading-6 sm:leading-7 ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                          {notification.text}
                        </p>
                        <p className={`mt-2 text-[11px] ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                          {notification.time} - {notification.date}
                        </p>
                        {notification.type === "transaction" && (
                          <p
                            className={`mt-2.5 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] ${
                              isDark
                                ? "border-teal-400/18 bg-teal-500/10 text-teal-200"
                                : "border-teal-200 bg-teal-50 text-teal-700"
                            }`}
                          >
                            <ReceiptText className="h-3 w-3" strokeWidth={2.3} />
                            Transaction
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeNotification(notification.id);
                        }}
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition ${
                          isDark
                            ? "text-slate-500 hover:bg-slate-800 hover:text-rose-300"
                            : "text-slate-400 hover:bg-slate-100 hover:text-rose-500"
                        }`}
                        aria-label="Remove notification"
                      >
                        <X className="h-4 w-4" strokeWidth={2.3} />
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={`border-t px-4 py-3 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
            <Link
              to="/Notification"
              className={`inline-flex w-full items-center justify-center gap-2 text-xs font-medium transition sm:w-auto sm:justify-start ${
                isDark ? "text-teal-200 hover:text-white" : "text-teal-700 hover:text-teal-900"
              }`}
              onClick={() => setShowPanel(false)}
            >
              <Bell className="h-3.5 w-3.5" strokeWidth={2.3} />
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

NotificationPanel.propTypes = {
  theme: PropTypes.string.isRequired,
};

const HeaderPage = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { userData, logoutUser, isLoading, isAuthenticated } =
    useUser();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const userMenuLinks = [
    { label: "Account", to: "/Account", icon: UserRound },
    { label: "Messages", to: "/Messages", icon: MessageSquareMore },
    { label: "Help Center", to: "/Help", icon: Sparkles },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (isLoading) {
    return (
      <header className="flex h-full w-full items-center justify-between px-4 text-slate-100 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-11 w-11 animate-pulse rounded-2xl bg-slate-800" />
          <div>
            <div className="h-3 w-24 animate-pulse rounded-full bg-slate-800" />
            <div className="mt-2 h-7 w-44 animate-pulse rounded-full bg-slate-900" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-11 w-11 animate-pulse rounded-2xl bg-slate-900" />
          <div className="h-11 w-11 animate-pulse rounded-2xl bg-slate-900" />
          <div className="h-12 w-36 animate-pulse rounded-2xl bg-slate-900" />
        </div>
      </header>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const getUserName = () =>
    userData?.firstName ||
    userData?.name ||
    userData?.displayName ||
    userData?.email?.split("@")[0] ||
    "User";

  const isDark = theme === "dark";
  const userName = getUserName();
  const currentPage = getDashboardPageMeta(location.pathname).title;
  const panelSurface = getPanelSurface(theme);

  return (
    <header
      className={`flex h-full w-full items-center gap-3 px-4 sm:px-6 lg:px-8 ${
        isDark ? "text-slate-100" : "text-slate-900"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition ${getControlButtonClass(
            theme
          )}`}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-4.5 w-4.5" strokeWidth={2.2} />
        </button>
        <div className="min-w-0">
          <p
            className={`truncate text-sm font-semibold tracking-[0.18em] ${
              isDark ? "text-white" : "text-slate-800"
            }`}
          >
            {currentPage}
          </p>
        </div>
      </div>

      <div className="min-w-0 flex-1 px-1">
        <div className="mx-auto w-full max-w-3xl">
          <GlobalSearchControl theme={theme} />
        </div>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <GlobalSearchControl theme={theme} compact />

        <LanguageSelectControl theme={theme} />

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className={`group flex h-11 w-11 items-center justify-center rounded-2xl border transition-all ${getControlButtonClass(
            theme
          )}`}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <SunMedium className="h-4.5 w-4.5" strokeWidth={2.2} />
          ) : (
            <MoonStar className="h-4.5 w-4.5" strokeWidth={2.2} />
          )}
        </button>

        <NotificationPanel theme={theme} />

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={`flex items-center gap-3 rounded-[1.2rem] border px-2 py-1.5 text-left transition-all ${
              isDark
                ? "border-slate-800 bg-slate-900/88 hover:border-teal-400/28 hover:bg-slate-900"
                : "border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.06)] hover:border-teal-300 hover:bg-teal-50/60"
            }`}
            aria-label="User menu"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border bg-gradient-to-br ${
                isDark
                  ? "border-teal-400/18 from-teal-500/20 to-cyan-500/18 text-teal-100"
                  : "border-teal-200 from-teal-50 to-cyan-50 text-teal-700"
              }`}
            >
              {userData.photoURL ? (
                <img
                  src={userData.photoURL}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound className="h-5 w-5" strokeWidth={2.2} />
              )}
            </div>
            <div className="hidden min-w-0 md:block">
              <p
                className={`max-w-[120px] truncate text-sm font-medium ${
                  isDark ? "text-white" : "text-slate-800"
                }`}
              >
                {userName}
              </p>
            </div>
            <ChevronDown
              className={`hidden h-4 w-4 transition-transform md:block ${
                isUserMenuOpen
                  ? `rotate-180 ${isDark ? "text-teal-300" : "text-teal-600"}`
                  : isDark
                    ? "text-slate-500"
                    : "text-slate-400"
              }`}
              strokeWidth={2.2}
            />
          </button>

          {isUserMenuOpen && (
            <div className={panelSurface}>
              <div
                className={`border-b px-4 py-4 ${
                  isDark
                    ? "border-slate-800 bg-gradient-to-r from-teal-500/12 via-slate-950 to-cyan-500/10"
                    : "border-slate-200 bg-gradient-to-r from-teal-50 via-white to-cyan-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border ${
                      isDark
                        ? "border-teal-400/20 bg-teal-500/12 text-teal-100"
                        : "border-teal-200 bg-teal-50 text-teal-700"
                    }`}
                  >
                    {userData.photoURL ? (
                      <img
                        src={userData.photoURL}
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserRound className="h-5 w-5" strokeWidth={2.2} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                      {userName}
                    </p>
                    <p className={`truncate text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {userData.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1 p-2">
                {userMenuLinks.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.to;

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all ${
                        active
                          ? isDark
                            ? "bg-teal-500/12 text-teal-200"
                            : "bg-teal-50 text-teal-700"
                          : isDark
                            ? "text-slate-200 hover:bg-slate-900 hover:text-teal-200"
                            : "text-slate-700 hover:bg-slate-100 hover:text-teal-700"
                      }`}
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4" strokeWidth={2.2} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              <div className={`border-t px-3 py-3 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    handleLogout();
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${
                    isDark
                      ? "text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                      : "text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  }`}
                >
                  <LogOut className="h-4 w-4" strokeWidth={2.2} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

HeaderPage.propTypes = {
  isSidebarOpen: PropTypes.bool.isRequired,
  setIsSidebarOpen: PropTypes.func.isRequired,
};

export default HeaderPage;
