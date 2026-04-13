import { useState, useEffect } from "react";
import { Range } from "react-range";

const ExchangeRateContainer = ({ type, currency, rate, currency2, rate2 }) => {
  return (
    <div className="bg-slate-800/70 backdrop-blur-lg p-6 rounded-xl border border-slate-700 hover:border-teal-500 transition-all duration-300 group">
      <h1 className="text-teal-400 text-lg font-semibold mb-3">{type}</h1>
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-slate-300 text-sm">{currency}</span>
          <span className="text-white font-medium">{rate}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-300 text-sm">{currency2}</span>
          <span className="text-white font-medium">{rate2}</span>
        </div>
      </div>
      <div className="mt-4 h-1 w-full bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 w-3/4 rounded-full"></div>
      </div>
    </div>
  );
};

const exchangeRates = [
  {
    type: "Exchange Rate",
    currency: "1 ETH",
    rate: "$1,865.36",
    currency2: "1 BTC",
    rate2: "$27,066.60",
  },
  {
    type: "Monthly Rate",
    currency: "BTC",
    rate: "$27,066.60",
    currency2: "HIGH",
    rate2: "$31,423.75",
  },
  {
    type: "Private Sales",
    currency: "1 BTC",
    rate: "$27,066.60",
    currency2: "Bonus",
    rate2: "65% (1.10)",
  },
  {
    type: "Public Sales",
    currency: "1 BTC",
    rate: "$27,066.60",
    currency2: "Bonus",
    rate2: "35% (1.05)",
  },
  {
    type: "Investors",
    currency: "Total",
    rate: "890,000.00",
    currency2: "Ave. Invest($)",
    rate2: "1,200",
  },
  {
    type: "Pivot Points",
    currency: "1 ETH",
    rate: "$3,900.00",
    currency2: "1 BTC",
    rate2: "$42,120.00",
  },
];

const CountdownTimer = () => {
  const [targetDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  });

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const difference = targetDate - now;

      if (difference <= 0) {
        clearInterval(timer);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div
          key={unit}
          className="bg-slate-800 rounded-xl p-3 text-center border border-slate-700"
        >
          <div className="text-2xl font-bold bg-gradient-to-br from-teal-400 to-emerald-500 text-transparent bg-clip-text">
            {String(value).padStart(2, "0")}
          </div>
          <div className="text-xs text-slate-400 mt-1 uppercase">{unit}</div>
        </div>
      ))}
    </div>
  );
};

const ProgressBar = ({ title, value, max, color }) => {
  const percentage = (value / max) * 100;

  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-300">{title}</span>
        <span className="font-medium">{percentage.toFixed(0)}%</span>
      </div>
      <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>0</span>
        <span>{value.toLocaleString()}</span>
        <span>{max.toLocaleString()}</span>
      </div>
    </div>
  );
};

const formatUsd = (value) =>
  `$${Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })}`;

export default function TokenSection() {
  const [values, setValues] = useState([0, 100]);
  const [tokenAmount, setTokenAmount] = useState(500);
  const [activeTab, setActiveTab] = useState("buy");
  const [saleProgress, setSaleProgress] = useState({
    softCap: 2500000,
    hardCap: 5000000,
    current: 3850000,
  });

  const minPrice = values[0] * 3000;
  const maxPrice = values[1] * 3000;
  const selectedRange = Math.max(0, maxPrice - minPrice);

  const handleTokenChange = (e) => {
    const value = Math.min(1000, Math.max(50, parseInt(e.target.value) || 50));
    setTokenAmount(value);
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 to-gray-950 py-16 px-4 sm:px-6 relative z-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block relative mb-5">
            <span className="text-teal-400 text-sm font-semibold tracking-wider uppercase bg-teal-400/10 px-4 py-1.5 rounded-full">
              Token Sales
            </span>
            <div className="absolute inset-0 bg-teal-400 rounded-full blur-lg opacity-20 -z-10 animate-pulse"></div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            <span className="bg-gradient-to-r from-teal-400 to-emerald-500 text-transparent bg-clip-text">
              Crypto Token
            </span>{" "}
            Pre-Sale Event
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Join our exclusive token pre-sale to get early access to the future
            of decentralized finance with special bonuses.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:items-stretch">
          <div className="lg:w-2/3 flex flex-col">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {exchangeRates.map((item, index) => (
                <ExchangeRateContainer
                  key={index}
                  type={item.type}
                  currency={item.currency}
                  rate={item.rate}
                  currency2={item.currency2}
                  rate2={item.rate2}
                />
              ))}
            </div>

            <div className="mt-8 bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700 flex-1">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-teal-400 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                Token Sale Progress
              </h3>

              <ProgressBar
                title="Current Funding"
                value={saleProgress.current}
                max={saleProgress.hardCap}
                color="bg-gradient-to-r from-teal-500 to-emerald-500"
              />

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="text-slate-400 text-sm">Soft Cap</div>
                  <div className="text-white font-bold text-xl">
                    ${(saleProgress.softCap / 1000000).toFixed(1)}M
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="text-slate-400 text-sm">Hard Cap</div>
                  <div className="text-white font-bold text-xl">
                    ${(saleProgress.hardCap / 1000000).toFixed(1)}M
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-1/3 flex">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700 shadow-xl w-full h-full">
              <div className="flex mb-6 bg-slate-700 rounded-lg p-1">
                <button
                  className={`flex-1 py-2 rounded-md text-center text-sm font-medium transition-colors ${
                    activeTab === "buy"
                      ? "bg-teal-900/50 text-teal-400"
                      : "text-slate-400 hover:text-white"
                  }`}
                  onClick={() => setActiveTab("buy")}
                >
                  Buy Tokens
                </button>
                <button
                  className={`flex-1 py-2 rounded-md text-center text-sm font-medium transition-colors ${
                    activeTab === "contribute"
                      ? "bg-teal-900/50 text-teal-400"
                      : "text-slate-400 hover:text-white"
                  }`}
                  onClick={() => setActiveTab("contribute")}
                >
                  Contribute
                </button>
              </div>

              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-teal-400 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
                Token Sale Starts In
              </h3>

              <CountdownTimer />

              <div className="mb-6">
                <div className="flex items-center justify-between gap-2 text-xs mb-3">
                  <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-slate-300">
                    Min: {formatUsd(minPrice)}
                  </span>
                  <span className="rounded-full border border-teal-500/40 bg-teal-500/10 px-3 py-1 text-teal-300 font-semibold">
                    Range: {formatUsd(selectedRange)}
                  </span>
                  <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-slate-300">
                    Max: {formatUsd(maxPrice)}
                  </span>
                </div>

                <Range
                  step={1}
                  min={0}
                  max={100}
                  values={values}
                  onChange={(newValues) => setValues(newValues)}
                  renderTrack={({ props, children }) => (
                    <div
                      onMouseDown={props.onMouseDown}
                      onTouchStart={props.onTouchStart}
                      className="w-full py-4"
                      style={props.style}
                    >
                      <div
                        ref={props.ref}
                        className="relative h-3 w-full rounded-full border border-slate-700 bg-slate-900/80 shadow-inner"
                      >
                        {[0, 50, 100].map((mark) => (
                          <span
                            key={mark}
                            className="absolute top-1/2 h-4 w-px -translate-y-1/2 bg-slate-600/80"
                            style={{ left: `${mark}%` }}
                          />
                        ))}
                        <div
                          className="absolute inset-y-0 rounded-full bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-500 shadow-[0_0_14px_rgba(20,184,166,0.45)]"
                          style={{
                            left: `${values[0]}%`,
                            width: `${values[1] - values[0]}%`,
                          }}
                        />
                        {children}
                      </div>
                    </div>
                  )}
                  renderThumb={({ props, isDragged, index }) => (
                    <div
                      {...props}
                      className={`relative h-6 w-6 rounded-full border-2 transition-all duration-200 ${
                        isDragged
                          ? "bg-teal-400 border-teal-200 shadow-lg shadow-teal-500/40 scale-110"
                          : "bg-white border-slate-300 shadow-md"
                      } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    >
                      <div
                        className={`absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                          isDragged
                            ? "bg-teal-500 text-white border-teal-300"
                            : "bg-slate-900 text-teal-300 border-slate-600"
                        }`}
                      >
                        {formatUsd(index === 0 ? minPrice : maxPrice)}
                      </div>
                      <span
                        className={`absolute inset-1 rounded-full ${
                          isDragged ? "bg-white" : "bg-teal-200"
                        }`}
                      />
                    </div>
                  )}
                />

                <div className="mt-1 flex justify-between text-[11px] text-slate-500 px-1">
                  <span>$0</span>
                  <span>$150,000</span>
                  <span>$300,000</span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-slate-400 text-sm mb-2">
                  Token Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={tokenAmount}
                    onChange={handleTokenChange}
                    min="50"
                    max="1000"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                    TOKENS
                  </div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-slate-500">
                  <span>Min: 50</span>
                  <span>Max: 1000</span>
                </div>
              </div>

              <div className="mb-6 bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-400">Token Price:</span>
                  <span className="text-white">$0.25</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-400">Bonus:</span>
                  <span className="text-teal-400">+15% (75 tokens)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total:</span>
                  <span className="text-white font-bold">
                    ${(tokenAmount * 0.25).toFixed(2)}
                  </span>
                </div>
              </div>

              <button className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30">
                Purchase Tokens
              </button>

              <div className="mt-4 text-center text-xs text-slate-500">
                By purchasing tokens, you agree to our Terms of Service
              </div>
            </div>

           
          </div>
        </div>
      </div>
    </div>
  );
}
