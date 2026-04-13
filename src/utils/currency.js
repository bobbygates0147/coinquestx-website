const FALLBACK_CURRENCY_CODE = "USD";
const CURRENCY_CODE_PATTERN = /^[A-Za-z]{3}$/;

const DEFAULT_SYMBOLS = {
  USD: "$",
  EUR: "EUR",
  GBP: "GBP",
  NGN: "NGN",
  CAD: "CAD",
  AUD: "AUD",
};

const isRecord = (value) => Boolean(value) && typeof value === "object";

const toCleanString = (value) => `${value ?? ""}`.trim();

const collectCurrencyCodeCandidates = (payload = {}) => {
  const directCurrency = payload?.currency;
  return [
    payload?.currencyCode,
    payload?.currency_code,
    payload?.preferredCurrency,
    payload?.preferredCurrencyCode,
    payload?.defaultCurrency,
    payload?.settings?.currencyCode,
    payload?.settings?.currency,
    payload?.profile?.currencyCode,
    payload?.profile?.currency,
    payload?.user?.currencyCode,
    payload?.user?.currency,
    payload?.account?.currencyCode,
    payload?.account?.currency,
    isRecord(directCurrency) ? directCurrency.code : directCurrency,
  ];
};

const collectCurrencySymbolCandidates = (payload = {}) => {
  const directCurrency = payload?.currency;
  return [
    payload?.currencySymbol,
    payload?.currency_symbol,
    payload?.preferredCurrencySymbol,
    payload?.symbol,
    payload?.settings?.currencySymbol,
    payload?.profile?.currencySymbol,
    payload?.user?.currencySymbol,
    payload?.account?.currencySymbol,
    isRecord(directCurrency) ? directCurrency.symbol : "",
  ];
};

const normalizeCurrencySymbol = (value) => {
  const candidate = toCleanString(value);
  if (!candidate) return "";
  return candidate.slice(0, 8);
};

export const normalizeCurrencyCode = (
  value,
  fallback = FALLBACK_CURRENCY_CODE
) => {
  const candidate = toCleanString(value).toUpperCase();
  if (!CURRENCY_CODE_PATTERN.test(candidate)) {
    return fallback;
  }

  try {
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: candidate,
    }).format(0);
    return candidate;
  } catch (error) {
    return fallback;
  }
};

export const resolveCurrencyInfo = (...sources) => {
  let resolvedCode = "";
  let resolvedSymbol = "";

  for (const source of sources) {
    if (!isRecord(source)) continue;

    if (!resolvedCode) {
      const codeCandidate = collectCurrencyCodeCandidates(source).find(
        (candidate) => Boolean(toCleanString(candidate))
      );
      if (codeCandidate) {
        resolvedCode = normalizeCurrencyCode(codeCandidate, "");
      }
    }

    if (!resolvedSymbol) {
      const symbolCandidate = collectCurrencySymbolCandidates(source).find(
        (candidate) => Boolean(toCleanString(candidate))
      );
      if (symbolCandidate) {
        resolvedSymbol = normalizeCurrencySymbol(symbolCandidate);
      }
    }

    if (resolvedCode && resolvedSymbol) {
      break;
    }
  }

  const currencyCode = normalizeCurrencyCode(
    resolvedCode,
    FALLBACK_CURRENCY_CODE
  );
  const currencySymbol = resolvedSymbol || DEFAULT_SYMBOLS[currencyCode] || "";

  return { currencyCode, currencySymbol };
};

export const formatCurrencyAmount = (value, currencyCode, options = {}) => {
  const numericValue = Number(value);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
  const normalizedCode = normalizeCurrencyCode(
    currencyCode,
    FALLBACK_CURRENCY_CODE
  );

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalizedCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    }).format(safeValue);
  } catch (error) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: FALLBACK_CURRENCY_CODE,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    }).format(safeValue);
  }
};

export { FALLBACK_CURRENCY_CODE };
