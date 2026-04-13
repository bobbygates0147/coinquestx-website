import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  AlertTriangle,
  BellRing,
  ChevronRight,
  Clock3,
  KeyRound,
  Laptop,
  LockKeyhole,
  Mail,
  ScanFace,
  ShieldCheck,
  Smartphone,
  Trash2,
  WalletCards,
} from "lucide-react";
import { useUser } from "../../context/UserContext";
import { API_BASE_URL } from "../../config/api";

const SECURITY_ACTIONS = [
  {
    label: "Update Email",
    description: "Change the recovery and sign-in email on your account.",
    to: "/EmailUpdate",
    icon: Mail,
  },
  {
    label: "Change Password",
    description: "Refresh your password and lock out older credentials.",
    to: "/PasswordUpdate",
    icon: LockKeyhole,
  },
  {
    label: "Update Photo",
    description: "Keep your profile and verification image current.",
    to: "/UpdatePhotoPage",
    icon: ScanFace,
  },
];

const SESSION_TIMEOUT_OPTIONS = [15, 30, 45, 60, 120];

const formatDateTime = (value) => {
  if (!value) return "Not available";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not available";
  return parsed.toLocaleString();
};

export default function AccountSetPage() {
  const { theme } = useTheme();
  const { userData, saveUserProfile, getAuthToken, refreshUser } = useUser();
  const isDark = theme === "dark";
  const [formState, setFormState] = useState(() => ({
    securitySettings: userData?.securitySettings || {},
    notificationSettings: userData?.notificationSettings || {},
    transactionCode: userData?.transactionCode || "",
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorChallengeId, setTwoFactorChallengeId] = useState("");
  const [isProcessingTwoFactor, setIsProcessingTwoFactor] = useState(false);
  const [removingWhitelistId, setRemovingWhitelistId] = useState("");

  useEffect(() => {
    setFormState({
      securitySettings: userData?.securitySettings || {},
      notificationSettings: userData?.notificationSettings || {},
      transactionCode: userData?.transactionCode || "",
    });
  }, [
    userData?.securitySettings,
    userData?.notificationSettings,
    userData?.transactionCode,
  ]);

  const securitySettings = formState.securitySettings || {};
  const notificationSettings = formState.notificationSettings || {};
  const sessionTimeout = Number(securitySettings.sessionTimeoutMinutes) || 30;
  const cooldownMinutes = Number(securitySettings.withdrawalCooldownMinutes) || 0;
  const activeWhitelistEntries = useMemo(
    () =>
      (Array.isArray(userData?.walletWhitelist) ? userData.walletWhitelist : []).filter(
        (entry) => `${entry?.status || "active"}`.toLowerCase() === "active"
      ),
    [userData?.walletWhitelist]
  );
  const surfaceClass = isDark
    ? "border-slate-700 bg-slate-900 text-slate-100"
    : "border-slate-200 bg-white text-slate-900";
  const mutedClass = isDark ? "text-slate-300" : "text-slate-600";

  const securityScore = useMemo(() => {
    let score = 25;
    if (securitySettings.loginAlerts) score += 20;
    if (securitySettings.withdrawalProtection) score += 20;
    if (`${formState.transactionCode || ""}`.trim().length >= 4) score += 20;
    if (`${securitySettings.antiPhishingPhrase || ""}`.trim()) score += 15;
    return Math.min(100, score);
  }, [formState.transactionCode, securitySettings]);

  const handleToggle = (key) => {
    setFormState((prev) => ({
      ...prev,
      securitySettings: {
        ...(prev.securitySettings || {}),
        [key]: !prev.securitySettings?.[key],
      },
    }));
  };

  const handleNotificationToggle = (key) => {
    setFormState((prev) => ({
      ...prev,
      notificationSettings: {
        ...(prev.notificationSettings || {}),
        [key]: !prev.notificationSettings?.[key],
      },
    }));
  };

  const authFetch = async (url, options = {}) => {
    const token = getAuthToken?.();
    if (!token) throw new Error("Not authenticated");

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(options.headers || {}),
      },
    });

    const result = await response.json().catch(() => null);
    return { response, result };
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveUserProfile({
        securitySettings: {
          ...securitySettings,
          lastSecurityReviewAt: new Date().toISOString(),
        },
        notificationSettings,
        transactionCode: formState.transactionCode.trim(),
      });
      toast.success("Security preferences updated.");
    } catch (error) {
      toast.error(error.message || "Unable to save security settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTwoFactorAction = async () => {
    try {
      setIsProcessingTwoFactor(true);
      const enabled = Boolean(securitySettings.twoFactorEnabled);

      if (!enabled && !twoFactorChallengeId) {
        const { response, result } = await authFetch(
          `${API_BASE_URL}/User/Security/2FA/RequestEnable`,
          {
            method: "POST",
          }
        );
        if (!response.ok || !result?.success) {
          throw new Error(result?.message || "Unable to send setup code.");
        }
        setTwoFactorChallengeId(result?.data?.challengeId || "");
        toast.success(result?.message || "Verification code sent to your email.");
        return;
      }

      if (!enabled) {
        if (!twoFactorCode.trim()) {
          throw new Error("Enter the email verification code first.");
        }

        const { response, result } = await authFetch(
          `${API_BASE_URL}/User/Security/2FA/ConfirmEnable`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              challengeId: twoFactorChallengeId,
              code: twoFactorCode.trim(),
            }),
          }
        );
        if (!response.ok || !result?.success) {
          throw new Error(result?.message || "Unable to enable two-factor security.");
        }
        setTwoFactorChallengeId("");
        setTwoFactorCode("");
        await refreshUser?.();
        toast.success("Two-factor security enabled.");
        return;
      }

      const disablePayload =
        twoFactorChallengeId && twoFactorCode.trim()
          ? {
              challengeId: twoFactorChallengeId,
              code: twoFactorCode.trim(),
            }
          : {};

      const { response, result } = await authFetch(
        `${API_BASE_URL}/User/Security/2FA/Disable`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(disablePayload),
        }
      );

      if (response.status === 202 && result?.requiresVerification) {
        setTwoFactorChallengeId(result?.data?.challengeId || "");
        toast.success(result?.message || "Verification code sent to your email.");
        return;
      }

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Unable to disable two-factor security.");
      }

      setTwoFactorChallengeId("");
      setTwoFactorCode("");
      await refreshUser?.();
      toast.success("Two-factor security disabled.");
    } catch (error) {
      toast.error(error.message || "Unable to update two-factor security.");
    } finally {
      setIsProcessingTwoFactor(false);
    }
  };

  const handleRemoveWhitelistEntry = async (entryId) => {
    if (!entryId) return;

    try {
      setRemovingWhitelistId(entryId);
      const { response, result } = await authFetch(
        `${API_BASE_URL}/User/Security/Whitelist/${entryId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Unable to remove whitelist entry.");
      }

      await refreshUser?.();
      toast.success("Whitelist entry removed.");
    } catch (error) {
      toast.error(error.message || "Unable to remove whitelist entry.");
    } finally {
      setRemovingWhitelistId("");
    }
  };

  const statusCards = [
    {
      label: "Security Score",
      value: `${securityScore}%`,
      note: "Based on alerts, withdrawal protection, and phishing shield.",
      icon: ShieldCheck,
      tone: "text-teal-400",
    },
    {
      label: "Login Alerts",
      value: securitySettings.loginAlerts ? "Active" : "Off",
      note: "Notifications for new sign-ins and session changes.",
      icon: BellRing,
      tone: securitySettings.loginAlerts ? "text-emerald-400" : "text-amber-400",
    },
    {
      label: "Withdrawal Shield",
      value: securitySettings.withdrawalProtection ? "Protected" : "Open",
      note: "Require extra confirmation before sensitive balance exits.",
      icon: KeyRound,
      tone: securitySettings.withdrawalProtection ? "text-cyan-400" : "text-amber-400",
    },
    {
      label: "2FA",
      value: securitySettings.twoFactorEnabled ? "Enabled" : "Disabled",
      note: "Email OTP is used for sign-ins and protected wallet actions.",
      icon: ShieldCheck,
      tone: securitySettings.twoFactorEnabled ? "text-emerald-400" : "text-amber-400",
    },
    {
      label: "Session Window",
      value: `${sessionTimeout} min`,
      note: "Auto-lock preference for dashboard inactivity.",
      icon: Clock3,
      tone: "text-purple-400",
    },
  ];

  return (
    <div className="space-y-6">
      <section className={`rounded-3xl border p-6 shadow-xl sm:p-8 ${surfaceClass}`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-400">
              Security Center
            </p>
            <h1 className="text-3xl font-semibold sm:text-4xl">
              Protect access, withdrawals, and sensitive account actions.
            </h1>
            <p className={`max-w-3xl text-sm sm:text-base ${mutedClass}`}>
              Configure login alerts, anti-phishing protection, withdrawal verification,
              and session behavior from one place. Changes save directly to your account.
            </p>
          </div>

          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              isDark
                ? "border-slate-700 bg-slate-800 text-slate-200"
                : "border-slate-200 bg-slate-50 text-slate-700"
            }`}
          >
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
              Last Security Review
            </p>
            <p className="mt-2 font-semibold">
              {formatDateTime(securitySettings.lastSecurityReviewAt)}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statusCards.map((card) => {
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
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                      {card.label}
                    </p>
                    <p className={`mt-3 text-2xl font-semibold ${card.tone}`}>{card.value}</p>
                  </div>
                  <div
                    className={`rounded-2xl p-3 ${
                      isDark ? "bg-slate-900 text-slate-200" : "bg-white text-slate-700"
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                </div>
                <p className={`mt-3 text-xs ${mutedClass}`}>{card.note}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className={`rounded-3xl border p-6 shadow-xl ${surfaceClass}`}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Security Preferences</h2>
              <p className={`mt-1 text-sm ${mutedClass}`}>
                Control alerts, trusted identity hints, and sensitive-action safeguards.
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white transition ${
                isSaving
                  ? "cursor-not-allowed bg-slate-500"
                  : "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500"
              }`}
            >
              {isSaving ? "Saving..." : "Save Security Changes"}
            </button>
          </div>

          <div className="space-y-4">
            {[
              {
                key: "loginAlerts",
                title: "Login alerts",
                description: "Notify me when a new device or browser signs in.",
                icon: BellRing,
              },
              {
                key: "withdrawalProtection",
                title: "Withdrawal protection",
                description: "Require the withdrawal code before sensitive payout requests.",
                icon: KeyRound,
              },
            ].map((item) => {
              const Icon = item.icon;
              const active = Boolean(securitySettings[item.key]);
              return (
                <div
                  key={item.key}
                  className={`flex min-w-0 flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                    isDark
                      ? "border-slate-700 bg-slate-800/60"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={`rounded-2xl p-3 ${
                        active
                          ? "bg-teal-500/15 text-teal-400"
                          : isDark
                          ? "bg-slate-900 text-slate-400"
                          : "bg-white text-slate-500"
                      }`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className={`mt-1 text-xs ${mutedClass}`}>{item.description}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggle(item.key)}
                    className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full transition ${
                      active ? "bg-teal-500" : isDark ? "bg-slate-700" : "bg-slate-300"
                    }`}
                    aria-pressed={active}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white transition ${
                        active ? "translate-x-8" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>

          <div
            className={`mt-5 rounded-2xl border p-4 ${
              isDark ? "border-slate-700 bg-slate-800/60" : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div
                  className={`rounded-2xl p-3 ${
                    securitySettings.twoFactorEnabled
                      ? "bg-teal-500/15 text-teal-400"
                      : isDark
                      ? "bg-slate-900 text-slate-400"
                      : "bg-white text-slate-500"
                  }`}
                >
                  <ShieldCheck className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Email OTP two-factor security</p>
                  <p className={`mt-1 text-xs ${mutedClass}`}>
                    {securitySettings.twoFactorEnabled
                      ? "Protected actions now require an emailed verification code."
                      : "Enable email OTP for protected sign-ins and payout actions."}
                  </p>
                  <p className={`mt-2 text-[11px] ${mutedClass}`}>
                    Last verified: {formatDateTime(securitySettings.lastTwoFactorVerifiedAt)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTwoFactorAction}
                disabled={isProcessingTwoFactor}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold text-white ${
                  isProcessingTwoFactor
                    ? "cursor-not-allowed bg-slate-500"
                    : securitySettings.twoFactorEnabled
                    ? "bg-rose-600 hover:bg-rose-500"
                    : "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500"
                }`}
              >
                {isProcessingTwoFactor
                  ? "Processing..."
                  : securitySettings.twoFactorEnabled
                  ? twoFactorChallengeId
                    ? "Confirm Disable"
                    : "Disable 2FA"
                  : twoFactorChallengeId
                  ? "Confirm Enable"
                  : "Enable 2FA"}
              </button>
            </div>

            {twoFactorChallengeId && (
              <div className="mt-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Email Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={twoFactorCode}
                  onChange={(event) =>
                    setTwoFactorCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="123456"
                  className={`w-full rounded-2xl border px-4 py-3 text-sm tracking-[0.35em] ${
                    isDark
                      ? "border-slate-700 bg-slate-950 text-slate-100"
                    : "border-slate-300 bg-white text-slate-900"
                  }`}
                />
              </div>
            )}
          </div>

          <div className="mt-5">
            <div className="mb-3">
              <h3 className="text-sm font-semibold">Email Notifications</h3>
              <p className={`mt-1 text-xs ${mutedClass}`}>
                Choose which account updates should also reach your inbox outside the app.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["depositEmails", "Deposit updates"],
                ["withdrawalEmails", "Withdrawal updates"],
                ["kycEmails", "KYC review updates"],
                ["tradeEmails", "Trade close alerts"],
                ["referralEmails", "Referral reward alerts"],
                ["subscriptionEmails", "Subscription expiry alerts"],
                ["supportEmails", "Support reply alerts"],
              ].map(([key, label]) => {
                const active = Boolean(notificationSettings[key]);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleNotificationToggle(key)}
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left ${
                      isDark
                        ? "border-slate-700 bg-slate-800/60"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <span className="text-sm font-medium">{label}</span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        active
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-slate-500/15 text-slate-400"
                      }`}
                    >
                      {active ? "On" : "Off"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Anti-Phishing Phrase
              </label>
              <input
                type="text"
                value={securitySettings.antiPhishingPhrase || ""}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    securitySettings: {
                      ...(prev.securitySettings || {}),
                      antiPhishingPhrase: event.target.value,
                    },
                  }))
                }
                placeholder="e.g. teal horizon"
                className={`w-full rounded-2xl border px-4 py-3 text-sm ${
                  isDark
                    ? "border-slate-700 bg-slate-950 text-slate-100"
                    : "border-slate-300 bg-white text-slate-900"
                }`}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Withdrawal Code
              </label>
              <input
                type="password"
                value={formState.transactionCode}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    transactionCode: event.target.value,
                  }))
                }
                placeholder="Set a 4-24 character code"
                className={`w-full rounded-2xl border px-4 py-3 text-sm ${
                  isDark
                    ? "border-slate-700 bg-slate-950 text-slate-100"
                    : "border-slate-300 bg-white text-slate-900"
                }`}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Trusted Device Label
              </label>
              <input
                type="text"
                value={securitySettings.trustedDeviceLabel || ""}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    securitySettings: {
                      ...(prev.securitySettings || {}),
                      trustedDeviceLabel: event.target.value,
                    },
                  }))
                }
                placeholder="e.g. Office MacBook"
                className={`w-full rounded-2xl border px-4 py-3 text-sm ${
                  isDark
                    ? "border-slate-700 bg-slate-950 text-slate-100"
                    : "border-slate-300 bg-white text-slate-900"
                }`}
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Session Timeout
              </label>
              <select
                value={sessionTimeout}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    securitySettings: {
                      ...(prev.securitySettings || {}),
                      sessionTimeoutMinutes: Number(event.target.value),
                    },
                  }))
                }
                className={`w-full rounded-2xl border px-4 py-3 text-sm ${
                  isDark
                    ? "border-slate-700 bg-slate-950 text-slate-100"
                    : "border-slate-300 bg-white text-slate-900"
                }`}
              >
                {SESSION_TIMEOUT_OPTIONS.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} minutes
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`rounded-3xl border p-6 shadow-xl ${surfaceClass}`}>
            <h2 className="text-xl font-semibold">Session & Device Snapshot</h2>
            <div className="mt-5 space-y-4">
              <div
                className={`rounded-2xl border p-4 ${
                  isDark
                    ? "border-slate-700 bg-slate-800/60"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Laptop className="h-5 w-5 text-teal-400" strokeWidth={2.2} />
                  <div>
                    <p className="text-sm font-semibold">Current session</p>
                    <p className={`text-xs ${mutedClass}`}>
                      {userData?.lastLoginDevice || "Active browser session"}
                    </p>
                  </div>
                </div>
                <p className={`mt-3 text-xs ${mutedClass}`}>
                  Last sign-in: {formatDateTime(userData?.lastLoginAt)}
                </p>
              </div>

              <div
                className={`rounded-2xl border p-4 ${
                  isDark
                    ? "border-slate-700 bg-slate-800/60"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-cyan-400" strokeWidth={2.2} />
                  <div>
                    <p className="text-sm font-semibold">Trusted device label</p>
                    <p className={`text-xs ${mutedClass}`}>
                      {securitySettings.trustedDeviceLabel || "No trusted label saved yet"}
                    </p>
                  </div>
                </div>
                <p className={`mt-3 text-xs ${mutedClass}`}>
                  Use a memorable device name so unfamiliar sign-ins stand out fast.
                </p>
              </div>
            </div>
          </div>

          <div className={`rounded-3xl border p-6 shadow-xl ${surfaceClass}`}>
            <h2 className="text-xl font-semibold">Account Actions</h2>
            <div className="mt-4 space-y-3">
              {SECURITY_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    to={action.to}
                    className={`flex items-center justify-between gap-3 rounded-2xl border p-4 transition ${
                      isDark
                        ? "border-slate-700 bg-slate-800/60 hover:bg-slate-800"
                        : "border-slate-200 bg-slate-50 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-teal-500/15 p-3 text-teal-400">
                        <Icon className="h-5 w-5" strokeWidth={2.2} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{action.label}</p>
                        <p className={`mt-1 text-xs ${mutedClass}`}>{action.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" strokeWidth={2.2} />
                  </Link>
                );
              })}
            </div>
          </div>

          <div
            className={`mt-5 rounded-2xl border p-4 ${
              isDark ? "border-slate-700 bg-slate-800/60" : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`rounded-2xl p-3 ${
                  activeWhitelistEntries.length
                    ? "bg-cyan-500/15 text-cyan-400"
                    : isDark
                    ? "bg-slate-900 text-slate-400"
                    : "bg-white text-slate-500"
                }`}
              >
                <WalletCards className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Withdrawal Guardrails</h3>
                <p className={`mt-1 text-xs ${mutedClass}`}>
                  Review your cooldown window, whitelist mode, and approved payout destinations.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div
                className={`rounded-2xl border p-4 ${
                  isDark ? "border-slate-700 bg-slate-900/70" : "border-slate-200 bg-white"
                }`}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Cooldown</p>
                <p className="mt-2 text-lg font-semibold">{cooldownMinutes} min</p>
                <p className={`mt-2 text-xs ${mutedClass}`}>
                  Last request: {formatDateTime(securitySettings.lastWithdrawalRequestedAt)}
                </p>
              </div>
              <div
                className={`rounded-2xl border p-4 ${
                  isDark ? "border-slate-700 bg-slate-900/70" : "border-slate-200 bg-white"
                }`}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Whitelist Mode</p>
                <p className="mt-2 text-lg font-semibold capitalize">
                  {securitySettings.whitelistMode || "enforced"}
                </p>
                <p className={`mt-2 text-xs ${mutedClass}`}>
                  Withdrawals only release to approved destinations when enforcement is active.
                </p>
              </div>
              <div
                className={`rounded-2xl border p-4 ${
                  isDark ? "border-slate-700 bg-slate-900/70" : "border-slate-200 bg-white"
                }`}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Approved Destinations</p>
                <p className="mt-2 text-lg font-semibold">{activeWhitelistEntries.length}</p>
                <p className={`mt-2 text-xs ${mutedClass}`}>
                  Add or confirm new payout destinations from the withdrawal flow.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {activeWhitelistEntries.length === 0 ? (
                <div
                  className={`rounded-2xl border border-dashed p-4 ${
                    isDark
                      ? "border-slate-700 bg-slate-900/50"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-400" strokeWidth={2.2} />
                    <p className={`text-sm ${mutedClass}`}>
                      No active payout destinations yet. Approve one from the withdrawal page
                      before requesting a withdrawal.
                    </p>
                  </div>
                </div>
              ) : (
                activeWhitelistEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                      isDark ? "border-slate-700 bg-slate-900/70" : "border-slate-200 bg-white"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {entry.label || entry.paymentMethod || "Approved destination"}
                      </p>
                      <p className={`mt-1 text-xs ${mutedClass}`}>
                        {entry.destinationSummary || entry.maskedDestination || "Destination approved"}
                      </p>
                      <p className={`mt-1 text-[11px] ${mutedClass}`}>
                        Added: {formatDateTime(entry.addedAt)} | Last used:{" "}
                        {formatDateTime(entry.lastUsedAt)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveWhitelistEntry(entry.id)}
                      disabled={removingWhitelistId === entry.id}
                      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold ${
                        removingWhitelistId === entry.id
                          ? "cursor-not-allowed bg-slate-500 text-white"
                          : "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                      }`}
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2.1} />
                      {removingWhitelistId === entry.id ? "Removing..." : "Remove"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
