import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTheme } from "next-themes";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowUpRight, Clock3, Search, Sparkles, X } from "lucide-react";
import {
  readRecentSearches,
  SEARCH_KIND_FILTERS,
  SEARCH_KIND_LABELS,
  storeRecentSearch,
  useGlobalSearch,
} from "../../hooks/useGlobalSearch";

const getKindChipClass = (theme, kind) => {
  const base =
    "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]";

  switch (kind) {
    case "product":
      return `${base} ${
        theme === "dark"
          ? "border-cyan-400/18 bg-cyan-500/10 text-cyan-200"
          : "border-cyan-200 bg-cyan-50 text-cyan-700"
      }`;
    case "account":
      return `${base} ${
        theme === "dark"
          ? "border-emerald-400/18 bg-emerald-500/10 text-emerald-200"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`;
    case "trader":
      return `${base} ${
        theme === "dark"
          ? "border-fuchsia-400/18 bg-fuchsia-500/10 text-fuchsia-200"
          : "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700"
      }`;
    case "transaction":
      return `${base} ${
        theme === "dark"
          ? "border-amber-400/18 bg-amber-500/10 text-amber-200"
          : "border-amber-200 bg-amber-50 text-amber-700"
      }`;
    case "notification":
      return `${base} ${
        theme === "dark"
          ? "border-rose-400/18 bg-rose-500/10 text-rose-200"
          : "border-rose-200 bg-rose-50 text-rose-700"
      }`;
    case "feature":
    default:
      return `${base} ${
        theme === "dark"
          ? "border-teal-400/18 bg-teal-500/10 text-teal-200"
          : "border-teal-200 bg-teal-50 text-teal-700"
      }`;
  }
};

export default function SearchPage() {
  const { theme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(urlQuery);
  const [activeFilter, setActiveFilter] = useState("all");
  const [recentSearches, setRecentSearches] = useState(() => readRecentSearches());
  const deferredQuery = useDeferredValue(query);
  const isDark = theme === "dark";

  const {
    allItems,
    results,
    featuredResults,
    recentActivity,
    countsByKind,
    hasQuery,
  } = useGlobalSearch(deferredQuery);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    if (activeFilter !== "all" && hasQuery && countsByKind[activeFilter] === 0) {
      setActiveFilter("all");
    }
  }, [activeFilter, countsByKind, hasQuery]);

  const filteredResults = useMemo(() => {
    if (!hasQuery) return [];
    if (activeFilter === "all") return results;
    return results.filter((item) => item.kind === activeFilter);
  }, [activeFilter, hasQuery, results]);

  const featureAndProductMatches = useMemo(
    () =>
      results.filter((item) => ["feature", "product"].includes(item.kind)).length,
    [results]
  );

  const liveRecordMatches = useMemo(
    () =>
      results.filter(
        (item) => !["feature", "product"].includes(item.kind)
      ).length,
    [results]
  );

  const searchableFeatureCount = countsByKind.feature + countsByKind.product;
  const trackedRecordCount =
    countsByKind.account +
    countsByKind.trader +
    countsByKind.transaction +
    countsByKind.notification;

  const pageShellClass =
    isDark
      ? "bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_28%),radial-gradient(circle_at_84%_14%,rgba(14,165,233,0.12),transparent_24%),linear-gradient(180deg,#020617_0%,#020617_40%,#0f172a_100%)] text-slate-100"
      : "bg-[radial-gradient(circle_at_top,rgba(45,212,191,0.12),transparent_28%),radial-gradient(circle_at_84%_14%,rgba(14,165,233,0.1),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef6ff_100%)] text-slate-900";
  const heroPanelClass = isDark
    ? "border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(2,6,23,0.88))] shadow-[0_32px_80px_rgba(2,8,23,0.52)]"
    : "border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(236,254,255,0.94))] shadow-[0_28px_70px_rgba(15,23,42,0.10)]";
  const glassPanelClass = isDark
    ? "border-white/10 bg-slate-900/72 shadow-[0_24px_70px_rgba(2,8,23,0.42)] backdrop-blur-xl"
    : "border-white/70 bg-white/90 shadow-[0_22px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl";
  const softPanelClass = isDark
    ? "border-white/8 bg-white/[0.04]"
    : "border-slate-200/80 bg-slate-50/90";
  const mutedTextClass = isDark ? "text-slate-400" : "text-slate-600";

  const syncSearchParams = (value) => {
    const trimmed = `${value || ""}`.trim();
    const nextParams = new URLSearchParams();

    if (trimmed) {
      nextParams.set("q", trimmed);
      storeRecentSearch(trimmed);
      setRecentSearches(readRecentSearches());
    }

    startTransition(() => {
      setSearchParams(nextParams);
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    syncSearchParams(query);
  };

  const applyRecentSearch = (value) => {
    setQuery(value);
    syncSearchParams(value);
  };

  return (
    <section className={`min-h-screen px-4 py-10 sm:px-6 lg:px-8 ${pageShellClass}`}>
      <div className="mx-auto w-full max-w-[1480px]">
        <section
          className={`relative mb-10 overflow-hidden rounded-[32px] border px-6 py-7 sm:px-8 lg:px-10 ${heroPanelClass}`}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-16 top-0 h-44 w-44 rounded-full bg-teal-400/18 blur-3xl" />
            <div className="absolute right-0 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full bg-cyan-400/14 blur-3xl" />
          </div>

          <div className="relative space-y-8">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-3 rounded-full border border-teal-400/15 bg-teal-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-teal-300">
                <Search className="h-4 w-4" strokeWidth={2.2} />
                Global Search
              </div>
              <div className="space-y-3">
                <h1 className="max-w-4xl text-3xl font-semibold tracking-tight sm:text-4xl">
                  Find any workspace, product, trader, transaction, or alert from one sharper search desk.
                </h1>
                <p className={`max-w-3xl text-sm leading-7 sm:text-base ${mutedTextClass}`}>
                  Search live account data and every major CoinQuestX feature from one global command surface, then jump straight into the right workspace.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="max-w-4xl">
                <label
                  className={`flex min-h-14 items-center gap-3 rounded-[1.4rem] border px-4 py-2 transition ${
                    isDark
                      ? "border-slate-800 bg-slate-900/88 text-slate-100 focus-within:border-teal-400/30"
                      : "border-slate-200 bg-white text-slate-900 shadow-[0_12px_34px_rgba(15,23,42,0.08)] focus-within:border-teal-300"
                  }`}
                >
                  <Search
                    className={isDark ? "h-5 w-5 text-teal-300" : "h-5 w-5 text-teal-600"}
                    strokeWidth={2.2}
                  />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search deposits, mining, bots, copy traders, transactions, alerts..."
                    className="w-full bg-transparent text-sm outline-none sm:text-base"
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        syncSearchParams("");
                      }}
                      className={`rounded-full p-1 transition ${
                        isDark
                          ? "text-slate-500 hover:bg-slate-800 hover:text-slate-200"
                          : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      }`}
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" strokeWidth={2.2} />
                    </button>
                  ) : null}
                </label>
              </form>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className={`rounded-[24px] border p-5 ${softPanelClass}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-400/80">
                  {hasQuery ? "Matches" : "Searchable Features"}
                </p>
                <p className="mt-3 text-3xl font-semibold">
                  {hasQuery ? results.length : searchableFeatureCount}
                </p>
              </div>
              <div className={`rounded-[24px] border p-5 ${softPanelClass}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400/80">
                  {hasQuery ? "Platform Features" : "Tracked Records"}
                </p>
                <p className="mt-3 text-3xl font-semibold">
                  {hasQuery ? featureAndProductMatches : trackedRecordCount}
                </p>
              </div>
              <div className={`rounded-[24px] border p-5 ${softPanelClass}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400/80">
                  {hasQuery ? "Live Records" : "Recent Searches"}
                </p>
                <p className="mt-3 text-3xl font-semibold">
                  {hasQuery ? liveRecordMatches : recentSearches.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        {!hasQuery ? (
          <div className="space-y-8">
            {recentSearches.length > 0 && (
              <section className={`rounded-[30px] border p-6 ${glassPanelClass}`}>
                <div className="mb-5 flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                      isDark
                        ? "border-slate-800 bg-slate-900 text-teal-200"
                        : "border-slate-200 bg-slate-50 text-teal-700"
                    }`}
                  >
                    <Clock3 className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Recent searches</h2>
                    <p className={`text-sm ${mutedTextClass}`}>
                      Jump back into previous lookups without typing again.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {recentSearches.map((entry) => (
                    <button
                      key={entry}
                      type="button"
                      onClick={() => applyRecentSearch(entry)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        isDark
                          ? "border-slate-800 bg-slate-900 text-slate-200 hover:border-teal-400/28 hover:text-teal-200"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-teal-300 hover:text-teal-700"
                      }`}
                    >
                      {entry}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className={`rounded-[30px] border p-6 ${glassPanelClass}`}>
              <div className="mb-6 flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                    isDark
                      ? "border-teal-400/18 bg-teal-500/10 text-teal-200"
                      : "border-teal-200 bg-teal-50 text-teal-700"
                  }`}
                >
                  <Sparkles className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Featured workspaces</h2>
                  <p className={`text-sm ${mutedTextClass}`}>
                    Fast access to the main operational surfaces across the platform.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {featuredResults.map((result) => {
                  const Icon = result.icon || Search;

                  return (
                    <Link
                      key={result.id}
                      to={result.path}
                      className={`rounded-[24px] border p-5 transition ${
                        isDark
                          ? "border-slate-800 bg-slate-900/82 hover:border-teal-400/20 hover:bg-slate-900"
                          : "border-slate-200 bg-white/92 hover:border-teal-300 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                            isDark
                              ? "border-teal-400/18 bg-teal-500/10 text-teal-200"
                              : "border-teal-200 bg-teal-50 text-teal-700"
                          }`}
                        >
                          <Icon className="h-5 w-5" strokeWidth={2.2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={getKindChipClass(theme, result.kind)}>
                              {SEARCH_KIND_LABELS[result.kind]}
                            </span>
                            {result.category ? (
                              <span className={`text-[11px] ${mutedTextClass}`}>
                                {result.category}
                              </span>
                            ) : null}
                          </div>
                          <h3 className="mt-3 text-lg font-semibold">{result.title}</h3>
                          <p className={`mt-2 text-sm leading-7 ${mutedTextClass}`}>
                            {result.description}
                          </p>
                          <span
                            className={`mt-4 inline-flex items-center gap-2 text-sm font-medium ${
                              isDark ? "text-teal-200" : "text-teal-700"
                            }`}
                          >
                            {result.actionLabel || "Open workspace"}
                            <ArrowUpRight className="h-4 w-4" strokeWidth={2.2} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className={`rounded-[30px] border p-6 ${glassPanelClass}`}>
              <div className="mb-6 flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                    isDark
                      ? "border-slate-800 bg-slate-900 text-cyan-200"
                      : "border-slate-200 bg-slate-50 text-cyan-700"
                  }`}
                >
                  <Clock3 className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Live account activity</h2>
                  <p className={`text-sm ${mutedTextClass}`}>
                    Fresh records from transactions, alerts, and copy-trader activity.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {recentActivity.length > 0 ? (
                  recentActivity.slice(0, 6).map((result) => {
                    const Icon = result.icon || Search;

                    return (
                      <Link
                        key={result.id}
                        to={result.path}
                        className={`rounded-[22px] border p-4 transition ${
                          isDark
                            ? "border-slate-800 bg-slate-900/82 hover:border-teal-400/20 hover:bg-slate-900"
                            : "border-slate-200 bg-white/92 hover:border-teal-300 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
                              isDark
                                ? "border-slate-800 bg-slate-900 text-teal-200"
                                : "border-slate-200 bg-slate-50 text-teal-700"
                            }`}
                          >
                            <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={getKindChipClass(theme, result.kind)}>
                                {SEARCH_KIND_LABELS[result.kind]}
                              </span>
                              {result.badge ? (
                                <span className={`text-[11px] ${mutedTextClass}`}>
                                  {result.badge}
                                </span>
                              ) : null}
                            </div>
                            <h3 className="mt-3 truncate text-base font-semibold">
                              {result.title}
                            </h3>
                            <p className={`mt-1 text-sm leading-7 ${mutedTextClass}`}>
                              {result.description}
                            </p>
                            {result.meta ? (
                              <p className={`mt-2 text-xs ${mutedTextClass}`}>
                                {result.meta}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div
                    className={`rounded-[22px] border px-5 py-8 xl:col-span-2 ${
                      isDark
                        ? "border-slate-800 bg-slate-900/82 text-slate-400"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    No live activity has been indexed yet. Once transactions, alerts, or copy-trader records come in, they will appear here.
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-6">
            <section className={`rounded-[30px] border p-6 ${glassPanelClass}`}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    Results for "{deferredQuery.trim()}"
                  </h2>
                  <p className={`mt-1 text-sm ${mutedTextClass}`}>
                    {results.length} result{results.length === 1 ? "" : "s"} matched across workspaces, products, and live account records.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {SEARCH_KIND_FILTERS.map((filter) => {
                    const count =
                      filter.id === "all"
                        ? results.length
                        : countsByKind[filter.id] || 0;
                    const active = activeFilter === filter.id;

                    return (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setActiveFilter(filter.id)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                          active
                            ? isDark
                              ? "border-teal-400/24 bg-teal-500/10 text-teal-200"
                              : "border-teal-300 bg-teal-50 text-teal-700"
                            : isDark
                              ? "border-slate-800 bg-slate-900 text-slate-300 hover:border-teal-400/18 hover:text-teal-200"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-teal-300 hover:text-teal-700"
                        }`}
                      >
                        {filter.label} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {filteredResults.length > 0 ? (
              <section className="grid gap-4 xl:grid-cols-2">
                {filteredResults.map((result) => {
                  const Icon = result.icon || Search;

                  return (
                    <Link
                      key={result.id}
                      to={result.path}
                      className={`rounded-[28px] border p-5 transition ${
                        isDark
                          ? "border-white/10 bg-slate-900/72 hover:border-teal-400/20 hover:bg-slate-900"
                          : "border-white/70 bg-white/92 hover:border-teal-300 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                            isDark
                              ? "border-teal-400/18 bg-teal-500/10 text-teal-200"
                              : "border-teal-200 bg-teal-50 text-teal-700"
                          }`}
                        >
                          <Icon className="h-5 w-5" strokeWidth={2.2} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={getKindChipClass(theme, result.kind)}>
                              {SEARCH_KIND_LABELS[result.kind] || "Result"}
                            </span>
                            {result.category ? (
                              <span className={`text-[11px] ${mutedTextClass}`}>
                                {result.category}
                              </span>
                            ) : null}
                            {result.badge ? (
                              <span className={`text-[11px] ${mutedTextClass}`}>
                                {result.badge}
                              </span>
                            ) : null}
                          </div>

                          <h3 className="mt-3 text-lg font-semibold">
                            {result.title}
                          </h3>
                          <p className={`mt-2 text-sm leading-7 ${mutedTextClass}`}>
                            {result.description}
                          </p>

                          {result.meta ? (
                            <p className={`mt-3 text-xs ${mutedTextClass}`}>
                              {result.meta}
                            </p>
                          ) : null}

                          <div className="mt-5 flex items-center justify-between gap-3">
                            <span
                              className={`truncate text-xs font-medium uppercase tracking-[0.18em] ${
                                isDark ? "text-slate-500" : "text-slate-500"
                              }`}
                            >
                              {result.path}
                            </span>
                            <span
                              className={`inline-flex items-center gap-2 text-sm font-medium ${
                                isDark ? "text-teal-200" : "text-teal-700"
                              }`}
                            >
                              {result.actionLabel || "Open"}
                              <ArrowUpRight className="h-4 w-4" strokeWidth={2.2} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </section>
            ) : (
              <section className={`rounded-[30px] border p-6 ${glassPanelClass}`}>
                <div
                  className={`rounded-[24px] border px-6 py-10 text-center ${softPanelClass}`}
                >
                  <h2 className="text-2xl font-semibold">No results matched</h2>
                  <p className={`mt-3 text-sm leading-7 ${mutedTextClass}`}>
                    Try a broader term like deposit, mining, subscription, copy trader, balance, or alerts.
                  </p>

                  <div className="mt-6 grid gap-4 xl:grid-cols-2">
                    {featuredResults.slice(0, 4).map((result) => (
                      <Link
                        key={result.id}
                        to={result.path}
                        className={`rounded-[20px] border p-4 text-left transition ${
                          isDark
                            ? "border-slate-800 bg-slate-900/82 hover:border-teal-400/20 hover:bg-slate-900"
                            : "border-slate-200 bg-white/92 hover:border-teal-300 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <result.icon
                            className={isDark ? "h-4.5 w-4.5 text-teal-200" : "h-4.5 w-4.5 text-teal-700"}
                            strokeWidth={2.2}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{result.title}</p>
                            <p className={`truncate text-xs ${mutedTextClass}`}>
                              {result.category}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
