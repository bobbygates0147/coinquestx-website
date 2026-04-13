"use client";

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Eye, EyeOff, Plus, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import { useUser } from "../../context/UserContext";
import { useTransactions } from "../../context/TransactionContext";
import { formatCurrencyAmount } from "../../utils/currency";

export default function BalanceCard({
  theme = "light",
  borderColor = "border-gray-200",
  currency = "USD",
  isKycVerified = false,
  refreshTrigger,
}) {
  const { userData, refreshUser } = useUser();
  const { refreshTransactions } = useTransactions();
  const hasFunds = (userData?.balance || 0) > 0;
  const [showBalance, setShowBalance] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const refreshInProgress = useRef(false);

  const refreshUserBalance = async (isManualRefresh = false) => {
    if (refreshInProgress.current) {
      return;
    }

    refreshInProgress.current = true;
    setIsRefreshing(true);

    try {
      await refreshUser();
      await refreshTransactions();

      if (isManualRefresh) {
        toast.success("Balance updated successfully!");
      }
    } catch (error) {
      console.error("Balance refresh failed:", error);
      if (isManualRefresh) {
        toast.error("Failed to refresh data");
      }
    } finally {
      setIsRefreshing(false);
      refreshInProgress.current = false;
    }
  };

  useEffect(() => {
    if (refreshTrigger) {
      refreshUserBalance(true);
    }
  }, [refreshTrigger]);

  const toggleBalanceVisibility = () => setShowBalance((prev) => !prev);

  const formatBalance = () => {
    if (!showBalance) return "******";

    return formatCurrencyAmount(userData?.balance || 0, currency, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const gradientColors =
    theme === "dark"
      ? "from-slate-800 to-slate-900"
      : "from-slate-400 via-slate-100 to-slate-300";

  const textColor = theme === "dark" ? "text-white" : "text-slate-800";
  const secondaryTextColor =
    theme === "dark" ? "text-slate-300" : "text-slate-600";

  const handleViewTransactions = () => navigate("/transactions");
  const handleAddFunds = () => {
    if (!isKycVerified) {
      toast.error("Complete KYC verification to add funds");
      navigate("/kyc-verification");
      return;
    }
    navigate("/deposits");
  };

  return (
    <div
      className={`bg-gradient-to-r ${gradientColors} mb-6 rounded-[1.75rem] border p-5 shadow-lg transition-[transform,box-shadow,border-color] duration-300 sm:p-6 xl:p-7 ${borderColor} ${
        isHovered
          ? "border-teal-500/60 shadow-[0_18px_45px_rgba(20,184,166,0.22)] scale-[1.01]"
          : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="mb-5 flex items-center justify-between">
        <h4 className={`text-sm font-medium lg:text-base ${secondaryTextColor}`}>
          Available Balance
        </h4>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshUserBalance(true)}
            disabled={isRefreshing}
            className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors ${
              theme === "dark"
                ? "border-slate-700 bg-slate-900/70 text-slate-300 hover:border-teal-400/25 hover:bg-slate-800"
                : "border-white/70 bg-white/80 text-slate-600 hover:border-teal-400/25 hover:bg-white"
            } ${isRefreshing ? "cursor-not-allowed opacity-50" : ""}`}
            aria-label="Refresh balance"
            title="Refresh data"
          >
            <RefreshCw
              className={`h-[18px] w-[18px] ${isRefreshing ? "animate-spin" : ""}`}
              strokeWidth={2.25}
            />
          </button>
          <button
            onClick={toggleBalanceVisibility}
            className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${
              theme === "dark"
                ? "border-slate-700 bg-slate-900/70 hover:border-teal-400/25 hover:bg-slate-800"
                : "border-white/70 bg-white/80 hover:border-teal-400/25 hover:bg-white"
            }`}
            aria-label={showBalance ? "Hide balance" : "Show balance"}
          >
            {showBalance ? (
              <EyeOff
                className={`h-[18px] w-[18px] ${secondaryTextColor}`}
                strokeWidth={2.25}
              />
            ) : (
              <Eye
                className={`h-[18px] w-[18px] ${secondaryTextColor}`}
                strokeWidth={2.25}
              />
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div className="min-w-0 flex-1">
          <h1
            className={`max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(2.2rem,4.8vw,3.45rem)] font-bold leading-[0.94] tracking-[-0.04em] tabular-nums ${textColor}`}
          >
            {formatBalance()}
          </h1>

          {!hasFunds && (
            <p className="mt-3 max-w-md break-words text-sm font-medium text-red-500">
              You currently have no funds available.
            </p>
          )}
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:flex sm:items-center sm:justify-start sm:gap-4 2xl:w-auto 2xl:flex-shrink-0 2xl:justify-end">
          <button
            onClick={handleViewTransactions}
            className="group flex min-h-[46px] min-w-full items-center justify-center gap-2 whitespace-nowrap sm:min-w-0 sm:w-auto sm:shrink-0 sm:justify-start"
          >
            <span
              className={`text-sm font-medium transition-colors lg:text-base ${secondaryTextColor} group-hover:text-teal-400`}
            >
              View Transactions
            </span>
            <ChevronRight
              className={`${secondaryTextColor} h-4 w-4 shrink-0 transition-all group-hover:translate-x-0.5 group-hover:text-teal-400`}
              strokeWidth={2.25}
            />
          </button>

          <button
            onClick={handleAddFunds}
            disabled={!isKycVerified}
            title={
              !isKycVerified
                ? "Complete KYC verification to add funds"
                : undefined
            }
            className={`flex min-h-[46px] min-w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium text-white transition-[background-color,box-shadow] duration-300 sm:min-w-[160px] sm:w-auto sm:shrink-0 lg:px-6 lg:text-base ${
              isKycVerified
                ? "cursor-pointer bg-teal-500 shadow-md hover:bg-teal-600 hover:shadow-teal-500/30"
                : "cursor-not-allowed bg-gray-400"
            }`}
          >
            <Plus className="h-4 w-4 shrink-0" strokeWidth={2.6} />
            Add Funds
          </button>
        </div>
      </div>
    </div>
  );
}

BalanceCard.propTypes = {
  theme: PropTypes.oneOf(["light", "dark"]),
  borderColor: PropTypes.string,
  currency: PropTypes.string,
  isKycVerified: PropTypes.bool,
  refreshTrigger: PropTypes.any,
};
