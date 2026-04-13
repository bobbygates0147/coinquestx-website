import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  CheckCircle2,
  Clock3,
  ShieldCheck,
  UserX,
  XCircle,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import KYCReviewPage from "./kyc-review";

const getToken = () =>
  (localStorage.getItem("authToken") || "").replace(/^["']|["']$/g, "").trim();

export default function SecuritySection() {
  const { theme, resolvedTheme } = useTheme();
  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";
  const [isLoading, setIsLoading] = useState(false);
  const [kycRows, setKycRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadError, setLoadError] = useState("");

  const loadSecurityData = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const token = getToken();
      if (!token) throw new Error("Missing admin token");

      const [kycResponse, usersResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/Admin/Kyc`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        }),
        fetch(`${API_BASE_URL}/Admin/Users`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        }),
      ]);

      const [kycResult, usersResult] = await Promise.all([
        kycResponse.json(),
        usersResponse.json(),
      ]);

      if (!kycResponse.ok || !kycResult?.success) {
        throw new Error(kycResult?.message || `KYC fetch failed (${kycResponse.status})`);
      }

      if (!usersResponse.ok || !usersResult?.success) {
        throw new Error(
          usersResult?.message || `Users fetch failed (${usersResponse.status})`
        );
      }

      setKycRows(kycResult?.data || []);
      setUsers(usersResult?.data || []);
    } catch (error) {
      console.error("Security data load failed:", error);
      setLoadError(error?.message || "Unable to load security data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSecurityData();
    const intervalId = setInterval(loadSecurityData, 30000);
    return () => clearInterval(intervalId);
  }, [loadSecurityData]);

  const stats = useMemo(() => {
    const pendingKyc = kycRows.filter((item) => item.status === "pending").length;
    const verifiedKyc = kycRows.filter((item) => item.status === "verified").length;
    const rejectedKyc = kycRows.filter((item) => item.status === "rejected").length;
    const suspendedUsers = users.filter((item) => item.status === "suspended").length;
    return {
      pendingKyc,
      verifiedKyc,
      rejectedKyc,
      suspendedUsers,
    };
  }, [kycRows, users]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <section
        className={`overflow-hidden rounded-[2rem] border p-6 shadow-[0_24px_80px_rgba(2,8,23,0.16)] ${
          isDark
            ? "border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.16),_transparent_34%),linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.96))]"
            : "border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.12),_transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(240,253,250,0.96))]"
        }`}
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-200" strokeWidth={2.4} />
              Security & Compliance
            </div>
            <h3 className={`mt-4 text-3xl font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
              Admin KYC oversight with live review control
            </h3>
            <p className={`mt-3 max-w-3xl text-sm leading-7 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Monitor the full KYC pipeline, track rejected cases, and move directly into the
              identity review workspace below for approval or rejection.
            </p>
          </div>
          <button
            onClick={loadSecurityData}
            className="rounded-[1rem] bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLoading}
          >
            {isLoading ? "Syncing..." : "Refresh security"}
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className={`rounded-[1.35rem] border p-4 ${isDark ? "border-white/8 bg-white/5" : "border-slate-200 bg-white/80"}`}>
            <div className="flex items-center gap-3">
              <div className={`rounded-2xl p-3 ${isDark ? "bg-amber-500/12 text-amber-200" : "bg-amber-100 text-amber-700"}`}>
                <Clock3 className="h-4 w-4" strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Pending KYC</p>
                <p className="mt-1 text-2xl font-semibold text-amber-400">{stats.pendingKyc}</p>
              </div>
            </div>
          </div>
          <div className={`rounded-[1.35rem] border p-4 ${isDark ? "border-white/8 bg-white/5" : "border-slate-200 bg-white/80"}`}>
            <div className="flex items-center gap-3">
              <div className={`rounded-2xl p-3 ${isDark ? "bg-emerald-500/12 text-emerald-200" : "bg-emerald-100 text-emerald-700"}`}>
                <CheckCircle2 className="h-4 w-4" strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Completed KYC</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-400">{stats.verifiedKyc}</p>
              </div>
            </div>
          </div>
          <div className={`rounded-[1.35rem] border p-4 ${isDark ? "border-white/8 bg-white/5" : "border-slate-200 bg-white/80"}`}>
            <div className="flex items-center gap-3">
              <div className={`rounded-2xl p-3 ${isDark ? "bg-rose-500/12 text-rose-200" : "bg-rose-100 text-rose-700"}`}>
                <XCircle className="h-4 w-4" strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Rejected KYC</p>
                <p className="mt-1 text-2xl font-semibold text-rose-400">{stats.rejectedKyc}</p>
              </div>
            </div>
          </div>
          <div className={`rounded-[1.35rem] border p-4 ${isDark ? "border-white/8 bg-white/5" : "border-slate-200 bg-white/80"}`}>
            <div className="flex items-center gap-3">
              <div className={`rounded-2xl p-3 ${isDark ? "bg-violet-500/12 text-violet-200" : "bg-violet-100 text-violet-700"}`}>
                <UserX className="h-4 w-4" strokeWidth={2.4} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Suspended Users</p>
                <p className="mt-1 text-2xl font-semibold text-violet-400">{stats.suspendedUsers}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {loadError && (
        <div className="rounded-[1.35rem] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {loadError}
        </div>
      )}

      <KYCReviewPage onStatusUpdated={loadSecurityData} />
    </div>
  );
}
