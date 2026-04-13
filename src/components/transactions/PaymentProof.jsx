import { useState, useRef, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import {
  CheckCircle2,
  CircleX,
  Clock3,
  CloudUpload,
  History,
  ReceiptText,
  Trash2,
  Upload,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import { useUser } from "../../context/UserContext";
import PaginationControls from "../ui/PaginationControls";

export default function PaymentProofPage() {
  const { theme } = useTheme();
  const { getAuthToken } = useUser();
  const [selectedFile, setSelectedFile] = useState(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [paymentProofs, setPaymentProofs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(Number(value) || 0);

  const fetchPaymentProofs = async () => {
    const token = getAuthToken?.();
    if (!token) {
      setErrorMessage("Please log in to view payment proofs.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/PaymentProof`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Failed to load payment proofs");
      }

      setErrorMessage("");
      setPaymentProofs(result.data || []);
    } catch (error) {
      console.error("Failed to fetch payment proofs:", error);
      setErrorMessage(error.message || "Unable to load payment proofs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentProofs();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, paymentProofs.length]);

  const totalPages = Math.max(1, Math.ceil(paymentProofs.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedProofs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return paymentProofs.slice(start, start + pageSize);
  }, [paymentProofs, currentPage, pageSize]);

  const paymentProofStats = useMemo(() => {
    const pendingCount = paymentProofs.filter(
      (proof) => `${proof?.status || ""}`.toLowerCase() === "pending"
    ).length;
    const approvedAmount = paymentProofs
      .filter((proof) => `${proof?.status || ""}`.toLowerCase() === "approved")
      .reduce((sum, proof) => sum + (Number(proof?.amount) || 0), 0);

    return {
      total: paymentProofs.length,
      pendingCount,
      approvedAmount,
    };
  }, [paymentProofs]);

  const pageShellClass =
    theme === "dark"
      ? "bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(14,165,233,0.12),transparent_26%),linear-gradient(180deg,#020617_0%,#020617_38%,#0f172a_100%)] text-slate-100"
      : "bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(14,165,233,0.1),transparent_26%),linear-gradient(180deg,#f8fafc_0%,#eef6ff_100%)] text-slate-900";
  const heroPanelClass =
    theme === "dark"
      ? "border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(2,6,23,0.86))] shadow-[0_32px_80px_rgba(2,8,23,0.52)]"
      : "border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(236,254,255,0.94))] shadow-[0_28px_70px_rgba(15,23,42,0.10)]";
  const glassPanelClass =
    theme === "dark"
      ? "border-white/10 bg-slate-900/72 shadow-[0_24px_70px_rgba(2,8,23,0.42)] backdrop-blur-xl"
      : "border-white/70 bg-white/90 shadow-[0_22px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl";
  const softPanelClass =
    theme === "dark"
      ? "border-white/8 bg-white/[0.04]"
      : "border-slate-200/80 bg-slate-50/90";
  const mutedTextClass = theme === "dark" ? "text-slate-400" : "text-slate-600";

  const getProofStatusClasses = (status) => {
    const normalizedStatus = `${status || ""}`.toLowerCase();
    if (normalizedStatus === "approved") {
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
    }
    if (normalizedStatus === "pending") {
      return "border-amber-500/20 bg-amber-500/10 text-amber-400";
    }
    return "border-rose-500/20 bg-rose-500/10 text-rose-400";
  };

  const validateFile = (file) => {
    if (!file) return "Please select a file to upload.";
    if (!file.type.startsWith("image/")) {
      return "Only image files are allowed.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 5MB.";
    }
    return "";
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const error = validateFile(file);
    if (error) {
      setErrorMessage(error);
      setSelectedFile(null);
      return;
    }
    setErrorMessage("");
    setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    const error = validateFile(file);
    if (error) {
      setErrorMessage(error);
      setSelectedFile(null);
      return;
    }
    setErrorMessage("");
    setSelectedFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const token = getAuthToken?.();
    if (!token) {
      setErrorMessage("Please log in to submit payment proof.");
      return;
    }

    const fileError = validateFile(selectedFile);
    if (fileError) {
      setErrorMessage(fileError);
      return;
    }

    if (!amount || !reason) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("PaymentProof", selectedFile);
      formData.append("amount", amount);
      formData.append("reason", reason);

      const response = await fetch(`${API_BASE_URL}/PaymentProof/Submit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Failed to submit payment proof");
      }

      const newProof = {
        id: result.data?.id,
        amount: result.data?.amount ?? Number(amount),
        reason: result.data?.reason ?? reason,
        status: result.data?.status ?? "Pending",
        createdAt: result.data?.createdAt ?? new Date().toISOString(),
      };

      setPaymentProofs((prev) => [newProof, ...prev]);
      setSuccessMessage("Payment proof submitted successfully.");

      setSelectedFile(null);
      setAmount("");
      setReason("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Payment proof submission failed:", error);
      setErrorMessage(error.message || "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`min-h-screen px-4 py-10 sm:px-6 lg:px-8 ${pageShellClass}`}
    >
      <div className="mx-auto w-full max-w-[1400px]">
        <section
          className={`relative mb-10 overflow-hidden rounded-[32px] border px-6 py-7 sm:px-8 lg:px-10 ${heroPanelClass}`}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-16 top-0 h-40 w-40 rounded-full bg-teal-400/18 blur-3xl" />
            <div className="absolute right-0 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full bg-cyan-400/14 blur-3xl" />
          </div>
          <div className="relative space-y-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-3 rounded-full border border-teal-400/15 bg-teal-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-teal-300">
                <Upload className="h-4 w-4" strokeWidth={2.2} />
                Payment Proof Desk
              </div>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
                  Upload confirmations with a cleaner review workflow.
                </h1>
                <p className={`max-w-2xl text-sm leading-7 sm:text-base ${mutedTextClass}`}>
                  Submit proof, track approval progress, and review your recent payment evidence from one sharper workspace.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className={`rounded-[24px] border p-5 ${softPanelClass}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400/80">
                  Submitted
                </p>
                <p className="mt-3 text-3xl font-semibold">{paymentProofStats.total}</p>
              </div>
              <div className={`rounded-[24px] border p-5 ${softPanelClass}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-400/80">
                  Pending Review
                </p>
                <p className="mt-3 text-3xl font-semibold">{paymentProofStats.pendingCount}</p>
              </div>
              <div className={`rounded-[24px] border p-5 ${softPanelClass}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400/80">
                  Approved Volume
                </p>
                <p className="mt-3 text-3xl font-semibold">
                  {formatCurrency(paymentProofStats.approvedAmount)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="w-full">
        {/* Upload Card */}
        <div
          className={`mb-10 rounded-[30px] border p-5 md:p-6 md:mb-12 ${glassPanelClass}`}
        >
          <div className="flex items-center mb-4 md:mb-5">
            <div
              className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-3 md:mr-4 ${
                theme === "dark"
                  ? "bg-teal-900/30 text-teal-400"
                  : "bg-teal-500/20 text-teal-600"
              }`}
            >
              <Upload className="h-5 w-5 md:h-6 md:w-6" strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold">
                Upload Payment Proof
              </h2>
              <p
                className={`text-xs md:text-sm ${mutedTextClass}`}
              >
                Submit confirmations, receipts, and wallet funding evidence
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {(errorMessage || successMessage) && (
              <div
                className={`rounded-xl px-4 py-3 text-sm ${
                  errorMessage
                    ? "bg-red-500/10 text-red-500 border border-red-500/30"
                    : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                }`}
              >
                {errorMessage || successMessage}
              </div>
            )}
            {/* File Upload Section */}
            <div>
              <label
                className={`block mb-2 text-sm font-medium md:text-base ${mutedTextClass}`}
              >
                Upload Image
              </label>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current.click()}
                className={`cursor-pointer rounded-[24px] border-2 border-dashed p-4 text-center transition-all md:p-6 ${
                  theme === "dark"
                    ? isDragging
                      ? "border-teal-400 bg-teal-500/10"
                      : "border-white/10 bg-white/[0.03] hover:border-teal-400 hover:bg-white/[0.05]"
                    : isDragging
                    ? "border-teal-500 bg-teal-50"
                    : "border-slate-200 bg-slate-50/80 hover:border-teal-500 hover:bg-teal-50/70"
                }`}
              >
                <div className="flex flex-col items-center justify-center">
                  {selectedFile ? (
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div
                            className={`w-10 h-10 rounded flex items-center justify-center mr-3 ${
                              theme === "dark"
                                ? "bg-slate-700 text-teal-400"
                                : "bg-slate-200 text-teal-600"
                            }`}
                          >
                            <ReceiptText className="h-5 w-5" strokeWidth={2.2} />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-sm md:text-base truncate max-w-[150px] md:max-w-xs">
                              {selectedFile.name}
                            </p>
                            <p
                              className={`text-xs ${mutedTextClass}`}
                            >
                              {Math.round(selectedFile.size / 1024)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile();
                          }}
                          className={`p-2 rounded-full ${
                            theme === "dark"
                              ? "hover:bg-slate-700"
                              : "hover:bg-slate-200"
                          }`}
                        >
                          <Trash2
                            className={`h-4 w-4 ${
                              theme === "dark" ? "text-red-400" : "text-red-500"
                            }`}
                            strokeWidth={2.2}
                          />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current.click();
                        }}
                            className={`mt-2 px-4 py-2 rounded-lg text-sm ${
                              theme === "dark"
                                ? "bg-white/[0.06] hover:bg-white/[0.1]"
                                : "bg-white hover:bg-slate-100"
                            }`}
                          >
                            Change File
                      </button>
                    </div>
                  ) : (
                    <>
                      <div
                        className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-3 ${
                          theme === "dark"
                            ? "bg-slate-700 text-teal-400"
                            : "bg-slate-200 text-teal-600"
                        }`}
                      >
                        <CloudUpload className="h-7 w-7 md:h-8 md:w-8" strokeWidth={2.2} />
                      </div>
                      <p className="font-medium mb-1 text-sm md:text-base">
                        Click to upload or drag and drop
                      </p>
                      <p
                        className={`text-xs md:text-sm ${mutedTextClass}`}
                      >
                        PNG, JPG, GIF (MAX. 5MB)
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  ref={fileInputRef}
                />
              </div>
            </div>

            {/* Amount and Reason Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              <div>
                <label
                  className={`block mb-2 text-sm font-medium md:text-base ${mutedTextClass}`}
                >
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className={`w-full pl-8 pr-4 py-2 md:py-3 rounded-xl focus:ring-2 focus:outline-none text-sm md:text-base ${
                      theme === "dark"
                        ? "border border-white/10 bg-white/[0.04] focus:border-teal-400 focus:ring-teal-500"
                        : "border border-slate-200 bg-white/85 focus:border-teal-500 focus:ring-teal-500"
                    }`}
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block mb-2 text-sm font-medium md:text-base ${mutedTextClass}`}
                >
                  Reason
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason"
                  className={`w-full px-4 py-2 md:py-3 rounded-xl focus:ring-2 focus:outline-none text-sm md:text-base ${
                    theme === "dark"
                      ? "border border-white/10 bg-white/[0.04] focus:border-teal-400 focus:ring-teal-500"
                      : "border border-slate-200 bg-white/85 focus:border-teal-500 focus:ring-teal-500"
                  }`}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-4 rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-500 p-px shadow-lg shadow-teal-500/20">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full p-3 md:p-4 rounded-xl text-white text-base md:text-lg font-bold transition-all ${
                  isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                } ${
                  theme === "dark"
                    ? "bg-gradient-to-r from-teal-600 to-teal-700"
                    : "bg-gradient-to-r from-teal-500 to-teal-600"
                }`}
              >
                {isSubmitting ? "Submitting..." : "Submit Payment Proof"}
              </button>
            </div>
          </form>
        </div>

        {/* Payment Proof Table */}
        <div
          className={`rounded-[30px] border p-5 md:p-6 ${glassPanelClass}`}
        >
          <div className="flex items-center mb-4 md:mb-6">
            <div
              className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mr-3 md:mr-4 ${
                theme === "dark"
                  ? "bg-slate-700 text-teal-400"
                  : "bg-slate-200 text-teal-600"
              }`}
            >
              <History className="h-5 w-5 md:h-6 md:w-6" strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-lg font-bold md:text-xl">Payment History</h2>
              <p className={`text-xs md:text-sm ${mutedTextClass}`}>
                Review every submitted proof with status, amount, and date.
              </p>
            </div>
          </div>

          {/* Responsive Table */}
          <div className={`overflow-x-auto rounded-[24px] border ${softPanelClass}`}>
            <table className="w-full min-w-[600px]">
              <thead>
                <tr
                  className={`border-b ${theme === "dark" ? "border-white/10" : "border-slate-200"}`}
                >
                  <th
                    className={`px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.24em] md:px-4 ${mutedTextClass}`}
                  >
                    ID
                  </th>
                  <th
                    className={`px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.24em] md:px-4 ${mutedTextClass}`}
                  >
                    Amount
                  </th>
                  <th
                    className={`px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.24em] md:px-4 ${mutedTextClass}`}
                  >
                    Reason
                  </th>
                  <th
                    className={`px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.24em] md:px-4 ${mutedTextClass}`}
                  >
                    Date
                  </th>
                  <th
                    className={`px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.24em] md:px-4 ${mutedTextClass}`}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center">
                      <div
                        className={`p-6 rounded-xl ${
                          theme === "dark"
                            ? "bg-white/[0.02]"
                            : "bg-slate-100"
                        }`}
                      >
                        <p
                          className={`text-base md:text-lg font-medium ${
                            theme === "dark"
                            ? "text-slate-300"
                            : "text-slate-700"
                          }`}
                        >
                          Loading payment proofs...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : paymentProofs.length > 0 ? (
                  paginatedProofs.map((proof, index) => (
                    <tr
                      key={proof.id}
                      className={`${
                        index % 2 === 0
                          ? theme === "dark"
                            ? "bg-slate-800/30"
                            : "bg-slate-100/50"
                          : ""
                      }`}
                    >
                      <td className="py-2 px-3 md:py-3 md:px-4 font-medium text-sm md:text-base">
                        {proof.id}
                      </td>
                      <td className="py-2 px-3 md:py-3 md:px-4 font-medium text-sm md:text-base">
                        {formatCurrency(proof.amount)}
                      </td>
                      <td className="py-2 px-3 md:py-3 md:px-4 text-sm md:text-base">
                        <div className="space-y-1">
                          <p>{proof.reason}</p>
                          {proof.reviewNotes ? (
                            <p className={`text-xs ${mutedTextClass}`}>
                              Review note: {proof.reviewNotes}
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td
                        className={`py-2 px-3 text-sm md:px-4 md:py-3 md:text-base ${mutedTextClass}`}
                      >
                        <div className="flex items-center">
                          <Clock3
                            className={`mr-2 h-3.5 w-3.5 ${
                              theme === "dark"
                                ? "text-gray-500"
                                : "text-gray-400"
                            }`}
                            strokeWidth={2.2}
                          />
                          {proof.createdAt
                            ? new Date(proof.createdAt).toLocaleDateString()
                            : "--"}
                        </div>
                      </td>
                      <td className="py-2 px-3 md:py-3 md:px-4">
                        <div className="space-y-1.5">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium md:px-3 md:py-1.5 md:text-sm ${getProofStatusClasses(proof.status)}`}
                          >
                            <div className="flex items-center">
                              {proof.status === "Approved" ? (
                                <CheckCircle2 className="mr-1 h-3.5 w-3.5 md:mr-2 md:h-4 md:w-4" strokeWidth={2.2} />
                              ) : proof.status === "Pending" ? (
                                <Clock3 className="mr-1 h-3.5 w-3.5 md:mr-2 md:h-4 md:w-4" strokeWidth={2.2} />
                              ) : (
                                <CircleX className="mr-1 h-3.5 w-3.5 md:mr-2 md:h-4 md:w-4" strokeWidth={2.2} />
                              )}
                              {proof.status}
                            </div>
                          </span>
                          {proof.reviewedAt ? (
                            <p className={`text-xs ${mutedTextClass}`}>
                              Reviewed {new Date(proof.reviewedAt).toLocaleDateString()}
                            </p>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center">
                      <div
                        className={`p-6 rounded-xl ${
                          theme === "dark" ? "bg-slate-800/30" : "bg-slate-100"
                        }`}
                      >
                        <div
                          className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                            theme === "dark"
                              ? "bg-slate-700 text-teal-400"
                              : "bg-slate-200 text-teal-600"
                          }`}
                        >
                          <ReceiptText className="h-7 w-7 md:h-8 md:w-8" strokeWidth={2.2} />
                        </div>
                        <p
                          className={`mb-2 text-base font-medium md:text-lg ${
                            theme === "dark" ? "text-slate-300" : "text-slate-700"
                          }`}
                        >
                          No Payment Proofs Yet
                        </p>
                        <p
                          className={`text-sm ${mutedTextClass}`}
                        >
                          Submit your first payment proof to get started
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {paymentProofs.length > 0 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={paymentProofs.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 20, 50]}
              itemLabel="payment proofs"
            />
          )}

          {paymentProofs.length > 0 && (
            <div
              className={`mt-4 p-3 rounded-xl text-center text-xs md:text-sm ${
                theme === "dark"
                  ? "border-white/10 bg-white/[0.03]"
                  : "border-slate-200 bg-slate-50/90"
              }`}
            >
              <p
                className={`flex items-center justify-center ${mutedTextClass}`}
              >
                <Clock3 className="mr-2 h-4 w-4" strokeWidth={2.2} />
                Showing {paginatedProofs.length} of {paymentProofs.length} payment proofs
              </p>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
