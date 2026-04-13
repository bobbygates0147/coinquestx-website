import imageChartLine from "../../pictures/depositicon.png";
import imageCoins from "../../pictures/tradeicon.png";
import imageWallet from "../../pictures/depositicon.png";
import CountUp from "react-countup";
import { motion } from "framer-motion";
import { formatCurrencyAmount } from "../../utils/currency";

export default function StatsGrid({
  theme,
  borderColor,
  secondaryText,
  performanceMetrics = {},
  liveTrades = 0,
  copiedTrades = 0,
  placeTradeSummary = {},
  currencyCode = "USD",
}) {
  const stats = [
    {
      label: "Avg. Trade Size",
      value: performanceMetrics.avgTradeSize,
      icon: imageChartLine,
      color: "teal",
      format: (value) =>
        formatCurrencyAmount(value || 0, currencyCode, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }),
    },
    {
      label: "Win Rate",
      value: performanceMetrics.winRate,
      icon: imageCoins,
      color: "green",
      format: (value) => `${value ? value.toFixed(1) : "0.0"}%`,
    },
    {
      label: "Profit Factor",
      value: performanceMetrics.profitFactor,
      icon: imageWallet,
      color: "teal",
      format: (value) => `${value ? value.toFixed(2) : "0.00"}x`,
    },
    {
      label: "Max Drawdown",
      value: performanceMetrics.maxDrawdown,
      icon: imageCoins,
      color: "rose",
      format: (value) => `${value ? value.toFixed(1) : "0.0"}%`,
    },
  ];

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        {stats.map((stat, index) => {
          const value = stat.value || 0;
          const isPositive = value >= 0;
          const colorClass =
            stat.color === "rose"
              ? "text-rose-400 dark:text-rose-300"
              : "text-teal-400 dark:text-teal-300";
          const borderHover =
            stat.color === "rose"
              ? "hover:border-rose-400"
              : "hover:border-teal-400";
          const shadowHover =
            stat.color === "rose"
              ? "hover:shadow-rose-400/50"
              : "hover:shadow-teal-400/50";

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
              className={`
                bg-gradient-to-r ${
                  theme === "dark"
                    ? "from-slate-800 to-slate-900"
                    : "from-slate-100 to-slate-200"
                }
                rounded-lg p-5 shadow-xl
                transition-all duration-300 border ${borderColor} ${borderHover} ${shadowHover} hover:scale-105
              `}
            >
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  className={`p-3 rounded-full ${
                    theme === "dark" ? "bg-slate-900" : "bg-white"
                  }`}
                >
                  <img
                    src={stat.icon}
                    alt={stat.label}
                    className="h-10 w-10 object-contain"
                  />
                </motion.div>
                <div>
                  <h3 className={`text-2xl font-bold ${colorClass}`}>
                    {stat.format ? stat.format(value) : value.toFixed(2)}
                  </h3>
                  <p
                    className={`text-xs lg:text-sm ${secondaryText} uppercase tracking-wider`}
                  >
                    {stat.label}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
        <div
          className={`mt-4 text-xs flex flex-wrap gap-4 ${
            theme === "dark" ? "text-slate-400" : "text-gray-500"
          }`}
        >
          <span className="px-3 py-1 rounded-full border border-dashed border-current">
            {liveTrades} live trades today
          </span>
          <span className="px-3 py-1 rounded-full border border-dashed border-current">
            {copiedTrades} copy traders connected
          </span>
          {placeTradeSummary?.totalTrades > 0 && (
            <span className="px-3 py-1 rounded-full border border-dashed border-current">
              {placeTradeSummary.totalTrades} place trades tracked
            </span>
          )}
          {placeTradeSummary?.avgTradeSize > 0 && (
            <span className="px-3 py-1 rounded-full border border-dashed border-current">
              Avg{" "}
              {formatCurrencyAmount(placeTradeSummary.avgTradeSize, currencyCode, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </span>
          )}
        </div>
      </div>
  );
}
