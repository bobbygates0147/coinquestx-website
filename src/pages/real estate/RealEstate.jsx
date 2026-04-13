import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import ProjectDetail from "../../components/real estate/RealEstatedetails";
import { useTheme } from "next-themes";
import { useUser } from "../../context/UserContext";
import { useTransactions } from "../../context/TransactionContext";
import { API_BASE_URL } from "../../config/api";
import {
  realEstateProjects as realest,
  realEstateProjectMap as projectDetails,
} from "../../data/realEstateProjects";
import {
  getRealEstateMetrics,
  normalizeStatus,
} from "../../utils/investmentMetrics";
import {
  FaChartLine,
  FaBuilding,
  FaCoins,
  FaHistory,
  FaRocket,
} from "react-icons/fa";

export default function RealestPage() {
  const { theme, systemTheme } = useTheme();
  const { userData, isAuthenticated, getAuthToken, refreshUser } = useUser();
  const { refreshTransactions } = useTransactions();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isInvestOpen, setIsInvestOpen] = useState(false);
  const [selectedReal, setSelectedReal] = useState(null);
  const [investmentRecords, setInvestmentRecords] = useState([]);
  const [isSyncingInvestments, setIsSyncingInvestments] = useState(false);
  const [investmentError, setInvestmentError] = useState("");
  const [investmentSuccess, setInvestmentSuccess] = useState("");
  const [prefersDark, setPrefersDark] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());
  const settlingRecordIdsRef = useRef(new Set());

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

  const effectiveTheme = theme === "system" ? systemTheme : theme;
  const isDarkMode = useMemo(() => {
    if (effectiveTheme === "dark") return true;
    if (effectiveTheme === "light") return false;
    return prefersDark;
  }, [effectiveTheme, prefersDark]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    setPrefersDark(media.matches);
    const handler = (event) => setPrefersDark(event.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNowTick(Date.now()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  const mapBackendRecordToInvestment = useCallback((row) => {
    const normalizedStatus = normalizeStatus(row?.status || "Active");
    return {
      id: String(row?._id || row?.id || `real-${Date.now()}`),
      backendId: String(row?._id || row?.id || ""),
      projectId: Number(row?.projectId || 0),
      propertyName: row?.propertyName || "",
      location: row?.location || "",
      amount: Number(row?.amount || 0),
      duration: Number(row?.durationDays || 30),
      startDate: row?.startDate || row?.createdAt || new Date().toISOString(),
      endDate:
        row?.endDate ||
        new Date(
          Date.now() + Number(row?.durationDays || 30) * 24 * 60 * 60 * 1000
        ).toISOString(),
      status:
        normalizedStatus === "completed"
          ? "completed"
          : normalizedStatus === "cancelled"
          ? "cancelled"
          : "active",
      roi: Number(row?.roi || 0),
      reference: row?.reference || "",
      payoutUsd: Number(row?.payoutUsd || 0),
      expectedPayoutUsd: Number(row?.expectedPayoutUsd || 0),
    };
  }, []);

  const hydrateInvestmentRecord = useCallback(
    (record, now = Date.now()) => ({
      ...record,
      ...getRealEstateMetrics(record, now),
    }),
    []
  );

  const syncInvestmentsFromBackend = useCallback(async () => {
    const token = getCleanToken();
    if (!token) {
      setInvestmentRecords([]);
      return;
    }

    setIsSyncingInvestments(true);
    try {
      const response = await fetch(`${API_BASE_URL}/RealEstate`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const { json: result } = await parseJsonSafely(response);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Failed to sync real estate investments.");
      }

      const rows = Array.isArray(result?.data) ? result.data : [];
      const mapped = rows.map(mapBackendRecordToInvestment);
      setInvestmentRecords(mapped);
    } catch (error) {
      console.error("Real estate sync failed:", error);
      setInvestmentError("Unable to sync real estate records from backend.");
    } finally {
      setIsSyncingInvestments(false);
    }
  }, [getCleanToken, mapBackendRecordToInvestment]);

  useEffect(() => {
    if (!isAuthenticated) {
      setInvestmentRecords([]);
      return;
    }
    syncInvestmentsFromBackend();
  }, [isAuthenticated, syncInvestmentsFromBackend, userData?.userId, userData?.uid]);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const handleFocusSync = () => syncInvestmentsFromBackend();
    window.addEventListener("focus", handleFocusSync);
    return () => window.removeEventListener("focus", handleFocusSync);
  }, [isAuthenticated, syncInvestmentsFromBackend]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "realEstateInvestments",
      JSON.stringify(investmentRecords)
    );
  }, [investmentRecords]);

  useEffect(() => {
    if (!investmentSuccess) return;
    const timer = setTimeout(() => setInvestmentSuccess(""), 5000);
    return () => clearTimeout(timer);
  }, [investmentSuccess]);

  const settleInvestment = useCallback(
    async (record) => {
      if (!record?.id || settlingRecordIdsRef.current.has(record.id)) {
        return;
      }

      settlingRecordIdsRef.current.add(record.id);
      const payoutUsd = Number(record.expectedPayoutUsd || 0);
      try {
        const token = getCleanToken();
        if (!token || !record.backendId) {
          throw new Error("Session unavailable during real estate payout sync.");
        }

        const response = await fetch(`${API_BASE_URL}/RealEstate/${record.backendId}/Complete`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
        const { json: result } = await parseJsonSafely(response);
        if (!response.ok || !result?.success) {
          throw new Error(
            result?.message || "Failed to finalize real estate payout in backend."
          );
        }

        setInvestmentRecords((prev) =>
          prev.map((item) =>
            item.id === record.id ? { ...item, status: "completed" } : item
          )
        );

        setInvestmentSuccess(
          `Real estate payout credited: $${payoutUsd.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}.`
        );
        await Promise.all([
          refreshUser?.(),
          refreshTransactions?.(2, 500),
        ]);
      } catch (error) {
        console.error("Real estate settlement failed:", error);
        setInvestmentError(
          error?.message || "Unable to complete the real estate payout right now."
        );
      } finally {
        settlingRecordIdsRef.current.delete(record.id);
      }
    },
    [getCleanToken, refreshTransactions, refreshUser]
  );

  const enrichedInvestmentRecords = useMemo(
    () =>
      investmentRecords.map((record) => hydrateInvestmentRecord(record, nowTick)),
    [hydrateInvestmentRecord, investmentRecords, nowTick]
  );

  useEffect(() => {
    const matured = enrichedInvestmentRecords.filter(
      (record) => record.status === "active" && record.isMatured
    );
    matured.forEach((record) => {
      settleInvestment(record);
    });
  }, [enrichedInvestmentRecords, settleInvestment]);

  const handleViewClick = (real) => {
    setSelectedReal(real);
    setIsDetailOpen(true);
  };

  const handleInvestClick = (real) => {
    setSelectedReal(real);
    setInvestmentError("");
    setIsInvestOpen(true);
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
  };

  const closeInvest = () => {
    setIsInvestOpen(false);
    setInvestmentError("");
  };

  const handleInvestmentSubmit = async ({ projectId, amount, duration }) => {
    const real = realest.find((r) => r.id === projectId);
    if (!real) {
      const message = "Unable to locate the selected property.";
      setInvestmentError(message);
      return { success: false, error: message };
    }

    if (!isAuthenticated) {
      const message = "Please sign in before investing.";
      setInvestmentError(message);
      return { success: false, error: message };
    }

    const token = getCleanToken();
    if (!token) {
      const message = "Session expired. Please sign in again.";
      setInvestmentError(message);
      return { success: false, error: message };
    }

    const detail = projectDetails[projectId];
    const minimumValue = detail?.minimum
      ? parseFloat(detail.minimum.replace(/[^0-9.]/g, "")) || 0
      : parseFloat(real.amount.replace(/[^0-9.]/g, "")) || 0;
    if (!amount || amount < minimumValue) {
      const message = `Insufficient investment amount. Minimum investment is ${
        detail?.minimum || real.amount
      }.`;
      setInvestmentError(message);
      return { success: false, error: message };
    }

    const currentBalance = Number(userData?.balance ?? 0);
    if (amount > currentBalance) {
      const message =
        "Insufficient balance. Please fund your account before investing.";
      setInvestmentError(message);
      return { success: false, error: message };
    }

    const timestamp = Date.now();
    const durationDays = duration || 30;
    const startDate = new Date().toISOString();
    const endDate = new Date(
      timestamp + durationDays * 24 * 60 * 60 * 1000
    ).toISOString();
    const roiPct = parseFloat(`${real.Roi || 0}`.replace(/[^0-9.]/g, "")) || 0;
    const expectedPayoutUsd = amount + (amount * roiPct) / 100;

    try {
      const payload = {
        projectId,
        reference: `REAL-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        propertyName: real.name,
        location: real.location || real.type,
        amount,
        roi: roiPct,
        durationDays,
        startDate,
        endDate,
        expectedPayoutUsd,
        status: "Active",
      };

      const response = await fetch(`${API_BASE_URL}/RealEstate/Create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const { json: result } = await parseJsonSafely(response);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Failed to save investment to backend.");
      }

      const record = mapBackendRecordToInvestment(result.data);
      setInvestmentRecords((prev) => [
        ...prev.filter((rec) => rec.projectId !== projectId),
        record,
      ]);

      setInvestmentError("");
      setInvestmentSuccess(
        `Investment submitted: $${amount.toLocaleString()} toward ${real.name}. Live accrual has started.`
      );
      await Promise.all([
        refreshUser?.(),
        refreshTransactions?.(2, 500),
      ]);

      setIsInvestOpen(false);
      return { success: true };
    } catch (error) {
      console.error("Real estate investment failed:", error);
      const message = error?.message || "Investment failed. Please try again.";
      setInvestmentError(message);
      return { success: false, error: message };
    }
  };

  const recordMap = useMemo(() => {
    const map = new Map();
    enrichedInvestmentRecords.forEach((record) => {
      map.set(record.projectId, record);
    });
    return map;
  }, [enrichedInvestmentRecords]);

  const invested = realest.filter(
    (real) => recordMap.get(real.id)?.status === "completed"
  );
  const investing = realest.filter(
    (real) => recordMap.get(real.id)?.status === "active"
  );
  const available = realest.filter((real) => !recordMap.has(real.id));

  const currentInvestment = selectedReal && recordMap.get(selectedReal.id);

  return (
    <div
      className={`min-h-screen px-4 pb-10 pt-16 sm:px-6 sm:pt-20 lg:px-8 ${
        isDarkMode ? "bg-zinc-950" : "bg-gray-50"
      }`}
    >
      <div className="w-full">
        {(investmentError || investmentSuccess) && (
          <div className="w-full mb-8 space-y-2">
            {investmentError && (
              <div className="rounded-2xl bg-red-900/20 border border-red-500/50 text-red-300 px-4 py-3 text-sm">
                {investmentError}
              </div>
            )}
            {investmentSuccess && (
              <div className="rounded-2xl bg-green-900/20 border border-green-500/60 text-green-300 px-4 py-3 text-sm">
                {investmentSuccess}
              </div>
            )}
          </div>
        )}
        {isSyncingInvestments && (
          <div className="w-full mb-6 text-xs text-cyan-400">
            Syncing investment records from backend...
          </div>
        )}

        {/* Portfolio Sections */}
        {invested.length > 0 && (
          <div className="mb-12">
            <h2
              className={`text-2xl font-bold mb-6 flex items-center gap-2 ${
                isDarkMode ? "text-green-400" : "text-green-600"
              }`}
            >
              <FaHistory className="text-xl" />
              My Investment Portfolio
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {invested.map((real) => (
                <PropertyCard
                  key={real.id}
                  real={real}
                  isDarkMode={isDarkMode}
                  status="invested"
                  onViewClick={() => handleViewClick(real)}
                  investmentRecord={recordMap.get(real.id)}
                />
              ))}
            </div>
          </div>
        )}

        {investing.length > 0 && (
          <div className="mb-12">
            <h2
              className={`text-2xl font-bold mb-6 flex items-center gap-2 ${
                isDarkMode ? "text-cyan-400" : "text-indigo-700"
              }`}
            >
              <FaRocket className="text-xl" />
              Active Investments
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {investing.map((real) => (
                <PropertyCard
                  key={real.id}
                  real={real}
                  isDarkMode={isDarkMode}
                  status="investing"
                  onViewClick={() => handleViewClick(real)}
                  investmentRecord={recordMap.get(real.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Available Properties */}
        <div className="mb-12">
          <h2
            className={`text-2xl font-bold mb-6 flex items-center gap-2 ${
              isDarkMode ? "text-teal-400" : "text-teal-600"
            }`}
          >
            <FaBuilding className="text-xl" />
            Available Properties
          </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {available.map((real) => (
                <PropertyCard
                  key={real.id}
                  real={real}
                  isDarkMode={isDarkMode}
                  status="available"
                  onViewClick={() => handleViewClick(real)}
                  onInvestClick={() => handleInvestClick(real)}
                  investmentRecord={recordMap.get(real.id)}
                />
            ))}
          </div>
        </div>
      </div>

      {/* Project Detail Modal */}
      {isDetailOpen && (
        <ProjectDetail
          project={selectedReal}
          onClose={closeDetail}
          theme={theme}
          investmentRecord={currentInvestment}
          handleInvestClick={handleInvestmentSubmit}
          availableBalance={Number(userData?.balance ?? 0)}
        />
      )}

      {/* Investment Modal */}
      {isInvestOpen && (
        <InvestmentModal
          project={selectedReal}
          onClose={closeInvest}
          theme={theme}
          handleInvest={handleInvestmentSubmit}
          isInvesting={currentInvestment?.status === "active"}
          isInvested={currentInvestment?.status === "completed"}
          availableBalance={Number(userData?.balance ?? 0)}
        />
      )}
    </div>
  );
}

function PropertyCard({
  real,
  isDarkMode,
  status,
  onViewClick,
  onInvestClick,
  investmentRecord,
}) {
  return (
    <div
      className={`rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 ${
        isDarkMode
          ? "bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700"
          : "bg-gradient-to-br from-white to-gray-50 border border-gray-200"
      } ${
        status === "invested"
          ? "ring-2 ring-green-500"
          : status === "investing"
          ? "ring-2 ring-cyan-500 animate-pulse"
          : ""
      }`}
    >
      {/* Status Ribbon */}
      {status !== "available" && (
        <div
          className={`absolute top-4 right-0 z-10 px-4 py-1 rounded-l-lg ${
            status === "invested"
              ? "bg-gradient-to-r from-green-600 to-emerald-700"
              : "bg-gradient-to-r from-cyan-600 to-blue-700"
          }`}
        >
          <span className="text-white text-sm font-medium">
            {status === "invested" ? "Completed" : "Active"}
          </span>
        </div>
      )}

      {/* Property Image */}
      <div className="h-48 overflow-hidden">
        <img
          className="w-full h-full object-cover"
          src={real.image}
          alt={real.name}
        />
      </div>

      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h2
            className={`text-xl font-bold ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {real.name}
          </h2>
          <div
            className={`text-xs px-2 py-1 rounded-full ${
              isDarkMode
                ? "bg-slate-700 text-cyan-300"
                : "bg-indigo-100 text-indigo-700"
            }`}
          >
            {real.type}
          </div>
        </div>

        <p
          className={`mb-4 ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}
        >
          {real.profitRate}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div
            className={`p-3 rounded-xl ${
              isDarkMode ? "bg-slate-800" : "bg-indigo-50"
            }`}
          >
            <div className={isDarkMode ? "text-slate-400" : "text-gray-600"}>
              Min. Investment
            </div>
            <div
              className={`font-bold ${
                isDarkMode ? "text-teal-300" : "text-teal-600"
              }`}
            >
              {real.amount}
            </div>
          </div>

          <div
            className={`p-3 rounded-xl ${
              isDarkMode ? "bg-slate-800" : "bg-indigo-50"
            }`}
          >
            <div className={isDarkMode ? "text-slate-400" : "text-gray-600"}>
              Projected ROI
            </div>
            <div
              className={`font-bold ${
                isDarkMode ? "text-green-400" : "text-green-600"
              }`}
            >
              {real.Roi}
            </div>
          </div>
        </div>

        {investmentRecord && (
          <div
            className={`mb-5 rounded-2xl border p-4 ${
              isDarkMode
                ? "border-slate-700 bg-slate-800/70"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className={isDarkMode ? "text-slate-400" : "text-gray-600"}>
                  Live Profit
                </div>
                <div className="font-semibold text-emerald-500">
                  ${Number(investmentRecord.accruedProfit || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div className="text-right">
                <div className={isDarkMode ? "text-slate-400" : "text-gray-600"}>
                  Payout Target
                </div>
                <div
                  className={`font-semibold ${
                    isDarkMode ? "text-cyan-300" : "text-cyan-700"
                  }`}
                >
                  ${Number(investmentRecord.expectedPayoutUsd || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>

            <div className="mt-3">
              <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-slate-400">
                <span>Progress</span>
                <span>{Math.round(Number(investmentRecord.progress || 0) * 100)}%</span>
              </div>
              <div
                className={`h-2 overflow-hidden rounded-full ${
                  isDarkMode ? "bg-slate-700" : "bg-slate-200"
                }`}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-400"
                  style={{
                    width: `${Math.max(
                      4,
                      Math.round(Number(investmentRecord.progress || 0) * 100)
                    )}%`,
                  }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span>{investmentRecord.duration} days locked</span>
                <span>{investmentRecord.daysLeft} days left</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={onViewClick}
            className={`py-3 rounded-xl transition-all ${
              isDarkMode
                ? "bg-slate-700 hover:bg-slate-600 text-cyan-400"
                : "bg-gray-200 hover:bg-gray-300 text-indigo-700"
            }`}
          >
            View Details
          </button>

          {status === "available" && onInvestClick && (
            <button
              onClick={onInvestClick}
              className={`py-3 rounded-xl transition-all ${
                isDarkMode
                  ? "bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white"
              }`}
            >
              Invest Now
            </button>
          )}
        </div>

        {investmentRecord && (
          <div className="mt-3 text-xs text-slate-400">
            Locked ${investmentRecord.amount.toLocaleString()} ·{" "}
            {investmentRecord.duration} days
          </div>
        )}
      </div>
    </div>
  );
}

// InvestmentModal component
const InvestmentModal = ({
  project,
  onClose,
  theme,
  handleInvest,
  isInvesting,
  isInvested,
  availableBalance = 0,
}) => {
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [investmentDuration, setInvestmentDuration] = useState(30);
  const [showSuccess, setShowSuccess] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const details = projectDetails[project.id];
  const minimumValue = details?.minimum
    ? parseFloat(details.minimum.replace(/[^0-9.]/g, "")) || 0
    : parseFloat(details?.value) || 0;
  const amountValue = Number(investmentAmount || 0);
  const hasAmount = investmentAmount !== "" && Number.isFinite(amountValue);
  const balanceValue = Number(availableBalance ?? 0);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(Number(value) || 0);

  const balanceWarning = (() => {
    if (!Number.isFinite(balanceValue)) return "";
    if (hasAmount) {
      if (amountValue <= 0) return "";
      if (minimumValue && amountValue < minimumValue) {
        return `Minimum investment is ${formatCurrency(minimumValue)}.`;
      }
      if (amountValue > balanceValue) {
        return `Insufficient funds. Available balance is ${formatCurrency(
          balanceValue
        )}.`;
      }
      return "";
    }
    if (minimumValue && balanceValue < minimumValue) {
      return `Insufficient funds. Available balance is ${formatCurrency(
        balanceValue
      )}. Minimum required is ${formatCurrency(minimumValue)}.`;
    }
    return "";
  })();

  const feedbackMessage =
    showSuccess || isInvesting || isInvested
      ? ""
      : modalMessage || balanceWarning;

  const handleSubmit = async () => {
    if (!investmentAmount || Number.isNaN(amountValue) || amountValue <= 0) {
      setShowSuccess(false);
      setModalMessage("Enter a valid investment amount.");
      return;
    }

    if (amountValue < minimumValue) {
      setShowSuccess(false);
      setModalMessage(`Minimum investment is ${formatCurrency(minimumValue)}.`);
      return;
    }

    if (amountValue > balanceValue) {
      setShowSuccess(false);
      setModalMessage(
        `Insufficient funds. Available balance is ${formatCurrency(
          balanceValue
        )}.`
      );
      return;
    }

    setModalMessage("");
    const result = await handleInvest({
      projectId: project?.id,
      amount: amountValue,
      duration: investmentDuration || 30,
    });

    if (result?.success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      setShowSuccess(false);
      setModalMessage(
        result?.error || "Unable to submit this investment right now."
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div
        className={`rounded-2xl w-full max-w-md shadow-2xl ${
          isDarkMode
            ? "bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700"
            : "bg-gradient-to-br from-white to-gray-50 border border-gray-200"
        }`}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2
              className={`text-2xl font-bold ${
                isDarkMode ? "text-cyan-400" : "text-indigo-700"
              }`}
            >
              Invest in {project.name}
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-full hover:bg-gray-200/30 ${
                isDarkMode ? "text-gray-300" : "text-gray-500"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Status Indicator */}
          {(isInvesting || isInvested) && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isInvesting ? "bg-blue-500 animate-pulse" : "bg-green-500"
                  }`}
                ></div>
                <span
                  className={`text-sm font-medium ${
                    isInvesting ? "text-blue-500" : "text-green-500"
                  }`}
                >
                  {isInvesting
                    ? "Investment active"
                    : "Successfully invested"}
                </span>
              </div>
              <div
                className={`h-2 rounded-full overflow-hidden ${
                  isDarkMode ? "bg-slate-700" : "bg-gray-200"
                }`}
              >
                <div
                  className={`h-full ${
                    isInvesting
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse"
                      : "bg-gradient-to-r from-green-500 to-emerald-500"
                  }`}
                  style={{ width: isInvesting ? "70%" : "100%" }}
                />
              </div>
            </div>
          )}

          {/* ROI Highlight */}
          <div
            className={`p-5 rounded-xl mb-6 bg-gradient-to-r ${
              isDarkMode
                ? "from-cyan-900/50 to-blue-900/50"
                : "from-blue-100 to-indigo-100"
            }`}
          >
            <div className="flex justify-between">
              <div>
                <p className={isDarkMode ? "text-slate-400" : "text-gray-600"}>
                  Minimum Investment
                </p>
                <p
                  className={`text-2xl font-bold ${
                    isDarkMode ? "text-teal-300" : "text-teal-600"
                  }`}
                >
                  {details.minimum}
                </p>
              </div>
              <div className="text-right">
                <p className={isDarkMode ? "text-slate-400" : "text-gray-600"}>
                  Projected ROI
                </p>
                <p
                  className={`text-2xl font-bold ${
                    isDarkMode ? "text-green-400" : "text-green-600"
                  }`}
                >
                  {details.roi}
                </p>
              </div>
            </div>
          </div>

          {/* Investment Form */}
          <div className="space-y-4">
            <div>
              <label
                className={`block mb-2 ${
                  isDarkMode ? "text-slate-400" : "text-gray-600"
                }`}
              >
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="text"
                  value={investmentAmount}
                  onChange={(e) =>
                    setInvestmentAmount(e.target.value.replace(/[^0-9.]/g, ""))
                  }
                  className={`w-full pl-10 pr-4 py-3 rounded-xl ${
                    isDarkMode
                      ? "bg-slate-700 text-white"
                      : "bg-white text-gray-800"
                  }`}
                  placeholder="Enter amount"
                  disabled={isInvesting || isInvested}
                />
              </div>
              <p
                className={`text-xs mt-1 ${
                  isDarkMode ? "text-slate-500" : "text-gray-500"
                }`}
              >
                Minimum investment: {details.minimum}
              </p>
            </div>

            <div>
              <label
                className={`block mb-2 ${
                  isDarkMode ? "text-slate-400" : "text-gray-600"
                }`}
              >
                Duration
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[30, 60, 90, 180, 365].map((days) => (
                  <button
                    key={days}
                    onClick={() => setInvestmentDuration(days)}
                    className={`py-3 rounded-xl ${
                      investmentDuration === days
                        ? isDarkMode
                          ? "bg-gradient-to-r from-cyan-600 to-blue-700 text-white"
                          : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                        : isDarkMode
                        ? "bg-slate-700 hover:bg-slate-600 text-gray-300"
                        : "bg-white hover:bg-gray-100 text-gray-800"
                    }`}
                    disabled={isInvesting || isInvested}
                  >
                    {days} Days
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Invest Button */}
          <button
            onClick={handleSubmit}
            disabled={isInvesting || isInvested}
            className={`w-full py-4 mt-6 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
              isInvesting || isInvested
                ? isDarkMode
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-gray-400 text-gray-600 cursor-not-allowed"
                : isDarkMode
                ? "bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:from-cyan-500 hover:to-blue-600"
                : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-400 hover:to-indigo-500"
            }`}
          >
            {isInvesting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Investment Active</span>
              </>
            ) : isInvested ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Already Invested</span>
              </>
            ) : (
              "Invest Now"
            )}
          </button>

          {feedbackMessage && (
            <p className="text-sm text-rose-400 mt-3">{feedbackMessage}</p>
          )}

          {/* Success Message */}
          {showSuccess && (
            <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Your investment has been submitted successfully!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
