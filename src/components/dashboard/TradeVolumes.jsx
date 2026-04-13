import PropTypes from "prop-types";
import { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  Area,
  ResponsiveContainer,
} from "recharts";
import { formatCurrencyAmount } from "../../utils/currency";

const lineChartData = [
  { value: 10 },
  { value: 0 },
  { value: 100 },
  { value: 30 },
  { value: 88 },
  { value: 15 },
  { value: 115 },
  { value: 40 },
  { value: 65 },
];

const formatCurrency = (value, currencyCode) =>
  formatCurrencyAmount(value || 0, currencyCode, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const formatPercentage = (value) =>
  `${value ? value.toFixed(1) : "0.0"}%`;

const computeChangeLabel = (value) => {
  const baseline = Math.max(1, (value || 0) * 0.85);
  const diff = value - baseline;
  const percent = ((diff / baseline) * 100).toFixed(1);
  return `${diff >= 0 ? "+" : ""}${percent}%`;
};

export default function TradeVolumes({
  theme = "dark",
  secondaryText = "text-gray-400",
  tradeVolumes = [],
  copiedTradeVolumes = [],
  totalTrades = 0,
  totalCopiedTrades = 0,
  performanceMetrics = {},
  currencyCode = "USD",
}) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [combinedVolumes, setCombinedVolumes] = useState([]);
  const [loopPhase, setLoopPhase] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    // Combine last 5 regular trades with last 5 copied trades
    const regular = tradeVolumes.slice(-5);
    const copied = copiedTradeVolumes.slice(-5);
    setCombinedVolumes([...regular, ...copied].slice(-10));
  }, [tradeVolumes, copiedTradeVolumes]);

  useEffect(() => {
    const loop = setInterval(() => {
      setLoopPhase((prev) => prev + 1);
    }, 2200);
    return () => clearInterval(loop);
  }, []);

  const chartSeries = useMemo(() => {
    if (combinedVolumes.length > 0) return combinedVolumes;
    return lineChartData.map((item) => item.value);
  }, [combinedVolumes]);

  const animatedLineData = useMemo(
    () => {
      const baselineSeries = lineChartData.map((item) => item.value);
      return baselineSeries.map((value, index) => {
        const baseline = Number(value) || 0;
        const swing = 0.95 + 0.08 * Math.sin(loopPhase * 0.85 + index * 0.7);
        return {
          value: Math.max(2, baseline * swing),
        };
      });
    },
    [loopPhase]
  );

  const maxVolume = Math.max(...chartSeries, 1);
  const combinedTotalTrades = totalTrades + totalCopiedTrades;
  const totalWon = combinedVolumes.reduce((a, b) => a + b, 0) * 0.75;
  const footerStats = [
    {
      title: "Avg. Trade Size",
      value: formatCurrency(performanceMetrics.avgTradeSize, currencyCode),
      change: computeChangeLabel(performanceMetrics.avgTradeSize),
      positive: true,
    },
    {
      title: "Win Rate",
      value: formatPercentage(performanceMetrics.winRate),
      change: computeChangeLabel(performanceMetrics.winRate),
      positive: true,
    },
    {
      title: "Profit Factor",
      value: `${performanceMetrics.profitFactor?.toFixed(2) || "0.00"}x`,
      change: computeChangeLabel(performanceMetrics.profitFactor),
      positive: true,
    },
    {
      title: "Max Drawdown",
      value: formatPercentage(performanceMetrics.maxDrawdown),
      change: computeChangeLabel(performanceMetrics.maxDrawdown),
      positive: false,
    },
  ];

  return (
    <div className="font-sans min-w-0">
      <div className="mx-auto w-full max-w-4xl min-w-0 pb-5">
        <div className="mt-5 flex min-w-0 flex-wrap gap-5">
          {/* Volume Bar Card */}
          <div
            className={`relative rounded-2xl p-5 flex-1 flex gap-6 lg:gap-8 items-center transition-all duration-500 
              border ${
                theme === "dark"
                  ? "bg-gray-900 border-gray-700"
                  : "bg-gray-50 border-gray-200"
              } 
              hover:shadow-[0_10px_40px_-15px_rgba(0,199,255,0.5)] hover:border-teal-400 hover:scale-[1.01] h-[140px] overflow-hidden min-w-[280px] min-w-0`}
          >
            <div className="absolute inset-0 opacity-20">
              <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] animate-spin-slow">
                <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-teal-500 rounded-full filter blur-[80px]"></div>
                <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-indigo-500 rounded-full filter blur-[80px]"></div>
              </div>
            </div>

            <div className="relative z-10 flex min-w-0 flex-col">
              <span className="text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-500">
                {combinedTotalTrades}
              </span>
              <span
                className={`text-sm lg:text-base font-medium ${secondaryText}`}
              >
                Total Trades
              </span>
            </div>

            <div className="relative z-10 flex min-w-0 mt-2 gap-2 flex-1 h-[84px] items-end overflow-hidden">
              {chartSeries.map((amount, i) => {
                const baseBarHeight = (amount / maxVolume) * 74;
                const wave = 0.88 + 0.18 * Math.sin(loopPhase * 0.95 + i * 0.75);
                const barHeight = Math.max(8, Math.min(78, baseBarHeight * wave));
                return (
                  <div
                    key={i}
                    className="flex flex-col gap-1 relative justify-end flex-1 group"
                    onMouseEnter={() => setHoverIndex(i)}
                    onMouseLeave={() => setHoverIndex(null)}
                  >
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ease-out ${
                        hoverIndex === i
                          ? "bg-gradient-to-t from-teal-400 to-cyan-500 shadow-[0_0_15px_0px_rgba(0,199,255,0.7)]"
                          : "bg-gradient-to-t from-teal-500/70 to-cyan-400/70"
                      } dash-bar-loop`}
                      style={{
                        height: isMounted ? `${barHeight}px` : "0px",
                        transitionDelay: `${i * 50}ms`,
                        animationDelay: `${i * 120}ms`,
                      }}
                    ></div>

                    {hoverIndex === i && (
                      <div
                        className={`absolute -top-10 left-1/2 transform -translate-x-1/2 px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg ${
                          theme === "dark"
                            ? "bg-gray-800 text-gray-100 border border-gray-700"
                            : "bg-white text-gray-800 border border-gray-200"
                        }`}
                      >
                        <div
                          className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-[6px] w-3 h-3 rotate-45 ${
                            theme === "dark" ? "bg-gray-800" : "bg-white"
                          } border-b border-r ${
                            theme === "dark"
                              ? "border-gray-700"
                              : "border-gray-200"
                          }`}
                        ></div>
                        {formatCurrency(amount, currencyCode)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Line Chart Card */}
          <div
            className={`relative rounded-2xl p-5 flex flex-col transition-all duration-500 flex-1
              border ${
                theme === "dark"
                  ? "bg-gray-900 border-gray-700"
                  : "bg-gray-50 border-gray-200"
              }
              hover:shadow-[0_10px_40px_-15px_rgba(0,199,255,0.5)] hover:border-teal-400 hover:scale-[1.01] h-[140px] overflow-hidden min-w-[280px] min-w-0`}
          >
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <p className={`text-sm font-medium ${secondaryText}`}>
                  Total Won
                </p>
                <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
                  {formatCurrency(Math.floor(totalWon), currencyCode)}
                </p>
              </div>
              <div
                className={`text-xs px-2 py-1 rounded-md ${
                  theme === "dark"
                    ? "bg-indigo-900/50 text-indigo-300"
                    : "bg-indigo-100 text-indigo-700"
                }`}
              >
                {combinedVolumes.length > 0
                  ? `+${Math.floor(
                      (combinedVolumes.length / 10) * 100
                    )}% this week`
                  : "+0% this week"}
              </div>
            </div>

            <div className="relative z-10 min-w-0 w-full h-[80px] mt-2 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%" debounce={120}>
                <LineChart data={animatedLineData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00c8ff" stopOpacity={0.8} />
                      <stop
                        offset="95%"
                        stopColor="#00c8ff"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="none"
                    fill="url(#colorValue)"
                    fillOpacity={0.3}
                    isAnimationActive
                    animationDuration={1500}
                    animationEasing="ease-in-out"
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#00c8ff"
                    strokeWidth={2}
                    dot={{
                      stroke: "#00c8ff",
                      strokeWidth: 2,
                      r: 3,
                      fill: theme === "dark" ? "#0f172a" : "#f8fafc",
                    }}
                    isAnimationActive
                    animationDuration={1500}
                    animationEasing="ease-in-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Stats Footer */}
        <div className="mt-5 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
          {footerStats.map((stat, index) => (
            <div
              key={index}
              className={`group relative min-w-0 overflow-hidden rounded-[1.35rem] border p-4 transition-all duration-300 sm:p-5 ${
                theme === "dark"
                  ? "border-gray-700 bg-gray-900"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div
                className={`pointer-events-none absolute -right-8 top-[-18px] h-20 w-20 rounded-full blur-2xl ${
                  stat.positive ? "bg-teal-500/15" : "bg-rose-500/15"
                }`}
              />
              <div className="relative flex h-full min-w-0 flex-col justify-between gap-4">
                <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                  <p
                    className={`min-w-0 flex-1 break-words text-[11px] font-semibold uppercase leading-5 tracking-[0.18em] ${secondaryText}`}
                  >
                    {stat.title}
                  </p>
                  <span
                    className={`inline-flex max-w-full shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      stat.change.startsWith("+")
                        ? theme === "dark"
                          ? "bg-green-900/40 text-green-300"
                          : "bg-green-100 text-green-700"
                        : theme === "dark"
                        ? "bg-rose-900/40 text-rose-300"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>

                <div className="min-w-0 space-y-3">
                  <p className="min-w-0 break-words text-[clamp(1.45rem,2.6vw,2rem)] font-bold leading-[1.05]">
                    {stat.value}
                  </p>
                  <div
                    className={`h-1.5 overflow-hidden rounded-full ${
                      theme === "dark" ? "bg-white/10" : "bg-slate-200"
                    }`}
                  >
                    <div
                      className={`h-full rounded-full ${
                        stat.positive
                          ? "bg-gradient-to-r from-teal-400 to-cyan-400"
                          : "bg-gradient-to-r from-rose-400 to-orange-400"
                      }`}
                      style={{
                        width: `${Math.max(
                          18,
                          Math.min(100, Math.abs(Number.parseFloat(stat.change)) * 2.4)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

TradeVolumes.propTypes = {
  theme: PropTypes.string,
  secondaryText: PropTypes.string,
  tradeVolumes: PropTypes.arrayOf(PropTypes.number),
  copiedTradeVolumes: PropTypes.arrayOf(PropTypes.number),
  totalTrades: PropTypes.number,
  totalCopiedTrades: PropTypes.number,
  performanceMetrics: PropTypes.shape({
    avgTradeSize: PropTypes.number,
    winRate: PropTypes.number,
    profitFactor: PropTypes.number,
    maxDrawdown: PropTypes.number,
  }),
  currencyCode: PropTypes.string,
};
