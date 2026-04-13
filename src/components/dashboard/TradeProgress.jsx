import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import { formatCurrencyAmount } from "../../utils/currency";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const resolveResult = (tradeItem) => {
  if (!tradeItem) return null;

  const raw = tradeItem.result || tradeItem.status;
  if (!raw) return null;

  const normalized = `${raw}`.toLowerCase();
  if (normalized === "win" || normalized === "loss") {
    return normalized;
  }

  return null;
};

const normalizeInitialTimeRemaining = (value) => {
  const numericValue = Number(value) || 0;
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 0;
  }

  return numericValue > 1000 ? numericValue / 1000 : numericValue;
};

const getDurationInMs = (duration) => {
  if (!duration) return 5 * 60 * 1000;
  if (typeof duration === "number") return duration * 60 * 1000;

  const [value, unit] = `${duration}`.split(" ");
  const numericValue = Number.parseInt(value, 10);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 5 * 60 * 1000;
  }

  switch ((unit || "minutes").toLowerCase()) {
    case "minutes":
    case "minute":
      return numericValue * 60 * 1000;
    case "hours":
    case "hour":
      return numericValue * 60 * 60 * 1000;
    case "days":
    case "day":
      return numericValue * 24 * 60 * 60 * 1000;
    default:
      return 5 * 60 * 1000;
  }
};

const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins}m ${String(secs).padStart(2, "0")}s`;
};

const parseDate = (value) => {
  if (value?.toDate) return value.toDate();

  const parsed = new Date(value || Date.now());
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
};

const formatTradeValue = (value, currencyCode) => {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    `${value}`.toLowerCase() === "n/a"
  ) {
    return "N/A";
  }

  const normalizedText = `${value}`.trim();
  const numericCandidate = Number(
    normalizedText.replace(/[^0-9.-]+/g, "")
  );

  if (Number.isFinite(numericCandidate) && /[0-9]/.test(normalizedText)) {
    return formatCurrencyAmount(numericCandidate, currencyCode);
  }

  return normalizedText;
};

const formatDurationLabel = (duration) => {
  if (!duration) return "5 min";
  if (typeof duration === "number") return `${duration} min`;

  const [value, unit] = `${duration}`.split(" ");
  const normalizedUnit = (unit || "minutes").toLowerCase();

  switch (normalizedUnit) {
    case "minutes":
    case "minute":
      return `${value} min`;
    case "hours":
    case "hour":
      return `${value} hr`;
    case "days":
    case "day":
      return `${value} day`;
    default:
      return `${duration}`;
  }
};

const getLifecycleText = (progress, result, isSettling) => {
  if (progress < 20) return "Order is live and entering the market.";
  if (progress < 55) return "Position is open and tracking price movement.";
  if (progress < 100) return "Trade is active and nearing its close.";
  if (isSettling) return "Trade is closing and your balance is being updated.";
  if (result === "win") return "Trade closed in profit.";
  if (result === "loss") return "Trade closed at a loss.";
  return "Trade is closed and ready to clear.";
};

const getVisualState = (theme, progress, result, isSettling) => {
  if (progress < 100) {
    return {
      accent: "text-teal-400",
      ring:
        theme === "dark"
          ? "border-teal-400/20 bg-teal-400/10 text-teal-300"
          : "border-teal-500/20 bg-teal-50 text-teal-700",
      surface:
        theme === "dark"
          ? "border-teal-400/16 bg-teal-400/8"
          : "border-teal-500/14 bg-teal-50/80",
      bar: "from-cyan-500 via-teal-400 to-emerald-400",
      dot: "bg-teal-400 shadow-[0_0_0_4px_rgba(45,212,191,0.16)]",
      glow: "bg-teal-400/12",
      outcome: "Live",
    };
  }

  if (isSettling) {
    return {
      accent: "text-amber-400",
      ring:
        theme === "dark"
          ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
          : "border-amber-500/20 bg-amber-50 text-amber-700",
      surface:
        theme === "dark"
          ? "border-amber-400/16 bg-amber-400/8"
          : "border-amber-500/14 bg-amber-50/80",
      bar: "from-amber-500 via-orange-400 to-yellow-300",
      dot: "bg-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,0.16)]",
      glow: "bg-amber-400/12",
      outcome: "Settling",
    };
  }

  if (result === "win") {
    return {
      accent: "text-emerald-400",
      ring:
        theme === "dark"
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
          : "border-emerald-500/20 bg-emerald-50 text-emerald-700",
      surface:
        theme === "dark"
          ? "border-emerald-400/16 bg-emerald-400/8"
          : "border-emerald-500/14 bg-emerald-50/80",
      bar: "from-emerald-500 via-teal-400 to-cyan-500",
      dot: "bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.16)]",
      glow: "bg-emerald-400/12",
      outcome: "Win",
    };
  }

  if (result === "loss") {
    return {
      accent: "text-rose-400",
      ring:
        theme === "dark"
          ? "border-rose-400/20 bg-rose-400/10 text-rose-300"
          : "border-rose-500/20 bg-rose-50 text-rose-700",
      surface:
        theme === "dark"
          ? "border-rose-400/16 bg-rose-400/8"
          : "border-rose-500/14 bg-rose-50/80",
      bar: "from-rose-500 via-orange-400 to-amber-400",
      dot: "bg-rose-400 shadow-[0_0_0_4px_rgba(251,113,133,0.16)]",
      glow: "bg-rose-400/12",
      outcome: "Loss",
    };
  }

  return {
    accent: theme === "dark" ? "text-slate-200" : "text-slate-800",
    ring:
      theme === "dark"
        ? "border-white/10 bg-white/[0.05] text-slate-200"
        : "border-slate-200 bg-slate-50 text-slate-700",
    surface:
      theme === "dark"
        ? "border-white/8 bg-white/[0.04]"
        : "border-slate-200 bg-slate-50/90",
    bar: "from-slate-500 via-slate-400 to-slate-300",
    dot: theme === "dark" ? "bg-slate-300" : "bg-slate-500",
    glow: "bg-slate-400/10",
    outcome: "Closed",
  };
};

export default function TradeProgress({
  theme,
  trade,
  onComplete,
  isSettling = false,
  currencyCode = "USD",
}) {
  const [progress, setProgress] = useState(() =>
    clamp(Number(trade?.progress) || 0, 0, 100)
  );
  const [timeRemaining, setTimeRemaining] = useState(() =>
    normalizeInitialTimeRemaining(trade?.timeRemaining)
  );
  const [result, setResult] = useState(() => resolveResult(trade));
  const [isExiting, setIsExiting] = useState(false);
  const [hasRequestedSettlement, setHasRequestedSettlement] = useState(false);

  useEffect(() => {
    if (!trade) return undefined;

    const existingResult = resolveResult(trade);
    if (existingResult) {
      setResult(existingResult);
      setProgress(100);
      setTimeRemaining(0);
      return undefined;
    }

    setResult(null);

    const status = `${trade.status || ""}`.toLowerCase();
    if (status && status !== "active") {
      setProgress(100);
      setTimeRemaining(0);
      return undefined;
    }

    const startTime = trade.startTime?.toDate
      ? trade.startTime.toDate()
      : parseDate(trade.startTime || trade.date);
    const durationMs = getDurationInMs(trade.duration);

    const syncProgress = () => {
      const now = Date.now();
      const startMs = startTime.getTime();
      const elapsed = Math.max(0, now - startMs);
      const nextProgress = clamp((elapsed / durationMs) * 100, 0, 100);
      const nextTimeRemaining = Math.max(0, (durationMs - elapsed) / 1000);

      setProgress(nextProgress);
      setTimeRemaining(nextTimeRemaining);
    };

    syncProgress();
    const interval = setInterval(syncProgress, 1000);
    return () => clearInterval(interval);
  }, [trade]);

  useEffect(() => {
    setHasRequestedSettlement(false);
  }, [trade?.id]);

  useEffect(() => {
    if (!trade || progress < 100 || result || isSettling || hasRequestedSettlement) {
      return undefined;
    }

    let isMounted = true;
    setHasRequestedSettlement(true);

    Promise.resolve(onComplete("settle", false))
      .then((settledTrade) => {
        if (isMounted && !settledTrade) {
          setHasRequestedSettlement(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setHasRequestedSettlement(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [hasRequestedSettlement, isSettling, onComplete, progress, result, trade]);

  const handleClearTrade = () => {
    if (isSettling) return;
    setIsExiting(true);
    window.setTimeout(() => onComplete(result || "completed", true), 320);
  };

  const isBuy = `${trade?.type || "buy"}`.toLowerCase() !== "sell";
  const settlementPending = progress >= 100 && !result;
  const DirectionIcon = isBuy ? ArrowUpRight : ArrowDownRight;
  const visual = getVisualState(theme, progress, result, isSettling || settlementPending);
  const lifecycleText = useMemo(
    () => getLifecycleText(progress, result, isSettling || settlementPending),
    [isSettling, progress, result, settlementPending]
  );
  const completion = Math.round(progress);
  const assetLabel = trade?.asset || "Market Order";

  const shellClass = theme === "dark" ? "text-white" : "text-slate-900";
  const cardClass =
    theme === "dark"
      ? "border-white/8 bg-white/[0.03]"
      : "border-slate-200/90 bg-white/90";
  const mutedText = theme === "dark" ? "text-slate-400" : "text-slate-600";
  const subtleText = theme === "dark" ? "text-slate-500" : "text-slate-500";
  const neutralChip =
    theme === "dark"
      ? "border-white/10 bg-slate-900/80 text-slate-300"
      : "border-slate-200 bg-white text-slate-700";
  const directionChip = isBuy
    ? theme === "dark"
      ? "border-emerald-400/18 bg-emerald-400/10 text-emerald-300"
      : "border-emerald-500/18 bg-emerald-50 text-emerald-700"
    : theme === "dark"
    ? "border-rose-400/18 bg-rose-400/10 text-rose-300"
    : "border-rose-500/18 bg-rose-50 text-rose-700";
  const liveBadgeText =
    progress < 100
      ? `Ends in ${formatTime(timeRemaining)}`
      : isSettling || settlementPending
      ? "Settling outcome..."
      : `${visual.outcome} settled`;
  const primaryAmount = formatCurrencyAmount(trade?.amount || 0, currencyCode);
  const detailItems = [
    {
      label: "Exposure",
      value: primaryAmount,
    },
    {
      label: "Duration",
      value: formatDurationLabel(trade?.duration),
    },
    progress < 100
      ? {
          label: "Target",
          value: formatTradeValue(trade?.takeProfit, currencyCode),
        }
      : {
          label: "P/L",
          value: formatCurrencyAmount(Number(trade?.profitLoss) || 0, currencyCode),
          valueClass:
            result === "win"
              ? theme === "dark"
                ? "text-emerald-300"
                : "text-emerald-700"
              : result === "loss"
              ? theme === "dark"
                ? "text-rose-300"
                : "text-rose-700"
              : "",
        },
  ];

  if (!trade || isExiting) return null;

  return (
    <motion.article
      key={trade.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className={`relative flex h-full min-h-0 flex-col overflow-hidden ${shellClass}`}
    >
      <div
        className={`pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full blur-3xl ${visual.glow}`}
      />

      <div className="relative z-10 flex h-full min-h-0 flex-col justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${visual.ring}`}
          >
            <span className={`h-2 w-2 rounded-full ${visual.dot}`} />
            {progress < 100 ? "Live" : visual.outcome}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${directionChip}`}
          >
            <DirectionIcon className="h-3.5 w-3.5" strokeWidth={2.3} />
            {isBuy ? "Buy" : "Sell"}
          </span>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${neutralChip}`}
          >
            {trade?.tradeType || "Market"}
          </span>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_7rem] sm:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="min-w-0 max-w-full truncate text-[1.4rem] font-semibold leading-none tracking-tight sm:text-[1.55rem]">
                {assetLabel}
              </h3>
            </div>
            <p className={`mt-1.5 text-[1.55rem] font-semibold leading-none ${visual.accent}`}>
              {primaryAmount}
            </p>
            <p className={`mt-1.5 max-w-xl text-xs leading-5 sm:text-[13px] ${mutedText}`}>
              {lifecycleText}
            </p>
          </div>

          <div
            className={`rounded-[1.1rem] border px-3 py-2.5 sm:justify-self-end ${cardClass} ${visual.surface}`}
          >
            <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${subtleText}`}>
              Progress
            </p>
            <p className={`mt-1 text-[1.65rem] font-semibold leading-none ${visual.accent}`}>
              {completion}%
            </p>
            <p className={`mt-1 text-[11px] font-medium leading-5 ${mutedText}`}>
              {progress < 100 ? formatTime(timeRemaining) : visual.outcome}
            </p>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${subtleText}`}>
              Market cycle
            </p>
            <p className={`truncate text-[11px] font-medium ${mutedText}`}>
              {liveBadgeText}
            </p>
          </div>
          <div
            className={`relative h-2 overflow-hidden rounded-full ${
              theme === "dark" ? "bg-slate-800/90" : "bg-slate-200"
            }`}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`relative h-full rounded-full bg-gradient-to-r ${visual.bar}`}
            >
              {progress > 0 && progress < 100 ? (
                <motion.div
                  animate={{ opacity: [0.15, 0.9, 0.15] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className="absolute right-0 top-0 h-full w-8 bg-gradient-to-r from-transparent via-white/80 to-white/10"
                />
              ) : null}
            </motion.div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid flex-1 grid-cols-3 gap-1.5">
            {detailItems.map((item) => (
              <div
                key={item.label}
                className={`min-w-0 overflow-hidden rounded-[0.95rem] border px-2.5 py-1.5 ${cardClass}`}
              >
                <p
                  className={`truncate text-[10px] font-semibold uppercase tracking-[0.16em] ${subtleText}`}
                >
                  {item.label}
                </p>
                <p
                  className={`mt-1 truncate text-[13px] font-semibold leading-tight sm:text-sm ${
                    item.valueClass || ""
                  }`}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {progress >= 100 ? (
            <button
              type="button"
              onClick={handleClearTrade}
              disabled={isSettling || settlementPending}
              className={`inline-flex h-9 shrink-0 items-center justify-center rounded-2xl px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-white sm:min-w-[8.25rem] ${
                isSettling || settlementPending
                  ? "cursor-wait bg-gradient-to-r from-amber-500 to-orange-500"
                  : result === "win"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                  : result === "loss"
                  ? "bg-gradient-to-r from-rose-500 to-orange-500"
                  : "bg-gradient-to-r from-slate-500 to-slate-600"
              }`}
            >
              {isSettling || settlementPending ? "Settling..." : "Clear Trade"}
            </button>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}

TradeProgress.propTypes = {
  theme: PropTypes.string.isRequired,
  trade: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    progress: PropTypes.number,
    timeRemaining: PropTypes.number,
    result: PropTypes.string,
    status: PropTypes.string,
    startTime: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.shape({
        toDate: PropTypes.func,
      }),
    ]),
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    duration: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    asset: PropTypes.string,
    type: PropTypes.string,
    tradeType: PropTypes.string,
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    takeProfit: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    stopLoss: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    lotSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  onComplete: PropTypes.func.isRequired,
  isSettling: PropTypes.bool,
  currencyCode: PropTypes.string,
};
