import { useMemo } from "react";
import {
  Bell,
  ClipboardList,
  ReceiptText,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { SEARCHABLE_FEATURES } from "../constants/globalSearchCatalog";
import { useCopyTraders } from "../context/CopyTraderContext";
import { useNotifications } from "../context/NotificationContext";
import { useTransactions } from "../context/TransactionContext";
import { useUser } from "../context/UserContext";
import { formatCurrencyAmount } from "../utils/currency";

const GLOBAL_SEARCH_RECENT_KEY = "coinquestx:global-search-recent-v1";
const MAX_RECENT_SEARCHES = 8;

const SEARCH_KIND_PRIORITY = {
  feature: 0,
  product: 1,
  account: 2,
  trader: 3,
  transaction: 4,
  notification: 5,
};

export const SEARCH_KIND_FILTERS = [
  { id: "all", label: "All" },
  { id: "feature", label: "Features" },
  { id: "product", label: "Products" },
  { id: "account", label: "Account" },
  { id: "trader", label: "Copy Traders" },
  { id: "transaction", label: "Transactions" },
  { id: "notification", label: "Alerts" },
];

export const SEARCH_KIND_LABELS = {
  feature: "Feature",
  product: "Product",
  account: "Account",
  trader: "Copy Trader",
  transaction: "Transaction",
  notification: "Alert",
};

const normalizeSearchValue = (value = "") =>
  `${value ?? ""}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const tokenizeSearch = (value = "") =>
  [...new Set(normalizeSearchValue(value).split(/\s+/).filter(Boolean))];

const getTimestamp = (value) => {
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : 0;
};

const truncateText = (value, maxLength = 160) => {
  const normalized = `${value || ""}`.trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
};

const buildSearchDocument = (item) =>
  normalizeSearchValue(
    [
      item.title,
      item.description,
      item.category,
      item.meta,
      item.badge,
      item.path,
      ...(Array.isArray(item.keywords) ? item.keywords : []),
    ].join(" ")
  );

const decorateSearchItem = (item) => ({
  ...item,
  searchDocument: buildSearchDocument(item),
  timestamp: Number(item.timestamp) || 0,
});

const getSearchScore = (item, rawQuery) => {
  const normalizedQuery = normalizeSearchValue(rawQuery);
  if (!normalizedQuery) return 0;

  const tokens = tokenizeSearch(normalizedQuery);
  if (tokens.length === 0) return 0;

  const title = normalizeSearchValue(item.title);
  const description = normalizeSearchValue(item.description);
  const category = normalizeSearchValue(item.category);
  const badge = normalizeSearchValue(item.badge);
  const path = normalizeSearchValue(item.path);
  const document = item.searchDocument || buildSearchDocument(item);
  let score = 0;
  let matched = false;

  if (title === normalizedQuery) {
    score += 240;
    matched = true;
  }
  if (title.startsWith(normalizedQuery)) {
    score += 180;
    matched = true;
  } else if (title.includes(normalizedQuery)) {
    score += 130;
    matched = true;
  }

  if (document.includes(normalizedQuery)) {
    score += 55;
    matched = true;
  }
  if (description.includes(normalizedQuery)) {
    score += 40;
    matched = true;
  }
  if (category.includes(normalizedQuery) || badge.includes(normalizedQuery)) {
    score += 28;
    matched = true;
  }
  if (path.includes(normalizedQuery)) {
    score += 24;
    matched = true;
  }

  tokens.forEach((token) => {
    if (!token) return;

    if (title.startsWith(token)) {
      score += 42;
      matched = true;
    } else if (title.includes(token)) {
      score += 28;
      matched = true;
    }

    if (document.includes(token)) {
      score += 16;
      matched = true;
    }
    if (description.includes(token)) {
      score += 10;
      matched = true;
    }
    if (category.includes(token) || badge.includes(token)) {
      score += 8;
      matched = true;
    }
    if (path.includes(token)) {
      score += 6;
      matched = true;
    }
  });

  if (!matched) return 0;

  if (item.kind === "feature") score += 10;
  if (item.kind === "product") score += 6;
  if (item.kind === "transaction" && `${item.badge || ""}`.toLowerCase() === "pending") {
    score += 4;
  }

  return score;
};

const compareSearchResults = (left, right) => {
  const scoreDelta = (right.score || 0) - (left.score || 0);
  if (scoreDelta !== 0) return scoreDelta;

  const kindDelta =
    (SEARCH_KIND_PRIORITY[left.kind] ?? 99) -
    (SEARCH_KIND_PRIORITY[right.kind] ?? 99);
  if (kindDelta !== 0) return kindDelta;

  const timeDelta = (right.timestamp || 0) - (left.timestamp || 0);
  if (timeDelta !== 0) return timeDelta;

  return `${left.title || ""}`.localeCompare(`${right.title || ""}`);
};

export const readRecentSearches = () => {
  if (typeof window === "undefined") return [];

  try {
    const stored = JSON.parse(
      localStorage.getItem(GLOBAL_SEARCH_RECENT_KEY) || "[]"
    );

    return Array.isArray(stored)
      ? stored.map((entry) => `${entry || ""}`.trim()).filter(Boolean)
      : [];
  } catch (error) {
    console.warn("Failed to read global search history:", error);
    return [];
  }
};

export const storeRecentSearch = (query) => {
  const normalized = `${query || ""}`.trim().replace(/\s+/g, " ");
  if (!normalized || typeof window === "undefined") {
    return readRecentSearches();
  }

  const nextValue = [
    normalized,
    ...readRecentSearches().filter(
      (entry) => entry.toLowerCase() !== normalized.toLowerCase()
    ),
  ].slice(0, MAX_RECENT_SEARCHES);

  try {
    localStorage.setItem(
      GLOBAL_SEARCH_RECENT_KEY,
      JSON.stringify(nextValue)
    );
  } catch (error) {
    console.warn("Failed to persist global search history:", error);
  }

  return nextValue;
};

export function useGlobalSearch(query = "", options = {}) {
  const { maxResults } = options;
  const { userData } = useUser();
  const { transactions = [] } = useTransactions();
  const { copiedTraders = [] } = useCopyTraders();
  const { notifications = [] } = useNotifications();

  const normalizedQuery = normalizeSearchValue(query);
  const currencyCode = userData?.currencyCode || "USD";

  const staticItems = useMemo(
    () => SEARCHABLE_FEATURES.map((item) => decorateSearchItem(item)),
    []
  );

  const accountItems = useMemo(() => {
    const balanceValue = formatCurrencyAmount(userData?.balance || 0, currencyCode);
    const currentPlan = userData?.subscriptionPlan || "Basic";
    const verificationStatus = userData?.kycVerified
      ? userData?.kycStatus || "verified"
      : "pending verification";

    return [
      decorateSearchItem({
        id: "account-balance",
        kind: "account",
        title: "Wallet Balance",
        description: `Current available balance is ${balanceValue}. Use it for products, trades, withdrawals, and wallet activity.`,
        path: "/Account",
        category: "Account",
        icon: WalletCards,
        badge: balanceValue,
        keywords: [
          "balance",
          "wallet",
          "funds",
          "available balance",
          currencyCode,
          `${userData?.balance || 0}`,
        ],
        timestamp: getTimestamp(userData?.updatedAt || userData?.createdAt),
      }),
      decorateSearchItem({
        id: "account-subscription",
        kind: "account",
        title: `Current Plan ${currentPlan}`,
        description: `Active subscription plan is ${currentPlan}. Review plan access, ROI windows, and upgrades from the subscription desk.`,
        path: "/Subscription",
        category: "Account",
        icon: ClipboardList,
        badge: currentPlan,
        keywords: [
          "plan",
          "subscription",
          currentPlan,
          "membership",
          "upgrade",
          "roi",
        ],
        timestamp: getTimestamp(userData?.updatedAt || userData?.createdAt),
      }),
      decorateSearchItem({
        id: "account-kyc-status",
        kind: "account",
        title: "Verification Status",
        description: `KYC is currently ${verificationStatus}. Complete identity checks to keep trading and withdrawals available.`,
        path: "/kyc-verification",
        category: "Account",
        icon: ShieldCheck,
        badge: userData?.kycVerified ? "Verified" : "Pending",
        keywords: ["kyc", "verification", "identity", "verify account", verificationStatus],
        timestamp: getTimestamp(userData?.updatedAt || userData?.createdAt),
      }),
    ];
  }, [
    currencyCode,
    userData?.balance,
    userData?.createdAt,
    userData?.kycStatus,
    userData?.kycVerified,
    userData?.subscriptionPlan,
    userData?.updatedAt,
  ]);

  const traderItems = useMemo(
    () =>
      copiedTraders.map((trader, index) =>
        decorateSearchItem({
          id: `trader:${trader?.backendId || trader?.id || index}`,
          kind: "trader",
          title: trader?.name || trader?.traderName || "Copy Trader",
          description: truncateText(
            `${trader?.status || "Active"} copy trader${trader?.strategy ? ` using ${trader.strategy}` : ""}. Invested ${formatCurrencyAmount(
              trader?.investmentAmount || trader?.amount || 0,
              trader?.currencyCode || currencyCode
            )} with live profit ${formatCurrencyAmount(
              trader?.liveProfit || trader?.pendingProfit || 0,
              trader?.currencyCode || currencyCode
            )}.`,
            168
          ),
          path: "/MyCopytraders",
          category: "Copy Trading",
          icon: Users,
          badge: trader?.status || "Active",
          meta: trader?.strategy || "Managed strategy",
          keywords: [
            trader?.name,
            trader?.traderName,
            trader?.strategy,
            trader?.status,
            `${trader?.investmentAmount || trader?.amount || 0}`,
            `${trader?.liveProfit || trader?.pendingProfit || 0}`,
          ],
          timestamp: getTimestamp(trader?.createdAt || trader?.copiedAt),
        })
      ),
    [copiedTraders, currencyCode]
  );

  const transactionItems = useMemo(
    () =>
      transactions.slice(0, 80).map((transaction, index) => {
        const amount = formatCurrencyAmount(
          transaction?.amount || 0,
          transaction?.currency || currencyCode
        );
        const type = `${transaction?.type || "Transaction"}`.trim();
        const status = `${transaction?.status || "Completed"}`.trim();
        const timestamp = getTimestamp(transaction?.createdAt || transaction?.date);
        const details =
          transaction?.details ||
          transaction?.description ||
          transaction?.paymentMethod ||
          transaction?.method ||
          "Ledger activity";

        return decorateSearchItem({
          id: `transaction:${transaction?.id || transaction?._id || index}`,
          kind: "transaction",
          title: `${type} ${amount}`,
          description: truncateText(
            `${status} record. ${details}.`,
            164
          ),
          path: "/Transactions",
          category: "Activity",
          icon: ReceiptText,
          badge: status,
          meta: timestamp ? new Date(timestamp).toLocaleString() : "",
          keywords: [
            type,
            status,
            details,
            transaction?.paymentMethod,
            transaction?.method,
            amount,
            `${transaction?.amount || 0}`,
          ],
          timestamp,
        });
      }),
    [currencyCode, transactions]
  );

  const notificationItems = useMemo(
    () =>
      notifications.slice(0, 60).map((notification, index) =>
        decorateSearchItem({
          id: `notification:${notification?.id || index}`,
          kind: "notification",
          title: truncateText(notification?.text || "Platform alert", 96),
          description: truncateText(
            `${notification?.read ? "Read" : "Unread"} ${
              notification?.type || "info"
            } alert from ${notification?.date || ""} ${notification?.time || ""}.`,
            164
          ),
          path: "/Notification",
          category: "Alerts",
          icon: Bell,
          badge: notification?.read ? "Read" : "Unread",
          meta:
            [notification?.date, notification?.time].filter(Boolean).join(" ") ||
            "",
          keywords: [
            notification?.text,
            notification?.type,
            notification?.date,
            notification?.time,
          ],
          timestamp: Number(notification?.timestamp) || 0,
        })
      ),
    [notifications]
  );

  const allItems = useMemo(
    () => [
      ...staticItems,
      ...accountItems,
      ...traderItems,
      ...transactionItems,
      ...notificationItems,
    ],
    [accountItems, notificationItems, staticItems, traderItems, transactionItems]
  );

  const results = useMemo(() => {
    if (!normalizedQuery) return [];

    const scoredItems = allItems
      .map((item) => ({
        ...item,
        score: getSearchScore(item, normalizedQuery),
      }))
      .filter((item) => item.score > 0)
      .sort(compareSearchResults);

    if (typeof maxResults === "number" && maxResults > 0) {
      return scoredItems.slice(0, maxResults);
    }

    return scoredItems;
  }, [allItems, maxResults, normalizedQuery]);

  const featuredResults = useMemo(() => {
    const featuredStatic = staticItems.filter((item) => item.featured);
    return [...featuredStatic, ...accountItems]
      .sort(compareSearchResults)
      .slice(0, 8);
  }, [accountItems, staticItems]);

  const recentActivity = useMemo(
    () =>
      [...transactionItems, ...notificationItems, ...traderItems]
        .sort((left, right) => (right.timestamp || 0) - (left.timestamp || 0))
        .slice(0, 8),
    [notificationItems, traderItems, transactionItems]
  );

  const countsByKind = useMemo(() => {
    const source = normalizedQuery ? results : allItems;
    return source.reduce(
      (accumulator, item) => {
        accumulator[item.kind] = (accumulator[item.kind] || 0) + 1;
        return accumulator;
      },
      {
        feature: 0,
        product: 0,
        account: 0,
        trader: 0,
        transaction: 0,
        notification: 0,
      }
    );
  }, [allItems, normalizedQuery, results]);

  return {
    allItems,
    results,
    featuredResults,
    recentActivity,
    countsByKind,
    hasQuery: Boolean(normalizedQuery),
    normalizedQuery,
  };
}
