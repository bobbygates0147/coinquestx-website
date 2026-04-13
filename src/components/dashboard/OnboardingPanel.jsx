import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { CheckCircle2, ChevronRight, CircleDashed, Sparkles, X } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { hasCompletedKyc } from "../../utils/kycAccess";

const NEW_ACCOUNT_WINDOW_DAYS = 7;
const NEW_ACCOUNT_WINDOW_MS = NEW_ACCOUNT_WINDOW_DAYS * 24 * 60 * 60 * 1000;

const isNewAccount = (createdAt) => {
  if (!createdAt) return true;
  const createdAtMs = new Date(createdAt).getTime();
  if (!Number.isFinite(createdAtMs)) return true;
  return Date.now() - createdAtMs <= NEW_ACCOUNT_WINDOW_MS;
};

const buildStepState = (userData = {}) => {
  const stats = userData.stats || {};
  const hasFunds = (Number(userData.balance) || 0) > 0 || (Number(stats.totalDeposits) || 0) > 0;
  const hasSubscription = `${userData.subscriptionPlan || "Basic"}`.toLowerCase() !== "basic";
  const hasProduct =
    (Number(stats.botCount) || 0) > 0 ||
    (Number(stats.miningCount) || 0) > 0 ||
    (Number(stats.stakeCount) || 0) > 0 ||
    (Number(stats.realEstateCount) || 0) > 0 ||
    (Number(stats.copyTradeCount) || 0) > 0 ||
    (Number(stats.placeTradeCount) || 0) > 0;

  return [
    {
      id: "verify",
      title: "Complete verification",
      description: "Unlock protected funding, trading, and withdrawal tools.",
      complete: hasCompletedKyc(userData),
      to: "/kyc-verification",
    },
    {
      id: "fund",
      title: "Fund your wallet",
      description: "Add balance before activating products or placing trades.",
      complete: hasFunds,
      to: "/Deposits",
    },
    {
      id: "plan",
      title: "Choose a plan",
      description: "Upgrade when you need premium product access and support.",
      complete: hasSubscription,
      to: "/Subscription",
    },
    {
      id: "start",
      title: "Start a product",
      description: "Open your first bot, stake, mining run, or trading workflow.",
      complete: hasProduct,
      to: "/PlaceTrade",
    },
  ];
};

export default function OnboardingPanel({ theme = "dark" }) {
  const { userData, saveUserProfile, updateUserProfile } = useUser();
  const [isDismissing, setIsDismissing] = useState(false);
  const steps = useMemo(() => buildStepState(userData), [userData]);
  const completedCount = steps.filter((step) => step.complete).length;
  const isDone = completedCount === steps.length;
  const isDismissed = Boolean(userData?.onboarding?.dismissed);
  const shouldShow = isNewAccount(userData?.createdAt) && !isDone && !isDismissed;

  if (!shouldShow) {
    return null;
  }

  const handleDismiss = async () => {
    const onboardingUpdate = {
      onboarding: {
        ...(userData?.onboarding || {}),
        dismissed: true,
        completedSteps: steps.filter((step) => step.complete).map((step) => step.id),
        lastDismissedAt: new Date().toISOString(),
      },
    };

    try {
      setIsDismissing(true);
      updateUserProfile(onboardingUpdate);
      await saveUserProfile(onboardingUpdate);
      toast.success("Onboarding checklist hidden.");
    } catch (error) {
      console.warn("Unable to sync onboarding dismissal:", error);
      toast.success("Onboarding checklist hidden on this device.");
    } finally {
      setIsDismissing(false);
    }
  };

  return (
    <section
      className={`mb-6 rounded-3xl border p-5 shadow-xl sm:p-6 ${
        theme === "dark"
          ? "border-slate-700 bg-slate-900 text-slate-100"
          : "border-slate-200 bg-white text-slate-900"
      }`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-teal-400">
            <Sparkles className="h-4 w-4" strokeWidth={2.2} />
            Getting Started
          </p>
          <h2 className="text-2xl font-semibold">Finish setting up your account.</h2>
          <p className={`text-sm ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>
            {`${completedCount} of ${steps.length} steps complete. Finish the remaining items to unlock your full dashboard.`}
          </p>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          disabled={isDismissing}
          aria-label="Dismiss onboarding panel"
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition ${
            theme === "dark"
              ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          } ${isDismissing ? "cursor-not-allowed opacity-60" : ""}`}
        >
          <X className="h-4 w-4" strokeWidth={2.2} />
        </button>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        {steps.map((step) => (
          <Link
            key={step.id}
            to={step.to}
            className={`rounded-2xl border p-4 transition ${
              theme === "dark"
                ? "border-slate-700 bg-slate-800/60 hover:bg-slate-800"
                : "border-slate-200 bg-slate-50 hover:bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`rounded-2xl p-3 ${
                    step.complete
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-teal-500/15 text-teal-400"
                  }`}
                >
                  {step.complete ? (
                    <CheckCircle2 className="h-5 w-5" strokeWidth={2.2} />
                  ) : (
                    <CircleDashed className="h-5 w-5" strokeWidth={2.2} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold">{step.title}</p>
                  <p
                    className={`mt-1 text-xs ${
                      theme === "dark" ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    {step.description}
                  </p>
                </div>
              </div>

              <ChevronRight className="mt-1 h-4 w-4 text-slate-400" strokeWidth={2.2} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

OnboardingPanel.propTypes = {
  theme: PropTypes.oneOf(["dark", "light"]),
};
