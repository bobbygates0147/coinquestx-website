import { useState, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCopy,
  faUserFriends,
  faShareAlt,
  faChartLine,
  faGift,
  faCoins,
  faQrcode,
  faEnvelope,
  faMessage,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import {
  faTwitter,
  faFacebook,
  faWhatsapp,
  faTelegram,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";
import { API_BASE_URL } from "../../config/api";
import { useUser } from "../../context/UserContext";
import { formatCurrencyAmount } from "../../utils/currency";
import PaginationControls from "../../components/ui/PaginationControls";

export default function ReferralsPage() {
  const { theme } = useTheme();
  const { getAuthToken, userData } = useUser();
  const referralCurrency = userData?.currencyCode || "USD";
  const [copied, setCopied] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [activeTab, setActiveTab] = useState("referrals");
  const [referralLink, setReferralLink] = useState("");
  const [referrals, setReferrals] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, earnings: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [referralsPage, setReferralsPage] = useState(1);
  const [rewardsPage, setRewardsPage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);

  const totalReferrals = stats.total || referrals.length;
  const activeReferrals =
    stats.active || referrals.filter((ref) => ref.status === "Active").length;
  const totalEarnings =
    stats.earnings ||
    referrals.reduce((sum, ref) => sum + (Number(ref.earnings) || 0), 0);

  const fetchReferralOverview = async () => {
    const token = getAuthToken?.();
    if (!token) {
      setErrorMessage("Please log in to view referrals.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/Referral/Overview`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Failed to load referrals");
      }

      const data = result.data || {};
      setReferralLink(data.referralLink || "");
      setStats(data.stats || { total: 0, active: 0, earnings: 0 });
      setReferrals(data.referrals || []);
      setRewards(data.rewards || []);
      setErrorMessage("");
    } catch (error) {
      console.error("Failed to load referrals:", error);
      setErrorMessage(error.message || "Unable to load referrals.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralOverview();
  }, []);

  useEffect(() => {
    setReferralsPage(1);
  }, [tablePageSize, referrals.length]);

  useEffect(() => {
    setRewardsPage(1);
  }, [tablePageSize, rewards.length]);

  const referralsTotalPages = Math.max(
    1,
    Math.ceil(referrals.length / tablePageSize)
  );
  const rewardsTotalPages = Math.max(1, Math.ceil(rewards.length / tablePageSize));

  useEffect(() => {
    if (referralsPage > referralsTotalPages) {
      setReferralsPage(referralsTotalPages);
    }
  }, [referralsPage, referralsTotalPages]);

  useEffect(() => {
    if (rewardsPage > rewardsTotalPages) {
      setRewardsPage(rewardsTotalPages);
    }
  }, [rewardsPage, rewardsTotalPages]);

  const paginatedReferrals = useMemo(() => {
    const start = (referralsPage - 1) * tablePageSize;
    return referrals.slice(start, start + tablePageSize);
  }, [referrals, referralsPage, tablePageSize]);

  const paginatedRewards = useMemo(() => {
    const start = (rewardsPage - 1) * tablePageSize;
    return rewards.slice(start, start + tablePageSize);
  }, [rewards, rewardsPage, tablePageSize]);

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleShareOptions = () => {
    setShowShareOptions(!showShareOptions);
  };

  const shareVia = (platform) => {
    let shareUrl = "";

    if (!referralLink) {
      return;
    }

    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=Join%20CoinQuestX%20with%20my%20referral%20link&url=${encodeURIComponent(
          referralLink
        )}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          referralLink
        )}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=Join%20CoinQuestX%20with%20my%20referral%20link:%20${encodeURIComponent(
          referralLink
        )}`;
        break;
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
          referralLink
        )}&text=Join%20CoinQuestX%20with%20my%20referral%20link`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          referralLink
        )}`;
        break;
      case "email":
      case "sms":
      default:
        // Just copy to clipboard for these
        handleCopy();
        return;
    }

    window.open(shareUrl, "_blank");
  };

  // Format currency
  const formatCurrency = (amount) => {
    return formatCurrencyAmount(amount, referralCurrency);
  };

  const pageShellClass =
    theme === "dark"
      ? "bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(99,102,241,0.12),transparent_24%),linear-gradient(180deg,#020617_0%,#020617_40%,#0f172a_100%)] text-slate-100"
      : "bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(99,102,241,0.1),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef6ff_100%)] text-slate-900";
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

  const getReferralStatusClasses = (status) =>
    `${status || ""}`.toLowerCase() === "active"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
      : "border-amber-500/20 bg-amber-500/10 text-amber-400";

  const getRewardStatusClasses = (status) =>
    `${status || ""}`.toLowerCase() === "paid"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
      : "border-amber-500/20 bg-amber-500/10 text-amber-400";

  return (
    <div
      className={`min-h-screen ${pageShellClass}`}
    >
      <div className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
        <section
          className={`relative mb-10 overflow-hidden rounded-[32px] border px-6 py-7 sm:px-8 lg:px-10 ${heroPanelClass}`}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-16 top-0 h-40 w-40 rounded-full bg-teal-400/18 blur-3xl" />
            <div className="absolute right-0 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full bg-indigo-400/16 blur-3xl" />
          </div>
          <div className="relative space-y-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-3 rounded-full border border-teal-400/15 bg-teal-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-teal-300">
                <FontAwesomeIcon icon={faGift} />
                Referral Studio
              </div>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
                  Turn every invite into a cleaner, more premium referral workflow.
                </h1>
                <p className={`max-w-2xl text-sm leading-7 sm:text-base ${mutedTextClass}`}>
                  Share your link, track conversions, and monitor reward payouts from a sharper referral dashboard built for clarity.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleCopy}
                  disabled={!referralLink}
                  className={`inline-flex items-center rounded-2xl px-5 py-3 text-sm font-semibold text-white transition ${
                    copied
                      ? "bg-emerald-500"
                      : "bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-500 hover:opacity-95"
                  } ${!referralLink ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  <FontAwesomeIcon icon={faCopy} className="mr-2" />
                  {copied ? "Copied" : "Copy Referral Link"}
                </button>
                <button
                  onClick={toggleShareOptions}
                  className={`inline-flex items-center rounded-2xl border px-5 py-3 text-sm font-semibold transition ${
                    theme === "dark"
                      ? "border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                      : "border-slate-200 bg-white/90 text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <FontAwesomeIcon icon={faShareAlt} className="mr-2" />
                  Share Campaign
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className={`rounded-[24px] border p-5 ${softPanelClass}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-400/80">
                  Total Referrals
                </p>
                <p className="mt-3 text-3xl font-semibold">{totalReferrals}</p>
              </div>
              <div className={`rounded-[24px] border p-5 ${softPanelClass}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400/80">
                  Active Users
                </p>
                <p className="mt-3 text-3xl font-semibold">{activeReferrals}</p>
              </div>
              <div className={`rounded-[24px] border p-5 ${softPanelClass}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400/80">
                  Reward Value
                </p>
                <p className="mt-3 text-3xl font-semibold">
                  {formatCurrency(totalEarnings)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {(errorMessage || isLoading) && (
          <div className="w-full mb-8 space-y-3">
            {errorMessage && (
              <div className="rounded-2xl bg-red-900/20 border border-red-500/50 text-red-300 px-4 py-3 text-sm">
                {errorMessage}
              </div>
            )}
            {isLoading && (
              <div
                className={`rounded-2xl px-4 py-3 text-sm ${
                  theme === "dark"
                    ? "bg-slate-800 border border-slate-700 text-slate-300"
                    : "bg-white border border-slate-200 text-slate-600"
                }`}
              >
                Loading referral data...
              </div>
            )}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div
            className={`rounded-[28px] border p-6 ${glassPanelClass}`}
          >
            <div className="flex items-center">
              <div
                className={`mr-4 rounded-2xl p-3 ${
                  theme === "dark" ? "bg-teal-900/50" : "bg-teal-100"
                }`}
              >
                <FontAwesomeIcon
                  icon={faUserFriends}
                  className={`h-6 ${
                    theme === "dark" ? "text-teal-400" : "text-teal-600"
                  }`}
                />
              </div>
              <div>
                <h3
                  className={`text-sm ${mutedTextClass}`}
                >
                  Total Referrals
                </h3>
                <p className="text-2xl font-bold">{totalReferrals}</p>
              </div>
            </div>
          </div>

          <div
            className={`rounded-[28px] border p-6 ${glassPanelClass}`}
          >
            <div className="flex items-center">
              <div
                className={`mr-4 rounded-2xl p-3 ${
                  theme === "dark" ? "bg-blue-900/50" : "bg-blue-100"
                }`}
              >
                <FontAwesomeIcon
                  icon={faChartLine}
                  className={`h-6 ${
                    theme === "dark" ? "text-blue-400" : "text-blue-600"
                  }`}
                />
              </div>
              <div>
                <h3
                  className={`text-sm ${mutedTextClass}`}
                >
                  Active Referrals
                </h3>
                <p className="text-2xl font-bold">{activeReferrals}</p>
              </div>
            </div>
          </div>

          <div
            className={`rounded-[28px] border p-6 ${glassPanelClass}`}
          >
            <div className="flex items-center">
              <div
                className={`mr-4 rounded-2xl p-3 ${
                  theme === "dark" ? "bg-teal-900/50" : "bg-teal-100"
                }`}
              >
                <FontAwesomeIcon
                  icon={faCoins}
                  className={`h-6 ${
                    theme === "dark" ? "text-teal-400" : "text-teal-600"
                  }`}
                />
              </div>
              <div>
                <h3
                  className={`text-sm ${mutedTextClass}`}
                >
                  Total Earnings
                </h3>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalEarnings)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Program Card */}
        <div
          className={`mb-12 overflow-hidden rounded-[30px] border ${glassPanelClass}`}
        >
          <div className="p-8 flex flex-col lg:flex-row gap-8 items-stretch">
            {/* Program Details */}
            <div className="flex-1">
              <div
                className={`h-full rounded-[24px] border p-6 ${softPanelClass}`}
              >
                <div className="flex items-center mb-6">
                  <div
                    className={`p-3 rounded-lg ${
                      theme === "dark" ? "bg-purple-900/50" : "bg-purple-100"
                    } mr-4`}
                  >
                    <FontAwesomeIcon
                      icon={faGift}
                      className={`h-6 ${
                        theme === "dark" ? "text-purple-400" : "text-purple-600"
                      }`}
                    />
                  </div>
                  <h2
                  className="text-2xl font-bold"
                >
                  Your Referral Rewards
                </h2>
                </div>

                <div className="space-y-4">
                  <div
                    className={`rounded-[20px] border p-4 ${softPanelClass}`}
                  >
                    <h3 className="font-bold mb-2">How it works</h3>
                    <ul className="space-y-2 pl-5 list-disc">
                      <li>Share your unique referral link with friends</li>
                      <li>Your friend signs up using your link</li>
                      <li>
                        You earn{" "}
                        <span className="font-bold text-teal-500">$25</span>{" "}
                        when they deposit their first $100
                      </li>
                      <li>
                        Your friend gets{" "}
                        <span className="font-bold text-teal-500">$10</span>{" "}
                        bonus
                      </li>
                      <li>
                        Earn{" "}
                        <span className="font-bold text-teal-500">10%</span> of
                        their trading fees for 3 months
                      </li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={`rounded-[20px] border p-4 text-center ${softPanelClass}`}
                    >
                      <div className="text-3xl font-bold text-teal-500">
                        $25
                      </div>
                      <p className="text-sm">Per referral</p>
                    </div>
                    <div
                      className={`rounded-[20px] border p-4 text-center ${softPanelClass}`}
                    >
                      <div className="text-3xl font-bold text-blue-500">
                        10%
                      </div>
                      <p className="text-sm">Commission on fees</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Referral Link Section */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center mb-6">
                <div
                  className={`p-3 rounded-lg ${
                    theme === "dark" ? "bg-teal-900/50" : "bg-teal-100"
                  } mr-4`}
                >
                  <FontAwesomeIcon
                    icon={faShareAlt}
                    className={`h-6 ${
                      theme === "dark" ? "text-teal-400" : "text-teal-600"
                    }`}
                  />
                </div>
                <h2
                  className={`text-2xl font-bold ${
                    theme === "dark" ? "text-white" : "text-slate-800"
                  }`}
                >
                  Your Referral Link
                </h2>
              </div>

              <div className="flex-1">
                <div
                  className={`rounded-[24px] border p-6 ${softPanelClass}`}
                >
                  <div className="mb-6">
                    <label
                      className={`block text-sm font-semibold mb-2 ${
                        theme === "dark" ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      Share this link
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={referralLink || "Generating referral link..."}
                        readOnly
                        className={`flex-1 rounded-l-2xl px-4 py-3 focus:outline-none ${
                          theme === "dark"
                            ? "bg-white/[0.06] text-white"
                            : "bg-white text-slate-900"
                        }`}
                      />
                      <button
                        onClick={handleCopy}
                        disabled={!referralLink}
                        className={`flex items-center rounded-r-2xl px-6 py-3 font-medium ${
                          copied
                            ? "bg-green-500 text-white"
                            : theme === "dark"
                            ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:opacity-95"
                            : "bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:opacity-95"
                        } ${!referralLink ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        <FontAwesomeIcon icon={faCopy} className="mr-2" />
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label
                      className={`block text-sm font-semibold mb-2 ${
                        theme === "dark" ? "text-slate-300" : "text-slate-700"
                      }`}
                    >
                      Referral QR Code
                    </label>
                    <div
                      className={`flex justify-center rounded-[20px] border p-4 ${softPanelClass}`}
                    >
                      <div
                        className={`p-4 ${
                          theme === "dark" ? "bg-white" : "bg-slate-200"
                        }`}
                      >
                        <FontAwesomeIcon
                          icon={faQrcode}
                          className="h-24 text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={toggleShareOptions}
                    className={`flex w-full items-center justify-center rounded-2xl py-3 font-medium ${
                      theme === "dark"
                        ? "bg-white/[0.06] text-white hover:bg-white/[0.1]"
                        : "bg-white text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <FontAwesomeIcon icon={faShareAlt} className="mr-2" />
                    Share via Social Media
                  </button>

                  {showShareOptions && (
                    <div
                      className={`mt-4 rounded-[20px] border p-4 ${softPanelClass}`}
                    >
                      <h3
                        className={`font-semibold mb-3 ${
                          theme === "dark" ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        Share on:
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => shareVia("twitter")}
                          className={`py-2 rounded-lg flex flex-col items-center ${
                            theme === "dark"
                              ? "bg-white/[0.06] hover:bg-white/[0.1]"
                              : "bg-white hover:bg-slate-100"
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={faTwitter}
                            className="h-5 text-blue-400 mb-1"
                          />
                          <span className="text-xs">Twitter</span>
                        </button>
                        <button
                          onClick={() => shareVia("facebook")}
                          className={`py-2 rounded-lg flex flex-col items-center ${
                            theme === "dark"
                              ? "bg-slate-700 hover:bg-slate-600"
                              : "bg-white hover:bg-slate-100"
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={faFacebook}
                            className="h-5 text-blue-600 mb-1"
                          />
                          <span className="text-xs">Facebook</span>
                        </button>
                        <button
                          onClick={() => shareVia("whatsapp")}
                          className={`py-2 rounded-lg flex flex-col items-center ${
                            theme === "dark"
                              ? "bg-slate-700 hover:bg-slate-600"
                              : "bg-white hover:bg-slate-100"
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={faWhatsapp}
                            className="h-5 text-green-500 mb-1"
                          />
                          <span className="text-xs">WhatsApp</span>
                        </button>
                        <button
                          onClick={() => shareVia("telegram")}
                          className={`py-2 rounded-lg flex flex-col items-center ${
                            theme === "dark"
                              ? "bg-slate-700 hover:bg-slate-600"
                              : "bg-white hover:bg-slate-100"
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={faTelegram}
                            className="h-5 text-blue-400 mb-1"
                          />
                          <span className="text-xs">Telegram</span>
                        </button>
                        <button
                          onClick={() => shareVia("linkedin")}
                          className={`py-2 rounded-lg flex flex-col items-center ${
                            theme === "dark"
                              ? "bg-slate-700 hover:bg-slate-600"
                              : "bg-white hover:bg-slate-100"
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={faLinkedin}
                            className="h-5 text-blue-700 mb-1"
                          />
                          <span className="text-xs">LinkedIn</span>
                        </button>
                        <button
                          onClick={() => shareVia("email")}
                          className={`py-2 rounded-lg flex flex-col items-center ${
                            theme === "dark"
                              ? "bg-slate-700 hover:bg-slate-600"
                              : "bg-white hover:bg-slate-100"
                          }`}
                        >
                          <FontAwesomeIcon
                            icon={faEnvelope}
                            className="h-5 text-red-500 mb-1"
                          />
                          <span className="text-xs">Email</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Tabs */}
        <div className="mb-6">
          <div
            className={`inline-flex flex-wrap gap-2 rounded-full border p-2 ${
              theme === "dark"
                ? "border-white/10 bg-white/[0.04]"
                : "border-slate-200 bg-white/90"
            }`}
          >
            <button
              className={`rounded-full px-6 py-3 font-medium transition ${
                activeTab === "referrals"
                  ? theme === "dark"
                    ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25"
                    : "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/20"
                  : theme === "dark"
                  ? "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
              onClick={() => setActiveTab("referrals")}
            >
              Your Referrals
            </button>
            <button
              className={`rounded-full px-6 py-3 font-medium transition ${
                activeTab === "rewards"
                  ? theme === "dark"
                    ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25"
                    : "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/20"
                  : theme === "dark"
                  ? "text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
              onClick={() => setActiveTab("rewards")}
            >
              Reward History
            </button>
          </div>
        </div>

        {/* Referrals Table */}
        <div
          className={`overflow-hidden rounded-[30px] border ${glassPanelClass}`}
        >
          <div className="p-6">
            {activeTab === "referrals" ? (
              <>
                <div className={`overflow-x-auto rounded-[24px] border ${softPanelClass}`}>
                <table className="min-w-full">
                  <thead>
                    <tr
                      className={`border-b ${
                        theme === "dark"
                          ? "border-white/10"
                          : "border-slate-200"
                      }`}
                    >
                      <th
                        className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.24em] ${mutedTextClass}`}
                      >
                        ID
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.24em] ${mutedTextClass}`}
                      >
                        Email
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.24em] ${mutedTextClass}`}
                      >
                        Full Name
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.24em] ${mutedTextClass}`}
                      >
                        Date
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.24em] ${mutedTextClass}`}
                      >
                        Status
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.24em] ${mutedTextClass}`}
                      >
                        Earnings
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.length > 0 ? (
                      paginatedReferrals.map((referral) => (
                        <tr
                          key={referral.id}
                          className={`border-b ${
                            theme === "dark"
                              ? "border-slate-700 hover:bg-slate-700/50"
                              : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <td
                            className={`py-3 px-4 ${
                              theme === "dark"
                                ? "text-slate-300"
                                : "text-slate-700"
                            }`}
                          >
                            {referral.id}
                          </td>
                          <td
                            className={`py-3 px-4 ${
                              theme === "dark"
                                ? "text-slate-300"
                                : "text-slate-700"
                            }`}
                          >
                            {referral.email}
                          </td>
                          <td
                            className={`py-3 px-4 ${
                              theme === "dark"
                                ? "text-slate-300"
                                : "text-slate-700"
                            }`}
                          >
                            {referral.name || "--"}
                          </td>
                          <td
                            className={`py-3 px-4 ${
                              theme === "dark"
                                ? "text-slate-300"
                                : "text-slate-700"
                            }`}
                          >
                            {referral.date
                              ? new Date(referral.date).toLocaleDateString()
                              : "--"}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${getReferralStatusClasses(referral.status)}`}
                            >
                              {referral.status}
                            </span>
                          </td>
                          <td
                            className={`py-3 px-4 font-medium ${
                              Number(referral.earnings || 0) > 0
                                ? "text-green-500"
                                : theme === "dark"
                                ? "text-slate-400"
                                : "text-slate-500"
                            }`}
                          >
                            {formatCurrency(referral.earnings)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-8 text-center">
                          <p
                            className={`text-sm ${
                              theme === "dark"
                                ? "text-slate-400"
                                : "text-slate-500"
                            }`}
                          >
                            No referrals yet. Share your link to get started.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                </div>
                {referrals.length > 0 && (
                  <PaginationControls
                    currentPage={referralsPage}
                    totalPages={referralsTotalPages}
                    totalItems={referrals.length}
                    pageSize={tablePageSize}
                    onPageChange={setReferralsPage}
                    onPageSizeChange={setTablePageSize}
                    pageSizeOptions={[10, 20, 50]}
                    itemLabel="referrals"
                  />
                )}
              </>
            ) : (
              <>
                <div className={`overflow-x-auto rounded-[24px] border ${softPanelClass}`}>
                  <table className="min-w-full">
                    <thead>
                      <tr
                        className={`border-b ${
                          theme === "dark"
                            ? "border-white/10"
                            : "border-slate-200"
                        }`}
                      >
                        <th
                          className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.24em] ${mutedTextClass}`}
                        >
                          ID
                        </th>
                        <th
                          className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.24em] ${mutedTextClass}`}
                        >
                          Description
                        </th>
                        <th
                          className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.24em] ${mutedTextClass}`}
                        >
                          Date
                        </th>
                        <th
                          className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.24em] ${mutedTextClass}`}
                        >
                          Status
                        </th>
                        <th
                          className={`px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.24em] ${mutedTextClass}`}
                        >
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rewards.length > 0 ? (
                        paginatedRewards.map((reward) => (
                          <tr
                            key={reward.id}
                            className={`border-b ${
                              theme === "dark"
                                ? "border-slate-700 hover:bg-slate-700/50"
                                : "border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <td
                              className={`py-3 px-4 ${
                                theme === "dark"
                                  ? "text-slate-300"
                                  : "text-slate-700"
                              }`}
                            >
                              {reward.id}
                            </td>
                            <td
                              className={`py-3 px-4 ${
                                theme === "dark"
                                  ? "text-slate-300"
                                  : "text-slate-700"
                              }`}
                            >
                              {reward.description}
                            </td>
                            <td
                              className={`py-3 px-4 ${
                                theme === "dark"
                                  ? "text-slate-300"
                                  : "text-slate-700"
                              }`}
                            >
                              {reward.date
                                ? new Date(reward.date).toLocaleDateString()
                                : "--"}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${getRewardStatusClasses(reward.status)}`}
                              >
                                {reward.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-medium text-green-500">
                              {formatCurrency(reward.amount)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="py-8 text-center">
                            <p
                              className={`text-sm ${
                                theme === "dark"
                                  ? "text-slate-400"
                                  : "text-slate-500"
                              }`}
                            >
                              No rewards yet. Earn bonuses as friends sign up.
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {rewards.length > 0 && (
                  <PaginationControls
                    currentPage={rewardsPage}
                    totalPages={rewardsTotalPages}
                    totalItems={rewards.length}
                    pageSize={tablePageSize}
                    onPageChange={setRewardsPage}
                    onPageSizeChange={setTablePageSize}
                    pageSizeOptions={[10, 20, 50]}
                    itemLabel="rewards"
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Invite Friends Section */}
        <div className={`mt-12 rounded-[30px] border px-6 py-8 text-center ${heroPanelClass}`}>
          <h2 className="mb-4 text-2xl font-bold">Invite More Friends</h2>
          <p
            className={`mx-auto mb-6 max-w-2xl ${mutedTextClass}`}
          >
            Share your referral link and earn rewards for every friend who joins
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              className={`flex items-center rounded-2xl px-6 py-3 font-medium ${
                theme === "dark"
                  ? "bg-white/[0.06] text-white hover:bg-white/[0.1]"
                  : "bg-white text-slate-800 hover:bg-slate-50"
              }`}
            >
              <FontAwesomeIcon icon={faMessage} className="mr-2" />
              Send Message
            </button>
            <button
              className={`flex items-center rounded-2xl px-6 py-3 font-medium ${
                theme === "dark"
                  ? "bg-white/[0.06] text-white hover:bg-white/[0.1]"
                  : "bg-white text-slate-800 hover:bg-slate-50"
              }`}
            >
              <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
              Send Email
            </button>
            <button
              className={`flex items-center rounded-2xl px-6 py-3 font-medium ${
                theme === "dark"
                  ? "bg-white/[0.06] text-white hover:bg-white/[0.1]"
                  : "bg-white text-slate-800 hover:bg-slate-50"
              }`}
            >
              <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
              Invite Contacts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
