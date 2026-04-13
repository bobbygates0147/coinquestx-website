import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import {
  DEFAULT_LANGUAGE_CODE,
  getGoogleTranslateLanguageList,
  getLanguageOption,
  getStoredLanguageCode,
  LANGUAGE_CHANGED_EVENT,
  LANGUAGE_OPTIONS,
  normalizeLanguageCode,
  setStoredLanguageCode,
} from "../lib/languages";

const LanguageContext = createContext(null);
const GOOGLE_TRANSLATE_SCRIPT_ID = "google-translate-script";
const ENGLISH_RESET_RELOAD_DELAY_MS = 180;

function writeTranslateCookie(languageCode) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const cookieValue = `/en/${languageCode}`;
  const expires =
    languageCode === DEFAULT_LANGUAGE_CODE
      ? "Thu, 01 Jan 1970 00:00:00 GMT"
      : "Fri, 31 Dec 9999 23:59:59 GMT";

  const hostParts = window.location.hostname.split(".");
  const isIpAddress = /^\d{1,3}(\.\d{1,3}){3}$/.test(window.location.hostname);
  const domain =
    !isIpAddress && hostParts.length > 1
      ? `;domain=.${hostParts.slice(-2).join(".")}`
      : "";

  document.cookie = `googtrans=${cookieValue};path=/;expires=${expires}`;
  document.cookie = `googtrans=${cookieValue};path=/;expires=${expires}${domain}`;
}

function findTranslateCombo() {
  if (typeof document === "undefined") return null;
  return document.querySelector(".goog-te-combo");
}

function dispatchComboChange(combo) {
  combo.dispatchEvent(new Event("change", { bubbles: true }));
}

function getTranslateCookieLanguage() {
  if (typeof document === "undefined") return "";

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith("googtrans="));

  if (!cookie) return "";

  const value = decodeURIComponent(cookie.split("=")[1] || "");
  return value.split("/").filter(Boolean)[1] || "";
}

function getActiveGoogleLanguage() {
  const combo = findTranslateCombo();
  return normalizeLanguageCode(combo?.value || getTranslateCookieLanguage());
}

function applyGoogleLanguage(languageCode) {
  if (typeof document === "undefined") return;

  document.documentElement.lang = languageCode;

  if (languageCode === DEFAULT_LANGUAGE_CODE) {
    writeTranslateCookie(languageCode);
    const combo = findTranslateCombo();
    if (combo?.value) {
      combo.value = "";
      dispatchComboChange(combo);
    }
    return;
  }

  writeTranslateCookie(languageCode);
  const combo = findTranslateCombo();
  if (!combo) return;
  if (combo.value !== languageCode) {
    combo.value = languageCode;
  }
  dispatchComboChange(combo);
}

function scheduleEnglishResetReload() {
  if (typeof window === "undefined") return;

  window.setTimeout(() => {
    window.location.reload();
  }, ENGLISH_RESET_RELOAD_DELAY_MS);
}

export function LanguageProvider({ children }) {
  const location = useLocation();
  const includedLanguages = useMemo(() => getGoogleTranslateLanguageList(), []);
  const [languageCode, setLanguageCodeState] = useState(() => getStoredLanguageCode());
  const [scriptReady, setScriptReady] = useState(false);

  const setLanguageCode = useCallback((value) => {
    const previousCode = getStoredLanguageCode();
    const activeGoogleLanguage = getActiveGoogleLanguage();
    const nextCode = normalizeLanguageCode(value);
    const shouldReloadForEnglishReset =
      nextCode === DEFAULT_LANGUAGE_CODE &&
      (previousCode !== DEFAULT_LANGUAGE_CODE ||
        activeGoogleLanguage !== DEFAULT_LANGUAGE_CODE);

    const normalized = setStoredLanguageCode(nextCode);
    setLanguageCodeState(normalized);
    applyGoogleLanguage(normalized);

    if (shouldReloadForEnglishReset) {
      scheduleEnglishResetReload();
    }
  }, []);

  useEffect(() => {
    const onLanguageChanged = (event) => {
      const nextCode = normalizeLanguageCode(event.detail?.code);
      setLanguageCodeState(nextCode);
    };

    window.addEventListener(LANGUAGE_CHANGED_EVENT, onLanguageChanged);
    return () => {
      window.removeEventListener(LANGUAGE_CHANGED_EVENT, onLanguageChanged);
    };
  }, []);

  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return;

      new window.google.translate.TranslateElement(
        {
          pageLanguage: DEFAULT_LANGUAGE_CODE,
          includedLanguages,
          autoDisplay: false,
        },
        "google_translate_element"
      );

      setScriptReady(true);
      window.setTimeout(() => applyGoogleLanguage(languageCode), 300);
    };

    if (document.getElementById(GOOGLE_TRANSLATE_SCRIPT_ID)) {
      setScriptReady(Boolean(findTranslateCombo()));
      window.setTimeout(() => applyGoogleLanguage(languageCode), 300);
      return undefined;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_TRANSLATE_SCRIPT_ID;
    script.async = true;
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.body.appendChild(script);

    return () => {
      if (window.googleTranslateElementInit) {
        delete window.googleTranslateElementInit;
      }
    };
  }, [includedLanguages, languageCode]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      applyGoogleLanguage(languageCode);
    }, scriptReady ? 250 : 800);

    return () => window.clearTimeout(timer);
  }, [languageCode, location.pathname, location.search, scriptReady]);

  const value = useMemo(
    () => ({
      languageCode,
      languageLabel: getLanguageOption(languageCode).label,
      languageOptions: LANGUAGE_OPTIONS,
      setLanguageCode,
    }),
    [languageCode, setLanguageCode]
  );

  return (
    <LanguageContext.Provider value={value}>
      <div id="google_translate_element" aria-hidden="true" className="hidden" />
      {children}
    </LanguageContext.Provider>
  );
}

LanguageProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
