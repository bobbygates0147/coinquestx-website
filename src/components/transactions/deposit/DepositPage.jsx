"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  Bitcoin,
  CheckCircle2,
  ChevronDown,
  Coins,
  Copy,
  Gem,
  Hexagon,
  Layers3,
  Orbit,
  QrCode,
  RefreshCw,
  TriangleAlert,
  Waves,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../../context/UserContext";
import { API_BASE_URL } from "../../../config/api";

const cryptoOptions = [
  { name: "Bitcoin", symbol: "BTC", icon: Bitcoin, iconColor: "text-orange-400", code: "BTC", paymentMethod: "btc" },
  { name: "Ethereum", symbol: "ETH", icon: Gem, iconColor: "text-violet-300", code: "ETH", paymentMethod: "eth" },
  { name: "Solana", symbol: "SOL", icon: Orbit, iconColor: "text-fuchsia-300", code: "SOL", paymentMethod: "sol" },
  { name: "Base", symbol: "BASE", icon: Layers3, iconColor: "text-blue-300", code: "BASE", paymentMethod: "base" },
  { name: "Sui", symbol: "SUI", icon: Waves, iconColor: "text-cyan-300", code: "SUI", paymentMethod: "sui" },
  { name: "Polygon", symbol: "POL", icon: Hexagon, iconColor: "text-purple-300", code: "POL", paymentMethod: "pol" },
];

const renderCryptoIcon = (option, className = "h-5 w-5") => {
  const Icon = option?.icon || Coins;
  return <Icon className={`${className} ${option?.iconColor || "text-teal-300"}`} strokeWidth={2.2} />;
};

export default function DepositPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { getAuthToken, hasValidToken, isAuthenticated, logoutUser } = useUser();
  const [amount, setAmount] = useState("10");
  const [selectedCrypto, setSelectedCrypto] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showMethods, setShowMethods] = useState(false);
  const [generatedAddress, setGeneratedAddress] = useState(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [processingDeposit, setProcessingDeposit] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [addressError, setAddressError] = useState(null);
  const [currentDepositAmount, setCurrentDepositAmount] = useState(10);
  const [depositMethods, setDepositMethods] = useState([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const isGeneratingAddressRef = useRef(false);
  const requestTimesRef = useRef({});
  const lastRequestKeyRef = useRef("");
  const isMountedRef = useRef(true);

  const parsedAmount = Number.parseFloat(amount) || 0;
  const fee = (parsedAmount * 0.01).toFixed(2);
  const total = (parsedAmount + Number.parseFloat(fee || 0)).toFixed(2);
  const selectedMethod = cryptoOptions.find((item) => item.symbol === selectedCrypto);
  const selectedMethodConfig = depositMethods.find((method) => method.currencyCode === selectedCrypto);
  const selectedMethodHasAddress = Boolean(
    selectedMethodConfig?.isConfigured && selectedMethodConfig?.walletAddress
  );
  const isDark = theme === "dark";
  const page = isDark ? "bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.18),transparent_32%),linear-gradient(180deg,#020617_0%,#0f172a_45%,#020617_100%)] text-slate-100" : "bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.14),transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eff8f7_50%,#f8fafc_100%)] text-slate-900";
  const shell = isDark ? "border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.88))]" : "border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.92))]";
  const card = isDark ? "border-white/10 bg-white/[0.04]" : "border-slate-200/80 bg-white/80";
  const accent = isDark ? "border-cyan-400/15 bg-cyan-400/10 text-cyan-300" : "border-cyan-200 bg-cyan-50 text-cyan-700";
  const label = isDark ? "text-slate-400" : "text-slate-600";
  const quiet = "text-slate-500";
  const input = isDark ? "w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-400/15" : "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-4 focus:ring-cyan-500/12";

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      requestTimesRef.current = {};
      isGeneratingAddressRef.current = false;
    };
  }, []);

  const getCleanToken = () => {
    const token = getAuthToken?.();
    return token ? token.replace(/^["']|["']$/g, "").trim() : null;
  };

  const fetchDepositMethods = async () => {
    const token = getCleanToken();
    if (!token) return;
    setLoadingMethods(true);
    try {
      const response = await fetch(`${API_BASE_URL}/Deposit/Methods`, { method: "GET", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
      const result = await response.json();
      if (response.ok && result?.success && Array.isArray(result.data)) setDepositMethods(result.data);
      else toast.error("Failed to load deposit methods");
    } catch (error) {
      console.error("Failed to load deposit methods:", error);
      toast.error("Network error loading deposit methods");
    } finally {
      setLoadingMethods(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !hasValidToken()) {
      setAuthError(true);
      toast.error("Please log in to access deposit features");
      navigate("/login");
      return;
    }
    fetchDepositMethods();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCryptoSelect = (cryptoCode) => {
    setSelectedCrypto(cryptoCode);
    setShowMethods(false);
    const method = depositMethods.find((item) => item.currencyCode === cryptoCode);
    const previewAddress = method?.walletAddress;
    setAddressError(
      previewAddress
        ? null
        : `${method?.currencyName || cryptoCode} deposit address is not configured yet`
    );
    setGeneratedAddress(previewAddress ? { address: previewAddress, depositId: null, depositData: null, isPreview: true } : null);
  };

  const generateDepositAddress = async (requestId) => {
    if (!selectedCrypto || parsedAmount < 10) {
      toast.error("Please select a cryptocurrency and enter amount >= $10");
      return;
    }
    const token = getCleanToken();
    const option = cryptoOptions.find((item) => item.code === selectedCrypto);
    if (!token || !option || isGeneratingAddressRef.current) return;
    const requestKey = `${selectedCrypto}-${parsedAmount}`;
    const now = Date.now();
    if (lastRequestKeyRef.current === requestKey && now - (requestTimesRef.current[requestKey] || 0) < 10000) return;
    isGeneratingAddressRef.current = true;
    lastRequestKeyRef.current = requestKey;
    requestTimesRef.current[requestKey] = now;
    setLoadingAddress(true);
    setAddressError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/Deposit/Create`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json", "X-Request-ID": requestId },
        body: JSON.stringify({ amount: parsedAmount, paymentMethod: option.paymentMethod.toLowerCase() }),
      });
      const result = JSON.parse(await response.text());
      if (response.status === 401) {
        setAuthError(true);
        toast.error("Session expired. Please log in again.");
        logoutUser();
        navigate("/login");
        return;
      }
      if (response.status === 403) {
        const message = result?.message || "KYC verification required";
        setAddressError(message);
        toast.error(message);
        return;
      }
      if (!response.ok || !result?.success || !result?.data?.walletAddress) {
        const message = result?.message || `Failed to create deposit (${response.status})`;
        setAddressError(message);
        toast.error(message);
        return;
      }
      setGeneratedAddress({ address: result.data.walletAddress, depositId: result.data.id, depositData: result.data, isPreview: false });
      setCurrentDepositAmount(parsedAmount);
      setShowSuccess(true);
      toast.success(`${option.name} address generated`);
    } catch (error) {
      const message = error?.message?.includes("Failed to fetch") ? "Network error. Please check your internet connection." : `Failed to generate address: ${error.message}`;
      setAddressError(message);
      toast.error(message);
    } finally {
      if (isMountedRef.current) {
        setLoadingAddress(false);
        setTimeout(() => {
          isGeneratingAddressRef.current = false;
        }, 2000);
      }
    }
  };

  const handleDeposit = async () => {
    if (!isAuthenticated || !hasValidToken()) {
      toast.error("Please log in to make a deposit");
      navigate("/login");
      return;
    }
    if (!selectedCrypto || parsedAmount <= 0) {
      toast.error("Please select a cryptocurrency and enter a valid amount.");
      return;
    }
    if (parsedAmount < 10) {
      toast.error("Minimum deposit amount is $10");
      return;
    }
    if (!selectedMethodHasAddress) {
      const message = `${
        selectedMethodConfig?.currencyName || selectedCrypto || "Selected asset"
      } deposit address is not configured yet`;
      setAddressError(message);
      toast.error(message);
      return;
    }
    if (generatedAddress?.depositId && generatedAddress?.depositData?.amount === parsedAmount) {
      setCurrentDepositAmount(parsedAmount);
      setShowSuccess(true);
      return;
    }
    if (processingDeposit) return;
    setProcessingDeposit(true);
    try {
      await generateDepositAddress(`deposit-${selectedCrypto}-${parsedAmount}-${Date.now()}`);
    } finally {
      if (isMountedRef.current) setProcessingDeposit(false);
    }
  };

  const refreshAddress = () => {
    if (selectedMethod && parsedAmount >= 10 && generatedAddress && !generatedAddress.isPreview) {
      setAddressError(null);
      generateDepositAddress(`refresh-${selectedCrypto}-${parsedAmount}-${Date.now()}`);
    }
  };

  const copyToClipboard = async () => {
    if (!generatedAddress?.address) return;
    await navigator.clipboard.writeText(generatedAddress.address);
    toast.success("Address copied to clipboard!");
  };

  const qrCodeUrl = (value) => `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(value)}`;

  const renderCryptoOptions = () => {
    if (loadingMethods) return <div className={`p-4 text-sm ${quiet}`}>Loading deposit methods...</div>;
    if (depositMethods.length === 0) return <div className={`p-4 text-sm ${quiet}`}>No deposit methods available</div>;
    return depositMethods.map((method) => {
      const option = cryptoOptions.find((item) => item.code === method.currencyCode);
      const isAvailable = Boolean(option && method.isConfigured && method.walletAddress);
      const isSelected = selectedCrypto === method.currencyCode;
      const unavailableReason = !option
        ? `${method.currencyCode} is not configured in frontend`
        : `${method.currencyName} deposit address is not configured yet`;
      return (
        <button
          key={method.id}
          type="button"
          onClick={() => (isAvailable ? handleCryptoSelect(method.currencyCode) : toast.error(unavailableReason))}
          className={`mx-2 my-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-2xl border p-3.5 text-left transition ${isAvailable ? isDark ? "border-white/8 bg-white/[0.04] hover:border-cyan-400/35 hover:bg-cyan-400/10" : "border-slate-200/80 bg-white hover:border-cyan-300 hover:bg-cyan-50/70" : "cursor-not-allowed border-rose-500/20 bg-rose-500/10 opacity-60"} ${isSelected ? isDark ? "border-cyan-400/40 bg-cyan-400/12" : "border-cyan-400 bg-cyan-50" : ""}`}
        >
          <span className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${isDark ? "border-white/10 bg-slate-950/80" : "border-slate-200 bg-slate-50"}`}>
            {option ? renderCryptoIcon(option) : <RefreshCw className="h-4 w-4 text-slate-400" strokeWidth={2.2} />}
          </span>
          <span className="flex-1">
            <span className="block font-medium">{method.currencyName}</span>
            <span className={`block text-xs ${quiet}`}>
              {isAvailable ? `Network: ${method.network}` : "Address not configured"}
            </span>
          </span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold tracking-[0.16em] ${isDark ? "bg-slate-950/80 text-slate-300" : "bg-slate-100 text-slate-700"}`}>{method.currencyCode}</span>
        </button>
      );
    });
  };

  if (authError) {
    return (
      <div className={`relative min-h-screen overflow-hidden ${page}`}>
        <div className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-10">
          <div className={`w-full rounded-[2rem] border p-8 text-center shadow-[0_24px_70px_rgba(15,23,42,0.2)] ${shell}`}>
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
              <TriangleAlert className="h-6 w-6 text-red-500" strokeWidth={2.2} />
            </div>
            <p className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${accent}`}>Access Required</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">Sign in to open the funding desk</h2>
            <p className={`mt-3 text-sm ${label}`}>Deposit routing, wallet generation, and transaction tracking are only available to authenticated accounts.</p>
            <button onClick={() => navigate("/login")} className="mt-6 w-full rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 px-4 py-3.5 font-semibold text-white shadow-[0_18px_40px_rgba(20,184,166,0.32)]">Go to Login</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen overflow-hidden ${page}`}>
      <div className="pointer-events-none absolute right-[-8rem] top-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute left-[-6rem] bottom-12 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_380px]">
          <section className={`rounded-[2rem] border p-5 shadow-[0_24px_70px_rgba(15,23,42,0.2)] sm:p-6 ${shell}`}>
            <div className={`rounded-[1.7rem] border p-5 ${card}`}>
              <p className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${accent}`}>Funding Desk</p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-[2.5rem]">Fund your wallet with cleaner routing.</h1>
              <p className={`mt-3 max-w-2xl text-sm leading-6 ${label}`}>Choose a network, set the amount, and generate a deposit address tied to your funding request.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className={`rounded-2xl border p-4 ${card}`}><p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${quiet}`}>Minimum</p><p className="mt-2 text-lg font-semibold">$10</p></div>
                <div className={`rounded-2xl border p-4 ${card}`}><p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${quiet}`}>Funding Fee</p><p className="mt-2 text-lg font-semibold">1%</p></div>
                <div className={`rounded-2xl border p-4 ${card}`}><p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${quiet}`}>Route</p><p className="mt-2 text-lg font-semibold">{selectedMethod?.name || "Select asset"}</p></div>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div className={`rounded-[1.6rem] border p-5 ${card}`}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className={`text-sm font-semibold ${label}`}>Deposit Method</p>
                    <p className={`mt-1 text-xs ${quiet}`}>Pick the network you want to use.</p>
                  </div>
                  <button type="button" onClick={refreshAddress} disabled={loadingAddress || !selectedMethod || parsedAmount < 10 || !generatedAddress || generatedAddress?.isPreview} className={`inline-flex h-10 w-10 items-center justify-center rounded-full border ${isDark ? "border-white/10 bg-slate-900/70 text-cyan-300" : "border-slate-200 bg-white text-cyan-700"} ${loadingAddress || !selectedMethod || parsedAmount < 10 || !generatedAddress || generatedAddress?.isPreview ? "opacity-50" : ""}`}><RefreshCw className={`${loadingAddress ? "animate-spin" : ""} h-4.5 w-4.5`} strokeWidth={2.3} /></button>
                </div>
                <div className="relative">
                  <button type="button" onClick={() => setShowMethods((prev) => !prev)} disabled={loadingMethods} className={`w-full rounded-[1.35rem] border px-4 py-4 text-left ${isDark ? "border-white/10 bg-slate-950/70" : "border-slate-200 bg-white"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${isDark ? "border-white/10 bg-slate-900/80" : "border-slate-200 bg-slate-50"}`}>{selectedMethod ? renderCryptoIcon(selectedMethod) : <Coins className="h-5 w-5 text-slate-400" strokeWidth={2.2} />}</span>
                        <div className="min-w-0">
                          <div className="font-medium">{selectedMethod?.name || "Select a cryptocurrency"}</div>
                          <div className={`truncate text-xs ${quiet}`}>Network: {selectedMethodConfig?.network || "Awaiting selection"}</div>
                        </div>
                      </div>
                      <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${showMethods ? "rotate-180" : ""}`} strokeWidth={2.3} />
                    </div>
                  </button>
                  {showMethods ? <div className={`absolute z-20 mt-3 max-h-80 w-full overflow-y-auto rounded-[1.4rem] border ${isDark ? "border-white/10 bg-slate-950/95" : "border-slate-200 bg-white/95"}`}>{renderCryptoOptions()}</div> : null}
                </div>
              </div>

              <div className={`rounded-[1.6rem] border p-5 ${card}`}>
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <div>
                    <label className={`block text-sm font-semibold ${label}`}>Amount (USD)</label>
                    <div className="relative mt-3">
                      <span className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 ${quiet}`}>$</span>
                      <input type="number" value={amount} min="10" step="0.01" onChange={(event) => setAmount(event.target.value)} className={`${input} pl-9`} placeholder="Enter amount" />
                    </div>
                    {parsedAmount < 10 && parsedAmount > 0 ? <p className="mt-2 text-xs text-rose-400">Minimum deposit amount is $10.</p> : null}
                    <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      {[50, 100, 500, 1000].map((quickAmount) => (
                        <button key={quickAmount} type="button" onClick={() => setAmount(String(quickAmount))} className={`rounded-2xl px-4 py-3 text-sm font-semibold ${Number(amount) === quickAmount ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white" : isDark ? "border border-white/10 bg-slate-900/70 text-slate-200" : "border border-slate-200 bg-white text-slate-700"}`}>${quickAmount}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className={`rounded-2xl border p-4 ${card}`}><p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${quiet}`}>Fee</p><p className="mt-2 text-2xl font-semibold">${fee}</p></div>
                    <div className={`rounded-2xl border p-4 ${card}`}><p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${quiet}`}>Total</p><p className="mt-2 text-2xl font-semibold">${total}</p></div>
                  </div>
                </div>
              </div>

              <button onClick={handleDeposit} disabled={!selectedMethod || !selectedMethodHasAddress || processingDeposit || !isAuthenticated || parsedAmount < 10} className={`w-full rounded-[1.45rem] px-5 py-4 text-base font-semibold text-white ${!selectedMethod || !selectedMethodHasAddress || processingDeposit || !isAuthenticated || parsedAmount < 10 ? "bg-slate-400" : "bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 shadow-[0_18px_45px_rgba(20,184,166,0.28)]"}`}>{processingDeposit ? "Preparing Deposit Route..." : !selectedMethod ? "Select Deposit Method" : !selectedMethodHasAddress ? "Address Not Configured" : parsedAmount < 10 ? "Minimum $10 Required" : `Confirm $${parsedAmount} Deposit`}</button>
            </div>
          </section>

          <aside className={`rounded-[2rem] border p-5 shadow-[0_24px_70px_rgba(15,23,42,0.2)] sm:p-6 ${shell}`}>
            <p className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${accent}`}>Settlement Workspace</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">Payment details and address routing</h2>
            <p className={`mt-2 text-sm leading-6 ${label}`}>Review the destination, copy the address, or scan the QR code once the route is ready.</p>
            {addressError ? <div className={`mt-5 rounded-2xl border p-4 ${isDark ? "border-rose-500/25 bg-rose-500/10" : "border-rose-200 bg-rose-50"}`}><p className={`text-sm ${isDark ? "text-rose-100" : "text-rose-800"}`}>{addressError}</p></div> : null}
            <div className={`mt-5 rounded-[1.6rem] border p-5 ${card}`}>
              <label className={`block text-sm font-semibold ${label}`}>Deposit Address</label>
              <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_72px]">
                <div className={`flex min-h-[72px] min-w-0 items-center rounded-[1.3rem] border px-4 ${isDark ? "border-white/10 bg-slate-950/70" : "border-slate-200 bg-white"}`}>
                  <QrCode className="mr-3 h-5 w-5 shrink-0 text-cyan-400" strokeWidth={2.2} />
                  <span className="min-w-0 flex-1 break-all font-mono text-sm sm:truncate sm:break-normal">{selectedMethod ? loadingAddress ? "Generating address..." : generatedAddress?.address || "No deposit address configured for this method" : "Select a cryptocurrency first"}</span>
                </div>
                <button type="button" onClick={copyToClipboard} disabled={!generatedAddress?.address} className={`inline-flex h-[72px] w-full shrink-0 items-center justify-center rounded-[1.3rem] border bg-gradient-to-br from-cyan-500 to-emerald-500 ${!generatedAddress?.address ? "opacity-50" : "shadow-[0_16px_36px_rgba(20,184,166,0.25)]"}`}><Copy className="h-4.5 w-4.5 text-white" strokeWidth={2.2} /></button>
              </div>
            </div>
            {selectedMethod && generatedAddress?.address && !loadingAddress ? (
              <div className={`mt-5 rounded-[1.6rem] border p-5 ${card}`}>
                <div className={`mx-auto w-fit rounded-[1.35rem] p-4 ${isDark ? "bg-white" : "bg-slate-950"}`}>
                  <img src={qrCodeUrl(generatedAddress.address)} alt={`${selectedMethod.name} QR code`} className="h-40 w-40" />
                </div>
                <p className={`mt-4 text-center text-sm leading-6 ${label}`}>Scan the QR code or copy the wallet address above to fund your account. Credit is applied after network confirmations.</p>
              </div>
            ) : (
              <div className={`mt-5 rounded-[1.6rem] border p-10 text-center ${card}`}>
                <div className={`mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full ${isDark ? "bg-slate-900/80 text-cyan-300" : "bg-cyan-50 text-cyan-700"}`}>{loadingAddress ? <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-cyan-500" /> : <QrCode className="h-8 w-8" strokeWidth={2.2} />}</div>
                <p className={`text-sm leading-6 ${label}`}>{loadingAddress ? "Generating your deposit address..." : !selectedMethod ? "Select a cryptocurrency to preview the payment route." : !selectedMethodHasAddress ? "This deposit route is unavailable until its wallet address is configured in the server environment." : parsedAmount < 10 ? "Enter an amount above the minimum to activate address generation." : "Address preview is ready. Confirm the deposit once you are ready to send funds."}</p>
              </div>
            )}
            <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {[{ label: "Network", value: selectedMethodConfig?.network || "Awaiting selection" }, { label: "Preview Amount", value: `$${parsedAmount.toFixed(2)}` }, { label: "Confirmation", value: "After network confirmations" }].map((item) => (
                <div key={item.label} className={`rounded-2xl border p-4 ${card}`}><p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${quiet}`}>{item.label}</p><p className="mt-2 text-sm font-semibold leading-6">{item.value}</p></div>
              ))}
            </div>
          </aside>
        </div>
      </div>

      {showSuccess && generatedAddress ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-[2rem] border p-8 text-center ${shell}`}>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/25"><CheckCircle2 className="h-10 w-10 text-emerald-500" strokeWidth={2.2} /></div>
            <p className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${accent}`}>Deposit Submitted</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight">Wallet address generated successfully</h2>
            <p className={`mt-3 text-sm leading-6 ${label}`}>Your deposit of <strong>${currentDepositAmount}</strong> is pending. Send your {selectedMethod?.name} to the address below to complete funding.</p>
            <div className={`mt-5 rounded-2xl border p-4 ${card}`}><p className="break-all font-mono text-xs">{generatedAddress.address}</p></div>
            <button onClick={() => setShowSuccess(false)} className="mt-6 w-full rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 px-4 py-3.5 font-semibold text-white shadow-[0_18px_40px_rgba(20,184,166,0.3)]">Continue</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
