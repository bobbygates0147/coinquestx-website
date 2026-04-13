export const LANGUAGE_STORAGE_KEY = "coinquestx-language";
export const LANGUAGE_CHANGED_EVENT = "coinquestx:language-changed";
export const DEFAULT_LANGUAGE_CODE = "en";

export const LANGUAGE_OPTIONS = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "ar", label: "Arabic", nativeLabel: "Arabic" },
  { code: "bn", label: "Bengali", nativeLabel: "Bangla" },
  { code: "zh-CN", label: "Chinese (Simplified)", nativeLabel: "Chinese Simplified" },
  { code: "zh-TW", label: "Chinese (Traditional)", nativeLabel: "Chinese Traditional" },
  { code: "nl", label: "Dutch", nativeLabel: "Nederlands" },
  { code: "fr", label: "French", nativeLabel: "Francais" },
  { code: "de", label: "German", nativeLabel: "Deutsch" },
  { code: "el", label: "Greek", nativeLabel: "Ellinika" },
  { code: "gu", label: "Gujarati", nativeLabel: "Gujarati" },
  { code: "ha", label: "Hausa", nativeLabel: "Hausa" },
  { code: "hi", label: "Hindi", nativeLabel: "Hindi" },
  { code: "id", label: "Indonesian", nativeLabel: "Bahasa Indonesia" },
  { code: "it", label: "Italian", nativeLabel: "Italiano" },
  { code: "ja", label: "Japanese", nativeLabel: "Nihongo" },
  { code: "ko", label: "Korean", nativeLabel: "Hangugeo" },
  { code: "ms", label: "Malay", nativeLabel: "Bahasa Melayu" },
  { code: "pt", label: "Portuguese", nativeLabel: "Portugues" },
  { code: "ru", label: "Russian", nativeLabel: "Russkiy" },
  { code: "es", label: "Spanish", nativeLabel: "Espanol" },
  { code: "sw", label: "Swahili", nativeLabel: "Kiswahili" },
  { code: "ta", label: "Tamil", nativeLabel: "Tamil" },
  { code: "th", label: "Thai", nativeLabel: "Thai" },
  { code: "tr", label: "Turkish", nativeLabel: "Turkce" },
  { code: "uk", label: "Ukrainian", nativeLabel: "Ukrainska" },
  { code: "ur", label: "Urdu", nativeLabel: "Urdu" },
  { code: "vi", label: "Vietnamese", nativeLabel: "Tieng Viet" },
  { code: "yo", label: "Yoruba", nativeLabel: "Yoruba" },
  { code: "zu", label: "Zulu", nativeLabel: "Zulu" },
];

const LANGUAGE_CODE_SET = new Set(LANGUAGE_OPTIONS.map((option) => option.code));
const LANGUAGE_NAME_TO_CODE = new Map(
  LANGUAGE_OPTIONS.flatMap((option) => [
    [option.code.toLowerCase(), option.code],
    [option.label.toLowerCase(), option.code],
    [option.nativeLabel.toLowerCase(), option.code],
  ])
);

export function normalizeLanguageCode(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return DEFAULT_LANGUAGE_CODE;
  if (LANGUAGE_CODE_SET.has(normalized)) return normalized;

  const lower = normalized.toLowerCase();
  return LANGUAGE_NAME_TO_CODE.get(lower) ?? DEFAULT_LANGUAGE_CODE;
}

export function getLanguageOption(value) {
  const code = normalizeLanguageCode(value);
  return LANGUAGE_OPTIONS.find((option) => option.code === code) ?? LANGUAGE_OPTIONS[0];
}

export function resolveLanguageFromLocale(locale) {
  if (!locale) return DEFAULT_LANGUAGE_CODE;
  const languagePart = locale.split("-")[0]?.trim();
  if (!languagePart) return DEFAULT_LANGUAGE_CODE;

  const normalizedLower = languagePart.toLowerCase();
  if (normalizedLower === "zh") return "zh-CN";
  return normalizeLanguageCode(normalizedLower);
}

export function getStoredLanguageCode() {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE_CODE;

  try {
    return normalizeLanguageCode(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return DEFAULT_LANGUAGE_CODE;
  }
}

export function setStoredLanguageCode(value) {
  const code = normalizeLanguageCode(value);

  if (typeof document !== "undefined") {
    document.documentElement.lang = code;
  }

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    } catch {
      // Ignore storage failures and still update the active page language.
    }

    window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGED_EVENT, { detail: { code } }));
  }

  return code;
}

export function getGoogleTranslateLanguageList() {
  return LANGUAGE_OPTIONS.map((option) => option.code).join(",");
}
