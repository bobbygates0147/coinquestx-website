import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import PropTypes from "prop-types";
import {
  ArrowLeftRight,
  Bitcoin,
  Bot,
  BriefcaseBusiness,
  Building2,
  CandlestickChart,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Gem,
  HandCoins,
  House,
  Landmark,
  LogOut,
  MessageSquareMore,
  ReceiptText,
  Rocket,
  ShieldCheck,
  Signal,
  UserRound,
  UserRoundCog,
  Users,
  WalletCards,
} from "lucide-react";
import { useKycNavigation } from "../hooks/useKycNavigation";
import { isKycProtectedPath } from "../utils/kycAccess";

const mainLinks = [
  { to: "/Dashboard", icon: House, text: "Dashboard" },
  { to: "/Assets", icon: Gem, text: "Assets" },
  { to: "/deposits", icon: WalletCards, text: "Deposit" },
  { to: "/Withdrawal", icon: HandCoins, text: "Withdraw" },
  { to: "/PaymentProof", icon: ReceiptText, text: "Payment Proof" },
  { to: "/transactions", icon: ArrowLeftRight, text: "Transactions" },
  { to: "/Referrals", icon: Users, text: "Referral" },
];

const tradingLinks = [
  { to: "/PlaceTrade", icon: CandlestickChart, text: "Place Trade" },
  { to: "/Subscription", icon: ClipboardList, text: "Subscription" },
  { to: "/MyTraders", icon: Users, text: "Copy Trade" },
  { to: "/DailySignal", icon: Signal, text: "Daily Signal" },
  { to: "/BuyBots", icon: Bot, text: "Buy Bots" },
  { to: "/Mining", icon: Rocket, text: "Mining" },
  { to: "/Stake", icon: Landmark, text: "Stake" },
  { to: "/RealEstate", icon: Building2, text: "Real Estate" },
  { to: "/MyCopytraders", icon: BriefcaseBusiness, text: "My Copy Trade" },
  { to: "/TradesRoi", icon: CandlestickChart, text: "Trades/ROI" },
  { to: "/BuyCrypto", icon: Bitcoin, text: "Buy Crypto" },
];

const userLinks = [
  { to: "/Account", icon: UserRoundCog, text: "My Profile" },
  { to: "/Settings", icon: ShieldCheck, text: "Security Settings" },
  { to: "/kyc-verification", icon: ShieldCheck, text: "Verify Account" },
  { to: "/Messages", icon: MessageSquareMore, text: "Messages" },
];

const baseItemClass =
  "group relative flex w-full min-w-0 items-center overflow-hidden rounded-2xl py-3 transition-all duration-200";

export default function DashboardSidebar({ isCollapsed }) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { theme } = useTheme();
  const location = useLocation();
  const { isKycComplete, navigateWithKycCheck } = useKycNavigation();
  const isDark = theme === "dark";
  const sectionLabelClass = `px-4 text-[10px] font-semibold uppercase tracking-[0.28em] ${
    isDark ? "text-slate-500" : "text-slate-400"
  }`;
  const railPaddingClass = isCollapsed ? "px-0.5" : "px-2";

  const isActive = (path) => {
    const current = location.pathname.toLowerCase();
    const target = path.toLowerCase();
    return current === target || current.startsWith(`${target}/`);
  };

  const renderNavItem = ({ to, icon: Icon, text, hidden = false }) => {
    const active = isActive(to);
    const isBlocked = !isKycComplete && isKycProtectedPath(to);
    const activeItemStateClass = isCollapsed
      ? isDark
        ? "bg-transparent text-teal-200 shadow-none"
        : "bg-transparent text-teal-700 shadow-none"
      : isDark
        ? "bg-gradient-to-r from-teal-500/20 via-teal-500/12 to-transparent text-teal-200 shadow-[inset_0_0_0_1px_rgba(45,212,191,0.22)]"
        : "bg-gradient-to-r from-teal-500/12 via-teal-50 to-transparent text-teal-700 shadow-[inset_0_0_0_1px_rgba(20,184,166,0.18)]";
    const activeIconStateClass = isCollapsed
      ? isDark
        ? "border-teal-300/30 bg-teal-400/12 text-teal-100 shadow-[0_0_0_1px_rgba(45,212,191,0.14),0_0_20px_rgba(45,212,191,0.28),0_0_38px_rgba(45,212,191,0.18)] animate-[pulse_2.4s_ease-in-out_infinite] motion-reduce:animate-none"
        : "border-teal-300/80 bg-white text-teal-700 shadow-[0_0_0_1px_rgba(20,184,166,0.12),0_0_18px_rgba(20,184,166,0.18),0_0_34px_rgba(45,212,191,0.14)] animate-[pulse_2.4s_ease-in-out_infinite] motion-reduce:animate-none"
      : isDark
        ? "border-teal-400/35 bg-teal-400/14 text-teal-200 shadow-[0_0_22px_rgba(45,212,191,0.22)]"
        : "border-teal-300/70 bg-white text-teal-700 shadow-[0_10px_20px_rgba(15,23,42,0.06)]";
    const itemClass = `${baseItemClass} ${
      hidden
        ? "hidden"
        : isCollapsed
          ? "justify-center px-0"
          : "justify-start px-3"
    } ${
      active
        ? activeItemStateClass
        : isBlocked
        ? isDark
          ? "text-slate-500 opacity-75 hover:bg-slate-900/70 hover:text-teal-200"
          : "text-slate-400 opacity-80 hover:bg-slate-100 hover:text-teal-700"
        : isDark
          ? "text-slate-400 hover:bg-slate-900/70 hover:text-teal-200"
          : "text-slate-600 hover:bg-slate-100 hover:text-teal-700"
    }`;

    const content = (
      <>
        <span
          className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-gradient-to-b from-teal-300 via-teal-400 to-cyan-400 transition-opacity ${
            !isCollapsed && active ? "opacity-100" : "opacity-0"
          }`}
        />
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-all ${
            active
              ? activeIconStateClass
              : isDark
                ? "border-slate-800 bg-slate-900 text-slate-400 group-hover:border-teal-400/25 group-hover:bg-teal-500/12 group-hover:text-teal-200"
                : "border-slate-200 bg-white text-slate-500 group-hover:border-teal-200 group-hover:bg-teal-50 group-hover:text-teal-700"
          }`}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} />
        </span>
        {!isCollapsed && (
          <span className="ml-3 truncate text-sm font-medium tracking-wide">
            {text}
          </span>
        )}
      </>
    );

    if (isBlocked) {
      return (
        <button
          key={to}
          type="button"
          onClick={() => navigateWithKycCheck(to)}
          className={itemClass}
          title={`Complete KYC verification to access ${text}`}
        >
          {content}
        </button>
      );
    }

    return (
      <Link
        key={to}
        to={to}
        className={itemClass}
        title={isCollapsed ? text : undefined}
      >
        {content}
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col overflow-x-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
        <div className={`space-y-1.5 ${railPaddingClass}`}>
          {mainLinks.map((item) => renderNavItem(item))}
        </div>

        {!isCollapsed && (
          <div className="mt-5 mb-3">
            <h3 className={sectionLabelClass}>Trading Grid</h3>
          </div>
        )}

        <div className={`space-y-1.5 ${railPaddingClass}`}>
          {tradingLinks.map((item, index) =>
            renderNavItem({ ...item, hidden: isCollapsed && index >= 4 })
          )}
        </div>
      </div>

      <div className="mt-auto space-y-2 pb-1">
        {!isCollapsed && (
          <div className="px-4 pt-4">
            <h3 className={sectionLabelClass.replace("px-4 ", "")}>Account</h3>
          </div>
        )}

        <div className={`relative ${railPaddingClass}`}>
          <button
            onClick={() => setIsUserMenuOpen((open) => !open)}
            className={`${baseItemClass} ${
              isCollapsed ? "justify-center px-0" : "justify-between px-3"
            } ${
              isDark
                ? "text-slate-300 hover:bg-slate-900/75 hover:text-teal-200"
                : "text-slate-700 hover:bg-slate-100 hover:text-teal-700"
            }`}
            aria-label="User menu"
            title={isCollapsed ? "User menu" : undefined}
          >
            <span className="flex min-w-0 items-center">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-2xl border shadow-[0_0_20px_rgba(45,212,191,0.14)] ${
                  isDark
                    ? "border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 text-teal-200"
                    : "border-slate-200 bg-gradient-to-br from-white to-slate-100 text-teal-700"
                }`}
              >
                <UserRound className="h-[18px] w-[18px]" strokeWidth={2.25} />
              </span>
              {!isCollapsed && (
                <span className="ml-3 truncate text-sm font-medium">User Space</span>
              )}
            </span>
            {!isCollapsed &&
              (isUserMenuOpen ? (
                <ChevronUp
                  className={`h-4 w-4 ${isDark ? "text-teal-300" : "text-teal-600"}`}
                  strokeWidth={2.2}
                />
              ) : (
                <ChevronDown
                  className={`h-4 w-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}
                  strokeWidth={2.2}
                />
              ))}
          </button>

          {isUserMenuOpen && !isCollapsed && (
            <div
              className={`mt-2 rounded-2xl border p-2 shadow-[0_16px_40px_rgba(2,8,23,0.18)] ${
                isDark
                  ? "border-slate-800 bg-slate-950"
                  : "border-slate-200 bg-white"
              }`}
            >
              {userLinks.map(({ to, icon: Icon, text }) => {
                const active = isActive(to);

                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex min-w-0 items-center rounded-xl px-3 py-2.5 text-sm transition-colors ${
                      active
                        ? isDark
                          ? "bg-teal-500/14 text-teal-200"
                          : "bg-teal-50 text-teal-700"
                        : isDark
                          ? "text-slate-300 hover:bg-slate-900 hover:text-teal-200"
                          : "text-slate-700 hover:bg-slate-100 hover:text-teal-700"
                    }`}
                  >
                    <Icon className="mr-3 h-4 w-4 shrink-0" strokeWidth={2.2} />
                    <span className="truncate">{text}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className={railPaddingClass}>
          <Link
            to="/"
            className={`${baseItemClass} ${
              isCollapsed ? "justify-center px-0" : "justify-start px-3"
            } ${
              isDark
                ? "text-slate-300 hover:bg-rose-500/12 hover:text-rose-200"
                : "text-slate-700 hover:bg-rose-50 hover:text-rose-600"
            }`}
            aria-label="Logout"
            title={isCollapsed ? "Logout" : undefined}
          >
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${
                isDark
                  ? "border-rose-500/15 bg-rose-500/10 text-rose-300"
                  : "border-rose-200 bg-rose-50 text-rose-600"
              }`}
            >
              <LogOut className="h-[18px] w-[18px]" strokeWidth={2.25} />
            </span>
            {!isCollapsed && <span className="ml-3 text-sm font-medium">Exit Dashboard</span>}
          </Link>
        </div>
      </div>
    </div>
  );
}

DashboardSidebar.propTypes = {
  isCollapsed: PropTypes.bool.isRequired,
};
