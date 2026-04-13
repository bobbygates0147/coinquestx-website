import { formatCurrencyAmount } from "./currency";

const SOURCE_FEATURE_LABELS = {
  wallet: "Wallet",
  trading: "Trading",
  "copy-trading": "Copy Trade",
  signals: "Daily Signal",
  subscription: "Subscription",
  mining: "Mining",
  staking: "Stake",
  bots: "Buy Bots",
  "real-estate": "Real Estate",
  referrals: "Referrals",
  account: "Account",
  "admin-balance-control": "Admin Balance Control",
  "balance-ledger": "Balance Ledger",
};

const TRANSACTION_TYPE_LABELS = {
  CopyTrade: "Copy Trade",
  PlaceTrade: "Place Trade",
  RealEstate: "Real Estate",
  BuyBot: "Buy Bot",
};

const safeText = (value) => `${value || ""}`.trim();
const toSentenceCaseWords = (value = "") =>
  safeText(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) =>
      index === 0
        ? `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`
        : word.toLowerCase()
    )
    .join(" ");
const isProfitHistoryAdjustment = (transaction = {}) =>
  safeText(transaction?.metadata?.adjustmentKind).toLowerCase() ===
  "profit_history";
const PROFIT_SUFFIX_PATTERN = /\s+profit$/i;
export const isAdjustmentTransaction = (transaction = {}) =>
  safeText(transaction?.type) === "Adjustment";

const getTransactionDestination = (transaction = {}) => {
  const value = transaction?.destination ?? transaction?.metadata?.destination;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value;
};

export const getTransactionDestinationRows = (transaction = {}) => {
  const destination = getTransactionDestination(transaction);
  const method = safeText(transaction?.paymentMethod || transaction?.method).toLowerCase();

  if (
    method === "crypto" ||
    safeText(destination.cryptoAddress) ||
    safeText(destination.cryptoAsset)
  ) {
    return [
      { label: "Asset", value: safeText(destination.cryptoAsset) },
      { label: "Address", value: safeText(destination.cryptoAddress) },
    ].filter((entry) => entry.value);
  }

  if (
    method === "bank transfer" ||
    safeText(destination.bankName) ||
    safeText(destination.bankAccountNumber) ||
    safeText(destination.bankAccountName)
  ) {
    return [
      { label: "Bank", value: safeText(destination.bankName) },
      { label: "Account Name", value: safeText(destination.bankAccountName) },
      { label: "Account Number", value: safeText(destination.bankAccountNumber) },
    ].filter((entry) => entry.value);
  }

  if (method === "cash app" || safeText(destination.cashAppId)) {
    return [{ label: "Cash App ID", value: safeText(destination.cashAppId) }].filter(
      (entry) => entry.value
    );
  }

  if (method === "paypal" || safeText(destination.paypalEmail)) {
    return [{ label: "PayPal Email", value: safeText(destination.paypalEmail) }].filter(
      (entry) => entry.value
    );
  }

  if (method === "skrill" || safeText(destination.skrillEmail)) {
    return [{ label: "Skrill Email", value: safeText(destination.skrillEmail) }].filter(
      (entry) => entry.value
    );
  }

  return Object.entries(destination)
    .map(([key, value]) => ({
      label: key
        .replace(/([A-Z])/g, " $1")
        .replace(/[_-]+/g, " ")
        .trim(),
      value: safeText(value),
    }))
    .filter((entry) => entry.value);
};

export const getTransactionDestinationSummary = (transaction = {}) =>
  getTransactionDestinationRows(transaction)
    .map((entry) => `${entry.label}: ${entry.value}`)
    .join(" / ");

const getAdjustmentReasonLabel = (transaction = {}) => {
  const reasonLabel = safeText(transaction?.metadata?.reasonLabel);
  if (!reasonLabel) return "";

  if (isProfitHistoryAdjustment(transaction)) {
    return reasonLabel.replace(PROFIT_SUFFIX_PATTERN, "").trim();
  }

  return reasonLabel;
};

export const getAdjustmentDelta = (transaction = {}) => {
  const metadataDelta = Number(transaction?.metadata?.delta);
  if (Number.isFinite(metadataDelta) && metadataDelta !== 0) {
    return metadataDelta;
  }

  const before = Number(transaction?.balanceBefore);
  const after = Number(transaction?.balanceAfter);
  if (Number.isFinite(before) && Number.isFinite(after) && before !== after) {
    return after - before;
  }

  const amount = Math.abs(Number(transaction?.amount) || 0);
  const operation = safeText(transaction?.metadata?.operation).toLowerCase();
  if (operation === "deduct") return -amount;
  if (operation === "increase") return amount;
  return 0;
};

export const getTransactionTypeLabel = (transaction = {}) => {
  const rawType = safeText(transaction?.type);
  if (!isAdjustmentTransaction(transaction)) {
    return TRANSACTION_TYPE_LABELS[rawType] || rawType || "Activity";
  }

  const delta = getAdjustmentDelta(transaction);
  if (isProfitHistoryAdjustment(transaction)) {
    if (delta < 0) return "Profit Debited";
    if (delta > 0) return "Profit Credited";
    return "Profit Recorded";
  }

  if (delta < 0) return "Debited";
  if (delta > 0) return "Credited";
  return "Recorded";
};

export const getTransactionSourceLabel = (transaction = {}) => {
  const reasonLabel = getAdjustmentReasonLabel(transaction);
  if (isAdjustmentTransaction(transaction) && reasonLabel) {
    return reasonLabel;
  }

  const sourceFeature = safeText(transaction?.sourceFeature);
  if (!sourceFeature) return "Account";

  return SOURCE_FEATURE_LABELS[sourceFeature] || sourceFeature;
};

export const getAdjustmentReferenceLabel = (transaction = {}) =>
  safeText(
    transaction?.metadata?.referenceName ||
      transaction?.metadata?.relatedEntityLabel ||
      transaction?.metadata?.relatedEntityName
  );

const getProfitHistoryDisplayLabel = (transaction = {}) => {
  const reasonLabel = toSentenceCaseWords(
    getTransactionSourceLabel(transaction) || "Account"
  );
  const reasonKey = safeText(transaction?.metadata?.reasonKey).toLowerCase();

  switch (reasonKey) {
    case "mining":
      return `${reasonLabel} reward`;
    case "stake":
      return `${reasonLabel} payout`;
    case "referral":
      return `${reasonLabel} reward`;
    default:
      return `${reasonLabel} profit`;
  }
};

const buildProfitHistoryActivityText = (
  transaction = {},
  formattedAmount = ""
) => {
  const displayLabel = getProfitHistoryDisplayLabel(transaction);
  const referenceLabel = getAdjustmentReferenceLabel(transaction);
  const delta = getAdjustmentDelta(transaction);
  const currency = transaction?.currency || "USD";
  const amountText =
    formattedAmount ||
    formatCurrencyAmount(
      Math.abs(delta || Number(transaction?.amount) || 0),
      currency
    );

  if (delta < 0) {
    return `${displayLabel} updated${
      referenceLabel ? ` for ${referenceLabel}` : ""
    }: -${amountText}`;
  }

  if (delta > 0) {
    return `${displayLabel} credited${
      referenceLabel ? ` from ${referenceLabel}` : ""
    }: ${amountText}`;
  }

  return `${displayLabel} recorded${
    referenceLabel ? ` for ${referenceLabel}` : ""
  }`;
};

const buildPlaceTradeActivityText = (transaction = {}) => {
  const metadata = transaction?.metadata || {};
  const currency = transaction?.currency || "USD";
  const phase = safeText(metadata.phase).toLowerCase();
  const result = safeText(metadata.result).toLowerCase();
  const assetLabel = safeText(metadata.asset) || "Place trade";
  const principal = Number(metadata.principal ?? transaction?.amount);
  const settlementAmount = Number(metadata.settlementAmount);
  const profitLoss = Number(metadata.profitLoss);

  if (phase === "opened") {
    return `${assetLabel} place trade opened. ${formatCurrencyAmount(
      principal,
      currency
    )} reserved from balance.`;
  }

  if (phase === "cancelled") {
    return `${assetLabel} place trade cancelled. ${formatCurrencyAmount(
      principal,
      currency
    )} returned to balance.`;
  }

  if (phase === "settled") {
    if (result === "loss") {
      const lossText = formatCurrencyAmount(Math.abs(profitLoss || 0), currency);
      const returnedText = formatCurrencyAmount(
        Math.max(0, settlementAmount || 0),
        currency
      );

      return settlementAmount > 0
        ? `${assetLabel} trade closed at a loss. ${returnedText} returned after ${lossText} loss.`
        : `${assetLabel} trade closed at a loss of ${lossText}. No stake was returned.`;
    }

    if (result === "win") {
      const profitText = formatCurrencyAmount(Math.abs(profitLoss || 0), currency);
      const creditedText = formatCurrencyAmount(
        Math.max(0, settlementAmount || 0),
        currency
      );

      return `${assetLabel} trade closed in profit. ${creditedText} credited, including ${profitText} profit.`;
    }

    return `${assetLabel} trade closed and balance was updated.`;
  }

  return "";
};

export const getTransactionDisplayDetails = (transaction = {}) => {
  if (isAdjustmentTransaction(transaction) && isProfitHistoryAdjustment(transaction)) {
    return buildProfitHistoryActivityText(transaction);
  }

  if (safeText(transaction?.type) === "PlaceTrade") {
    const placeTradeText = buildPlaceTradeActivityText(transaction);
    if (placeTradeText) return placeTradeText;
  }

  const details = safeText(transaction?.details);
  if (details) return details;

  if (isAdjustmentTransaction(transaction)) {
    const reasonLabel = getTransactionSourceLabel(transaction);
    const referenceLabel = getAdjustmentReferenceLabel(transaction);
    const delta = getAdjustmentDelta(transaction);
    const prefix = delta < 0 ? "Debited for" : "Credited from";

    return `${prefix} ${reasonLabel}${referenceLabel ? ` - ${referenceLabel}` : ""}`;
  }

  return "Activity recorded";
};

export const formatTransactionAmount = (transaction = {}) => {
  const currency = transaction?.currency || "USD";
  if (isAdjustmentTransaction(transaction)) {
    const delta = getAdjustmentDelta(transaction);
    const absoluteValue = Math.abs(delta || Number(transaction?.amount) || 0);
    const prefix = delta < 0 ? "-" : "+";
    return `${prefix}${formatCurrencyAmount(absoluteValue, currency)}`;
  }

  return formatCurrencyAmount(transaction?.amount || 0, currency);
};

export const buildAdjustmentNotificationText = (
  transaction = {},
  formattedAmount = ""
) => {
  if (isProfitHistoryAdjustment(transaction)) {
    return buildProfitHistoryActivityText(transaction, formattedAmount);
  }

  const reasonLabel = getTransactionSourceLabel(transaction);
  const referenceLabel = getAdjustmentReferenceLabel(transaction);
  const delta = getAdjustmentDelta(transaction);
  const prefix = delta < 0 ? "Balance debited for" : "Balance credited from";
  const suffix = formattedAmount ? `: ${formattedAmount}` : "";

  return `${prefix} ${reasonLabel}${referenceLabel ? ` - ${referenceLabel}` : ""}${suffix}`;
};
