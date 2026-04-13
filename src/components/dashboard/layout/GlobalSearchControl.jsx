import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Clock3,
  Command,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import PropTypes from "prop-types";
import {
  readRecentSearches,
  SEARCH_KIND_LABELS,
  storeRecentSearch,
  useGlobalSearch,
} from "../../../hooks/useGlobalSearch";

const getSearchSurfaceClass = (theme) =>
  theme === "dark"
    ? "border-slate-800 bg-slate-950 shadow-[0_26px_90px_rgba(2,8,23,0.56)]"
    : "border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.12)]";

const getSearchInputClass = (theme) =>
  theme === "dark"
    ? "border-slate-800 bg-slate-900/85 text-slate-100 placeholder:text-slate-500 focus-within:border-teal-400/28 focus-within:bg-slate-900"
    : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-within:border-teal-300 focus-within:bg-white";

const getSearchKindChipClass = (theme, kind) => {
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

function GlobalSearchControl({ theme, compact = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isCompactExpanded, setIsCompactExpanded] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => readRecentSearches());
  const deferredQuery = useDeferredValue(query);
  const isDark = theme === "dark";
  const hasQuery = deferredQuery.trim().length > 0;
  const { results, featuredResults, recentActivity } = useGlobalSearch(
    deferredQuery,
    { maxResults: 6 }
  );

  const previewResults = useMemo(
    () => (hasQuery ? results : featuredResults.slice(0, 4)),
    [featuredResults, hasQuery, results]
  );

  useEffect(() => {
    if (location.pathname.toLowerCase() !== "/search") return;

    const params = new URLSearchParams(location.search);
    setQuery(params.get("q") || "");
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current?.contains(event.target)) return;
      setIsOpen(false);
      if (compact) {
        setIsCompactExpanded(false);
      }
    };

    const handleKeyboardShortcuts = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen(true);
        if (compact) {
          setIsCompactExpanded(true);
        }
        window.requestAnimationFrame(() => inputRef.current?.focus());
      }

      if (event.key === "Escape") {
        setIsOpen(false);
        if (compact) {
          setIsCompactExpanded(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyboardShortcuts);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyboardShortcuts);
    };
  }, [compact]);

  const navigateToSearchPage = (nextQuery) => {
    const trimmed = `${nextQuery || ""}`.trim();
    const params = new URLSearchParams();

    if (trimmed) {
      storeRecentSearch(trimmed);
      setRecentSearches(readRecentSearches());
      params.set("q", trimmed);
    }

    navigate({
      pathname: "/Search",
      search: params.toString() ? `?${params.toString()}` : "",
    });
    setIsOpen(false);
    if (compact) {
      setIsCompactExpanded(false);
    }
  };

  const navigateToResult = (result) => {
    if (query.trim()) {
      storeRecentSearch(query);
      setRecentSearches(readRecentSearches());
    }

    navigate(result?.path || "/Search");
    setIsOpen(false);
    if (compact) {
      setIsCompactExpanded(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    navigateToSearchPage(query);
  };

  const handleRecentQuery = (value) => {
    setQuery(value);
    navigateToSearchPage(value);
  };

  const panelClass = compact
    ? `fixed left-3 right-3 top-[4.75rem] z-50 overflow-hidden rounded-[1.5rem] border ${getSearchSurfaceClass(
        theme
      )}`
    : `absolute left-0 right-0 top-[calc(100%+0.75rem)] z-50 overflow-hidden rounded-[1.5rem] border ${getSearchSurfaceClass(
        theme
      )}`;

  const renderSuggestions = () => (
    <div className={panelClass}>
      {compact && (
        <div className={`border-b p-3 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
          <form onSubmit={handleSubmit}>
            <label
              className={`flex h-12 items-center gap-3 rounded-[1.15rem] border px-4 transition-all ${getSearchInputClass(
                theme
              )}`}
            >
              <Search
                className={isDark ? "h-4.5 w-4.5 text-teal-300" : "h-4.5 w-4.5 text-teal-600"}
                strokeWidth={2.2}
              />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setIsOpen(true);
                }}
                placeholder="Search features, traders, records..."
                className="w-full bg-transparent text-sm outline-none"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
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
      )}

      <div className="max-h-[28rem] overflow-y-auto p-3">
        {!hasQuery && recentSearches.length > 0 && (
          <div className="mb-4">
            <div className="mb-2 flex items-center gap-2">
              <Clock3
                className={isDark ? "h-3.5 w-3.5 text-slate-500" : "h-3.5 w-3.5 text-slate-400"}
                strokeWidth={2.2}
              />
              <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${
                isDark ? "text-slate-500" : "text-slate-500"
              }`}>
                Recent Searches
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.slice(0, 4).map((entry) => (
                <button
                  key={entry}
                  type="button"
                  onClick={() => handleRecentQuery(entry)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    isDark
                      ? "border-slate-800 bg-slate-900 text-slate-200 hover:border-teal-400/28 hover:text-teal-200"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-teal-300 hover:text-teal-700"
                  }`}
                >
                  {entry}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-2 flex items-center gap-2">
          <Sparkles
            className={isDark ? "h-3.5 w-3.5 text-teal-300" : "h-3.5 w-3.5 text-teal-600"}
            strokeWidth={2.2}
          />
          <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${
            isDark ? "text-teal-200/90" : "text-teal-700"
          }`}>
            {hasQuery ? "Top Matches" : "Featured Workspaces"}
          </p>
        </div>

        {previewResults.length > 0 ? (
          <div className="space-y-2">
            {previewResults.map((result) => {
              const Icon = result.icon || Search;

              return (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => navigateToResult(result)}
                  className={`flex w-full items-start gap-3 rounded-[1.2rem] border px-3 py-3 text-left transition ${
                    isDark
                      ? "border-slate-800 bg-slate-900 hover:border-teal-400/20 hover:bg-slate-900"
                      : "border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
                      isDark
                        ? "border-teal-400/18 bg-teal-500/10 text-teal-200"
                        : "border-teal-200 bg-teal-50 text-teal-700"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className={getSearchKindChipClass(theme, result.kind)}>
                        {SEARCH_KIND_LABELS[result.kind] || "Result"}
                      </span>
                      {result.badge ? (
                        <span className={`text-[11px] ${
                          isDark ? "text-slate-500" : "text-slate-500"
                        }`}>
                          {result.badge}
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={`mt-2 block truncate text-sm font-semibold ${
                        isDark ? "text-slate-100" : "text-slate-900"
                      }`}
                    >
                      {result.title}
                    </span>
                    <span
                      className={`mt-1 line-clamp-2 block text-xs leading-6 ${
                        isDark ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      {result.description}
                    </span>
                  </span>
                  <ArrowUpRight
                    className={isDark ? "mt-1 h-4 w-4 text-slate-500" : "mt-1 h-4 w-4 text-slate-400"}
                    strokeWidth={2.2}
                  />
                </button>
              );
            })}
          </div>
        ) : (
          <div
            className={`rounded-[1.3rem] border px-4 py-6 text-center ${
              isDark
                ? "border-slate-800 bg-slate-900 text-slate-400"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            <p className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}>
              No direct matches found
            </p>
            <p className="mt-1 text-xs">
              Try account, deposit, bots, mining, subscription, or a trader name.
            </p>
          </div>
        )}

        {!hasQuery && recentActivity.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center gap-2">
              <Clock3
                className={isDark ? "h-3.5 w-3.5 text-slate-500" : "h-3.5 w-3.5 text-slate-400"}
                strokeWidth={2.2}
              />
              <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${
                isDark ? "text-slate-500" : "text-slate-500"
              }`}>
                Live Activity
              </p>
            </div>
            <div className="space-y-2">
              {recentActivity.slice(0, 3).map((result) => (
                <button
                  key={result.id}
                  type="button"
                  onClick={() => navigateToResult(result)}
                  className={`flex w-full items-start gap-3 rounded-[1.1rem] px-3 py-2.5 text-left transition ${
                    isDark ? "hover:bg-slate-900" : "hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`mt-1 h-2.5 w-2.5 rounded-full ${
                      isDark ? "bg-teal-300" : "bg-teal-500"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-sm font-medium ${
                        isDark ? "text-slate-200" : "text-slate-800"
                      }`}
                    >
                      {result.title}
                    </span>
                    <span
                      className={`mt-1 block truncate text-xs ${
                        isDark ? "text-slate-500" : "text-slate-500"
                      }`}
                    >
                      {result.meta || result.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={`border-t px-4 py-3 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
        <button
          type="button"
          onClick={() => navigateToSearchPage(query)}
          className={`inline-flex items-center gap-2 text-xs font-medium transition ${
            isDark ? "text-teal-200 hover:text-white" : "text-teal-700 hover:text-teal-900"
          }`}
        >
          <Search className="h-3.5 w-3.5" strokeWidth={2.2} />
          {hasQuery ? "View all search results" : "Open full search page"}
        </button>
      </div>
    </div>
  );

  if (compact) {
    return (
      <div ref={containerRef} className="relative md:hidden">
        <button
          type="button"
          onClick={() => {
            setIsCompactExpanded((previous) => !previous);
            setIsOpen(true);
            window.requestAnimationFrame(() => inputRef.current?.focus());
          }}
          className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
            isDark
              ? "border-slate-800 bg-slate-900/85 text-slate-300 hover:border-teal-400/30 hover:text-teal-200"
              : "border-slate-200 bg-white text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.06)] hover:border-teal-300 hover:text-teal-700"
          }`}
          aria-label="Open global search"
        >
          <Search className="h-4.5 w-4.5" strokeWidth={2.2} />
        </button>

        {isCompactExpanded && renderSuggestions()}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative hidden w-full md:block">
      <form onSubmit={handleSubmit}>
        <label
          className={`flex h-12 items-center gap-3 rounded-[1.25rem] border px-4 transition-all ${getSearchInputClass(
            theme
          )}`}
        >
          <Search
            className={isDark ? "h-4.5 w-4.5 text-teal-300" : "h-4.5 w-4.5 text-teal-600"}
            strokeWidth={2.2}
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            placeholder="Search features, traders, transactions, alerts..."
            className="w-full bg-transparent text-sm outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setIsOpen(true);
                inputRef.current?.focus();
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
          ) : (
            <span
              className={`hidden shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] lg:inline-flex ${
                isDark
                  ? "border-slate-800 bg-slate-900 text-slate-500"
                  : "border-slate-200 bg-slate-50 text-slate-400"
              }`}
            >
              <Command className="h-3 w-3" strokeWidth={2.2} />
              <span className="whitespace-nowrap leading-none">Ctrl K</span>
            </span>
          )}
        </label>
      </form>

      {isOpen && renderSuggestions()}
    </div>
  );
}

GlobalSearchControl.propTypes = {
  theme: PropTypes.string.isRequired,
  compact: PropTypes.bool,
};

export default GlobalSearchControl;
