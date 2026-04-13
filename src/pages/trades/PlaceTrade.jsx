import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import ChartSection from "../../components/PlaceTrade/ChartSection";
import MarketData from "../../components/PlaceTrade/MarketData";
import TradeForm from "../../components/PlaceTrade/TradeForm";
import RecentTrades from "../../components/PlaceTrade/RecentTrades";
import TradeSuccessModal from "../../components/PlaceTrade/TradeSuccessModal";
import { API_BASE_URL } from "../../config/api";

const TRADE_ASSETS = {
  "VIP Trades": ["BTC/USD", "ETH/USD", "SOL/USD", "EUR/USD"],
  Crypto: ["BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD", "DOGE/USD"],
  Forex: ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD"],
};

const TRADE_TYPE_OPTIONS = Object.keys(TRADE_ASSETS);
const DURATION_OPTIONS = [
  "5 Minutes",
  "10 Minutes",
  "15 Minutes",
  "30 Minutes",
  "1 Hour",
];

const getDurationInMs = (durationValue) => {
  if (!durationValue) return 5 * 60 * 1000;

  const [value, unit] = durationValue.split(" ");
  const numericValue = Number.parseInt(value, 10);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return 5 * 60 * 1000;

  switch ((unit || "minutes").toLowerCase()) {
    case "minute":
    case "minutes":
      return numericValue * 60 * 1000;
    case "hour":
    case "hours":
      return numericValue * 60 * 60 * 1000;
    case "day":
    case "days":
      return numericValue * 24 * 60 * 60 * 1000;
    default:
      return 5 * 60 * 1000;
  }
};

const formatCurrency = (value) => {
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (!cleaned) return "";
  const [integerPart, decimalPart] = cleaned.split(".");
  const formattedInteger = integerPart
    .replace(/^0+(?=\d)/, "")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (decimalPart !== undefined) {
    return `${formattedInteger || "0"}.${decimalPart.slice(0, 2)}`;
  }
  return formattedInteger || "0";
};

const normalizeTrade = (trade, fallbackDuration, fallbackUserId) => {
  if (!trade) return null;

  const createdAt = trade.createdAt || trade.date || trade.startedAt;
  const parsedStart = Number(trade.startTime);
  const startTime = Number.isFinite(parsedStart) && parsedStart > 0
    ? parsedStart
    : createdAt
      ? new Date(createdAt).getTime()
      : Date.now();
  const duration = trade.duration || fallbackDuration || "5 Minutes";
  const durationMs = Number(trade.durationMs) || getDurationInMs(duration);
  const direction = (trade.direction || trade.type || "buy").toLowerCase();

  const rawStatus = trade.status || "Active";
  const result = trade.result || "Pending";
  const status =
    rawStatus === "Completed" && result !== "Pending" ? result : rawStatus;

  return {
    id: trade.id || trade._id || `${startTime}`,
    type: direction,
    tradeType: trade.tradeType || "",
    asset: trade.asset || "",
    amount: Number(trade.amount) || 0,
    lotSize: trade.lotSize || "N/A",
    takeProfit: trade.takeProfit || "N/A",
    stopLoss: trade.stopLoss || "N/A",
    duration,
    status,
    date: createdAt || new Date().toISOString(),
    startTime,
    durationMs,
    profitLoss: Number(trade.profitLoss) || 0,
    userId: trade.user || fallbackUserId || "self",
  };
};

export default function PlaceTradePage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { userData, isAuthenticated, getAuthToken, refreshUser } = useUser();

  const [tradeType, setTradeType] = useState(TRADE_TYPE_OPTIONS[0]);
  const [assets, setAssets] = useState(TRADE_ASSETS[TRADE_TYPE_OPTIONS[0]] || []);
  const [selectedAsset, setSelectedAsset] = useState(
    (TRADE_ASSETS[TRADE_TYPE_OPTIONS[0]] || [])[0] || ""
  );
  const [activeTab, setActiveTab] = useState("buy");
  const [amount, setAmount] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [duration, setDuration] = useState(DURATION_OPTIONS[0]);
  const [lotSize, setLotSize] = useState(2);
  const [error, setError] = useState("");
  const [recentTrades, setRecentTrades] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());
  const [successModal, setSuccessModal] = useState({
    isOpen: false,
    trade: null,
  });

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

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTrades = useCallback(async () => {
    if (!isAuthenticated) {
      setRecentTrades([]);
      return;
    }

    const token = getCleanToken();
    if (!token) {
      setRecentTrades([]);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/PlaceTrade`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const { json: result } = await parseJsonSafely(response);
      if (response.ok && result?.success) {
        const normalized = (result.data || [])
          .map((trade) =>
            normalizeTrade(
              trade,
              duration,
              userData?.userId || userData?.uid || "self"
            )
          )
          .filter(Boolean)
          .slice(0, 12);

        setRecentTrades(normalized);
      } else {
        setRecentTrades([]);
      }
    } catch (fetchError) {
      console.error("Failed to fetch trades:", fetchError);
      setRecentTrades([]);
    }
  }, [isAuthenticated, getCleanToken, duration, userData?.userId, userData?.uid]);

  useEffect(() => {
    fetchTrades();
    const intervalId = setInterval(fetchTrades, 20000);
    return () => clearInterval(intervalId);
  }, [fetchTrades]);

  const handleTradeTypeChange = (event) => {
    const selectedTradeType = event.target.value;
    setTradeType(selectedTradeType);

    const nextAssets = TRADE_ASSETS[selectedTradeType] || [];
    setAssets(nextAssets);
    setSelectedAsset((prev) => (nextAssets.includes(prev) ? prev : nextAssets[0] || ""));
  };

  const handleAssetChange = (event) => {
    setSelectedAsset(event.target.value);
  };

  const handlePlaceOrder = async () => {
    setError("");

    if (!isAuthenticated) {
      setError("You must be signed in to place trades.");
      return;
    }

    if (!tradeType) {
      setError("Please select a trade type.");
      return;
    }

    if (!selectedAsset) {
      setError("Please select an asset.");
      return;
    }

    if (!amount) {
      setError("Please enter an amount.");
      return;
    }

    const numericAmount = Number.parseFloat(amount.replace(/,/g, ""));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid amount greater than zero.");
      return;
    }

    const userBalance = Number(userData?.balance) || 0;
    if (userBalance < numericAmount) {
      setError("Insufficient funds. Please deposit to your account.");
      return;
    }

    const token = getCleanToken();
    if (!token) {
      setError("Session expired. Please log in again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        tradeType,
        asset: selectedAsset,
        amount: numericAmount,
        direction: activeTab,
        lotSize,
        takeProfit,
        stopLoss,
        duration,
        startTime: Date.now(),
        durationMs: getDurationInMs(duration),
      };

      const response = await fetch(`${API_BASE_URL}/PlaceTrade/Create`, {
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
        throw new Error(result?.message || "Failed to place trade");
      }

      const createdTrade = normalizeTrade(
        result.data,
        duration,
        userData?.userId || userData?.uid || "self"
      ) || {
        ...payload,
        id: Date.now(),
        type: activeTab,
        status: "Active",
        date: new Date().toISOString(),
      };

      await Promise.all([refreshUser?.(), fetchTrades()]);

      setSuccessModal({
        isOpen: true,
        trade: createdTrade,
      });

      setAmount("");
      setTakeProfit("");
      setStopLoss("");
      setLotSize(2);
      setDuration(DURATION_OPTIONS[0]);
    } catch (placeTradeError) {
      console.error("Place trade error:", placeTradeError);
      setError(
        placeTradeError?.message ||
          "Failed to place trade. Please try again later."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateProgress = (trade) => {
    if (!trade || trade.status !== "Active") return 100;
    const elapsed = Math.max(0, nowTick - Number(trade.startTime || nowTick));
    return Math.min(100, (elapsed / Math.max(1, trade.durationMs || 1)) * 100);
  };

  const formatTimeRemaining = (trade) => {
    if (!trade || trade.status !== "Active") return "Completed";

    const remaining = Number(trade.startTime || nowTick) +
      Number(trade.durationMs || 0) -
      nowTick;

    if (remaining <= 0) return "Closing...";

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  };

  return (
    <>
      <section className="min-h-screen px-4 py-6 sm:px-6 sm:py-10 lg:px-8 bg-gray-50 dark:bg-zinc-950">
        <div className="w-full space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-stretch">
            <div className="min-w-0">
              <ChartSection
                theme={theme}
                selectedAsset={selectedAsset}
                className="h-full"
              />
            </div>

            <div className="min-w-0 xl:h-full">
              <TradeForm
                theme={theme}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                tradeType={tradeType}
                tradeTypeOptions={TRADE_TYPE_OPTIONS}
                handleTradeTypeChange={handleTradeTypeChange}
                assets={assets}
                selectedAsset={selectedAsset}
                handleAssetChange={handleAssetChange}
                amount={amount}
                setAmount={setAmount}
                userData={userData}
                lotSize={lotSize}
                setLotSize={setLotSize}
                takeProfit={takeProfit}
                setTakeProfit={setTakeProfit}
                stopLoss={stopLoss}
                setStopLoss={setStopLoss}
                duration={duration}
                durationOptions={DURATION_OPTIONS}
                setDuration={setDuration}
                error={error}
                handlePlaceOrder={handlePlaceOrder}
                formatCurrency={formatCurrency}
                isSubmitting={isSubmitting}
                className="h-full"
              />
            </div>
          </div>

          <MarketData theme={theme} />

          <RecentTrades
            theme={theme}
            recentTrades={recentTrades}
            calculateProgress={calculateProgress}
            formatTimeRemaining={formatTimeRemaining}
          />
        </div>
      </section>

      <TradeSuccessModal
        isOpen={successModal.isOpen}
        trade={successModal.trade}
        onClose={() => setSuccessModal({ isOpen: false, trade: null })}
        onViewTrades={() => {
          setSuccessModal({ isOpen: false, trade: null });
          navigate("/TradesRoi");
        }}
      />
    </>
  );
}
