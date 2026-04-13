import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../../config/api";
import PaginationControls from "../../components/ui/PaginationControls";
import usePagination from "../../hooks/usePagination";

const STATUS_OPTIONS = ["open", "pending", "resolved", "closed"];
const PRIORITY_OPTIONS = ["low", "normal", "high", "urgent"];
const CATEGORY_OPTIONS = [
  "general",
  "deposit",
  "withdrawal",
  "kyc",
  "trading",
  "technical",
  "billing",
];

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
};

const normalizeToken = () =>
  (localStorage.getItem("authToken") || "").replace(/^["']|["']$/g, "").trim();

export default function MessageCenter() {
  const [threads, setThreads] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedThread, setSelectedThread] = useState(null);
  const [reply, setReply] = useState("");
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [lastSyncAt, setLastSyncAt] = useState(0);
  const [messagingUnavailable, setMessagingUnavailable] = useState(false);

  const authFetch = useCallback(async (urlOrUrls, options = {}) => {
    const token = normalizeToken();
    if (!token) {
      throw new Error("Missing auth token");
    }

    const urls = Array.isArray(urlOrUrls) ? urlOrUrls : [urlOrUrls];
    let lastError = null;

    for (const url of urls) {
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          ...(options.headers || {}),
        },
      });

      const text = await response.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }

      if (response.ok && json?.success) {
        return json;
      }

      const error = new Error(
        json?.message || `Request failed (${response.status})`
      );
      if (response.status === 404) {
        lastError = error;
        continue;
      }
      throw error;
    }

    throw lastError || new Error("Request failed");
  }, []);

  const loadThreads = useCallback(async () => {
    if (messagingUnavailable) return;
    setIsLoadingThreads(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (statusFilter) params.set("status", statusFilter);
      const result = await authFetch([
        `${API_BASE_URL}/Admin/Messages?${params.toString()}`,
        `${API_BASE_URL}/Admin/Message?${params.toString()}`,
        `${API_BASE_URL}/admin/messages?${params.toString()}`,
        `${API_BASE_URL}/admin/message?${params.toString()}`,
      ]);
      const rows = Array.isArray(result?.data) ? result.data : [];
      setThreads(rows);
      setSelectedId((current) => {
        if (current && rows.some((row) => row.id === current)) return current;
        return rows[0]?.id || "";
      });
      setLastSyncAt(Date.now());
      setMessagingUnavailable(false);
    } catch (error) {
      if (/\(404\)/.test(error?.message || "")) {
        setMessagingUnavailable(true);
        return;
      }
      console.error("Admin messages load failed:", error);
    } finally {
      setIsLoadingThreads(false);
    }
  }, [authFetch, messagingUnavailable, statusFilter]);

  const loadThread = useCallback(
    async (threadId) => {
      if (!threadId) {
        setSelectedThread(null);
        return;
      }
      if (messagingUnavailable) return;

      setIsLoadingThread(true);
      try {
        const result = await authFetch([
          `${API_BASE_URL}/Admin/Messages/${threadId}`,
          `${API_BASE_URL}/Admin/Message/${threadId}`,
          `${API_BASE_URL}/admin/messages/${threadId}`,
          `${API_BASE_URL}/admin/message/${threadId}`,
        ]);
        setSelectedThread(result?.data || null);
      } catch (error) {
        if (/\(404\)/.test(error?.message || "")) {
          setMessagingUnavailable(true);
          return;
        }
        console.error("Admin message thread failed:", error);
      } finally {
        setIsLoadingThread(false);
      }
    },
    [authFetch, messagingUnavailable]
  );

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    loadThread(selectedId);
  }, [loadThread, selectedId]);

  useEffect(() => {
    if (messagingUnavailable) return undefined;
    const interval = setInterval(() => {
      loadThreads();
      if (selectedId) {
        loadThread(selectedId);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [loadThreads, loadThread, messagingUnavailable, selectedId]);

  const selectedSummary = useMemo(
    () => threads.find((thread) => thread.id === selectedId) || null,
    [threads, selectedId]
  );
  const {
    currentPage: threadsPage,
    pageSize: threadsPageSize,
    totalPages: threadsTotalPages,
    paginatedItems: paginatedThreads,
    setCurrentPage: setThreadsPage,
    setPageSize: setThreadsPageSize,
  } = usePagination(threads, {
    initialPageSize: 8,
    resetDeps: [statusFilter],
  });

  const handleReply = async () => {
    const text = `${reply || ""}`.trim();
    if (!selectedId || !text) return;

    setIsSending(true);
    try {
      await authFetch(
        [
          `${API_BASE_URL}/Admin/Messages/${selectedId}/Reply`,
          `${API_BASE_URL}/Admin/Message/${selectedId}/Reply`,
          `${API_BASE_URL}/admin/messages/${selectedId}/reply`,
          `${API_BASE_URL}/admin/message/${selectedId}/reply`,
        ],
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        }
      );
      setReply("");
      await loadThreads();
      await loadThread(selectedId);
    } catch (error) {
      console.error("Admin reply failed:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleThreadUpdate = async (payload) => {
    if (!selectedId || !payload) return;
    setIsUpdatingStatus(true);
    try {
      await authFetch(
        [
          `${API_BASE_URL}/Admin/Messages/${selectedId}`,
          `${API_BASE_URL}/Admin/Message/${selectedId}`,
          `${API_BASE_URL}/admin/messages/${selectedId}`,
          `${API_BASE_URL}/admin/message/${selectedId}`,
        ],
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      await loadThreads();
      await loadThread(selectedId);
    } catch (error) {
      console.error("Admin status update failed:", error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">User Messages</h3>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-slate-900 [color-scheme:light] dark:border-gray-700 dark:bg-gray-900 dark:text-slate-100 dark:[color-scheme:dark]"
          >
            <option value="" className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">All Statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status} className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                {status}
              </option>
            ))}
          </select>
          <span className="text-xs text-gray-500">
            Sync {lastSyncAt ? formatDateTime(lastSyncAt) : "starting..."}
          </span>
        </div>
      </div>

      {messagingUnavailable && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-600/40 dark:bg-amber-900/20 dark:text-amber-200">
          Messaging routes are missing on this backend deployment. Redeploy backend with latest admin/message routes.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <aside className="xl:col-span-4 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
          <div className="space-y-2">
            {isLoadingThreads ? (
              <p className="text-xs text-gray-500">Loading threads...</p>
            ) : threads.length === 0 ? (
              <p className="text-xs text-gray-500">No message threads found.</p>
            ) : (
              paginatedThreads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedId(thread.id)}
                  className={`w-full rounded-lg border p-2 text-left ${
                    selectedId === thread.id
                      ? "border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-900/20"
                      : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="line-clamp-1 text-xs font-semibold">
                      {thread.subject}
                    </p>
                    {thread.unreadForAdmin > 0 && (
                      <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        {thread.unreadForAdmin}
                      </span>
                    )}
                  </div>
                    <p className="mt-1 line-clamp-1 text-[11px] text-gray-600 dark:text-gray-300">
                      {thread.user?.email || "Unknown user"}
                    </p>
                    <p className="mt-1 line-clamp-1 text-[11px] text-gray-500 dark:text-gray-400">
                      {thread.latestMessage?.text || "No messages"}
                    </p>
                    <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                      {thread.category || "general"} | {thread.priority || "normal"} |{" "}
                      {thread.slaStatus || "on_track"}
                    </p>
                  </button>
                ))
            )}
          </div>
          <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
            <PaginationControls
              currentPage={threadsPage}
              totalPages={threadsTotalPages}
              totalItems={threads.length}
              pageSize={threadsPageSize}
              onPageChange={setThreadsPage}
              onPageSizeChange={setThreadsPageSize}
              pageSizeOptions={[8, 16, 32]}
              itemLabel="threads"
            />
          </div>
        </aside>

        <div className="xl:col-span-8 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          {selectedId ? (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">
                    {selectedSummary?.subject || "Support Thread"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedSummary?.user?.email || "Unknown user"}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Category: {selectedSummary?.category || "general"} | Priority:{" "}
                    {selectedSummary?.priority || "normal"} | SLA:{" "}
                    {selectedSummary?.slaStatus || "on_track"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedSummary?.status || "open"}
                    onChange={(event) =>
                      handleThreadUpdate({ status: event.target.value })
                    }
                    disabled={isUpdatingStatus || messagingUnavailable}
                    className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-slate-900 [color-scheme:light] dark:border-gray-700 dark:bg-gray-900 dark:text-slate-100 dark:[color-scheme:dark]"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status} className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                        {status}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedSummary?.priority || "normal"}
                    onChange={(event) =>
                      handleThreadUpdate({ priority: event.target.value })
                    }
                    disabled={isUpdatingStatus || messagingUnavailable}
                    className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-slate-900 [color-scheme:light] dark:border-gray-700 dark:bg-gray-900 dark:text-slate-100 dark:[color-scheme:dark]"
                  >
                    {PRIORITY_OPTIONS.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedSummary?.category || "general"}
                    onChange={(event) =>
                      handleThreadUpdate({ category: event.target.value })
                    }
                    disabled={isUpdatingStatus || messagingUnavailable}
                    className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-slate-900 [color-scheme:light] dark:border-gray-700 dark:bg-gray-900 dark:text-slate-100 dark:[color-scheme:dark]"
                  >
                    {CATEGORY_OPTIONS.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-3 h-[46vh] overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-950">
                {isLoadingThread ? (
                  <p className="text-xs text-gray-500">Loading conversation...</p>
                ) : selectedThread?.messages?.length ? (
                  <div className="space-y-3">
                    {selectedThread.messages.map((message) => {
                      const isAdmin = message.senderRole === "admin";
                      return (
                        <div
                          key={message.id}
                          className={`max-w-[88%] rounded-lg px-3 py-2 text-sm ${
                            isAdmin
                              ? "ml-auto bg-indigo-600 text-white"
                              : "bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.text}</p>
                          <p className="mt-1 text-[10px] opacity-80">
                            {isAdmin ? "Admin" : "User"} | {formatDateTime(message.createdAt)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No messages yet.</p>
                )}
              </div>

              <div>
                <textarea
                  rows={4}
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Reply to this user..."
                  className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={handleReply}
                    disabled={isSending || messagingUnavailable}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                      isSending || messagingUnavailable
                        ? "cursor-not-allowed bg-gray-500"
                        : "bg-indigo-600 hover:bg-indigo-500"
                    }`}
                  >
                    {isSending ? "Sending..." : "Send Reply"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">Select a thread to view messages.</p>
          )}
        </div>
      </div>
    </div>
  );
}

