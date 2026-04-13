import { lazy } from "react";

const CHUNK_RELOAD_FLAG_PREFIX = "coinquestx:chunk-reload";
const CHUNK_RELOAD_QUERY_PARAM = "__chunk_reload";
const CHUNK_ERROR_PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /Importing a module script failed/i,
  /Loading chunk [\d]+ failed/i,
];

const getCurrentPathKey = () => {
  if (typeof window === "undefined") return CHUNK_RELOAD_FLAG_PREFIX;
  return `${CHUNK_RELOAD_FLAG_PREFIX}:${window.location.pathname}`;
};

const clearRecoveryFlag = () => {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(getCurrentPathKey());
};

const getErrorMessage = (errorLike) => {
  if (!errorLike) return "";
  if (typeof errorLike === "string") return errorLike;
  if (typeof errorLike?.message === "string") return errorLike.message;
  if (typeof errorLike?.reason?.message === "string") return errorLike.reason.message;
  if (typeof errorLike?.reason === "string") return errorLike.reason;
  return "";
};

const isChunkLoadError = (errorLike) => {
  const message = getErrorMessage(errorLike);
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
};

const reloadWithCacheBust = () => {
  const url = new URL(window.location.href);
  url.searchParams.set(CHUNK_RELOAD_QUERY_PARAM, `${Date.now()}`);
  window.location.replace(url.toString());
};

const clearRecoveryQueryParam = () => {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  if (!url.searchParams.has(CHUNK_RELOAD_QUERY_PARAM)) return;

  url.searchParams.delete(CHUNK_RELOAD_QUERY_PARAM);
  window.history.replaceState(
    window.history.state,
    document.title,
    `${url.pathname}${url.search}${url.hash}`
  );
};

const recoverFromChunkLoad = (errorLike) => {
  if (typeof window === "undefined" || !isChunkLoadError(errorLike)) {
    return false;
  }

  const recoveryKey = getCurrentPathKey();
  if (window.sessionStorage.getItem(recoveryKey) === "1") {
    window.sessionStorage.removeItem(recoveryKey);
    return false;
  }

  window.sessionStorage.setItem(recoveryKey, "1");
  reloadWithCacheBust();
  return true;
};

let recoveryListenersAttached = false;

export const setupChunkLoadRecovery = () => {
  if (typeof window === "undefined" || recoveryListenersAttached) return;

  recoveryListenersAttached = true;
  clearRecoveryQueryParam();

  window.addEventListener("vite:preloadError", (event) => {
    if (recoverFromChunkLoad(event?.payload || event)) {
      event.preventDefault?.();
    }
  });

  window.addEventListener(
    "error",
    (event) => {
      recoverFromChunkLoad(event?.error || event);
    },
    true
  );

  window.addEventListener("unhandledrejection", (event) => {
    if (recoverFromChunkLoad(event?.reason || event)) {
      event.preventDefault?.();
    }
  });
};

export const lazyWithRetry = (importer) =>
  lazy(async () => {
    try {
      const module = await importer();
      clearRecoveryFlag();
      return module;
    } catch (error) {
      if (recoverFromChunkLoad(error)) {
        return new Promise(() => {});
      }
      throw error;
    }
  });
