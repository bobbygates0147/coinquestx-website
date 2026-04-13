import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { useTheme } from "next-themes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faCrown,
  faTimes,
  faChartLine,
  faCoins,
  faRocket,
  faGem,
} from "@fortawesome/free-solid-svg-icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useTransactions } from "../../context/TransactionContext";
import { useUser } from "../../context/UserContext";
import { API_BASE_URL } from "../../config/api";
import { Link, useLocation } from "react-router-dom";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "../../components/ui/modal";
import {
  getFeatureRequiredPlans,
  hasAiBotAccess,
  normalizePlanName,
} from "../../utils/subscriptionAccess";

const PLAN_DURATION_DAYS = {
  Standard: 1,
  Premium: 5,
  Platinum: 3,
  Elite: 7,
};

const toPositiveNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, parsed);
};

const SubscriptionTooltip = ({
  active,
  payload,
  label,
  theme,
  basicPlan,
  paidPlans,
}) => {
  if (active && payload && payload.length) {
    const plan = payload[0].payload;
    const planDetails =
      plan.name === "Basic"
        ? basicPlan
        : paidPlans.find((item) => item.name === plan.name);

    return (
      <div
        className={`rounded-lg border p-4 shadow-lg backdrop-blur-sm ${
          theme === "dark" ? "border-slate-700 bg-slate-800/90" : "border-gray-200 bg-white/90"
        }`}
      >
        <p className="text-lg font-bold">{label}</p>
        <div className="mt-2 space-y-1">
          <p className="flex items-center">
            <span className="w-24 font-medium">ROI:</span>
            <span
              className={`font-bold ${
                theme === "dark" ? "text-teal-300" : "text-teal-600"
              }`}
            >
              {payload[0].value}%
            </span>
          </p>
          <p className="flex items-center">
            <span className="w-24 font-medium">Price:</span>
            <span>{planDetails?.price || "N/A"}</span>
          </p>
          <p className="flex items-center">
            <span className="w-24 font-medium">Min Investment:</span>
            <span>{planDetails?.minAmount || "N/A"}</span>
          </p>
          <p className="flex items-center">
            <span className="w-24 font-medium">Duration:</span>
            <span>{planDetails?.duration || "N/A"}</span>
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default function SubscriptionPage() {
  const { theme } = useTheme();
  const location = useLocation();
  const [currentPlan, setCurrentPlan] = useState("Basic");
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [investmentAmounts, setInvestmentAmounts] = useState({});
  const [subscribingPlan, setSubscribingPlan] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [activeBar, setActiveBar] = useState(null);
  const { addTransaction, refreshTransactions } = useTransactions();
  const { userData, refreshUser, isAuthenticated, getAuthToken } = useUser();
  const lockedFeature = location.state?.lockedFeature || "";
  const botRequiredPlans = getFeatureRequiredPlans("aiBots");

  const parseJsonSafely = async (response) => {
    const text = await response.text();
    try {
      return { json: JSON.parse(text), text };
    } catch {
      return { json: null, text };
    }
  };

  const getCleanToken = useCallback(() => {
    const token = getAuthToken?.();
    if (!token) return null;
    return token.replace(/^["']|["']$/g, "").trim();
  }, [getAuthToken]);

  const getPersistedPlan = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("currentPlan");
  };

  const persistPlan = (planName) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("currentPlan", planName || "Basic");
  };

  const requestWithAuth = useCallback(async (path, options = {}) => {
    const token = getCleanToken();
    if (!token) {
      throw new Error("Session expired. Please login again.");
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(options.headers || {}),
      },
    });

    const { json: result } = await parseJsonSafely(response);
    if (!response.ok || !result?.success) {
      throw new Error(result?.message || `Request failed (${response.status})`);
    }

    return result;
  }, [getCleanToken]);

  useEffect(() => {
    setIsClient(true);
    const initialAmounts = {
      Elite: "25000",
      Premium: "4000",
      Platinum: "10000",
      Standard: "2500",
    };
    setInvestmentAmounts(initialAmounts);

    // Load active plan from localStorage if available
    const savedPlan = localStorage.getItem("currentPlan");
    if (savedPlan) {
      setCurrentPlan(savedPlan);
    }
  }, []);

  const fetchSubscriptions = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoadingSubscription(true);
    try {
      const result = await requestWithAuth("/Subscription", { method: "GET" });

      const rows = Array.isArray(result?.data) ? result.data : [];
      const activeRow =
        rows.find((row) => row?.status === "Active") || null;
      const resolvedPlan =
        result?.currentPlan ||
        activeRow?.planName ||
        userData?.subscriptionPlan ||
        getPersistedPlan() ||
        "Basic";

      setCurrentPlan(resolvedPlan);
      setActiveSubscription(activeRow);
      if (activeRow?.planName && toPositiveNumber(activeRow?.price, 0) > 0) {
        setInvestmentAmounts((prev) => ({
          ...prev,
          [activeRow.planName]: String(toPositiveNumber(activeRow.price, 0)),
        }));
      }
      persistPlan(resolvedPlan);
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
      const fallbackPlan =
        userData?.subscriptionPlan || getPersistedPlan() || "Basic";
      setCurrentPlan(fallbackPlan);
      setActiveSubscription(null);
      persistPlan(fallbackPlan);
    } finally {
      setIsLoadingSubscription(false);
    }
  }, [isAuthenticated, requestWithAuth, userData?.subscriptionPlan]);

  useEffect(() => {
    if (!isClient) return;

    if (!isAuthenticated) {
      const fallbackPlan =
        userData?.subscriptionPlan || getPersistedPlan() || "Basic";
      setCurrentPlan(fallbackPlan);
      setActiveSubscription(null);
      persistPlan(fallbackPlan);
      return;
    }

    fetchSubscriptions();
  }, [
    fetchSubscriptions,
    isAuthenticated,
    isClient,
    userData?.subscriptionPlan,
  ]);

  const paidPlans = [
    {
      name: "Elite",
      price: "$25,000.00",
      minAmount: "Minimum $25,000",
      description: "Premium trading experience with maximum returns",
      duration: "7 Days",
      roi: "55.00%",
      roiValue: 55,
      features: [
        "AI Trading Bot",
        "24/7 Priority Support",
        "Advanced Analytics",
        "Custom Strategies",
        "VIP Events",
      ],
      icon: faGem,
      color: "from-purple-600 to-indigo-700",
      darkColor: "from-purple-700 to-indigo-800",
      buttonColor:
        "bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800",
    },
    {
      name: "Platinum",
      price: "$10,000.00",
      minAmount: "Minimum $10,000",
      description: "Professional trading tools for serious investors",
      duration: "3 Days",
      roi: "15.00%",
      roiValue: 15,
      features: [
        "AI Trading Bot",
        "Email & Chat Support",
        "Portfolio Analysis",
        "Market Insights",
      ],
      icon: faRocket,
      color: "from-blue-500 to-cyan-600",
      darkColor: "from-blue-600 to-cyan-700",
      buttonColor:
        "bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700",
    },
    {
      name: "Premium",
      price: "$4,000.00",
      minAmount: "Minimum $4,000",
      description: "Enhanced features for active traders",
      duration: "5 Days",
      roi: "30.00%",
      roiValue: 30,
      features: [
        "AI Trading Bot",
        "Email Support",
        "Basic Analytics",
        "Trading Signals",
      ],
      icon: faChartLine,
      color: "from-teal-500 to-emerald-600",
      darkColor: "from-teal-600 to-emerald-700",
      buttonColor:
        "bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700",
    },
    {
      name: "Standard",
      price: "$2,500.00",
      minAmount: "Minimum $2,500",
      description: "Solid foundation for new investors",
      duration: "1 Day",
      roi: "5.00%",
      roiValue: 5,
      features: ["Manual Trading", "Basic Support", "Market Overview"],
      icon: faCoins,
      color: "from-teal-500 to-orange-500",
      darkColor: "from-teal-600 to-orange-600",
      buttonColor:
        "bg-gradient-to-r from-teal-500 to-orange-500 hover:from-teal-600 hover:to-orange-600",
    },
  ];

  const basicPlan = {
    name: "Basic",
    price: "Free",
    minAmount: "Minimum $100",
    description: "Starter plan with essential features",
    duration: "N/A",
    roi: "2.00%",
    roiValue: 2,
    features: ["Manual Trading", "Basic Support", "Limited Access"],
    icon: faCoins,
    color: "from-gray-400 to-gray-500",
    darkColor: "from-gray-600 to-gray-700",
    buttonColor:
      "bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600",
  };

  const roiChartData = [
    {
      name: "Basic",
      roi: basicPlan.roiValue,
      current: currentPlan === "Basic",
    },
    {
      name: "Standard",
      roi: paidPlans.find((p) => p.name === "Standard").roiValue,
      current: currentPlan === "Standard",
    },
    {
      name: "Premium",
      roi: paidPlans.find((p) => p.name === "Premium").roiValue,
      current: currentPlan === "Premium",
    },
    {
      name: "Platinum",
      roi: paidPlans.find((p) => p.name === "Platinum").roiValue,
      current: currentPlan === "Platinum",
    },
    {
      name: "Elite",
      roi: paidPlans.find((p) => p.name === "Elite").roiValue,
      current: currentPlan === "Elite",
    },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleAmountChange = (planName, value) => {
    setInvestmentAmounts((prev) => ({
      ...prev,
      [planName]: value,
    }));
  };

  const cancelActiveSubscriptionRecord = async () => {
    let subscriptionId =
      activeSubscription?.id || activeSubscription?._id || "";

    if (!subscriptionId) {
      const listResult = await requestWithAuth("/Subscription", { method: "GET" });
      const rows = Array.isArray(listResult?.data) ? listResult.data : [];
      const activeRow = rows.find((row) => row?.status === "Active");
      subscriptionId = activeRow?.id || activeRow?._id || "";
    }

    if (!subscriptionId) return null;

    const result = await requestWithAuth(`/Subscription/${subscriptionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "Cancelled",
        endsAt: new Date().toISOString(),
      }),
    });

    return result?.data || null;
  };

  const createSubscriptionRecord = async (planName, amount) => {
    const durationDays = PLAN_DURATION_DAYS[planName] || undefined;
    const payload = {
      planName,
      price: toPositiveNumber(amount, 0),
      status: "Active",
    };

    if (durationDays) {
      payload.durationDays = durationDays;
    }

    const result = await requestWithAuth("/Subscription/Create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return result?.data || null;
  };

  const handleSubscribe = async (planName) => {
    const plan = paidPlans.find((p) => p.name === planName) || basicPlan;
    const investmentAmount = toPositiveNumber(investmentAmounts[planName], 0);
    const minAmount = toPositiveNumber(plan.price.replace(/[^0-9.]/g, ""), 0);

    if (planName !== "Basic" && investmentAmount < minAmount) {
      setSuccessMessage(`Minimum investment for ${planName} is ${plan.price}`);
      setShowSuccessModal(true);
      return;
    }

    if (planName === "Basic") {
      setSubscribingPlan(planName);
      try {
        if (currentPlan && currentPlan !== "Basic") {
          await cancelActiveSubscriptionRecord();

          const transactionResult = await addTransaction({
            type: "Subscription",
            amount: 0,
            method: currentPlan,
            details: "Subscription downgraded to Basic",
            status: "Cancelled",
            subscriptionDetails: {
              planName: currentPlan,
            },
          });

          if (!transactionResult?.success) {
            console.warn(
              "Subscription downgrade log failed:",
              transactionResult?.error
            );
          }
        }

        setCurrentPlan("Basic");
        setActiveSubscription(null);
        persistPlan("Basic");
        await refreshUser();
        await fetchSubscriptions();

        setSuccessMessage("You have switched to the Basic plan.");
        setShowSuccessModal(true);
      } catch (error) {
        console.error("Basic plan switch failed:", error);
        setSuccessMessage("Plan update failed. Please try again.");
        setShowSuccessModal(true);
      } finally {
        setSubscribingPlan(null);
      }
      return;
    }

    if (!userData || userData.balance < investmentAmount) {
      setShowInsufficientModal(true);
      return;
    }

    setSubscribingPlan(planName);
    try {
      const createdSubscription = await createSubscriptionRecord(
        planName,
        investmentAmount
      );

      setCurrentPlan(planName);
      setActiveSubscription(createdSubscription || null);
      persistPlan(planName);
      await refreshUser();
      await fetchSubscriptions();
      await refreshTransactions?.(2, 500);

      setSuccessMessage(
        `Successfully subscribed to ${planName} plan with ${formatCurrency(
          investmentAmount
        )} investment`
      );
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Subscription failed:", error);
      setSuccessMessage(error?.message || "Subscription failed. Please try again.");
      setShowSuccessModal(true);
    } finally {
      setSubscribingPlan(null);
    }
  };

  const handleManageSubscription = () => {
    setShowManageModal(true);
  };

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      await cancelActiveSubscriptionRecord();

      // Record cancellation transaction
      const transactionResult = await addTransaction({
        type: "Subscription",
        amount: 0,
        method: currentPlan,
        details: "Subscription cancelled",
        status: "Cancelled",
        subscriptionDetails: {
          planName: currentPlan,
        },
      });

      if (!transactionResult?.success) {
        console.warn(
          "Subscription cancellation log failed:",
          transactionResult?.error
        );
      }

      setCurrentPlan("Basic");
      setActiveSubscription(null);
      persistPlan("Basic");
      await refreshUser();
      await fetchSubscriptions();
      setSuccessMessage("Your subscription has been cancelled successfully");
      setShowSuccessModal(true);
      setShowManageModal(false);
    } catch (error) {
      console.error("Cancellation failed:", error);
    } finally {
      setIsCancelling(false);
    }
  };

  const activeSubscriptionPrice = toPositiveNumber(activeSubscription?.price, 0);
  const activeSubscriptionStatus =
    activeSubscription?.status || (currentPlan === "Basic" ? "Inactive" : "Active");
  const nextRenewalLabel = activeSubscription?.endsAt
    ? new Date(activeSubscription.endsAt).toLocaleDateString()
    : "N/A";
  const normalizedCurrentPlan = normalizePlanName(
    currentPlan || userData?.subscriptionPlan
  );
  const hasBotAccess = hasAiBotAccess(normalizedCurrentPlan);
  const showBotGateBanner = lockedFeature === "aiBots";
  const currentPlanMeta =
    currentPlan === "Basic"
      ? basicPlan
      : paidPlans.find((plan) => plan.name === currentPlan) || basicPlan;
  const pageShellClass =
    theme === "dark"
      ? "bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(99,102,241,0.12),transparent_26%),linear-gradient(180deg,#020617_0%,#020617_40%,#0f172a_100%)] text-slate-100"
      : "bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_28%),radial-gradient(circle_at_82%_16%,rgba(99,102,241,0.1),transparent_26%),linear-gradient(180deg,#f8fafc_0%,#eef6ff_100%)] text-slate-900";
  const heroPanelClass =
    theme === "dark"
      ? "border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(2,6,23,0.86))] shadow-[0_32px_80px_rgba(2,8,23,0.52)]"
      : "border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(236,254,255,0.94))] shadow-[0_28px_70px_rgba(15,23,42,0.10)]";
  const glassPanelClass =
    theme === "dark"
      ? "border-white/10 bg-slate-900/72 shadow-[0_24px_70px_rgba(2,8,23,0.42)] backdrop-blur-xl"
      : "border-white/70 bg-white/90 shadow-[0_22px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl";
  const softPanelClass =
    theme === "dark"
      ? "border-white/8 bg-white/[0.04]"
      : "border-slate-200/80 bg-slate-50/90";
  const mutedTextClass = theme === "dark" ? "text-slate-400" : "text-slate-600";

  return (
    <>
      <section
        className={`min-h-screen mx-auto px-4 py-10 sm:px-6 lg:px-8 ${pageShellClass}`}
      >
        <section
          className={`relative mb-10 overflow-hidden rounded-[32px] border px-6 py-7 sm:px-8 lg:px-10 ${heroPanelClass}`}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-20 top-0 h-44 w-44 rounded-full bg-teal-400/18 blur-3xl" />
            <div className="absolute right-0 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-indigo-400/16 blur-3xl" />
          </div>
          <div className="relative space-y-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-3 rounded-full border border-teal-400/15 bg-teal-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-teal-300">
                <FontAwesomeIcon icon={faCrown} />
                Subscription Desk
              </div>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
                  Modern plan management with clearer pricing, access, and ROI visibility.
                </h1>
                <p className={`max-w-2xl text-sm leading-7 sm:text-base ${mutedTextClass}`}>
                  Compare investment plans, manage active access, and review growth potential from one sharper subscription workspace.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className={`rounded-[24px] border p-5 ${softPanelClass}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-400/80">
                  Active Tier
                </p>
                <p className="mt-3 text-3xl font-semibold">{currentPlan}</p>
              </div>
              <div className={`rounded-[24px] border p-5 ${softPanelClass}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400/80">
                  ROI Window
                </p>
                <p className="mt-3 text-3xl font-semibold">{currentPlanMeta.roi}</p>
              </div>
              <div className={`rounded-[24px] border p-5 ${softPanelClass}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400/80">
                  Funded Access
                </p>
                <p className="mt-3 text-3xl font-semibold">
                  {activeSubscriptionPrice > 0
                    ? formatCurrency(activeSubscriptionPrice)
                    : currentPlanMeta.price}
                </p>
              </div>
            </div>
          </div>
        </section>

        {showBotGateBanner && (
          <div
            className={`mb-6 rounded-[30px] border px-5 py-4 ${glassPanelClass}`}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-400">
                  Bot Access Locked
                </p>
                <h2 className="text-xl font-semibold">
                  AI trading bots are not available on the {normalizedCurrentPlan} plan.
                </h2>
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  Upgrade to {botRequiredPlans.join(", ")} to open the bot marketplace and
                  manage automated strategies.
                </p>
              </div>

              {hasBotAccess ? (
                <Link
                  to={location.state?.from || "/BuyBots"}
                  replace
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/20"
                >
                  Open Buy Bots
                </Link>
              ) : (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                    theme === "dark"
                      ? "border-slate-700 bg-slate-800 text-slate-200"
                      : "border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                >
                  Current plan: {normalizedCurrentPlan}
                </div>
              )}
            </div>
          </div>
        )}

        {isClient && (
          <div className="w-full mb-10">
            <div
              className={`overflow-hidden rounded-[30px] border ${glassPanelClass}`}
            >
              <div className="p-6 flex flex-col lg:flex-row gap-6 items-stretch">
                {/* Plan Info Section */}
                <div className="flex-1">
                  <div
                    className={`h-full rounded-[24px] border p-5 ${softPanelClass}`}
                  >
                    <div className="flex items-center mb-4">
                      <div
                        className={`p-2 rounded-lg ${
                          theme === "dark" ? "bg-teal-900/50" : "bg-teal-100"
                        } mr-3`}
                      >
                        <FontAwesomeIcon
                          icon={faCrown}
                          className={`h-6 ${
                            paidPlans.some((p) => p.name === currentPlan)
                              ? "text-yellow-400"
                              : "text-slate-400"
                          }`}
                        />
                      </div>
                      <div>
                        <p
                          className={`text-sm ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Current Plan
                        </p>
                        <h2 className="text-2xl font-bold">
                          <span
                            className={
                              paidPlans.some((p) => p.name === currentPlan)
                                ? "text-teal-400"
                                : "text-slate-400"
                            }
                          >
                            {currentPlan}
                          </span>
                        </h2>
                      </div>
                    </div>

                    <p className={`mb-6 text-lg ${mutedTextClass}`}>
                      {currentPlanMeta.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div
                        className={`rounded-[20px] border p-4 ${softPanelClass}`}
                      >
                        <p className="font-semibold text-sm mb-1">ROI:</p>
                        <p
                          className={`text-2xl font-bold ${
                            theme === "dark" ? "text-teal-400" : "text-teal-600"
                          }`}
                        >
                          {currentPlan === "Basic"
                            ? basicPlan.roi
                            : paidPlans.find((p) => p.name === currentPlan)
                                ?.roi}
                        </p>
                      </div>
                      <div
                        className={`rounded-[20px] border p-4 ${softPanelClass}`}
                      >
                        <p className="font-semibold text-sm mb-1">Duration:</p>
                        <p className="text-xl font-semibold">
                          {currentPlan === "Basic"
                            ? basicPlan.duration
                            : paidPlans.find((p) => p.name === currentPlan)
                                ?.duration}
                        </p>
                      </div>
                      <div
                        className={`rounded-[20px] border p-4 ${softPanelClass}`}
                      >
                        <p className="font-semibold text-sm mb-1">Price:</p>
                        <p className="text-xl font-semibold">
                          {currentPlan === "Basic"
                            ? basicPlan.price
                            : paidPlans.find((p) => p.name === currentPlan)
                                ?.price}
                        </p>
                      </div>
                      <div
                        className={`rounded-[20px] border p-4 ${softPanelClass}`}
                      >
                        <p className="font-semibold text-sm mb-1">
                          Min Investment:
                        </p>
                        <p className="text-xl font-semibold">
                          {currentPlan === "Basic"
                            ? basicPlan.minAmount
                            : paidPlans.find((p) => p.name === currentPlan)
                                ?.minAmount}
                        </p>
                      </div>
                    </div>

                    {currentPlan !== "Basic" && (
                      <button
                        onClick={handleManageSubscription}
                        disabled={isLoadingSubscription}
                      className={`w-full py-3 rounded-xl font-medium transition-all ${
                          theme === "dark"
                            ? "bg-white/[0.06] text-white hover:bg-white/[0.1]"
                            : "bg-white text-slate-800 shadow-md hover:bg-slate-50 hover:shadow-lg"
                        } ${isLoadingSubscription ? "opacity-70 cursor-not-allowed" : ""}`}
                      >
                        {isLoadingSubscription ? "Loading..." : "Manage Subscription"}
                      </button>
                    )}
                  </div>
                </div>

                {/* ROI Chart Section */}
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center mb-6">
                    <div
                      className={`p-2 rounded-lg ${
                        theme === "dark" ? "bg-blue-900/50" : "bg-blue-100"
                      } mr-3`}
                    >
                      <FontAwesomeIcon
                        icon={faChartLine}
                        className={`h-6 ${
                          theme === "dark" ? "text-blue-400" : "text-blue-600"
                        }`}
                      />
                    </div>
                    <h3
                      className={`text-xl font-bold ${
                        theme === "dark" ? "text-white" : "text-slate-800"
                      }`}
                    >
                      ROI Comparison
                    </h3>
                  </div>

                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={roiChartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                        onMouseOver={(data) =>
                          setActiveBar(data.activeTooltipIndex)
                        }
                        onMouseLeave={() => setActiveBar(null)}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={theme === "dark" ? "#334155" : "#e2e8f0"}
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          tick={{
                            fill: theme === "dark" ? "#cbd5e1" : "#475569",
                          }}
                        />
                        <YAxis
                          tick={{
                            fill: theme === "dark" ? "#cbd5e1" : "#475569",
                          }}
                          label={{
                            value: "ROI (%)",
                            angle: -90,
                            position: "insideLeft",
                            fill: theme === "dark" ? "#94a3b8" : "#64748b",
                            style: { textAnchor: "middle" },
                          }}
                        />
                        <Tooltip
                          content={
                            <SubscriptionTooltip
                              theme={theme}
                              basicPlan={basicPlan}
                              paidPlans={paidPlans}
                            />
                          }
                          cursor={{
                            fill:
                              theme === "dark"
                                ? "rgba(30, 41, 59, 0.5)"
                                : "rgba(226, 232, 240, 0.5)",
                          }}
                        />
                        <Bar
                          dataKey="roi"
                          name="Return on Investment"
                          radius={[6, 6, 0, 0]}
                          barSize={50}
                        >
                          {roiChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                activeBar === index
                                  ? theme === "dark"
                                    ? "#0ea5e9"
                                    : "#38bdf8"
                                  : entry.current
                                  ? theme === "dark"
                                    ? "#0d9488"
                                    : "#14b8a6"
                                  : theme === "dark"
                                  ? "#4b5563"
                                  : "#9ca3af"
                              }
                              stroke={theme === "dark" ? "#1e293b" : "#f1f5f9"}
                              strokeWidth={1}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className={`mt-4 rounded-[20px] border p-4 ${softPanelClass}`}>
                    <p className={`text-sm ${mutedTextClass}`}>
                      <span className="font-semibold">Tip:</span> Higher-tier
                      plans offer significantly better ROI potential with
                      advanced trading algorithms and market analysis tools.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Choose Your Investment Plan
            </h2>
            <p className={`mx-auto max-w-2xl text-xl ${mutedTextClass}`}>
              Select the plan that matches your investment goals and budget
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {[basicPlan, ...paidPlans].map((plan, index) => (
              <div
                key={index}
                className={`min-w-0 overflow-hidden rounded-[28px] transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${
                  theme === "dark"
                    ? "bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.92))] shadow-[0_24px_60px_rgba(2,8,23,0.38)]"
                    : "bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] shadow-[0_22px_54px_rgba(15,23,42,0.10)]"
                } border ${
                  currentPlan === plan.name
                    ? theme === "dark"
                      ? "border-teal-500 ring-2 ring-teal-500/50"
                      : "border-teal-400 ring-2 ring-teal-400/50"
                    : theme === "dark"
                    ? "border-slate-600"
                    : "border-slate-200"
                }`}
              >
                {/* Plan Header */}
                <div
                  className={`min-w-0 p-5 bg-gradient-to-r ${
                    theme === "dark" ? plan.darkColor : plan.color
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex min-w-0 items-center gap-2">
                        <FontAwesomeIcon
                          icon={plan.icon}
                          className="h-5 shrink-0 text-white/90"
                        />
                        <h3 className="truncate text-xl font-bold text-white">
                          {plan.name}
                        </h3>
                      </div>
                      <h4 className="break-words text-[clamp(2rem,2.6vw,3rem)] font-bold leading-tight text-white mb-1">
                        {plan.price}
                      </h4>
                      <p className="break-words text-white/80">{plan.minAmount}</p>
                    </div>

                    {plan.name === "Premium" && (
                      <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-purple-700">
                        POPULAR
                      </span>
                    )}
                    {plan.name === "Elite" && (
                      <span className="shrink-0 rounded-full bg-yellow-500 px-3 py-1 text-xs font-bold text-white">
                        PREMIUM
                      </span>
                    )}
                  </div>
                </div>

                {/* Plan Body */}
                <div className="min-w-0 p-5">
                  <h4
                    className={`mb-4 break-words text-lg font-medium ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {plan.description}
                  </h4>

                  <div className="mb-6">
                    <div className={`mb-3 flex justify-between rounded-2xl border px-4 py-3 ${softPanelClass}`}>
                      <span
                        className={`font-medium ${
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Duration
                      </span>
                      <span className="font-semibold">{plan.duration}</span>
                    </div>
                    <div className={`flex justify-between rounded-2xl border px-4 py-3 ${softPanelClass}`}>
                      <span
                        className={`font-medium ${
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        ROI
                      </span>
                      <span
                        className={`font-bold ${
                          theme === "dark" ? "text-teal-400" : "text-teal-600"
                        }`}
                      >
                        {plan.roi}
                      </span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h5
                      className={`font-bold mb-3 ${
                        theme === "dark" ? "text-gray-300" : "text-gray-800"
                      }`}
                    >
                      Features
                    </h5>
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start min-w-0">
                          <FontAwesomeIcon
                            icon={faCheckCircle}
                            className={`mt-1 mr-2 h-4 shrink-0 ${
                              theme === "dark"
                                ? "text-teal-400"
                                : "text-teal-600"
                            }`}
                          />
                          <span
                            className={`break-words ${
                              theme === "dark"
                                ? "text-gray-300"
                                : "text-gray-700"
                            }`}
                          >
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4">
                    {plan.name !== "Basic" && (
                      <>
                        <label
                          className={`block text-sm font-semibold mb-2 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Investment Amount
                        </label>
                        <div className="relative mb-4">
                          <span
                            className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            $
                          </span>
                          <input
                            type="number"
                            value={investmentAmounts[plan.name] || ""}
                            onChange={(e) =>
                              handleAmountChange(plan.name, e.target.value)
                            }
                            className={`w-full rounded-xl px-8 py-3 focus:outline-none focus:ring-2 ${
                              theme === "dark"
                                ? "border border-white/10 bg-white/[0.04] text-white focus:ring-teal-500"
                                : "border border-slate-200 bg-white text-gray-900 focus:ring-teal-400"
                            }`}
                            min={plan.price.replace(/[^0-9.]/g, "")}
                          />
                        </div>
                      </>
                    )}

                    <button
                      onClick={() => handleSubscribe(plan.name)}
                      disabled={
                        isLoadingSubscription ||
                        currentPlan === plan.name ||
                        subscribingPlan === plan.name ||
                        (plan.name !== "Basic" &&
                          (!investmentAmounts[plan.name] ||
                            parseFloat(investmentAmounts[plan.name]) <
                              parseFloat(plan.price.replace(/[^0-9.]/g, ""))))
                      }
                      className={`w-full py-3 rounded-xl font-bold text-white transition-all duration-300 shadow-lg ${
                        currentPlan === plan.name
                          ? "bg-gradient-to-r from-gray-500 to-gray-600 cursor-not-allowed"
                          : plan.buttonColor
                      } ${
                        subscribingPlan === plan.name
                          ? "opacity-80"
                          : "hover:opacity-95"
                      }`}
                    >
                      {subscribingPlan === plan.name
                        ? "Processing..."
                        : currentPlan === plan.name
                        ? "Active Plan"
                        : plan.name === "Basic"
                        ? "Select Free Plan"
                        : "Upgrade Now"}
                    </button>

                    {currentPlan === plan.name && (
                      <div className="mt-3 text-center">
                        <span
                          className={`text-sm font-medium ${
                            theme === "dark" ? "text-teal-400" : "text-teal-600"
                          }`}
                        >
                          Active plan selected
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Manage Subscription Modal */}
        <Modal
          isOpen={showManageModal}
          onClose={() => setShowManageModal(false)}
        >
          <ModalContent
            theme={theme}
            size="lg"
            onClose={() => setShowManageModal(false)}
          >
            <ModalHeader
              theme={theme}
              tone="teal"
              eyebrow="Subscription"
              title="Manage Your Plan"
              description="Track renewal timing, funded amount, and access status from one control panel."
              icon={<FontAwesomeIcon icon={faCrown} className="text-2xl" />}
              badge={
                <span className="inline-flex items-center rounded-full border border-teal-400/20 bg-teal-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-teal-400">
                  {currentPlan}
                </span>
              }
            />
            <ModalBody className="space-y-5 pt-6">
              <div
                className={`grid gap-3 sm:grid-cols-3 ${
                  theme === "dark" ? "text-white" : "text-slate-900"
                }`}
              >
                <div
                  className={`rounded-2xl border p-4 ${
                    theme === "dark"
                      ? "border-white/10 bg-white/[0.04]"
                      : "border-slate-200 bg-white/70"
                  }`}
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-400/80">
                    Status
                  </div>
                  <div className="mt-3 text-lg font-semibold text-emerald-400">
                    {activeSubscriptionStatus}
                  </div>
                </div>
                <div
                  className={`rounded-2xl border p-4 ${
                    theme === "dark"
                      ? "border-white/10 bg-white/[0.04]"
                      : "border-slate-200 bg-white/70"
                  }`}
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-400/80">
                    Investment
                  </div>
                  <div className="mt-3 text-lg font-semibold">
                    {activeSubscriptionPrice > 0
                      ? formatCurrency(activeSubscriptionPrice)
                      : "N/A"}
                  </div>
                </div>
                <div
                  className={`rounded-2xl border p-4 ${
                    theme === "dark"
                      ? "border-white/10 bg-white/[0.04]"
                      : "border-slate-200 bg-white/70"
                  }`}
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-400/80">
                    Renewal
                  </div>
                  <div className="mt-3 text-lg font-semibold">
                    {nextRenewalLabel}
                  </div>
                </div>
              </div>

              <div
                className={`rounded-[24px] border p-5 ${
                  theme === "dark"
                    ? "border-white/10 bg-slate-900/55"
                    : "border-slate-200 bg-slate-50/95"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-400/80">
                      Plan Summary
                    </div>
                    <div className="mt-2 text-xl font-bold">{currentPlan}</div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      activeSubscriptionStatus === "Active"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : theme === "dark"
                        ? "bg-white/10 text-slate-300"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {activeSubscriptionStatus}
                  </span>
                </div>
                <p
                  className={`mt-3 text-sm leading-6 ${
                    theme === "dark" ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  Changes to this plan immediately affect protected features that
                  depend on your subscription tier.
                </p>
              </div>
            </ModalBody>
            <ModalFooter theme={theme} className="sm:flex-nowrap">
              <button
                onClick={() => setShowManageModal(false)}
                className={`w-full rounded-2xl px-4 py-3 font-semibold ${
                  theme === "dark"
                    ? "bg-white/[0.06] text-white hover:bg-white/[0.1]"
                    : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                }`}
              >
                Close
              </button>
              <button
                onClick={() => setShowManageModal(false)}
                className={`w-full rounded-2xl px-4 py-3 font-semibold ${
                  theme === "dark"
                    ? "border border-white/10 bg-slate-900/40 text-slate-200 hover:bg-slate-800"
                    : "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                }`}
              >
                Update Payment Method
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isCancelling}
                className={`w-full rounded-2xl px-4 py-3 font-semibold text-white transition ${
                  isCancelling
                    ? "cursor-not-allowed opacity-70"
                    : "hover:opacity-95"
                } bg-gradient-to-r from-rose-600 to-orange-600`}
              >
                {isCancelling ? "Processing..." : "Cancel Subscription"}
              </button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Success Modal */}
        <Modal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
        >
          <ModalContent
            theme={theme}
            size="sm"
            onClose={() => setShowSuccessModal(false)}
          >
            <ModalHeader
              theme={theme}
              tone="success"
              align="center"
              eyebrow="Subscription Updated"
              title="Success"
              description={successMessage}
              icon={<FontAwesomeIcon icon={faCheckCircle} className="text-3xl" />}
            />
            <ModalFooter
              theme={theme}
              divided={false}
              className="pt-6"
            >
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-3 font-semibold text-white transition hover:opacity-95"
              >
                Continue
              </button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Insufficient Funds Modal */}
        <Modal
          isOpen={showInsufficientModal}
          onClose={() => setShowInsufficientModal(false)}
        >
          <ModalContent
            theme={theme}
            size="sm"
            onClose={() => setShowInsufficientModal(false)}
          >
            <ModalHeader
              theme={theme}
              tone="danger"
              align="center"
              eyebrow="Funding Required"
              title="Insufficient Funds"
              description={`Your available balance is ${formatCurrency(
                userData?.balance || 0
              )}. Add more funds to activate this investment plan.`}
              icon={
                <svg
                  className="h-9 w-9"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />
            <ModalBody className="pt-6">
              <div
                className={`rounded-2xl border p-4 text-center ${
                  theme === "dark"
                    ? "border-white/10 bg-white/[0.04]"
                    : "border-slate-200 bg-slate-50/90"
                }`}
              >
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-400/85">
                  Available Balance
                </div>
                <div className="mt-3 text-3xl font-bold">
                  {formatCurrency(userData?.balance || 0)}
                </div>
              </div>
            </ModalBody>
            <ModalFooter theme={theme}>
              <button
                onClick={() => setShowInsufficientModal(false)}
                className={`w-full rounded-2xl px-4 py-3 font-semibold ${
                  theme === "dark"
                    ? "bg-white/[0.06] text-white hover:bg-white/[0.1]"
                    : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                }`}
              >
                Cancel
              </button>
              <Link to="/deposits" className="w-full">
                <button
                  onClick={() => setShowInsufficientModal(false)}
                  className="w-full rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-3 font-semibold text-white transition hover:opacity-95"
                >
                  Deposit Funds
                </button>
              </Link>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </section>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}

SubscriptionTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.number,
      payload: PropTypes.shape({
        name: PropTypes.string,
      }),
    })
  ),
  label: PropTypes.string,
  theme: PropTypes.string.isRequired,
  basicPlan: PropTypes.shape({
    price: PropTypes.string,
    minAmount: PropTypes.string,
    duration: PropTypes.string,
  }).isRequired,
  paidPlans: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      price: PropTypes.string,
      minAmount: PropTypes.string,
      duration: PropTypes.string,
    })
  ).isRequired,
};

