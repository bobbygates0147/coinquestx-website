import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileBadge2,
  Globe2,
  ImageIcon,
  Mail,
  MapPinned,
  RefreshCw,
  Search,
  ShieldCheck,
  Undo2,
  UserCircle2,
  XCircle,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import PaginationControls from "../../components/ui/PaginationControls";
import usePagination from "../../hooks/usePagination";

const ID_TYPE_LABELS = {
  passport: "Passport",
  national_id: "National ID",
  drivers_license: "Driver's License",
  residence_permit: "Residence Permit",
};

const getToken = () =>
  (localStorage.getItem("authToken") || "").replace(/^["']|["']$/g, "").trim();

const formatTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
};

const getStatusMeta = (status = "") => {
  const normalized = `${status}`.toLowerCase();

  if (normalized === "verified") {
    return {
      label: "Verified",
      badge: "border-emerald-400/25 bg-emerald-500/12 text-emerald-200",
      queueTone: "text-emerald-300",
      accent: "from-emerald-400/18 via-emerald-500/10 to-transparent",
    };
  }

  if (normalized === "rejected") {
    return {
      label: "Rejected",
      badge: "border-rose-400/25 bg-rose-500/12 text-rose-200",
      queueTone: "text-rose-300",
      accent: "from-rose-400/18 via-rose-500/10 to-transparent",
    };
  }

  return {
    label: "Pending",
    badge: "border-amber-400/25 bg-amber-500/12 text-amber-200",
    queueTone: "text-amber-300",
    accent: "from-amber-400/18 via-amber-500/10 to-transparent",
  };
};

const getFullName = (submission = {}) => {
  const value = [
    submission.legalFirstName,
    submission.legalMiddleName,
    submission.legalLastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return value || submission.name || "Unknown applicant";
};

const getInitials = (submission = {}) =>
  getFullName(submission)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "NA";

const getAddressText = (submission = {}) =>
  [
    submission.addressLine1,
    submission.addressLine2,
    submission.city,
    submission.stateProvince,
    submission.postalCode,
    submission.countryOfResidence,
  ]
    .filter(Boolean)
    .join(", ") || "No address submitted";

const getDocuments = (submission = {}) =>
  [
    {
      key: "front",
      label: "Document front",
      shortLabel: "Front",
      src: submission.documents?.front || submission.governmentId || "",
    },
    {
      key: "back",
      label: "Document back",
      shortLabel: "Back",
      src: submission.documents?.back || submission.governmentIdBack || "",
    },
    {
      key: "selfie",
      label: "Selfie with ID",
      shortLabel: "Selfie",
      src: submission.documents?.selfie || submission.selfie || "",
    },
  ].filter((item) => item.src);

const getSearchIndex = (submission = {}) =>
  [
    getFullName(submission),
    submission.email,
    submission.idNumber,
    submission.countryOfResidence,
    submission.issuingCountry,
    ID_TYPE_LABELS[submission.idType] || submission.idType,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

function ReviewPanel({ isDark, title, subtitle, icon: Icon, children, className = "" }) {
  return (
    <section
      className={`min-w-0 overflow-hidden rounded-[1.5rem] border border-slate-800 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.92))] p-5 ${className}`}
    >
      <div className="mb-4 flex items-start gap-3">
        <div
          className="rounded-2xl bg-slate-900 p-3 text-teal-200"
        >
          <Icon className="h-5 w-5" strokeWidth={2.3} />
        </div>
        <div className="min-w-0">
          <h5 className="text-base font-semibold text-white">{title}</h5>
          {subtitle && <p className="mt-1 text-sm leading-6 text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function FieldPair({ label, value, mono = false }) {
  return (
    <div className="min-w-0 rounded-[1.1rem] border border-slate-800/80 bg-slate-950/45 p-3 dark:border-slate-800/80 dark:bg-slate-950/45">
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className={`mt-2 break-words text-sm font-semibold text-white ${mono ? "font-mono text-[13px]" : ""}`}>
        {value || "Not provided"}
      </p>
    </div>
  );
}

function QueueCard({ submission, isSelected, isDark, onSelect }) {
  const documents = getDocuments(submission);
  const statusMeta = getStatusMeta(submission.status);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative w-full overflow-hidden rounded-[1.35rem] border p-4 text-left transition ${
        isSelected
          ? "border-teal-400/35 bg-slate-900"
          : "border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900/80"
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-r ${statusMeta.accent} opacity-70`}
      />

      <div className="relative min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white dark:text-white">
              {getFullName(submission)}
            </p>
            <p className="mt-1 break-all text-xs text-slate-400">{submission.email || "No email"}</p>
          </div>
          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${statusMeta.badge}`}>
            {statusMeta.label}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-slate-300">
            {ID_TYPE_LABELS[submission.idType] || submission.idType || "ID type pending"}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-slate-300">
            {submission.countryOfResidence || "Country pending"}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-slate-300">
            {documents.length}/3 docs
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
          <span>Submitted {formatTime(submission.submittedAt)}</span>
          <span className={statusMeta.queueTone}>
            {`${submission.reviewNotes || ""}`.trim() ? "Reviewer note added" : "No reviewer note"}
          </span>
        </div>
      </div>
    </button>
  );
}

export default function KYCReviewPage({ onStatusUpdated }) {
  const { theme, resolvedTheme } = useTheme();
  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";

  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [isUpdating, setIsUpdating] = useState("");
  const [lastSyncAt, setLastSyncAt] = useState(0);
  const [showProcessed, setShowProcessed] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [activeDocumentKey, setActiveDocumentKey] = useState("front");

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      const token = getToken();
      if (!token) throw new Error("Missing admin token");

      const response = await fetch(`${API_BASE_URL}/Admin/Kyc`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || `KYC fetch failed (${response.status})`);
      }

      setSubmissions(Array.isArray(result?.data) ? result.data : []);
      setLastSyncAt(Date.now());
    } catch (error) {
      console.error("Failed to load KYC submissions", error);
      setLoadError(error?.message || "Unable to sync KYC submissions.");
      setSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
    const intervalId = setInterval(fetchSubmissions, 15000);
    return () => clearInterval(intervalId);
  }, [fetchSubmissions]);

  const updateKycStatus = useCallback(
    async (submission, nextStatus, nextReviewNote = "") => {
      if (!submission?.userId) return;

      setIsUpdating(submission.userId);
      setLoadError("");

      try {
        const token = getToken();
        if (!token) throw new Error("Missing admin token");

        const response = await fetch(`${API_BASE_URL}/Admin/UpdateKycStatus`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            userId: submission.userId,
            status: nextStatus,
            reviewNotes: nextReviewNote.trim(),
          }),
        });

        const result = await response.json();
        if (!response.ok || !result?.success) {
          throw new Error(result?.message || `Update failed (${response.status})`);
        }

        const nowIso = new Date().toISOString();
        let nextSelectedId = submission.id;

        setSubmissions((prev) => {
          const updatedRows = prev.map((row) =>
            row.userId === submission.userId
              ? {
                  ...row,
                  status: nextStatus,
                  verified: nextStatus === "verified",
                  reviewNotes: nextReviewNote.trim(),
                  reviewedAt: nowIso,
                  updatedAt: nowIso,
                }
              : row
          );

          if (`${nextStatus || ""}`.toLowerCase() !== "pending") {
            const nextPendingRow = updatedRows.find(
              (row) =>
                row.id !== submission.id &&
                `${row.status || ""}`.toLowerCase() === "pending"
            );
            nextSelectedId = nextPendingRow?.id || "";
          }

          return updatedRows;
        });

        if (`${nextStatus || ""}`.toLowerCase() !== "pending") {
          setSelectedId(nextSelectedId);
          setShowProcessed(false);
        } else {
          setSelectedId(submission.id);
        }

        setLastSyncAt(Date.now());
        onStatusUpdated?.();
      } catch (error) {
        console.error("Failed to update KYC status", error);
        setLoadError(error?.message || "Unable to update KYC status.");
      } finally {
        setIsUpdating("");
      }
    },
    [onStatusUpdated]
  );

  const pendingRows = useMemo(
    () => submissions.filter((item) => `${item.status || ""}`.toLowerCase() === "pending"),
    [submissions]
  );

  const processedRows = useMemo(
    () => submissions.filter((item) => `${item.status || ""}`.toLowerCase() !== "pending"),
    [submissions]
  );

  const normalizedQuery = searchTerm.trim().toLowerCase();
  const filteredPendingRows = useMemo(
    () =>
      pendingRows.filter((item) =>
        normalizedQuery ? getSearchIndex(item).includes(normalizedQuery) : true
      ),
    [normalizedQuery, pendingRows]
  );

  const filteredProcessedRows = useMemo(
    () =>
      processedRows.filter((item) =>
        normalizedQuery ? getSearchIndex(item).includes(normalizedQuery) : true
      ),
    [normalizedQuery, processedRows]
  );
  const visibleProcessedRows = useMemo(
    () => (showProcessed ? filteredProcessedRows : []),
    [filteredProcessedRows, showProcessed]
  );
  const {
    currentPage: pendingPage,
    pageSize: pendingPageSize,
    totalPages: pendingTotalPages,
    paginatedItems: paginatedPendingRows,
    setCurrentPage: setPendingPage,
    setPageSize: setPendingPageSize,
  } = usePagination(filteredPendingRows, {
    initialPageSize: 5,
    resetDeps: [searchTerm],
  });
  const {
    currentPage: processedPage,
    pageSize: processedPageSize,
    totalPages: processedTotalPages,
    paginatedItems: paginatedProcessedRows,
    setCurrentPage: setProcessedPage,
    setPageSize: setProcessedPageSize,
  } = usePagination(filteredProcessedRows, {
    initialPageSize: 4,
    resetDeps: [searchTerm, showProcessed],
  });

  const selectedSubmission = useMemo(() => {
    const pool = [...filteredPendingRows, ...visibleProcessedRows];
    return pool.find((item) => item.id === selectedId) || pool[0] || null;
  }, [filteredPendingRows, visibleProcessedRows, selectedId]);

  useEffect(() => {
    if (selectedSubmission?.id) {
      setSelectedId(selectedSubmission.id);
      return;
    }

    const fallback = filteredPendingRows[0] || visibleProcessedRows[0] || null;
    if (fallback?.id) {
      setSelectedId(fallback.id);
    } else if (selectedId) {
      setSelectedId("");
    }
  }, [filteredPendingRows, selectedId, selectedSubmission, visibleProcessedRows]);

  useEffect(() => {
    setReviewNote(selectedSubmission?.reviewNotes || "");

    const nextDocuments = getDocuments(selectedSubmission || {});
    setActiveDocumentKey(nextDocuments[0]?.key || "front");
  }, [selectedSubmission?.id]);

  const selectedDocuments = useMemo(
    () => getDocuments(selectedSubmission || {}),
    [selectedSubmission]
  );

  const activeDocument =
    selectedDocuments.find((item) => item.key === activeDocumentKey) ||
    selectedDocuments[0] ||
    null;

  const overview = useMemo(() => {
    const verified = submissions.filter((item) => `${item.status || ""}`.toLowerCase() === "verified").length;
    const rejected = submissions.filter((item) => `${item.status || ""}`.toLowerCase() === "rejected").length;
    const completeDocs = submissions.filter((item) => getDocuments(item).length >= 2).length;

    return {
      verified,
      rejected,
      completeDocs,
    };
  }, [submissions]);

  const isCurrentRowUpdating =
    Boolean(selectedSubmission?.userId) && isUpdating === selectedSubmission.userId;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-300">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-200" strokeWidth={2.4} />
            Admin KYC Review
          </div>
          <h4 className="mt-4 text-2xl font-semibold text-white dark:text-white">
            Review identity packs in one workspace
          </h4>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
            Open a submission, inspect document images, verify identity data, add reviewer notes,
            and approve or reject without leaving the security tab.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={fetchSubmissions}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-[1rem] border border-teal-400/18 bg-teal-500/12 px-4 py-2 text-sm font-semibold text-teal-100 transition hover:border-teal-300/35 hover:bg-teal-500/16 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} strokeWidth={2.3} />
            {isLoading ? "Syncing" : "Refresh queue"}
          </button>
          <div className="rounded-[1rem] border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-400">
            Last sync:{" "}
            <span className="font-semibold text-white">
              {lastSyncAt ? formatTime(lastSyncAt) : "Starting..."}
            </span>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="rounded-[1.35rem] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {loadError}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.35rem] border border-white/8 bg-white/5 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Pending queue</p>
          <p className="mt-2 text-2xl font-semibold text-amber-300">{pendingRows.length}</p>
          <p className="mt-1 text-xs text-slate-400">Submissions waiting for review.</p>
        </div>
        <div className="rounded-[1.35rem] border border-white/8 bg-white/5 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Approved</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-300">{overview.verified}</p>
          <p className="mt-1 text-xs text-slate-400">Verified identities cleared for access.</p>
        </div>
        <div className="rounded-[1.35rem] border border-white/8 bg-white/5 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Rejected</p>
          <p className="mt-2 text-2xl font-semibold text-rose-300">{overview.rejected}</p>
          <p className="mt-1 text-xs text-slate-400">Applications needing correction.</p>
        </div>
        <div className="rounded-[1.35rem] border border-white/8 bg-white/5 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Document packs</p>
          <p className="mt-2 text-2xl font-semibold text-cyan-300">{overview.completeDocs}</p>
          <p className="mt-1 text-xs text-slate-400">Rows with at least two visible images.</p>
        </div>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside
          className="min-w-0 overflow-hidden rounded-[1.75rem] border border-slate-800 bg-slate-950/96"
        >
          <div className="border-b border-white/8 p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-slate-900 p-3 text-teal-200">
                <Search className="h-5 w-5" strokeWidth={2.3} />
              </div>
              <div>
                <h5 className="text-base font-semibold text-white">Queue search</h5>
                <p className="mt-1 text-sm text-slate-400">
                  Find users by name, email, country, or document number.
                </p>
              </div>
            </div>
            <label className="relative mt-4 block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search submissions"
                className="w-full rounded-[1.2rem] border border-slate-800 bg-slate-900/90 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-teal-400/35 focus:outline-none"
              />
            </label>
          </div>

          <div className="space-y-5 p-5">
            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h6 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Pending queue
                  </h6>
                  <p className="mt-1 text-xs text-slate-400">
                    {filteredPendingRows.length} submission{filteredPendingRows.length === 1 ? "" : "s"} in review order
                  </p>
                </div>
                <span className="rounded-full border border-amber-400/18 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                  {pendingRows.length}
                </span>
              </div>

              {filteredPendingRows.length === 0 ? (
                <div className="rounded-[1.25rem] border border-dashed border-slate-800 bg-slate-950/55 px-4 py-6 text-sm text-slate-500">
                  No pending submissions matched this filter.
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedPendingRows.map((submission) => (
                    <QueueCard
                      key={submission.id}
                      submission={submission}
                      isSelected={selectedSubmission?.id === submission.id}
                      isDark={isDark}
                      onSelect={() => setSelectedId(submission.id)}
                    />
                  ))}
                  <div className="border-t border-white/8 pt-4">
                    <PaginationControls
                      currentPage={pendingPage}
                      totalPages={pendingTotalPages}
                      totalItems={filteredPendingRows.length}
                      pageSize={pendingPageSize}
                      onPageChange={setPendingPage}
                      onPageSizeChange={setPendingPageSize}
                      pageSizeOptions={[5, 10, 20]}
                      itemLabel="pending records"
                    />
                  </div>
                </div>
              )}
            </section>

            <section className="border-t border-white/8 pt-5">
              <button
                type="button"
                onClick={() => setShowProcessed((prev) => !prev)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <div>
                  <h6 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Processed history
                  </h6>
                  <p className="mt-1 text-xs text-slate-400">
                    Verified and rejected records stay available for audit.
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                  {showProcessed ? "Hide" : "Show"}
                </span>
              </button>

              {showProcessed && (
                <div className="mt-4 space-y-3">
                  {filteredProcessedRows.length === 0 ? (
                    <div className="rounded-[1.25rem] border border-dashed border-slate-800 bg-slate-950/55 px-4 py-6 text-sm text-slate-500">
                      No processed submissions matched this filter.
                    </div>
                  ) : (
                    paginatedProcessedRows.map((submission) => (
                      <QueueCard
                        key={submission.id}
                        submission={submission}
                        isSelected={selectedSubmission?.id === submission.id}
                        isDark={isDark}
                        onSelect={() => setSelectedId(submission.id)}
                      />
                    ))
                  )}
                  <div className="border-t border-white/8 pt-4">
                    <PaginationControls
                      currentPage={processedPage}
                      totalPages={processedTotalPages}
                      totalItems={filteredProcessedRows.length}
                      pageSize={processedPageSize}
                      onPageChange={setProcessedPage}
                      onPageSizeChange={setProcessedPageSize}
                      pageSizeOptions={[4, 8, 16]}
                      itemLabel="processed records"
                    />
                  </div>
                </div>
              )}
            </section>
          </div>
        </aside>

        <section className="min-w-0 overflow-hidden rounded-[1.75rem] border border-slate-800 bg-slate-950/96 p-5 sm:p-6">
          {!selectedSubmission ? (
            <div className="flex min-h-[32rem] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-800 bg-slate-950/50 px-6 text-center">
              <AlertCircle className="h-10 w-10 text-slate-500" strokeWidth={2.2} />
              <h5 className="mt-4 text-lg font-semibold text-white">No KYC record selected</h5>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                Choose a submission from the queue to inspect identity details, preview images,
                and apply a review decision.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-5 border-b border-white/8 pb-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[1.25rem] bg-[linear-gradient(135deg,rgba(45,212,191,0.25),rgba(6,182,212,0.14))] text-lg font-semibold text-teal-100 shadow-[0_0_30px_rgba(45,212,191,0.12)]">
                    {getInitials(selectedSubmission)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-2xl font-semibold text-white">
                        {getFullName(selectedSubmission)}
                      </h3>
                      <span
                        className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                          getStatusMeta(selectedSubmission.status).badge
                        }`}
                      >
                        {getStatusMeta(selectedSubmission.status).label}
                      </span>
                    </div>
                    <p className="mt-2 flex items-center gap-2 break-all text-sm text-slate-400">
                      <Mail className="h-4 w-4 shrink-0" strokeWidth={2.2} />
                      {selectedSubmission.email || "No email provided"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-slate-300">
                        {ID_TYPE_LABELS[selectedSubmission.idType] || selectedSubmission.idType || "ID type pending"}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-slate-300">
                        {selectedSubmission.idNumber || "Document number pending"}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-slate-300">
                        {selectedSubmission.countryOfResidence || "Country pending"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[24rem]">
                  <div className="rounded-[1.2rem] border border-white/8 bg-white/5 p-4">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Submitted</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-white">
                      {formatTime(selectedSubmission.submittedAt)}
                    </p>
                  </div>
                  <div className="rounded-[1.2rem] border border-white/8 bg-white/5 p-4">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Reviewed</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-white">
                      {formatTime(selectedSubmission.reviewedAt)}
                    </p>
                  </div>
                  <div className="rounded-[1.2rem] border border-white/8 bg-white/5 p-4">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Images</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-white">
                      {selectedDocuments.length} visible file{selectedDocuments.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
                <div className="min-w-0 space-y-6">
                  <ReviewPanel
                    isDark={isDark}
                    title="Document studio"
                    subtitle="Inspect uploaded files directly in the review pane before you approve or reject."
                    icon={ImageIcon}
                  >
                    {selectedDocuments.length === 0 ? (
                      <div className="rounded-[1.35rem] border border-dashed border-slate-800 bg-slate-950/55 px-4 py-10 text-center">
                        <ImageIcon className="mx-auto h-10 w-10 text-slate-500" strokeWidth={2.1} />
                        <p className="mt-3 text-sm text-slate-400">No document images are attached to this submission yet.</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-2">
                          {selectedDocuments.map((document) => (
                            <button
                              key={document.key}
                              type="button"
                              onClick={() => setActiveDocumentKey(document.key)}
                              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                activeDocument?.key === document.key
                                  ? "border-teal-400/30 bg-teal-500/12 text-teal-100"
                                  : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                              }`}
                            >
                              {document.label}
                            </button>
                          ))}
                        </div>

                        <div className="mt-4 overflow-hidden rounded-[1.35rem] border border-slate-800 bg-slate-950/85">
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
                            <div>
                              <p className="text-sm font-semibold text-white">{activeDocument?.label}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                Review image clarity, crop, and matching identity details.
                              </p>
                            </div>
                            {activeDocument?.src && (
                              <a
                                href={activeDocument.src}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-white/20"
                              >
                                Open original
                                <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.3} />
                              </a>
                            )}
                          </div>
                          {activeDocument?.src && (
                            <div className="flex h-[24rem] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.08),transparent_40%),linear-gradient(180deg,rgba(2,6,23,0.96),rgba(15,23,42,0.9))] p-4">
                              <img
                                src={activeDocument.src}
                                alt={activeDocument.label}
                                className="max-h-full w-full rounded-[1.1rem] object-contain"
                                loading="lazy"
                              />
                            </div>
                          )}
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          {selectedDocuments.map((document) => (
                            <button
                              key={`${document.key}-thumb`}
                              type="button"
                              onClick={() => setActiveDocumentKey(document.key)}
                              className={`overflow-hidden rounded-[1.1rem] border text-left transition ${
                                activeDocument?.key === document.key
                                  ? "border-teal-400/30 bg-teal-500/10"
                                  : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                              }`}
                            >
                              <div className="h-32 bg-slate-950">
                                <img
                                  src={document.src}
                                  alt={document.label}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                              <div className="px-3 py-2">
                                <p className="text-sm font-semibold text-white">{document.shortLabel}</p>
                                <p className="mt-1 text-xs text-slate-500">{document.label}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </ReviewPanel>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <ReviewPanel
                      isDark={isDark}
                      title="Identity details"
                      subtitle="Verify the person matches the submitted legal profile."
                      icon={UserCircle2}
                    >
                      <div className="grid gap-3">
                        <FieldPair label="Legal full name" value={getFullName(selectedSubmission)} />
                        <FieldPair label="Date of birth" value={selectedSubmission.dateOfBirth} />
                        <FieldPair label="Email" value={selectedSubmission.email} />
                        <FieldPair label="Phone number" value={selectedSubmission.phoneNumber} />
                      </div>
                    </ReviewPanel>

                    <ReviewPanel
                      isDark={isDark}
                      title="Document details"
                      subtitle="Cross-check document metadata against the uploaded file."
                      icon={FileBadge2}
                    >
                      <div className="grid gap-3">
                        <FieldPair label="ID type" value={ID_TYPE_LABELS[selectedSubmission.idType] || selectedSubmission.idType} />
                        <FieldPair label="Document number" value={selectedSubmission.idNumber} mono />
                        <FieldPair label="Country of residence" value={selectedSubmission.countryOfResidence} />
                        <FieldPair label="Issuing country" value={selectedSubmission.issuingCountry} />
                      </div>
                    </ReviewPanel>

                    <ReviewPanel
                      isDark={isDark}
                      title="Address profile"
                      subtitle="Review the submitted residential record for completeness."
                      icon={MapPinned}
                    >
                      <div className="grid gap-3">
                        <FieldPair label="Primary address" value={getAddressText(selectedSubmission)} />
                        <FieldPair label="City" value={selectedSubmission.city} />
                        <FieldPair label="State / Province" value={selectedSubmission.stateProvince} />
                        <FieldPair label="Postal code" value={selectedSubmission.postalCode} />
                      </div>
                    </ReviewPanel>

                    <ReviewPanel
                      isDark={isDark}
                      title="Review timeline"
                      subtitle="Use the submission history to understand the current state."
                      icon={Clock3}
                    >
                      <div className="grid gap-3">
                        <FieldPair label="Submitted at" value={formatTime(selectedSubmission.submittedAt)} />
                        <FieldPair label="Reviewed at" value={formatTime(selectedSubmission.reviewedAt)} />
                        <FieldPair label="Updated at" value={formatTime(selectedSubmission.updatedAt)} />
                        <FieldPair label="Current status" value={getStatusMeta(selectedSubmission.status).label} />
                      </div>
                    </ReviewPanel>
                  </div>
                </div>

                <div className="min-w-0 space-y-6 xl:sticky xl:top-6 xl:self-start">
                  <ReviewPanel
                    isDark={isDark}
                    title="Reviewer actions"
                    subtitle="Capture a note and make a decision without leaving this applicant profile."
                    icon={ShieldCheck}
                  >
                    <div className="space-y-4">
                      <div className="rounded-[1.2rem] border border-white/8 bg-white/5 p-4">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Action state</p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-white">
                          {selectedSubmission.status === "pending"
                            ? "Awaiting final compliance decision."
                            : selectedSubmission.status === "verified"
                            ? "Identity has been approved."
                            : "Identity was rejected and may need correction."}
                        </p>
                      </div>

                      <label className="block space-y-2">
                        <span className="text-sm font-medium text-white">Reviewer note</span>
                        <textarea
                          rows={6}
                          value={reviewNote}
                          onChange={(event) => setReviewNote(event.target.value)}
                          placeholder="Add compliance notes, mismatch details, or next-step instructions"
                          className="w-full rounded-[1.2rem] border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-teal-400/35 focus:outline-none"
                        />
                      </label>

                      <div className="grid gap-3">
                        <button
                          type="button"
                          onClick={() => updateKycStatus(selectedSubmission, "verified", reviewNote)}
                          disabled={isCurrentRowUpdating}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-[1.2rem] bg-[linear-gradient(135deg,rgba(16,185,129,1),rgba(45,212,191,0.95))] px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(16,185,129,0.16)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
                          {isCurrentRowUpdating ? "Updating..." : "Approve verification"}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateKycStatus(selectedSubmission, "rejected", reviewNote)}
                          disabled={isCurrentRowUpdating}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-[1.2rem] border border-rose-400/20 bg-rose-500/12 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:border-rose-300/35 hover:bg-rose-500/16 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <XCircle className="h-4 w-4" strokeWidth={2.5} />
                          {isCurrentRowUpdating ? "Updating..." : "Reject verification"}
                        </button>
                        <button
                          type="button"
                          onClick={() => updateKycStatus(selectedSubmission, selectedSubmission.status || "pending", reviewNote)}
                          disabled={isCurrentRowUpdating}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <FileBadge2 className="h-4 w-4" strokeWidth={2.5} />
                          Save note
                        </button>
                        {`${selectedSubmission.status || ""}`.toLowerCase() !== "pending" && (
                          <button
                            type="button"
                            onClick={() => updateKycStatus(selectedSubmission, "pending", reviewNote)}
                            disabled={isCurrentRowUpdating}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-[1.2rem] border border-white/10 bg-transparent px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Undo2 className="h-4 w-4" strokeWidth={2.5} />
                            Return to pending
                          </button>
                        )}
                      </div>
                    </div>
                  </ReviewPanel>

                  <ReviewPanel
                    isDark={isDark}
                    title="Quick review prompts"
                    subtitle="Use the same checks across every submission to keep decisions consistent."
                    icon={Globe2}
                  >
                    <div className="space-y-3 text-sm leading-6 text-slate-300">
                      <div className="rounded-[1.1rem] border border-white/8 bg-white/5 p-3">
                        Confirm the legal name, date of birth, and ID number match the uploaded document.
                      </div>
                      <div className="rounded-[1.1rem] border border-white/8 bg-white/5 p-3">
                        Check whether the selfie clearly matches the identity document and applicant profile.
                      </div>
                      <div className="rounded-[1.1rem] border border-white/8 bg-white/5 p-3">
                        Add a reviewer note before rejecting so the user has a clear correction path.
                      </div>
                    </div>
                  </ReviewPanel>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
