import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "react-hot-toast";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { API_BASE_URL } from "../../config/api";

const formatUsd = (value) => `$${Number(value || 0).toFixed(2)}`;

const getToken = () =>
  (localStorage.getItem("authToken") || "").replace(/^["']|["']$/g, "").trim();

const filterProofsByStatus = (proofs = [], statusFilter = "pending") => {
  if (statusFilter === "all") return proofs;
  return proofs.filter(
    (proof) => `${proof?.status || ""}`.toLowerCase() === statusFilter
  );
};

const statusTone = {
  Pending:
    "border-amber-500/20 bg-amber-500/10 text-amber-500 dark:text-amber-300",
  Approved:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  Rejected:
    "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-300",
};

export default function PaymentProofReview() {
  const { theme, resolvedTheme } = useTheme();
  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";
  const [proofs, setProofs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedProofId, setSelectedProofId] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");

  const fetchProofs = async () => {
    try {
      setIsLoading(true);
      setError("");
      const token = getToken();
      if (!token) {
        throw new Error("Missing admin token");
      }

      const response = await fetch(`${API_BASE_URL}/Admin/PaymentProofs`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Failed to load payment proofs");
      }

      const nextProofs = Array.isArray(result.data) ? result.data : [];
      setProofs(nextProofs);
      setSelectedProofId((current) => {
        const nextFilteredProofs = filterProofsByStatus(nextProofs, statusFilter);
        if (current && nextFilteredProofs.some((proof) => proof.id === current)) {
          return current;
        }
        return nextFilteredProofs[0]?.id || "";
      });
    } catch (nextError) {
      console.error("Payment proof admin load failed:", nextError);
      setError(nextError.message || "Unable to load payment proofs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProofs();
  }, []);

  const filteredProofs = useMemo(() => {
    return filterProofsByStatus(proofs, statusFilter);
  }, [proofs, statusFilter]);

  const stats = useMemo(
    () => ({
      total: proofs.length,
      pending: proofs.filter((proof) => proof.status === "Pending").length,
      approved: proofs.filter((proof) => proof.status === "Approved").length,
      rejected: proofs.filter((proof) => proof.status === "Rejected").length,
    }),
    [proofs]
  );

  const selectedProof = useMemo(
    () =>
      filteredProofs.find((proof) => proof.id === selectedProofId) ||
      filteredProofs[0] ||
      null,
    [filteredProofs, selectedProofId]
  );

  useEffect(() => {
    setReviewNotes(selectedProof?.reviewNotes || "");
  }, [selectedProof?.id, selectedProof?.reviewNotes]);

  useEffect(() => {
    if (!filteredProofs.length) {
      setSelectedProofId("");
      return;
    }

    if (!filteredProofs.some((proof) => proof.id === selectedProofId)) {
      setSelectedProofId(filteredProofs[0]?.id || "");
    }
  }, [filteredProofs, selectedProofId]);

  const handleUpdateStatus = async (status) => {
    if (!selectedProof) return;

    try {
      setProcessingStatus(status);
      const token = getToken();
      if (!token) {
        throw new Error("Missing admin token");
      }

      const response = await fetch(
        `${API_BASE_URL}/Admin/PaymentProofs/${selectedProof.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            status,
            reviewNotes: reviewNotes.trim(),
          }),
        }
      );

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Failed to update payment proof");
      }

      const updatedProof = result.data;
      const nextProofs = proofs.map((proof) =>
        proof.id === updatedProof.id ? updatedProof : proof
      );
      const nextFilteredProofs = filterProofsByStatus(nextProofs, statusFilter);
      const nextSelectedProof =
        nextFilteredProofs.find((proof) => proof.id !== updatedProof.id) ||
        nextFilteredProofs.find((proof) => proof.id === updatedProof.id) ||
        nextFilteredProofs[0] ||
        null;

      setProofs(nextProofs);
      setSelectedProofId(nextSelectedProof?.id || "");
      toast.success(`Payment proof marked ${status.toLowerCase()}.`);
    } catch (nextError) {
      console.error("Payment proof review failed:", nextError);
      toast.error(nextError.message || "Unable to update payment proof.");
    } finally {
      setProcessingStatus("");
    }
  };

  const shellClass = isDark
    ? "border-slate-700 bg-slate-950/60"
    : "border-slate-200 bg-white";
  const mutedClass = isDark ? "text-slate-400" : "text-slate-500";

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Payment Proof Review</h3>
              <p className={`mt-1 text-sm ${mutedClass}`}>
                Pending proofs stay in the active queue. Approved or rejected proofs move out of that queue and remain available through history filters.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="pending">Pending only</option>
                <option value="all">All proofs</option>
                <option value="approved">Approved only</option>
                <option value="rejected">Rejected only</option>
              </select>
              <Button variant="outline" onClick={fetchProofs} disabled={isLoading}>
                {isLoading ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {[
              ["Total", stats.total],
              ["Pending", stats.pending],
              ["Approved", stats.approved],
              ["Rejected", stats.rejected],
            ].map(([label, value]) => (
              <div
                key={label}
                className={`rounded-xl border p-4 ${shellClass}`}
              >
                <p className={`text-xs uppercase tracking-[0.18em] ${mutedClass}`}>{label}</p>
                <p className="mt-2 text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </div>

          {error ? (
            <div className="mt-5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
              {error}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[380px,minmax(0,1fr)]">
        <Card>
          <CardContent className="pt-6">
            <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-500">
              {statusFilter === "pending" ? "Pending Review Queue" : "Payment Proof History"}
            </h4>
            <div className="mt-4 space-y-3">
              {filteredProofs.length === 0 ? (
                <div className={`rounded-xl border p-4 text-sm ${shellClass}`}>
                  {statusFilter === "pending"
                    ? "No pending payment proofs right now."
                    : "No payment proofs match this filter."}
                </div>
              ) : (
                filteredProofs.map((proof) => (
                  <button
                    key={proof.id}
                    type="button"
                    onClick={() => setSelectedProofId(proof.id)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      selectedProof?.id === proof.id
                        ? "border-teal-500 bg-teal-500/10"
                        : shellClass
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{proof.userName || "Unknown user"}</p>
                        <p className={`mt-1 text-xs ${mutedClass}`}>{proof.userEmail || "No email"}</p>
                      </div>
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold ${
                          statusTone[proof.status] || shellClass
                        }`}
                      >
                        {proof.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-medium">{formatUsd(proof.amount)}</p>
                    <p className={`mt-1 text-xs ${mutedClass}`}>
                      {proof.reason || "No reason provided"}
                    </p>
                    <p className={`mt-2 text-[11px] ${mutedClass}`}>
                      {proof.createdAt
                        ? new Date(proof.createdAt).toLocaleString()
                        : "No date"}
                    </p>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {!selectedProof ? (
              <div className={`rounded-xl border p-6 text-sm ${shellClass}`}>
                Select a payment proof to review.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h4 className="text-xl font-semibold">
                      {selectedProof.userName || "Unknown user"}
                    </h4>
                    <p className={`mt-1 text-sm ${mutedClass}`}>
                      {selectedProof.userEmail || "No email"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                      statusTone[selectedProof.status] || shellClass
                    }`}
                  >
                    {selectedProof.status}
                  </span>
                </div>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr),320px]">
                  <div className={`overflow-hidden rounded-2xl border ${shellClass}`}>
                    {selectedProof.proofImage ? (
                      <img
                        src={selectedProof.proofImage}
                        alt={`Payment proof ${selectedProof.id}`}
                        className="h-full max-h-[520px] w-full object-contain bg-slate-950/80"
                      />
                    ) : (
                      <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-400">
                        No proof image available.
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className={`rounded-xl border p-4 ${shellClass}`}>
                      <p className={`text-xs uppercase tracking-[0.18em] ${mutedClass}`}>Amount</p>
                      <p className="mt-2 text-xl font-semibold">{formatUsd(selectedProof.amount)}</p>
                    </div>
                    <div className={`rounded-xl border p-4 ${shellClass}`}>
                      <p className={`text-xs uppercase tracking-[0.18em] ${mutedClass}`}>Reason</p>
                      <p className="mt-2 text-sm leading-6">{selectedProof.reason}</p>
                    </div>
                    <div className={`rounded-xl border p-4 ${shellClass}`}>
                      <p className={`text-xs uppercase tracking-[0.18em] ${mutedClass}`}>File</p>
                      <p className="mt-2 text-sm">{selectedProof.fileName || "Uploaded image"}</p>
                      <p className={`mt-1 text-xs ${mutedClass}`}>
                        {selectedProof.mimeType || "Unknown type"} • {Math.round((selectedProof.fileSize || 0) / 1024)} KB
                      </p>
                    </div>
                    <div className={`rounded-xl border p-4 ${shellClass}`}>
                      <p className={`text-xs uppercase tracking-[0.18em] ${mutedClass}`}>Timeline</p>
                      <p className="mt-2 text-sm">
                        Submitted:{" "}
                        {selectedProof.createdAt
                          ? new Date(selectedProof.createdAt).toLocaleString()
                          : "Unknown"}
                      </p>
                      <p className={`mt-1 text-sm ${mutedClass}`}>
                        Reviewed:{" "}
                        {selectedProof.reviewedAt
                          ? new Date(selectedProof.reviewedAt).toLocaleString()
                          : "Not reviewed yet"}
                      </p>
                      {selectedProof.reviewedByEmail ? (
                        <p className={`mt-1 text-sm ${mutedClass}`}>
                          Reviewer: {selectedProof.reviewedByEmail}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className={`rounded-xl border p-4 ${shellClass}`}>
                  <label className="block text-sm font-medium">Review note</label>
                  <textarea
                    value={reviewNotes}
                    onChange={(event) => setReviewNotes(event.target.value)}
                    rows={4}
                    placeholder="Add a short note for the user if needed"
                    className="mt-3 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleUpdateStatus("Approved")}
                      disabled={processingStatus !== ""}
                    >
                      {processingStatus === "Approved" ? "Approving..." : "Approve"}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleUpdateStatus("Rejected")}
                      disabled={processingStatus !== ""}
                    >
                      {processingStatus === "Rejected" ? "Rejecting..." : "Reject"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateStatus("Pending")}
                      disabled={processingStatus !== ""}
                    >
                      {processingStatus === "Pending" ? "Resetting..." : "Move Back To Pending"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
