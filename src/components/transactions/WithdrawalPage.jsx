import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Building2,
  CheckCircle2,
  Coins,
  CreditCard,
  DollarSign,
  Mail,
} from "lucide-react";
import { useTransactions } from "../../context/TransactionContext";
import { useUser } from "../../context/UserContext";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../../config/api";

const CustomAlert = ({ message, onClose }) => {
  const { theme } = useTheme();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 animate-fadeIn">
      <div
        className={`p-8 rounded-2xl w-full max-w-md ${
          theme === "dark"
            ? "bg-gradient-to-br from-slate-800 to-gray-900 border border-slate-700 text-gray-200"
            : "bg-white border border-gray-200 text-gray-800"
        }`}
      >
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/25">
          <CheckCircle2 className="h-8 w-8 text-green-500" strokeWidth={2.2} />
        </div>
        <p className="inline-flex rounded-full border border-cyan-400/15 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
          Withdrawal Submitted
        </p>
        <p className="mt-4 text-lg leading-7">{message}</p>
        <button
          onClick={onClose}
          className={`w-full p-3 rounded-xl font-medium transition-all ${
            theme === "dark"
              ? "mt-6 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 text-white shadow-[0_18px_40px_rgba(20,184,166,0.28)]"
              : "mt-6 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 text-white shadow-[0_18px_40px_rgba(20,184,166,0.2)]"
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default function WithdrawalPage({ onSuccess }) {
  const { theme } = useTheme();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [formData, setFormData] = useState({
    cryptoAsset: "BTC",
    amount: "",
    btcAddress: "",
    bankAccountNumber: "",
    bankName: "",
    bankAccountName: "",
    cashAppId: "",
    paypalEmail: "",
    skrillEmail: "",
  });
  const [alertMessage, setAlertMessage] = useState(null);
  const { refreshTransactions } = useTransactions();
  const { userData, getAuthToken, logoutUser, refreshUser } = useUser();
  const [processingWithdrawal, setProcessingWithdrawal] = useState(false);
  const [whitelistEntries, setWhitelistEntries] = useState([]);
  const [loadingWhitelist, setLoadingWhitelist] = useState(false);
  const [whitelistChallengeId, setWhitelistChallengeId] = useState("");
  const [whitelistCode, setWhitelistCode] = useState("");
  const [withdrawalChallengeId, setWithdrawalChallengeId] = useState("");
  const [withdrawalCode, setWithdrawalCode] = useState("");
  const isDark = theme === "dark";
  const page = isDark
    ? "bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_32%),radial-gradient(circle_at_right_top,rgba(45,212,191,0.12),transparent_24%),linear-gradient(180deg,#020617_0%,#0f172a_46%,#020617_100%)] text-slate-100"
    : "bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_30%),radial-gradient(circle_at_right_top,rgba(20,184,166,0.12),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef6ff_50%,#f8fafc_100%)] text-slate-900";
  const shell = isDark
    ? "border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.88))] shadow-[0_28px_80px_rgba(2,8,23,0.45)]"
    : "border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] shadow-[0_24px_70px_rgba(15,23,42,0.08)]";
  const card = isDark ? "border-white/10 bg-white/[0.04]" : "border-slate-200/80 bg-white/80";
  const accent = isDark ? "border-cyan-400/15 bg-cyan-400/10 text-cyan-300" : "border-cyan-200 bg-cyan-50 text-cyan-700";
  const labelTone = isDark ? "text-slate-400" : "text-slate-600";
  const quietTone = "text-slate-500";

  const getCleanToken = () => {
    const token = getAuthToken?.();
    if (!token) return null;
    return token.replace(/^["']|["']$/g, "").trim();
  };

  const buildDestinationPayload = () => ({
    network: formData.cryptoAsset,
    cryptoAsset: formData.cryptoAsset,
    cryptoAddress: formData.btcAddress,
    bankAccountNumber: formData.bankAccountNumber,
    bankName: formData.bankName,
    bankAccountName: formData.bankAccountName,
    cashAppId: formData.cashAppId,
    paypalEmail: formData.paypalEmail,
    skrillEmail: formData.skrillEmail,
  });

  const buildWhitelistLabel = () => {
    switch (selectedPaymentMethod) {
      case "Crypto":
        return `${formData.cryptoAsset || "Crypto"} payout wallet`;
      case "Bank Transfer":
        return `${formData.bankName || "Bank"} payout account`;
      case "Cash App":
        return "Cash App payout";
      case "PayPal":
        return "PayPal payout";
      case "Skrill":
        return "Skrill payout";
      default:
        return "Withdrawal destination";
    }
  };

  const fetchWhitelist = async () => {
    const token = getCleanToken();
    if (!token) return;

    try {
      setLoadingWhitelist(true);
      const response = await fetch(`${API_BASE_URL}/User/Security/Whitelist`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const result = await response.json();
      if (response.ok && result?.success) {
        setWhitelistEntries(Array.isArray(result.data) ? result.data : []);
      }
    } catch (error) {
      console.error("Whitelist load failed:", error);
    } finally {
      setLoadingWhitelist(false);
    }
  };

  useEffect(() => {
    fetchWhitelist();
  }, []);

  const paymentMethods = [
    {
      id: "Bank Transfer",
      name: "Bank Transfer",
      icon: Building2,
      color: "bg-blue-500/10",
    },
    {
      id: "Crypto",
      name: "Crypto",
      icon: Coins,
      color: "bg-orange-500/10",
    },
    {
      id: "Cash App",
      name: "Cash App",
      icon: DollarSign,
      color: "bg-green-500/10",
    },
    {
      id: "PayPal",
      name: "PayPal",
      icon: CreditCard,
      color: "bg-blue-400/10",
    },
    {
      id: "Skrill",
      name: "Skrill",
      icon: Mail,
      color: "bg-red-500/10",
    },
  ];

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleWithdrawal = async () => {
    if (!selectedPaymentMethod) {
      setAlertMessage("Please select a payment method.");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setAlertMessage("Please enter a valid amount.");
      return;
    }

    if (amount < 10) {
      setAlertMessage("Minimum withdrawal amount is $10.");
      return;
    }

    const availableBalance = userData?.balance ?? 0;
    if (amount > availableBalance) {
      setAlertMessage("Insufficient balance for this withdrawal.");
      return;
    }

    let details = "";
    switch (selectedPaymentMethod) {
      case "Crypto":
        if (!formData.btcAddress) {
          setAlertMessage("Please provide a crypto address.");
          return;
        }
        details = `To: ${formData.btcAddress.substring(0, 12)}... (${
          formData.cryptoAsset
        })`;
        break;
      case "Bank Transfer":
        if (!formData.bankAccountNumber || !formData.bankName) {
          setAlertMessage("Please fill in all required bank details.");
          return;
        }
        details = `To: ${formData.bankAccountNumber.substring(0, 8)}... (${
          formData.bankName
        })`;
        break;
      case "Cash App":
        if (!formData.cashAppId) {
          setAlertMessage("Please enter your Cash App ID.");
          return;
        }
        details = `Cash App: ${formData.cashAppId.substring(0, 8)}...`;
        break;
      case "PayPal":
        if (!formData.paypalEmail) {
          setAlertMessage("Please enter your PayPal email.");
          return;
        }
        details = `PayPal: ${formData.paypalEmail.substring(0, 8)}...`;
        break;
      case "Skrill":
        if (!formData.skrillEmail) {
          setAlertMessage("Please enter your Skrill email.");
          return;
        }
        details = `Skrill: ${formData.skrillEmail.substring(0, 8)}...`;
        break;
      default:
        break;
    }

    const token = getCleanToken();
    if (!token) {
      setAlertMessage("Please log in to continue with withdrawals.");
      toast.error("Authentication required to withdraw");
      return;
    }

    setProcessingWithdrawal(true);

    try {
      const payload = {
        amount: amount.toFixed(2),
        currency: "USD",
        paymentMethod: selectedPaymentMethod,
        details,
        destination: buildDestinationPayload(),
        ...(withdrawalChallengeId
          ? {
              challengeId: withdrawalChallengeId,
              otpCode: withdrawalCode,
            }
          : {}),
      };

      const response = await fetch(`${API_BASE_URL}/Withdrawal/Create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        setAlertMessage("Session expired. Please log in again.");
        toast.error("Session expired. Please log in again.");
        await logoutUser();
        return;
      }

      const result = await response.json();

      if (response.status === 202 && result?.requiresConfirmation) {
        setWithdrawalChallengeId(result?.data?.challengeId || "");
        setAlertMessage(result?.message || "Verification code sent to your email.");
        toast.info("Enter the email OTP to confirm this withdrawal.");
        return;
      }

      if (!response.ok) {
        const message =
          result?.message ||
          `Failed to request withdrawal (error ${response.status})`;
        setAlertMessage(message);
        toast.error(message);
        return;
      }

      if (result?.success) {
        const txStatus = result.data?.status || "Pending";
        setAlertMessage(
          `Withdrawal request of $${amount.toFixed(
            2
          )} via ${selectedPaymentMethod} is ${txStatus.toLowerCase()}.`
        );
        await refreshTransactions();
        await refreshUser();
        await fetchWhitelist();
        setFormData({
          cryptoAsset: "BTC",
          amount: "",
          btcAddress: "",
          bankAccountNumber: "",
          bankName: "",
          bankAccountName: "",
          cashAppId: "",
          paypalEmail: "",
          skrillEmail: "",
        });
        setSelectedPaymentMethod(null);
        setWithdrawalChallengeId("");
        setWithdrawalCode("");
        if (onSuccess) onSuccess();
      } else {
        const message = result?.message || "Withdrawal request failed";
        setAlertMessage(message);
        toast.error(message);
      }
    } catch (error) {
      console.error("Withdrawal failed:", error);
      setAlertMessage(
        "Failed to submit withdrawal request. Please try again."
      );
    } finally {
      setProcessingWithdrawal(false);
    }

  };

  const handleRequestWhitelistAdd = async () => {
    if (!selectedPaymentMethod) {
      setAlertMessage("Select a payment method before approving a destination.");
      return;
    }

    const token = getCleanToken();
    if (!token) {
      setAlertMessage("Please log in to continue.");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/User/Security/Whitelist/RequestAdd`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            label: buildWhitelistLabel(),
            paymentMethod: selectedPaymentMethod,
            destination: buildDestinationPayload(),
          }),
        }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Unable to start whitelist approval");
      }

      if (result?.data?.entry) {
        setAlertMessage("This destination is already in your whitelist.");
        await fetchWhitelist();
        return;
      }

      setWhitelistChallengeId(result?.data?.challengeId || "");
      setAlertMessage(
        result?.message || "Verification code sent. Enter it to approve this destination."
      );
      toast.info("Check your email for the destination approval code.");
    } catch (error) {
      console.error("Whitelist approval request failed:", error);
      setAlertMessage(error.message || "Unable to start whitelist approval.");
    }
  };

  const handleConfirmWhitelistAdd = async () => {
    const token = getCleanToken();
    if (!token || !whitelistChallengeId || !whitelistCode.trim()) {
      setAlertMessage("Enter the whitelist verification code first.");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/User/Security/Whitelist/ConfirmAdd`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            challengeId: whitelistChallengeId,
            code: whitelistCode.trim(),
          }),
        }
      );
      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Unable to confirm whitelist entry");
      }

      setWhitelistEntries(Array.isArray(result.data) ? result.data : []);
      setWhitelistChallengeId("");
      setWhitelistCode("");
      await refreshUser();
      setAlertMessage("Destination added to wallet whitelist.");
      toast.success("Wallet whitelist updated.");
    } catch (error) {
      console.error("Whitelist confirmation failed:", error);
      setAlertMessage(error.message || "Unable to verify whitelist code.");
    }
  };

  const renderFormFields = () => {
    const inputClasses = `w-full rounded-2xl border px-4 py-3.5 focus:outline-none focus:ring-4 ${
      isDark
        ? "border-white/10 bg-slate-950/70 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-cyan-400/15"
        : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-cyan-500/12"
    }`;

    const labelClasses = `mb-2 block text-sm font-semibold ${labelTone}`;

    switch (selectedPaymentMethod) {
      case "Crypto":
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>Coin Assets</label>
              <select
                name="cryptoAsset"
                value={formData.cryptoAsset}
                onChange={handleInputChange}
                className={inputClasses}
              >
                {["BTC", "ETH", "LTC", "XRP", "BCH"].map((coin) => (
                  <option key={coin} value={coin}>
                    {coin}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClasses}>Amount</label>
              <input
                type="number"
                name="amount"
                placeholder="Amount"
                value={formData.amount}
                onChange={handleInputChange}
                className={inputClasses}
                min="10"
                step="0.01"
              />
              <p
                className={`text-sm mt-2 ${
                  theme === "dark" ? "text-gray-500" : "text-gray-600"
                }`}
              >
                Available Balance: ${userData?.balance?.toFixed(2) || "0.00"}
              </p>
            </div>
            <div>
              <label className={labelClasses}>
                {formData.cryptoAsset} Address
              </label>
              <input
                type="text"
                name="btcAddress"
                placeholder={`${formData.cryptoAsset} Address`}
                value={formData.btcAddress}
                onChange={handleInputChange}
                className={inputClasses}
              />
            </div>
          </div>
        );
      case "Bank Transfer":
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>Bank Name</label>
              <input
                type="text"
                name="bankName"
                placeholder="Bank Name"
                value={formData.bankName}
                onChange={handleInputChange}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Account Number</label>
              <input
                type="text"
                name="bankAccountNumber"
                placeholder="Account Number"
                value={formData.bankAccountNumber}
                onChange={handleInputChange}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Account Name</label>
              <input
                type="text"
                name="bankAccountName"
                placeholder="Account Name"
                value={formData.bankAccountName}
                onChange={handleInputChange}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Amount</label>
              <input
                type="number"
                name="amount"
                placeholder="Amount"
                value={formData.amount}
                onChange={handleInputChange}
                className={inputClasses}
                min="10"
                step="0.01"
              />
              <p
                className={`text-sm mt-2 ${
                  theme === "dark" ? "text-gray-500" : "text-gray-600"
                }`}
              >
                Available Balance: ${userData?.balance?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
        );
      case "Cash App":
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>Cash App ID</label>
              <input
                type="text"
                name="cashAppId"
                placeholder="Cash App ID"
                value={formData.cashAppId}
                onChange={handleInputChange}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Amount</label>
              <input
                type="number"
                name="amount"
                placeholder="Amount"
                value={formData.amount}
                onChange={handleInputChange}
                className={inputClasses}
                min="10"
                step="0.01"
              />
              <p
                className={`text-sm mt-2 ${
                  theme === "dark" ? "text-gray-500" : "text-gray-600"
                }`}
              >
                Available Balance: ${userData?.balance?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
        );
      case "PayPal":
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>PayPal Email</label>
              <input
                type="email"
                name="paypalEmail"
                placeholder="PayPal Email"
                value={formData.paypalEmail}
                onChange={handleInputChange}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Amount</label>
              <input
                type="number"
                name="amount"
                placeholder="Amount"
                value={formData.amount}
                onChange={handleInputChange}
                className={inputClasses}
                min="10"
                step="0.01"
              />
              <p
                className={`text-sm mt-2 ${
                  theme === "dark" ? "text-gray-500" : "text-gray-600"
                }`}
              >
                Available Balance: ${userData?.balance?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
        );
      case "Skrill":
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>Skrill Email</label>
              <input
                type="email"
                name="skrillEmail"
                placeholder="Skrill Email"
                value={formData.skrillEmail}
                onChange={handleInputChange}
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Amount</label>
              <input
                type="number"
                name="amount"
                placeholder="Amount"
                value={formData.amount}
                onChange={handleInputChange}
                className={inputClasses}
                min="10"
                step="0.01"
              />
              <p
                className={`text-sm mt-2 ${
                  theme === "dark" ? "text-gray-500" : "text-gray-600"
                }`}
              >
                Available Balance: ${userData?.balance?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div className={`rounded-[1.6rem] border p-8 text-center ${card}`}>
            <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
              isDark ? "bg-slate-900/80 text-cyan-300" : "bg-cyan-50 text-cyan-700"
            }`}>
              <Coins className="h-7 w-7" strokeWidth={2.1} />
            </div>
            <p className={labelTone}>
              Select a payment method to start your withdrawal
            </p>
          </div>
        );
    }
  };

  return (
    <div className={`relative min-h-screen overflow-hidden ${page}`}>
      <div className="pointer-events-none absolute right-[-8rem] top-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute left-[-6rem] bottom-12 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_380px]">
          <div className={`rounded-[2rem] border p-5 sm:p-6 lg:p-7 ${shell}`}>
            <div className={`rounded-[1.7rem] border p-5 ${card}`}>
              <p className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${accent}`}>
                Payout Desk
              </p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-[2.45rem]">
                Move balance out with sharper destination review.
              </h1>
              <p className={`mt-3 max-w-2xl text-sm leading-6 ${labelTone}`}>
                Select the payout rail, confirm the destination details, and send the request with a cleaner audit summary.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className={`rounded-2xl border p-4 ${card}`}><p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${quietTone}`}>Available</p><p className="mt-2 text-lg font-semibold">${userData?.balance?.toFixed(2) || "0.00"}</p></div>
                <div className={`rounded-2xl border p-4 ${card}`}><p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${quietTone}`}>Minimum</p><p className="mt-2 text-lg font-semibold">$10</p></div>
                <div className={`rounded-2xl border p-4 ${card}`}><p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${quietTone}`}>Processing</p><p className="mt-2 text-lg font-semibold">1-3 days</p></div>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="mb-4 text-xl font-semibold">Select Payment Method</h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isSelected = selectedPaymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => handlePaymentMethodSelect(method.id)}
                      className={`rounded-[1.45rem] border p-4 text-left transition ${
                        isSelected
                          ? isDark
                            ? "border-cyan-400/35 bg-cyan-400/12"
                            : "border-cyan-400 bg-cyan-50"
                          : card
                      }`}
                    >
                      <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full ${method.color}`}>
                        <Icon className={`h-5 w-5 ${isSelected ? "text-cyan-400" : isDark ? "text-slate-400" : "text-slate-600"}`} strokeWidth={2.2} />
                      </div>
                      <span className="font-medium">{method.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8">
              <h2 className="mb-4 text-xl font-semibold">
                {selectedPaymentMethod ? `${selectedPaymentMethod} Details` : "Payment Details"}
              </h2>
              {renderFormFields()}
            </div>
          </div>

          <div className={`rounded-[2rem] border p-5 sm:p-6 lg:p-7 ${shell}`}>
            <p className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${accent}`}>
              Review Summary
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">Withdrawal Summary</h2>

            <div className={`mt-5 rounded-[1.6rem] border p-5 ${card}`}>
              <div className="flex justify-between mb-3">
                <span
                  className={
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }
                >
                  Payment Method:
                </span>
                <span className="font-medium">
                  {selectedPaymentMethod || "Not selected"}
                </span>
              </div>

              {selectedPaymentMethod && (
                <>
                  <div className="flex justify-between mb-3">
                    <span
                      className={
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      }
                    >
                      Amount:
                    </span>
                    <span className="font-medium">
                      ${formData.amount || "0.00"}
                    </span>
                  </div>

                  {selectedPaymentMethod === "Crypto" && (
                    <>
                      <div className="flex justify-between mb-3">
                        <span
                          className={
                            theme === "dark" ? "text-gray-400" : "text-gray-600"
                          }
                        >
                          Coin:
                        </span>
                        <span className="font-medium">
                          {formData.cryptoAsset}
                        </span>
                      </div>
                      <div>
                        <span
                          className={
                            theme === "dark" ? "text-gray-400" : "text-gray-600"
                          }
                        >
                          Address:
                        </span>
                        <p className="font-medium truncate">
                          {formData.btcAddress || "Not provided"}
                        </p>
                      </div>
                    </>
                  )}

                  {selectedPaymentMethod === "Bank Transfer" && (
                    <>
                      <div className="flex justify-between mb-3">
                        <span
                          className={
                            theme === "dark" ? "text-gray-400" : "text-gray-600"
                          }
                        >
                          Bank:
                        </span>
                        <span className="font-medium">
                          {formData.bankName || "Not provided"}
                        </span>
                      </div>
                      <div className="flex justify-between mb-3">
                        <span
                          className={
                            theme === "dark" ? "text-gray-400" : "text-gray-600"
                          }
                        >
                          Account Number:
                        </span>
                        <span className="font-medium">
                          {formData.bankAccountNumber || "Not provided"}
                        </span>
                      </div>
                      <div>
                        <span
                          className={
                            theme === "dark" ? "text-gray-400" : "text-gray-600"
                          }
                        >
                          Account Name:
                        </span>
                        <p className="font-medium">
                          {formData.bankAccountName || "Not provided"}
                        </p>
                      </div>
                    </>
                  )}

                  {selectedPaymentMethod === "Cash App" && (
                    <div>
                      <span
                        className={
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }
                      >
                        Cash App ID:
                      </span>
                      <p className="font-medium">
                        {formData.cashAppId || "Not provided"}
                      </p>
                    </div>
                  )}

                  {selectedPaymentMethod === "PayPal" && (
                    <div>
                      <span
                        className={
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }
                      >
                        PayPal Email:
                      </span>
                      <p className="font-medium">
                        {formData.paypalEmail || "Not provided"}
                      </p>
                    </div>
                  )}

                  {selectedPaymentMethod === "Skrill" && (
                    <div>
                      <span
                        className={
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }
                      >
                        Skrill Email:
                      </span>
                      <p className="font-medium">
                        {formData.skrillEmail || "Not provided"}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="rounded-[1.45rem] bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 p-px shadow-[0_18px_40px_rgba(20,184,166,0.25)]">
              <button
                onClick={handleWithdrawal}
                className={`w-full rounded-[1.45rem] p-4 text-lg font-bold text-white transition-all ${
                  !selectedPaymentMethod || !formData.amount
                    ? "bg-gray-400 cursor-not-allowed"
                    : isDark
                    ? "bg-slate-950/10"
                    : "bg-white/10"
                }`}
                disabled={!selectedPaymentMethod || !formData.amount}
              >
                Confirm Withdrawal
              </button>
            </div>

            <div className={`mt-6 rounded-[1.6rem] border p-4 ${card}`}>
              <h3 className="mb-2 font-bold">
                Withdrawal Notes
              </h3>
              <ul className={`space-y-1 text-sm ${labelTone}`}>
                <li>Minimum withdrawal: $10</li>
                <li>Processing time: 1-3 business days</li>
                <li>No transaction fees</li>
                <li>Protected withdrawals require email OTP confirmation</li>
                <li>Destination must already exist in your wallet whitelist</li>
              </ul>
            </div>

            <div className={`mt-6 rounded-[1.6rem] border p-4 ${card}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold">Wallet Whitelist</h3>
                  <p className={`mt-1 text-xs ${labelTone}`}>
                    Approve payout destinations before you use them for withdrawals.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRequestWhitelistAdd}
                  className="rounded-xl border border-cyan-400/30 px-3 py-2 text-xs font-semibold text-cyan-500 hover:bg-cyan-500/10"
                >
                  Approve Current Destination
                </button>
              </div>

              {whitelistChallengeId && (
                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    value={whitelistCode}
                    onChange={(event) =>
                      setWhitelistCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="Enter email OTP"
                    className={`w-full rounded-2xl border px-4 py-3 text-sm ${
                      isDark
                        ? "border-slate-700 bg-slate-950 text-slate-100"
                        : "border-slate-300 bg-white text-slate-900"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleConfirmWhitelistAdd}
                    className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white dark:bg-teal-600"
                  >
                    Confirm Destination OTP
                  </button>
                </div>
              )}

              <div className="mt-4 space-y-2">
                {loadingWhitelist ? (
                  <p className={`text-sm ${labelTone}`}>Loading wallet whitelist...</p>
                ) : whitelistEntries.length === 0 ? (
                  <p className={`text-sm ${labelTone}`}>
                    No approved destinations yet. Approve one before requesting a withdrawal.
                  </p>
                ) : (
                  whitelistEntries
                    .filter((entry) => entry.status === "active")
                    .slice(0, 4)
                    .map((entry) => (
                      <div
                        key={entry.id}
                        className={`rounded-2xl border px-4 py-3 text-sm ${card}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold">{entry.label || entry.paymentMethod}</span>
                          <span className={`text-xs ${labelTone}`}>{entry.paymentMethod}</span>
                        </div>
                        <p className={`mt-1 text-xs ${labelTone}`}>
                          {entry.destinationSummary || entry.maskedDestination}
                        </p>
                      </div>
                    ))
                )}
              </div>
            </div>

            {withdrawalChallengeId && (
              <div className={`mt-6 rounded-[1.6rem] border p-4 ${card}`}>
                <h3 className="font-bold">Verify Withdrawal</h3>
                <p className={`mt-1 text-xs ${labelTone}`}>
                  Enter the email OTP to release this withdrawal request.
                </p>
                <input
                  type="text"
                  value={withdrawalCode}
                  onChange={(event) =>
                    setWithdrawalCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="Enter email OTP"
                    className={`mt-4 w-full rounded-2xl border px-4 py-3 text-sm ${
                      isDark
                        ? "border-slate-700 bg-slate-950 text-slate-100"
                        : "border-slate-300 bg-white text-slate-900"
                    }`}
                />
                <button
                  type="button"
                  onClick={handleWithdrawal}
                  className="mt-3 w-full rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 px-4 py-3 text-sm font-semibold text-white"
                >
                  Verify and Submit Withdrawal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Alert Popup */}
      {alertMessage && (
        <CustomAlert
          message={alertMessage}
          onClose={() => setAlertMessage(null)}
        />
      )}
    </div>
  );
}
