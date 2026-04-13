import {
  faFileAlt,
  faXmark,
  faChartLine,
  faBuilding,
  faCalendar,
  faDollarSign,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState, useEffect } from "react";
import { realEstateProjectMap } from "../../data/realEstateProjects";

const ProjectDetail = ({
  project,
  onClose,
  theme,
  investmentRecord,
  handleInvestClick,
  availableBalance = 0,
}) => {
  const [view, setView] = useState("property");
  const [isInvesting, setIsInvesting] = useState(false);
  const [isInvested, setIsInvested] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [investmentDuration, setInvestmentDuration] = useState(30);
  const [showSuccess, setShowSuccess] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    setIsInvesting(investmentRecord?.status === "pending");
    setIsInvested(investmentRecord?.status === "completed");
  }, [investmentRecord]);

  const parseCurrency = (value) => {
    if (!value) return 0;
    const parsed = Number(`${value}`.replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(Number(value) || 0);

  const handleDetailInvest = async () => {
    const amountValue = parseCurrency(investmentAmount);
    const minimumValue = parseCurrency(project?.amount);
    const balanceValue = Number(availableBalance ?? 0);

    if (!investmentAmount || Number.isNaN(amountValue) || amountValue <= 0) {
      setShowSuccess(false);
      setModalMessage("Enter a valid investment amount.");
      return;
    }

    if (amountValue < minimumValue) {
      setShowSuccess(false);
      setModalMessage(
        `Minimum investment is ${formatCurrency(minimumValue)}.`
      );
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

    if (!investmentDuration) {
      setShowSuccess(false);
      setModalMessage("Select an investment duration.");
      return;
    }

    setModalMessage("");
    const result = await handleInvestClick({
      projectId: project.id,
      amount: amountValue,
      duration: investmentDuration,
    });

    if (result?.success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setInvestmentAmount("");
      setInvestmentDuration(30);
    } else {
      setShowSuccess(false);
      setModalMessage(
        result?.error || "Unable to submit this investment right now."
      );
    }
  };

  const details = realEstateProjectMap[project.id] || project;
  const minimumValue =
    parseCurrency(details?.minimum) || parseCurrency(details?.value);
  const amountValue = parseCurrency(investmentAmount);
  const hasAmount = investmentAmount !== "" && Number.isFinite(amountValue);
  const balanceValue = Number(availableBalance ?? 0);

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

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div
        className={`rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto shadow-2xl ${
          isDarkMode
            ? "bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700"
            : "bg-gradient-to-br from-white to-gray-50 border border-gray-200"
        }`}
      >
        {/* Header with status indicator */}
        <div
          className={`p-6 border-b ${
            isDarkMode ? "border-slate-700" : "border-gray-200"
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h2
                className={`text-2xl md:text-3xl font-bold ${
                  isDarkMode ? "text-cyan-400" : "text-indigo-700"
                }`}
              >
                {project.name}
              </h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <span
                  className={`px-2 py-1 rounded-full text-sm ${
                    isDarkMode
                      ? "bg-slate-700 text-cyan-300"
                      : "bg-indigo-100 text-indigo-700"
                  }`}
                >
                  {details.type}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-sm ${
                    isDarkMode
                      ? "bg-slate-700 text-green-400"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  ROI: {details.roi}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-sm ${
                    isDarkMode
                      ? "bg-slate-700 text-teal-400"
                      : "bg-teal-100 text-teal-700"
                  }`}
                >
                  Min: {details.minimum}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-2 rounded-full hover:bg-gray-200/30 ${
                isDarkMode ? "text-gray-300" : "text-gray-500"
              }`}
            >
              <FontAwesomeIcon icon={faXmark} className="text-xl" />
            </button>
          </div>

          {/* Status Indicator */}
          {(isInvesting || isInvested) && (
            <div className="mt-4">
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
                    ? "Investment in progress..."
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
        </div>

        <div className="p-6 flex flex-col md:flex-row gap-8">
          {/* Left Column */}
          <div className="md:w-1/2">
            <div className="rounded-xl overflow-hidden mb-6">
              <img
                src={project.image}
                alt={project.name}
                className="w-full h-64 object-cover"
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 p-1 rounded-xl bg-gray-200/30 dark:bg-slate-700/50">
              <button
                onClick={() => setView("property")}
                className={`flex-1 py-3 rounded-xl text-center ${
                  view === "property"
                    ? isDarkMode
                      ? "bg-gradient-to-r from-cyan-600 to-blue-700 text-white"
                      : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                    : isDarkMode
                    ? "text-gray-300 hover:bg-slate-700"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                Property Details
              </button>
              <button
                onClick={() => setView("document")}
                className={`flex-1 py-3 rounded-xl text-center ${
                  view === "document"
                    ? isDarkMode
                      ? "bg-gradient-to-r from-cyan-600 to-blue-700 text-white"
                      : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                    : isDarkMode
                    ? "text-gray-300 hover:bg-slate-700"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                Documents
              </button>
            </div>

            {/* Content based on view */}
            {view === "property" ? (
              <div
                className={`rounded-xl p-5 ${
                  isDarkMode ? "bg-slate-800/50" : "bg-indigo-50"
                }`}
              >
                <h3
                  className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                    isDarkMode ? "text-cyan-300" : "text-indigo-700"
                  }`}
                >
                  <FontAwesomeIcon icon={faBuilding} />
                  Property Description
                </h3>
                <p className={isDarkMode ? "text-slate-300" : "text-gray-700"}>
                  {details.propertyDescription}
                </p>

                {details.whyProperty.length > 0 && (
                  <>
                    <h3
                      className={`text-xl font-bold mt-6 mb-4 flex items-center gap-2 ${
                        isDarkMode ? "text-cyan-300" : "text-indigo-700"
                      }`}
                    >
                      Why It Stands Out
                    </h3>
                    <ul className="space-y-3">
                      {details.whyProperty.map((point, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center mt-1 ${
                              isDarkMode
                                ? "bg-cyan-500/20 text-cyan-400"
                                : "bg-blue-500/20 text-blue-600"
                            }`}
                          >
                            <span className="text-xs font-bold">✓</span>
                          </div>
                          <p
                            className={
                              isDarkMode ? "text-slate-300" : "text-gray-700"
                            }
                          >
                            {point}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {details.whySponsor.length > 0 && (
                  <>
                    <h3
                      className={`text-xl font-bold mt-6 mb-4 flex items-center gap-2 ${
                        isDarkMode ? "text-cyan-300" : "text-indigo-700"
                      }`}
                    >
                      Project Team & Delivery
                    </h3>
                    <ul className="space-y-3">
                      {details.whySponsor.map((point, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center mt-1 ${
                              isDarkMode
                                ? "bg-cyan-500/20 text-cyan-400"
                                : "bg-blue-500/20 text-blue-600"
                            }`}
                          >
                            <span className="text-xs font-bold">✓</span>
                          </div>
                          <p
                            className={
                              isDarkMode ? "text-slate-300" : "text-gray-700"
                            }
                          >
                            {point}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ) : (
              <div
                className={`rounded-xl p-5 ${
                  isDarkMode ? "bg-slate-800/50" : "bg-indigo-50"
                }`}
              >
                <h3
                  className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                    isDarkMode ? "text-cyan-300" : "text-indigo-700"
                  }`}
                >
                  <FontAwesomeIcon icon={faFileAlt} />
                  Documents
                </h3>
                {details.documentDescription && (
                  <p
                    className={`mb-4 text-sm ${
                      isDarkMode ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    {details.documentDescription}
                  </p>
                )}
                <div className="space-y-3">
                  {details.documents.map((doc, index) => (
                    <a
                      key={index}
                      href={doc.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                        isDarkMode
                          ? "bg-slate-700 hover:bg-slate-600 text-cyan-400"
                          : "bg-white hover:bg-gray-100 text-blue-600"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isDarkMode ? "bg-cyan-500/20" : "bg-blue-500/20"
                        }`}
                      >
                        <FontAwesomeIcon icon={faFileAlt} className="text-xl" />
                      </div>
                      <span className="font-medium">{doc.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Investment Panel */}
          <div className="md:w-1/2">
            <div
              className={`rounded-xl p-6 ${
                isDarkMode ? "bg-slate-800/50" : "bg-indigo-50"
              }`}
            >
              <h3
                className={`text-xl font-bold mb-6 flex items-center gap-2 ${
                  isDarkMode ? "text-cyan-300" : "text-indigo-700"
                }`}
              >
                <FontAwesomeIcon icon={faChartLine} />
                Investment Details
              </h3>

              {investmentRecord && (
                <div className="mb-4 text-sm text-slate-300 space-y-1">
                  <p>
                    Amount: ${investmentRecord.amount.toLocaleString()}
                  </p>
                  <p>Duration: {investmentRecord.duration} days</p>
                </div>
              )}

              {/* Property Attributes Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div
                  className={`p-4 rounded-xl ${
                    isDarkMode ? "bg-slate-700" : "bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isDarkMode
                          ? "bg-cyan-500/20 text-cyan-400"
                          : "bg-blue-500/20 text-blue-600"
                      }`}
                    >
                      <FontAwesomeIcon icon={faBuilding} className="text-sm" />
                    </div>
                    <span
                      className={
                        isDarkMode ? "text-slate-400" : "text-gray-600"
                      }
                    >
                      Type
                    </span>
                  </div>
                  <p
                    className={`font-bold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {details.type}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    isDarkMode ? "bg-slate-700" : "bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={
                        isDarkMode ? "text-slate-400" : "text-gray-600"
                      }
                    >
                      Location
                    </span>
                  </div>
                  <p
                    className={`font-bold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {details.location}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    isDarkMode ? "bg-slate-700" : "bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={
                        isDarkMode ? "text-slate-400" : "text-gray-600"
                      }
                    >
                      Brand / Team
                    </span>
                  </div>
                  <p
                    className={`font-bold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {details.team}
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl ${
                    isDarkMode ? "bg-slate-700" : "bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={
                        isDarkMode ? "text-slate-400" : "text-gray-600"
                      }
                    >
                      Official Docs
                    </span>
                  </div>
                  <p
                    className={`font-bold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {details.officialDocs}
                  </p>
                </div>
              </div>

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
                    <p
                      className={
                        isDarkMode ? "text-slate-400" : "text-gray-600"
                      }
                    >
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
                    <p
                      className={
                        isDarkMode ? "text-slate-400" : "text-gray-600"
                      }
                    >
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
              <div className="mb-6">
                <h3
                  className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                    isDarkMode ? "text-cyan-300" : "text-indigo-700"
                  }`}
                >
                  Invest in this Property
                </h3>

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
                          setInvestmentAmount(
                            e.target.value.replace(/[^0-9.]/g, "")
                          )
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
                </div>

                {/* Invest Button */}
              <button
                onClick={handleDetailInvest}
                disabled={isInvesting || isInvested}
                className={`w-full py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
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
                    <span>Processing Investment...</span>
                  </>
                ) : isInvested ? (
                  <>
                    <FontAwesomeIcon icon={faCheck} />
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
                  <FontAwesomeIcon icon={faCheck} className="text-xl" />
                  <span>Your investment has been submitted successfully!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
