import {
  Bell,
  CircleHelp,
  Image,
  LockKeyhole,
  LogOut,
  Mail,
  ShieldCheck,
  Star,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
  Banknote,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useTransactions } from "../../context/TransactionContext";
import { useUser } from "../../context/UserContext";
import { formatCurrencyAmount } from "../../utils/currency";
import coinquestxLogoDark from "../../pictures/coinquestxlogodark.png";
import coinquestxLogoLight from "../../pictures/coinquestxlogolight.png";
import {
  hasAiBotAccess,
  hasDirectMessageAccess,
  normalizePlanName,
} from "../../utils/subscriptionAccess";

const formatCount = (value) =>
  Number.isFinite(value) ? value.toLocaleString() : "0";

export default function AccountPage() {
  const { theme } = useTheme();
  const { userData, isAuthenticated, logoutUser, isLoading } = useUser();
  const { transactions = [] } = useTransactions();
  const accountCurrency = userData?.currencyCode || "USD";
  const isDark = theme === "dark";
  const activeLogo = isDark ? coinquestxLogoLight : coinquestxLogoDark;
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("account");
  const [dots, setDots] = useState(0);
  const completedWithdrawalsTotal = useMemo(() => {
    if (!transactions || transactions.length === 0) return 0;
    return transactions.reduce((sum, tx) => {
      const type = (tx.type || "").toLowerCase();
      if (type !== "withdrawal") return sum;
      if (tx.status !== "Completed") return sum;
      return sum + (parseFloat(tx.amount) || 0);
    }, 0);
  }, [transactions]);

  const referralCount = useMemo(() => {
    if (!userData) return 0;
    if (typeof userData.referralCount === "number") return userData.referralCount;
    if (Array.isArray(userData.referrals)) return userData.referrals.length;
    if (typeof userData.referralsCount === "number") return userData.referralsCount;
    if (userData.referralStats?.count) return userData.referralStats.count;
    return 0;
  }, [userData]);

  const accountStats = useMemo(() => {
    const balanceValue = Number.isFinite(userData?.balance) ? userData.balance : 0;
    const portfolioValue = Number.isFinite(userData?.portfolioValue)
      ? userData.portfolioValue
      : balanceValue;

    return [
      {
        icon: Wallet,
        title: "Balance",
        value: formatCurrencyAmount(balanceValue, accountCurrency),
        color: isDark ? "text-teal-400" : "text-teal-600",
      },
      {
        icon: TrendingUp,
        title: "Portfolio",
        value: formatCurrencyAmount(portfolioValue, accountCurrency),
        color: isDark ? "text-emerald-400" : "text-emerald-600",
      },
      {
        icon: Banknote,
        title: "Withdrawn",
        value: formatCurrencyAmount(completedWithdrawalsTotal, accountCurrency),
        color: isDark ? "text-teal-400" : "text-cyan-600",
      },
      {
        icon: Users,
        title: "Referrals",
        value: formatCount(referralCount),
        color: isDark ? "text-purple-400" : "text-violet-600",
      },
    ];
  }, [userData, completedWithdrawalsTotal, referralCount, accountCurrency, isDark]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const timer = setTimeout(() => navigate("/LoginPage"), 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (!isAuthenticated || !userData) {
      const interval = setInterval(() => {
        setDots((prev) => (prev < 3 ? prev + 1 : 0));
      }, 500);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, userData]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUser();
      navigate("/LoginPage");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const profile = userData || {
    uid: "",
    name: "User",
    email: "user@example.com",
    photoURL: null,
    coverImageURL: null,
  };

  const profileName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    profile.name ||
    "User";

  const getStoredSubscriptionPlan = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("currentPlan");
  };

  const subscriptionPlanLabel =
    userData?.subscriptionPlan || getStoredSubscriptionPlan() || "Basic";
  const normalizedPlan = normalizePlanName(subscriptionPlanLabel);
  const revenue = userData?.revenue || {};
  const stats = userData?.stats || {};
  const grossRevenue = Number(revenue.grossRevenue) || 0;
  const activeTradesCount = Number(revenue.activeTrades) || 0;
  const roiPercent = Number(revenue.roiPercent) || 0;
  const netCashflow = Number(revenue.netCashflow) || 0;
  const investedExposure =
    (Number(revenue.activeCopyTradeExposure) || 0) +
    (Number(revenue.activeStakePrincipal) || 0) +
    (Number(revenue.activeMiningCapital) || 0) +
    (Number(revenue.activeRealEstateAmount) || 0) +
    (Number(revenue.activeBuyBotCapital) || 0);
  const productCount =
    (Number(stats.copyTradeCount) || 0) +
    (Number(stats.botCount) || 0) +
    (Number(stats.miningCount) || 0) +
    (Number(stats.stakeCount) || 0) +
    (Number(stats.realEstateCount) || 0);
  const entitlementCards = [
    {
      label: "AI Bots",
      enabled: hasAiBotAccess(normalizedPlan),
      detail: hasAiBotAccess(normalizedPlan)
        ? "Enabled on your current plan"
        : "Upgrade plan to unlock",
    },
    {
      label: "Direct Admin Inbox",
      enabled: hasDirectMessageAccess(normalizedPlan),
      detail: hasDirectMessageAccess(normalizedPlan)
        ? "Priority support access is open"
        : "Reserved for higher tiers",
    },
    {
      label: "KYC Status",
      enabled: Boolean(userData?.kycVerified),
      detail: userData?.kycVerified ? "Verified and protected" : "Verification still pending",
    },
  ];
  const portfolioMetrics = [
    {
      label: "Realized Revenue",
      value: formatCurrencyAmount(grossRevenue, accountCurrency),
      detail: "Across trading, staking, mining, bots, and real estate.",
      accent: isDark ? "text-emerald-400" : "text-emerald-600",
    },
    {
      label: "Capital Deployed",
      value: formatCurrencyAmount(investedExposure, accountCurrency),
      detail: "Current active exposure across live products.",
      accent: isDark ? "text-cyan-400" : "text-cyan-600",
    },
    {
      label: "ROI",
      value: `${roiPercent.toFixed(1)}%`,
      detail: "Revenue relative to completed deposits.",
      accent: isDark ? "text-teal-400" : "text-teal-600",
    },
    {
      label: "Net Cashflow",
      value: formatCurrencyAmount(netCashflow, accountCurrency),
      detail: "Completed deposits minus completed withdrawals.",
      accent: isDark ? "text-purple-400" : "text-violet-600",
    },
  ];

  const pageShellClass = isDark
    ? "bg-zinc-950 text-white"
    : "bg-gray-50 text-slate-900";
  const shellCardClass = isDark
    ? "border-slate-700 bg-slate-800/50 shadow-2xl"
    : "border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.08)]";
  const sectionCardClass = isDark
    ? "border-slate-700 bg-slate-900/70 shadow-xl"
    : "border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]";
  const innerCardClass = isDark
    ? "border-slate-700 bg-slate-800/60"
    : "border-slate-200 bg-slate-50/90";
  const mutedTextClass = isDark ? "text-slate-400" : "text-slate-600";
  const softTextClass = isDark ? "text-slate-300" : "text-slate-700";
  const subtleLabelClass = isDark ? "text-teal-400" : "text-teal-600";
  const chipClass = isDark
    ? "bg-slate-700 text-slate-100"
    : "border border-slate-200 bg-slate-100 text-slate-700";
  const ghostButtonClass = isDark
    ? "border-slate-700 bg-slate-800 text-slate-100 hover:border-teal-500 hover:text-teal-300"
    : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:text-teal-600 hover:bg-slate-50";
  const overlayClass = isDark
    ? "from-slate-950/15 via-slate-900/25 to-slate-950/45"
    : "from-white/12 via-white/10 to-slate-900/18";
  const avatarBorderClass = isDark ? "border-slate-800" : "border-white";
  const avatarFallbackClass = isDark
    ? "bg-slate-800 text-teal-400"
    : "bg-white text-teal-600";

  const isProfileLoading = isLoading || !isAuthenticated || !userData;

  if (isProfileLoading) {
    return (
      <div className={`pt-10 min-h-screen flex items-center justify-center ${pageShellClass}`}>
        <div className="relative w-full max-w-md px-4">
          {/* Animated background elements */}
          <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-teal-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-emerald-500/15 rounded-full blur-3xl animate-ping-slow"></div>

          {/* Main loading card */}
          <div
            className={`relative overflow-hidden rounded-2xl border p-8 backdrop-blur-lg ${
              isDark
                ? "border-slate-700/50 bg-slate-800/30 shadow-2xl"
                : "border-slate-200 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
            }`}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-teal-500/10 to-transparent animate-shimmer"></div>

            {/* Animated logo */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-x-8 inset-y-5 rounded-full bg-gradient-to-r from-teal-500/20 to-cyan-400/20 blur-2xl"></div>
                <img
                  src={activeLogo}
                  alt="CoinQuestX logo"
                  className="relative z-10 h-16 w-auto object-contain animate-pulse-slow drop-shadow-[0_12px_18px_rgba(15,23,42,0.18)] sm:h-20"
                />
              </div>
            </div>

            {/* Loading text */}
            <div className="text-center">
              <h2
                className={`mb-2 flex items-center justify-center text-2xl font-bold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                Loading your account
                <span className="w-8 ml-1">
                  {Array(dots + 1)
                    .fill(".")
                    .join("")}
                </span>
              </h2>
              <p className={`mb-8 ${mutedTextClass}`}>Securely fetching your data</p>

              {/* Animated progress */}
              <div
                className={`relative mx-auto h-2 w-3/4 overflow-hidden rounded-full ${
                  isDark ? "bg-slate-700" : "bg-slate-200"
                }`}
              >
                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full w-3/4 animate-loading-bar"></div>
              </div>
            </div>

            {/* Decorative particles */}
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-teal-400 rounded-full opacity-30 animate-pulse"></div>
            <div className="absolute -bottom-4 -left-4 w-10 h-10 bg-emerald-400 rounded-full opacity-20 animate-ping-slow"></div>
          </div>

          {/* Footer */}
          <div className={`mt-8 text-center text-sm ${mutedTextClass}`}>
            <p>Secured with end-to-end encryption</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-10 ${pageShellClass}`}>
      {/* Profile Card */}
      <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
        <div
          className={`w-full overflow-hidden rounded-2xl border backdrop-blur-sm ${shellCardClass}`}
        >
          <div className="relative h-44 bg-gradient-to-r from-teal-700 to-emerald-700 sm:h-52">
            {profile.coverImageURL ? (
              <img
                src={profile.coverImageURL}
                alt="Profile cover"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
            <div className={`absolute inset-0 bg-gradient-to-r ${overlayClass}`} />
            <div className="absolute -bottom-16 left-8">
              {profile.photoURL ? (
                <img
                  src={profile.photoURL}
                  alt="Profile"
                  className={`w-32 h-32 rounded-full object-cover border-4 shadow-xl ${avatarBorderClass}`}
                />
              ) : (
                <div
                  className={`w-32 h-32 rounded-full flex items-center justify-center shadow-xl border-4 ${avatarBorderClass} ${avatarFallbackClass}`}
                >
                  <UserRound className="h-12 w-12" strokeWidth={2.1} />
                </div>
              )}
            </div>
          </div>

          <div className="pt-20 px-8 pb-8">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
              <div>
              <h2 className="text-3xl font-bold">{profileName}</h2>
              <p className={`mt-1 ${mutedTextClass}`}>{profile.email}</p>

                <div className="flex mt-4 space-x-3">
                  <div className={`px-3 py-1 rounded-full text-sm flex items-center ${chipClass}`}>
                    <ShieldCheck className="mr-2 h-4 w-4 text-teal-400" strokeWidth={2.2} />
                    <span>Verified Account</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm flex items-center ${chipClass}`}>
                    <TrendingUp className="mr-2 h-4 w-4 text-emerald-400" strokeWidth={2.2} />
                    <span>{subscriptionPlanLabel} Member</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate("/updatephotopage")}
                className="mt-4 md:mt-0 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 px-6 py-3 rounded-lg font-medium shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                Edit Profile
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {accountStats.map((stat) => (
                <StatCard
                  key={stat.title}
                  icon={stat.icon}
                  title={stat.title}
                  value={stat.value}
                  color={stat.color}
                  theme={theme}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="w-full mt-8 mb-20">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <ActionButton
              icon={Users}
              text="Referrals"
              iconColor="text-purple-400"
              theme={theme}
              onClick={() => navigate("/referrals")}
            />
            <ActionButton
              icon={Star}
              text="Watch List"
              iconColor="text-teal-400"
              theme={theme}
              onClick={() => navigate("/Watchlist")}
            />
            <ActionButton
              icon={ShieldCheck}
              text="Security Settings"
              iconColor="text-teal-400"
              theme={theme}
              onClick={() => navigate("/Settings")}
            />
            <ActionButton
              icon={Mail}
              text="Update Email"
              iconColor="text-blue-400"
              theme={theme}
              onClick={() => navigate("/EmailUpdate")}
            />
            <ActionButton
              icon={Banknote}
              text="Withdrawals"
              iconColor="text-emerald-400"
              theme={theme}
              onClick={() => navigate("/Withdrawal")}
            />
            <ActionButton
              icon={Image}
              text="Update Media"
              iconColor="text-pink-400"
              theme={theme}
              onClick={() => navigate("/UpdatePhotoPage")}
            />
            <ActionButton
              icon={LockKeyhole}
              text="Update Password"
              iconColor="text-cyan-400"
              theme={theme}
              onClick={() => navigate("/PasswordUpdate")}
            />
            <ActionButton
              icon={Bell}
              text="Notifications"
              iconColor="text-teal-400"
              theme={theme}
              onClick={() => navigate("/Notification")}
            />
            <ActionButton
              icon={CircleHelp}
              text="Help Center"
              iconColor="text-teal-400"
              theme={theme}
              onClick={() => navigate("/Help")}
            />
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.1fr,0.9fr]">
          <section className={`rounded-2xl border p-6 ${sectionCardClass}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${subtleLabelClass}`}>
                  Portfolio Center
                </p>
                <h2 className="mt-2 text-2xl font-bold">Performance and exposure snapshot</h2>
                <p className={`mt-2 text-sm ${mutedTextClass}`}>
                  A single view of realized revenue, deployed capital, active product count,
                  and account-level performance.
                </p>
              </div>
              <button
                onClick={() => navigate("/Transactions")}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold ${ghostButtonClass}`}
              >
                Open Ledger
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {portfolioMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className={`rounded-2xl border p-4 ${innerCardClass}`}
                >
                  <p className={`text-xs uppercase tracking-[0.24em] ${mutedTextClass}`}>
                    {metric.label}
                  </p>
                  <p className={`mt-3 text-2xl font-semibold ${metric.accent}`}>{metric.value}</p>
                  <p className={`mt-2 text-xs ${mutedTextClass}`}>{metric.detail}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className={`rounded-2xl border p-4 ${innerCardClass}`}>
                <p className={`text-xs uppercase tracking-[0.24em] ${mutedTextClass}`}>Plan</p>
                <p className="mt-3 text-xl font-semibold">{normalizedPlan}</p>
                <p className={`mt-2 text-xs ${mutedTextClass}`}>Current entitlement tier.</p>
              </div>
              <div className={`rounded-2xl border p-4 ${innerCardClass}`}>
                <p className={`text-xs uppercase tracking-[0.24em] ${mutedTextClass}`}>Active Products</p>
                <p className="mt-3 text-xl font-semibold">{productCount}</p>
                <p className={`mt-2 text-xs ${mutedTextClass}`}>
                  Includes bots, mining, stake, copy trading, and real estate.
                </p>
              </div>
              <div className={`rounded-2xl border p-4 ${innerCardClass}`}>
                <p className={`text-xs uppercase tracking-[0.24em] ${mutedTextClass}`}>Live Trades</p>
                <p className="mt-3 text-xl font-semibold">{activeTradesCount}</p>
                <p className={`mt-2 text-xs ${mutedTextClass}`}>Open trade workflows still in motion.</p>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className={`rounded-2xl border p-6 ${sectionCardClass}`}>
              <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${subtleLabelClass}`}>
                Entitlements
              </p>
              <div className="mt-4 space-y-3">
                {entitlementCards.map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-2xl border p-4 ${innerCardClass}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{item.label}</p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.enabled
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-amber-500/15 text-amber-300"
                        }`}
                      >
                        {item.enabled ? "Enabled" : "Locked"}
                      </span>
                    </div>
                    <p className={`mt-2 text-xs ${mutedTextClass}`}>{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-2xl border p-6 ${sectionCardClass}`}>
              <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${subtleLabelClass}`}>
                Next Best Move
              </p>
              <h3 className="mt-2 text-xl font-semibold">
                {userData?.kycVerified
                  ? productCount > 0
                    ? "Review your ledger and keep security settings tight."
                    : "Your account is ready for its first product activation."
                  : "Complete KYC before using protected funding and trading tools."}
              </h3>
              <p className={`mt-2 text-sm ${mutedTextClass}`}>
                The account hub now links your plan access, revenue view, and product readiness
                into one profile surface so you can see what to do next quickly.
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div
            className={`w-full max-w-md rounded-xl border p-6 animate-fade-in ${
              isDark
                ? "border-slate-700 bg-slate-800 shadow-2xl"
                : "border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.12)]"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-500/20 w-12 h-12 rounded-full flex items-center justify-center">
                <LogOut className="h-5 w-5 text-red-500" strokeWidth={2.3} />
              </div>
              <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                Confirm Logout
              </h3>
            </div>
            <p className={`mb-6 ${softTextClass}`}>
              You'll need to sign in again to access your account. Are you sure
              you want to logout?
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
                className={`px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50 ${
                  isDark
                    ? "bg-slate-700 text-white hover:bg-slate-600"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="px-5 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Logging Out...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" strokeWidth={2.3} />
                    Log Out
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionButton({ icon, text, iconColor, onClick, theme = "dark" }) {
  const Icon = icon;
  const isDark = theme === "dark";
  return (
    <button
      onClick={onClick}
      className={`group flex flex-col items-center rounded-xl border p-5 text-center shadow-md transition-all duration-300 hover:-translate-y-1 ${
        isDark
          ? "border-slate-700 bg-slate-800/50 hover:border-teal-500 hover:bg-slate-800 hover:shadow-xl"
          : "border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
      }`}
    >
      <div
        className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
          isDark
            ? "bg-slate-700 group-hover:bg-gradient-to-r from-teal-700 to-emerald-700"
            : "bg-slate-100 group-hover:bg-gradient-to-r group-hover:from-teal-50 group-hover:to-emerald-50"
        } ${iconColor}`}
      >
        <Icon className="h-6 w-6" strokeWidth={2.2} />
      </div>
      <span className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-800"}`}>
        {text}
      </span>
    </button>
  );
}

function StatCard({ icon, title, value, color, theme = "dark" }) {
  const Icon = icon;
  const isDark = theme === "dark";
  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        isDark
          ? "border-slate-700 bg-slate-800/30 hover:border-teal-500"
          : "border-slate-200 bg-white hover:border-teal-300"
      }`}
    >
      <div className="flex items-center">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${
            isDark ? "bg-slate-700" : "bg-slate-100"
          } ${color}`}
        >
          <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
        </div>
        <div className="ml-3">
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {title}
          </p>
          <p className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
