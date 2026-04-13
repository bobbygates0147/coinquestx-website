import { useMemo } from "react";
import { useTheme } from "next-themes";
import { TraderCard } from "../../components/traders/TraderCard";
import { useCopyTraders } from "../../context/CopyTraderContext";
import { toast } from "react-toastify";

export function MyCopyTradersPage() {
  const { theme } = useTheme();
  const { copiedTraders, removeCopiedTrader } = useCopyTraders();

  const liveSummary = useMemo(
    () => ({
      capital: copiedTraders.reduce(
        (sum, trader) =>
          sum + Number(trader.investmentAmount || trader.amount || 0),
        0
      ),
      profit: copiedTraders.reduce(
        (sum, trader) => sum + Number(trader.liveProfit || 0),
        0
      ),
      credited: copiedTraders.reduce(
        (sum, trader) => sum + Number(trader.settledProfit || 0),
        0
      ),
    }),
    [copiedTraders]
  );

  const handleRemove = async (id) => {
    const result = await removeCopiedTrader(id);
    if (!result?.success) {
      toast.error(result?.error || "Failed to settle copied trader.");
      return;
    }

    if (result.profitLoss > 0) {
      toast.success(
        `Trade settled. +$${result.profitLoss.toFixed(2)} profit credited to balance.`
      );
      return;
    }

    if (result.profitLoss < 0) {
      toast.info(
        `Trade settled. -$${Math.abs(result.profitLoss).toFixed(2)} loss applied.`
      );
      return;
    }

    toast.success("Trade settled. Principal returned to your balance.");
  };

  return (
    <section
      className={`min-h-screen px-4 py-10 sm:px-6 lg:px-8 ${
        theme === "dark" ? "bg-zinc-950" : "bg-gray-50"
      }`}
    >
      {copiedTraders.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div
            className={`rounded-2xl border p-5 ${
              theme === "dark"
                ? "border-slate-700 bg-slate-900 text-slate-100"
                : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Capital Deployed
            </p>
            <p className="mt-2 text-2xl font-bold">
              $
              {liveSummary.capital.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div
            className={`rounded-2xl border p-5 ${
              theme === "dark"
                ? "border-slate-700 bg-slate-900 text-slate-100"
                : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Profit Generated
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-500">
              $
              {liveSummary.profit.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div
            className={`rounded-2xl border p-5 ${
              theme === "dark"
                ? "border-slate-700 bg-slate-900 text-slate-100"
                : "border-slate-200 bg-white text-slate-900"
            }`}
          >
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Credited To Balance
            </p>
            <p className="mt-2 text-2xl font-bold text-cyan-400">
              $
              {liveSummary.credited.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      )}

      {copiedTraders.length === 0 ? (
        <p
          className={`rounded-3xl border p-10 text-lg transition-all duration-300 ${
            theme === "dark"
              ? "border-gray-800 bg-slate-900 text-gray-500 hover:border-teal-500 hover:shadow-teal-500/50"
              : "border-gray-200 bg-white text-gray-400 hover:border-teal-400 hover:shadow-teal-400/50"
          } hover:scale-105 hover:shadow-lg`}
        >
          No copy traders yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {copiedTraders.map((trader) => (
            <div key={trader.id} className="group relative">
              <TraderCard trader={trader} theme={theme} isCopied={true} />
              <button
                onClick={() => handleRemove(trader.id)}
                className={`absolute right-2 top-2 rounded-full p-2 opacity-0 transition-opacity group-hover:opacity-100 ${
                  theme === "dark"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-red-500 hover:bg-red-600"
                } text-white`}
                title="Remove trader"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
