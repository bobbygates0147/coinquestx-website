import {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
  useRef,
} from "react";
import { useTransactions } from "./TransactionContext";
import { useCopyTraders } from "./CopyTraderContext";
import { useUser } from "./UserContext";
import { formatCurrencyAmount } from "../utils/currency";
import { buildAdjustmentNotificationText } from "../utils/transactionPresentation";

const NotificationContext = createContext();

const formatNotificationTime = (date = new Date()) =>
  new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);

const formatNotificationDate = (date = new Date()) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);

const sanitizeNotificationText = (value) => {
  if (typeof value !== "string") return "";

  return value
    .replace(/Ã¢â‚¬Â¢|â€¢/g, " - ")
    .replace(
      /^(âœ…|â³|âŒ|â„¹ï¸|ðŸ“¦|ðŸ“¡|ðŸ¤–|✅|⏳|❌|ℹ️|📦|📡|🤖)\s*/u,
      ""
    )
    .replace(
      /^Copy trading\s+(.+?)\s+with\s+(.+)$/i,
      "Copy trade started with $1: $2 allocated"
    )
    .replace(/\s+/g, " ")
    .trim();
};

const normalizeStoredNotification = (notification = {}) => {
  const timestamp = Number(notification.timestamp) || Date.now();

  return {
    ...notification,
    id: notification.id ?? timestamp,
    text: sanitizeNotificationText(notification.text),
    time:
      typeof notification.time === "string" && notification.time.trim()
        ? notification.time
        : formatNotificationTime(new Date(timestamp)),
    date:
      typeof notification.date === "string" && notification.date.trim()
        ? notification.date
        : formatNotificationDate(new Date(timestamp)),
    timestamp,
    read: Boolean(notification.read),
  };
};

const getScopedNotificationKey = (scopeKey, suffix) =>
  `coinquestx:${scopeKey || "guest"}:${suffix}`;

const RECENT_ACTIVITY_WINDOW_MS = 5 * 60 * 1000;

const isRecentActivity = (value) => {
  const timestamp =
    typeof value === "number" ? value : Date.parse(value || "");

  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return false;
  }

  return Date.now() - timestamp <= RECENT_ACTIVITY_WINDOW_MS;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [storageReady, setStorageReady] = useState(false);
  const { transactions = [], loading: transactionsLoading } = useTransactions();
  const [processedTransactionIds, setProcessedTransactionIds] = useState(
    new Set()
  );
  const [processedCopyTraderIds, setProcessedCopyTraderIds] = useState(
    new Set()
  );
  const { copiedTraders } = useCopyTraders();
  const { userData, isAuthenticated } = useUser();
  const hasInitializedTransactionStreamRef = useRef(false);
  const hasInitializedCopyTraderStreamRef = useRef(false);
  const notificationScopeKey = `${
    userData?.userId || userData?.uid || userData?.email || ""
  }`
    .trim()
    .toLowerCase();

  const formatCurrency = useCallback(
    (value, currencyCode = "USD") =>
      formatCurrencyAmount(value || 0, currencyCode, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    []
  );

  const addNotification = useCallback((message, type = "info", data = {}) => {
    const now = new Date();
    const timestamp = now.getTime();
    const newNotification = {
      id: timestamp + Math.random(),
      text: sanitizeNotificationText(message),
      type,
      data,
      time: formatNotificationTime(now),
      date: formatNotificationDate(now),
      timestamp,
      read: false,
    };

    setNotifications((prev) => [...prev, newNotification]);
    setUnreadCount((prev) => prev + 1);
  }, []);

  const createCopyTradeNotification = useCallback(
    (trader) => {
      addNotification(
        `Copy trade started with ${trader.name}: ${formatCurrency(
          trader.investmentAmount,
          trader.currencyCode || trader.currency || "USD"
        )} allocated`,
        "info",
        {
          amount: trader.investmentAmount,
          trader,
        }
      );
    },
    [addNotification, formatCurrency]
  );

  const createTransactionNotification = useCallback(
    (transaction) => {
      let message = "";
      let notificationType = "transaction";
      const txCurrency = transaction.currency || "USD";
      const txAmount = formatCurrency(transaction.amount || 0, txCurrency);
      const status = `${transaction.status || ""}`.toLowerCase();
      const method = transaction.method || "plan";
      const signalName =
        transaction.signalDetails?.planName || transaction.method || "signal";
      const metadata = transaction.metadata || {};
      const placeTradeAsset = metadata.asset || transaction.method || "trade";
      const placeTradePhase = `${metadata.phase || ""}`.toLowerCase();
      const placeTradeResult = `${metadata.result || ""}`.toLowerCase();
      const settlementAmount = formatCurrency(
        Math.max(0, Number(metadata.settlementAmount) || 0),
        txCurrency
      );

      try {
        switch (`${transaction.type}`.toLowerCase()) {
          case "deposit":
            if (status === "completed") {
              message = `Deposit completed: ${txAmount}`;
              notificationType = "success";
            } else if (status === "pending") {
              message = `Deposit pending: ${txAmount}`;
              notificationType = "info";
            } else if (status === "failed") {
              message = `Deposit failed: ${txAmount}`;
              notificationType = "error";
            }
            break;
          case "withdrawal":
            if (status === "completed") {
              message = `Withdrawal completed: ${txAmount}`;
              notificationType = "success";
            } else if (status === "pending") {
              message = `Withdrawal pending: ${txAmount}`;
              notificationType = "info";
            } else if (status === "failed") {
              message = `Withdrawal failed: ${txAmount}`;
              notificationType = "error";
            }
            break;
          case "subscription":
            if (status === "cancelled") {
              message = `Subscription to ${method} cancelled`;
            } else if (status === "pending") {
              message = `Subscription to ${method} pending`;
            } else {
              message = `Subscription to ${method} activated`;
            }
            break;
          case "signal":
            if (status === "cancelled") {
              message = `Signal service ${signalName} cancelled`;
            } else if (status === "pending") {
              message = `Signal service ${signalName} pending`;
            } else {
              message = `Signal service ${signalName} purchased`;
            }
            break;
          case "adjustment":
            message = buildAdjustmentNotificationText(transaction, txAmount);
            notificationType =
              (Number(transaction.metadata?.delta) || 0) < 0 ||
              (Number(transaction.balanceAfter) || 0) <
                (Number(transaction.balanceBefore) || 0)
                ? "info"
                : "success";
            break;
          case "bot":
            message = `${
              transaction.botDetails?.name || "Trading"
            } bot activated`;
            break;
          case "placetrade":
            if (placeTradePhase === "opened") {
              message = `Place trade opened: ${placeTradeAsset}, ${txAmount} reserved`;
              notificationType = "info";
            } else if (placeTradePhase === "settled" && placeTradeResult === "loss") {
              message =
                Number(metadata.settlementAmount) > 0
                  ? `Place trade closed: ${placeTradeAsset} loss, ${settlementAmount} returned`
                  : `Place trade closed: ${placeTradeAsset} loss, no stake returned`;
              notificationType = "info";
            } else if (placeTradePhase === "settled" && placeTradeResult === "win") {
              message = `Place trade closed: ${placeTradeAsset} profit realized`;
              notificationType = "success";
            } else if (placeTradePhase === "cancelled") {
              message = `Place trade cancelled: ${placeTradeAsset} stake returned`;
              notificationType = "info";
            } else if (status === "completed") {
              message = `Place trade updated: ${placeTradeAsset}`;
              notificationType = "success";
            }
            break;
          default:
            if (status === "completed") {
              message = `Transaction completed: ${
                transaction.description || "Payment processed"
              }`;
              notificationType = "success";
            } else {
              message = `Transaction ${status || "processed"}: ${
                transaction.description || "Updated"
              }`;
            }
        }

        if (message) {
          addNotification(message, notificationType, transaction);
        }
      } catch (error) {
        console.error("Error creating transaction notification:", error);
      }
    },
    [addNotification, formatCurrency]
  );

  useEffect(() => {
    hasInitializedTransactionStreamRef.current = false;
    hasInitializedCopyTraderStreamRef.current = false;
    setStorageReady(false);

    if (!isAuthenticated || !notificationScopeKey) {
      setNotifications([]);
      setUnreadCount(0);
      setProcessedTransactionIds(new Set());
      setProcessedCopyTraderIds(new Set());
      return;
    }

    try {
      const notificationStorageKey = getScopedNotificationKey(
        notificationScopeKey,
        "notifications"
      );
      const processedTransactionStorageKey = getScopedNotificationKey(
        notificationScopeKey,
        "processed-transaction-ids"
      );
      const processedCopyStorageKey = getScopedNotificationKey(
        notificationScopeKey,
        "processed-copy-trader-ids"
      );

      const savedNotifications = JSON.parse(
        localStorage.getItem(notificationStorageKey) || "[]"
      );
      const normalizedNotifications = Array.isArray(savedNotifications)
        ? savedNotifications.map(normalizeStoredNotification)
        : [];

      setNotifications(normalizedNotifications);
      setUnreadCount(normalizedNotifications.filter((item) => !item.read).length);

      const savedProcessedIds = JSON.parse(
        localStorage.getItem(processedTransactionStorageKey) || "[]"
      );
      setProcessedTransactionIds(new Set(savedProcessedIds));

      const savedCopyIds = JSON.parse(
        localStorage.getItem(processedCopyStorageKey) || "[]"
      );
      setProcessedCopyTraderIds(new Set(savedCopyIds));
    } catch (error) {
      console.error("Error loading notifications:", error);
      setNotifications([]);
      setUnreadCount(0);
      setProcessedTransactionIds(new Set());
      setProcessedCopyTraderIds(new Set());
    } finally {
      setStorageReady(true);
    }
  }, [isAuthenticated, notificationScopeKey]);

  useEffect(() => {
    if (!storageReady || !isAuthenticated || !notificationScopeKey) return;

    localStorage.setItem(
      getScopedNotificationKey(notificationScopeKey, "notifications"),
      JSON.stringify(notifications)
    );
  }, [notifications, storageReady, isAuthenticated, notificationScopeKey]);

  useEffect(() => {
    if (!storageReady || !isAuthenticated || !notificationScopeKey) return;

    localStorage.setItem(
      getScopedNotificationKey(notificationScopeKey, "processed-transaction-ids"),
      JSON.stringify([...processedTransactionIds])
    );
  }, [
    processedTransactionIds,
    storageReady,
    isAuthenticated,
    notificationScopeKey,
  ]);

  useEffect(() => {
    if (!storageReady || !isAuthenticated || !notificationScopeKey) return;

    localStorage.setItem(
      getScopedNotificationKey(notificationScopeKey, "processed-copy-trader-ids"),
      JSON.stringify([...processedCopyTraderIds])
    );
  }, [
    processedCopyTraderIds,
    storageReady,
    isAuthenticated,
    notificationScopeKey,
  ]);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) => {
      const next = prev.map((item) =>
        item.id === id ? { ...item, read: true } : item
      );
      setUnreadCount(next.filter((item) => !item.read).length);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => {
      const next = prev.filter((item) => item.id !== id);
      setUnreadCount(next.filter((item) => !item.read).length);
      return next;
    });
  }, []);

  const removeAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const getSortedNotifications = useCallback(
    () => [...notifications].sort((a, b) => b.timestamp - a.timestamp),
    [notifications]
  );

  useEffect(() => {
    if (!storageReady || !isAuthenticated || !notificationScopeKey) return;
    if (!copiedTraders || copiedTraders.length === 0) return;

    if (!hasInitializedCopyTraderStreamRef.current) {
      hasInitializedCopyTraderStreamRef.current = true;

      if (processedCopyTraderIds.size === 0) {
        const baselineCopyTraderIds = copiedTraders
          .map((trader) => trader?.id)
          .filter(Boolean);
        const freshCopyTraders = copiedTraders.filter(
          (trader) =>
            trader?.id &&
            isRecentActivity(trader?.createdAt || trader?.copiedAt)
        );

        if (freshCopyTraders.length > 0) {
          freshCopyTraders.forEach(createCopyTradeNotification);
        }

        if (baselineCopyTraderIds.length > 0) {
          setProcessedCopyTraderIds(new Set(baselineCopyTraderIds));
        }
        return;
      }
    }

    const newCopies = copiedTraders.filter(
      (trader) => trader?.id && !processedCopyTraderIds.has(trader.id)
    );

    if (newCopies.length === 0) return;

    newCopies.forEach(createCopyTradeNotification);

    setProcessedCopyTraderIds((prev) => {
      const next = new Set(prev);
      newCopies.forEach((trader) => next.add(trader.id));
      return next;
    });
  }, [
    copiedTraders,
    processedCopyTraderIds,
    createCopyTradeNotification,
    storageReady,
    isAuthenticated,
    notificationScopeKey,
  ]);

  useEffect(() => {
    if (transactionsLoading) return;
    if (!storageReady || !isAuthenticated || !notificationScopeKey) return;

    if (!hasInitializedTransactionStreamRef.current) {
      hasInitializedTransactionStreamRef.current = true;

      if (processedTransactionIds.size === 0) {
        const baselineTransactionIds = transactions
          .map((transaction) => transaction?.id)
          .filter(Boolean);
        const freshTransactions = transactions.filter(
          (transaction) =>
            transaction?.id &&
            transaction?.type &&
            isRecentActivity(
              Number(transaction.timestamp) ||
                Date.parse(transaction?.createdAt || transaction?.date || "")
            )
        );

        if (freshTransactions.length > 0) {
          freshTransactions.forEach(createTransactionNotification);
        }

        if (baselineTransactionIds.length > 0) {
          setProcessedTransactionIds(new Set(baselineTransactionIds));
        }
        return;
      }
    }

    if (!transactions || transactions.length === 0) return;

    const newTransactions = transactions.filter(
      (transaction) =>
        transaction?.id &&
        !processedTransactionIds.has(transaction.id) &&
        transaction?.type
    );

    if (newTransactions.length === 0) return;

    newTransactions.forEach(createTransactionNotification);

    const newIds = newTransactions.map((transaction) => transaction.id);
    setProcessedTransactionIds((prev) => new Set([...prev, ...newIds]));
  }, [
    transactions,
    processedTransactionIds,
    transactionsLoading,
    createTransactionNotification,
    storageReady,
    isAuthenticated,
    notificationScopeKey,
  ]);

  return (
    <NotificationContext.Provider
      value={{
        notifications: getSortedNotifications(),
        unreadCount,
        showPanel,
        setShowPanel,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        removeAllNotifications,
        getSortedNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};
