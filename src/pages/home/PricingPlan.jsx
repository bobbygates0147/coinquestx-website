import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCrown,
  faRocket,
  faGem,
} from "@fortawesome/free-solid-svg-icons";

export default function PricingSection() {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-950 text-white py-16 px-4 sm:px-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center gap-2 bg-teal-400/10 px-4 py-1.5 rounded-full mb-6">
            <span className="text-teal-400 text-sm font-medium tracking-wider uppercase">
              Transparent Pricing
            </span>
          </div>

          <h2 className="text-white text-4xl sm:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-teal-300">
            Smart Investment Plans
          </h2>

          <p className="text-gray-400 text-lg md:text-xl">
            Optimized plans with competitive returns and dedicated support for
            your mining journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Starter Plan */}
          <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 shadow-xl hover:border-teal-500/50 transition-all duration-300 flex flex-col">
            <div className="mb-8 flex items-center">
              <div className="bg-indigo-500/10 p-3 rounded-xl mr-4">
                <FontAwesomeIcon
                  icon={faGem}
                  className="text-indigo-400 text-xl"
                />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-300">Starter</h3>
                <p className="text-gray-500 text-sm">Perfect for beginners</p>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-5xl font-bold text-white mb-2">$100</p>
              <p className="text-gray-500 text-sm">Starting price · 3 Layers</p>
            </div>

            <div className="space-y-4 mb-8 flex-grow">
              <PlanFeature
                title="Layer 1: Daily income"
                details="0.9% ROI · 60 Days"
              />
              <PlanFeature
                title="Layer 2: Weekly iconic"
                details="6.5% ROI · 8 Weeks"
              />
              <PlanFeature
                title="Layer 3: Monthly iconic"
                details="28.0% ROI · 2 Months"
              />
              <PlanFeature title="Capital Back" details="Yes" />
            </div>

            <button className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
              Get Started
            </button>
          </div>

          {/* Pro Plan - Featured */}
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 backdrop-blur-sm rounded-2xl p-8 border-2 border-teal-500/30 shadow-xl shadow-teal-500/10 relative overflow-hidden flex flex-col transform md:scale-[1.05]">
            {/* Popular badge */}
            <div className="absolute top-6 -right-8 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-bold px-8 py-1 transform rotate-45">
              POPULAR
            </div>

            <div className="mb-8 flex items-center">
              <div className="bg-teal-500/10 p-3 rounded-xl mr-4">
                <FontAwesomeIcon
                  icon={faRocket}
                  className="text-teal-400 text-xl"
                />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">
                  Professional
                </h3>
                <p className="text-teal-400 text-sm">
                  Best value for investors
                </p>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-5xl font-bold text-white mb-2">$5000</p>
              <p className="text-gray-500 text-sm">Starting price · 3 Layers</p>
            </div>

            <div className="space-y-4 mb-8 flex-grow">
              <PlanFeature
                title="Layer 1: Daily income"
                details="1.5% ROI · 60 Days"
                highlight
              />
              <PlanFeature
                title="Layer 2: Weekly income"
                details="10.5% ROI · 8 Weeks"
                highlight
              />
              <PlanFeature
                title="Layer 3: Monthly income"
                details="45.0% ROI · 2 Months"
                highlight
              />
              <PlanFeature title="Capital back" details="Yes" highlight />
            </div>

            <button className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 hover:from-teal-600 hover:to-emerald-600 hover:scale-[1.02] hover:shadow-lg hover:shadow-teal-500/30">
              Get Professional
            </button>
          </div>

          {/* Ultimate Plan */}
          <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 shadow-xl hover:border-indigo-500/50 transition-all duration-300 flex flex-col">
            <div className="mb-8 flex items-center">
              <div className="bg-purple-500/10 p-3 rounded-xl mr-4">
                <FontAwesomeIcon
                  icon={faCrown}
                  className="text-purple-400 text-xl"
                />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-300">
                  Ultimate
                </h3>
                <p className="text-gray-500 text-sm">For serious investors</p>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-5xl font-bold text-white mb-2">$50000</p>
              <p className="text-gray-500 text-sm">Starting price · 3 Layers</p>
            </div>

            <div className="space-y-4 mb-8 flex-grow">
              <PlanFeature
                title="Layer 1: Daily income"
                details="1.8% ROI · 65 Days"
              />
              <PlanFeature
                title="Layer 2: Weekly income"
                details="12.6% ROI · 8 Weeks"
              />
              <PlanFeature
                title="Layer 3: Monthly income"
                details="54.0% ROI · 2 Months"
              />
              <PlanFeature title="Capital Back" details="Yes" />
            </div>

            <button className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
              Go Ultimate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Feature component for better structure
function PlanFeature({ title, details, highlight = false }) {
  return (
    <div
      className={`flex items-start p-3 rounded-lg ${
        highlight ? "bg-gray-800/50" : ""
      }`}
    >
      <FontAwesomeIcon
        className={`text-white rounded-full p-1 h-4 mr-3 mt-1 ${
          highlight ? "bg-teal-500" : "bg-gray-700"
        }`}
        icon={faCheck}
      />
      <div>
        <p
          className={`font-medium ${
            highlight ? "text-white" : "text-gray-300"
          }`}
        >
          {title}
        </p>
        <p className="text-gray-400 text-sm">{details}</p>
      </div>
    </div>
  );
}
