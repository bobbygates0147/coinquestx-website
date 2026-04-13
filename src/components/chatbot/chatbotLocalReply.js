import cryptoQuestions from "./CryptoQuestions";
import {
  buildAction,
  PROJECT_FALLBACK_REPLY,
  PUBLIC_PROMPTS,
  sanitizeActions,
} from "./chatbotConfig";

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildAccountPulse = ({
  formatCurrency,
  userData,
  isKycComplete,
  pendingRequests,
  pendingDeposits,
  pendingWithdrawals,
  totalCopiedTrades,
  totalCompletedDeposits,
  tradingStats,
}) => {
  const activeTrades =
    toNumber(userData?.revenue?.activeTrades, 0) || toNumber(tradingStats?.liveTrades, 0);

  return [
    `Balance: ${formatCurrency(userData?.balance || 0)}`,
    `Plan: ${userData?.subscriptionPlan || "Basic"}`,
    `KYC: ${isKycComplete ? "Verified" : userData?.kycStatus || "pending"}`,
    `Pending requests: ${pendingRequests.length} (${pendingDeposits.length} deposits, ${pendingWithdrawals.length} withdrawals)`,
    `Completed deposits: ${formatCurrency(totalCompletedDeposits || 0)}`,
    `Active trades: ${activeTrades}`,
    `Copied traders: ${toNumber(totalCopiedTrades, 0)}`,
  ].join("\n");
};

const getNextStepReply = ({
  isAuthenticated,
  isKycComplete,
  canSendDirectMessages,
  formatCurrency,
  userData,
  pendingRequests,
  totalCopiedTrades,
  tradingStats,
}) => {
  if (!isAuthenticated) {
    return {
      topic: "next_step",
      reply:
        "Start by creating your account or signing in. Once you are inside, I can guide you through KYC, funding, and the right feature to open next.",
      actions: sanitizeActions([
        buildAction("signup", { variant: "primary" }),
        buildAction("login"),
      ]),
    };
  }

  if (!isKycComplete) {
    return {
      topic: "next_step",
      reply:
        "Your best next step is KYC. Verification unlocks deposits, withdrawals, trading tools, bots, mining, staking, and other protected features.",
      actions: sanitizeActions([
        buildAction("kyc", { variant: "primary" }),
        buildAction("account"),
        buildAction("help"),
      ]),
    };
  }

  if (toNumber(userData?.balance, 0) <= 0) {
    return {
      topic: "next_step",
      reply:
        "Your account is verified, so the next move is funding your wallet. Once funds arrive, you can go into trading, bots, mining, staking, or withdrawals when needed.",
      actions: sanitizeActions([
        buildAction("deposits", { variant: "primary" }),
        buildAction("paymentProof"),
        buildAction("transactions"),
      ]),
    };
  }

  if (pendingRequests.length > 0) {
    return {
      topic: "next_step",
      reply:
        "You already have requests in motion. Review Transactions first so you can see what is pending before starting another action.",
      actions: sanitizeActions([
        buildAction("transactions", { variant: "primary" }),
        buildAction("deposits"),
        buildAction("withdrawal"),
      ]),
    };
  }

  if (toNumber(tradingStats?.liveTrades, 0) === 0 && toNumber(totalCopiedTrades, 0) === 0) {
    return {
      topic: "next_step",
      reply:
        `Your wallet is funded with ${formatCurrency(userData?.balance || 0)} and ready for action. You can start with Place Trade, Copy Trade, Buy Bots, Mining, or Stake depending on how hands-on you want to be.`,
      actions: sanitizeActions([
        buildAction("placeTrade", { variant: "primary" }),
        buildAction("myTraders"),
        buildAction("bots"),
      ]),
    };
  }

  return {
    topic: "next_step",
    reply: canSendDirectMessages
      ? "Your account is active. Monitor Dashboard and Transactions, then use Messages if you need direct account support."
      : "Your account is active. Monitor Dashboard and Transactions, and use Help whenever you need guidance on a feature.",
    actions: sanitizeActions([
      buildAction("dashboard", { variant: "primary" }),
      buildAction("transactions"),
      buildAction(canSendDirectMessages ? "messages" : "help"),
    ]),
  };
};

export const getLocalAssistantReply = ({
  query,
  isAuthenticated,
  isKycComplete,
  canSendDirectMessages,
  contextualPrompts,
  formatCurrency,
  userData,
  pendingRequests = [],
  pendingDeposits = [],
  pendingWithdrawals = [],
  totalCompletedDeposits = 0,
  totalCopiedTrades = 0,
  totalInvested = 0,
  tradingStats = {},
  performanceMetrics = {},
  pageMeta,
}) => {
  const normalized = `${query || ""}`.toLowerCase().trim();
  const planLabel = userData?.subscriptionPlan || "Basic";
  const accountPulse = buildAccountPulse({
    formatCurrency,
    userData,
    isKycComplete,
    pendingRequests,
    pendingDeposits,
    pendingWithdrawals,
    totalCopiedTrades,
    totalCompletedDeposits,
    tradingStats,
  });

  if (!normalized) {
    return {
      topic: "help",
      reply: "Ask about account setup, KYC, deposits, withdrawals, trading tools, referrals, or the next best step for your account.",
      suggestions: contextualPrompts,
      actions: sanitizeActions([
        buildAction(isAuthenticated ? "dashboard" : "signup", { variant: "primary" }),
        buildAction(isAuthenticated ? "help" : "login"),
      ]),
    };
  }

  if (/what should i do next|next step|what next|guide me/.test(normalized)) {
    return {
      ...getNextStepReply({
        isAuthenticated,
        isKycComplete,
        canSendDirectMessages,
        formatCurrency,
        userData,
        pendingRequests,
        totalCopiedTrades,
        tradingStats,
      }),
      suggestions: contextualPrompts,
    };
  }

  if (/register|sign up|signup|create account/.test(normalized)) {
    return {
      topic: "register",
      reply:
        "Create your account, confirm your details, then sign in to continue from the dashboard. After that, KYC and wallet funding are usually the next two steps.",
      suggestions: PUBLIC_PROMPTS,
      actions: sanitizeActions([
        buildAction("signup", { variant: "primary" }),
        buildAction("login"),
      ]),
    };
  }

  if (/login|log in|sign in/.test(normalized)) {
    return {
      topic: "login",
      reply:
        "Open the login screen and use the email and password tied to your account. If access fails, use password reset and return here once you are signed in.",
      suggestions: PUBLIC_PROMPTS,
      actions: sanitizeActions([
        buildAction("login", { variant: "primary" }),
        buildAction("forgotPassword"),
      ]),
    };
  }

  if (/kyc|verify account|verification|id type|passport|national id|driver/.test(normalized)) {
    return {
      topic: "kyc",
      reply: isKycComplete
        ? "Your verification already looks complete. You can move directly into deposits, withdrawals, or the trading modules."
        : "KYC here covers your legal name, country, document type, document number, identity images, and selfie confirmation. Complete it to unlock wallet and trading features.",
      suggestions: contextualPrompts,
      actions: sanitizeActions([
        buildAction(
          isAuthenticated ? (isKycComplete ? "deposits" : "kyc") : "signup",
          { variant: "primary" }
        ),
        buildAction(isAuthenticated ? "account" : "login"),
        buildAction("help"),
      ]),
    };
  }

  if (/deposit|fund account|fund wallet|wallet|payment proof/.test(normalized)) {
    return {
      topic: "deposit",
      reply: isAuthenticated && !isKycComplete
        ? "Deposits open up after KYC approval. Finish verification first so wallet funding is fully available."
        : `Use Deposits to fund your wallet, then Payment Proof if a transfer needs manual review. Your completed deposits so far total ${formatCurrency(totalCompletedDeposits || 0)}.`,
      suggestions: contextualPrompts,
      actions: sanitizeActions([
        buildAction(isAuthenticated ? (isAuthenticated && !isKycComplete ? "kyc" : "deposits") : "login", {
          variant: "primary",
        }),
        buildAction(isAuthenticated ? "paymentProof" : "signup"),
        buildAction(isAuthenticated ? "transactions" : "help"),
      ]),
    };
  }

  if (/withdraw|cash out|payout/.test(normalized)) {
    return {
      topic: "withdrawal",
      reply: isAuthenticated && !isKycComplete
        ? "Withdrawals stay locked until verification is approved."
        : `Use Withdrawal to request a payout and Transactions to monitor the result. You currently have ${pendingWithdrawals.length} withdrawal request${pendingWithdrawals.length === 1 ? "" : "s"} pending.`,
      suggestions: contextualPrompts,
      actions: sanitizeActions([
        buildAction(isAuthenticated ? (isAuthenticated && !isKycComplete ? "kyc" : "withdrawal") : "login", {
          variant: "primary",
        }),
        buildAction(isAuthenticated ? "transactions" : "signup"),
        buildAction("help"),
      ]),
    };
  }

  if (/dashboard|account pulse|overview|balance|summary|portfolio/.test(normalized)) {
    return {
      topic: "account_pulse",
      reply: isAuthenticated
        ? accountPulse
        : "Sign in to view your live account pulse, funding status, and feature readiness.",
      suggestions: contextualPrompts,
      actions: sanitizeActions([
        buildAction(isAuthenticated ? "dashboard" : "login", { variant: "primary" }),
        buildAction(isAuthenticated ? "transactions" : "signup"),
      ]),
    };
  }

  if (/transaction|history|pending request|pending deposit|pending withdrawal/.test(normalized)) {
    return {
      topic: "transactions",
      reply: isAuthenticated
        ? `You have ${pendingRequests.length} pending request${pendingRequests.length === 1 ? "" : "s"} right now. Deposits pending: ${pendingDeposits.length}. Withdrawals pending: ${pendingWithdrawals.length}.`
        : "Sign in to review live transaction status and wallet activity.",
      suggestions: contextualPrompts,
      actions: sanitizeActions([
        buildAction(isAuthenticated ? "transactions" : "login", { variant: "primary" }),
        buildAction(isAuthenticated ? "deposits" : "signup"),
      ]),
    };
  }

  if (/copy trade|copytrader|copied trader|trader/.test(normalized)) {
    return {
      topic: "copy_trade",
      reply: isAuthenticated
        ? `You currently have ${toNumber(totalCopiedTrades, 0)} copied trader${toNumber(totalCopiedTrades, 0) === 1 ? "" : "s"} and ${formatCurrency(totalInvested || 0)} allocated. Use Copy Trade to discover traders and My Copy Trade to manage active ones.`
        : "Sign in first, then use Copy Trade to explore traders and mirror positions.",
      suggestions: contextualPrompts,
      actions: sanitizeActions([
        buildAction(isAuthenticated ? "myTraders" : "login", { variant: "primary" }),
        buildAction(isAuthenticated ? "myCopytraders" : "signup"),
      ]),
    };
  }

  if (/bot|automation/.test(normalized)) {
    return {
      topic: "bots",
      reply:
        "Buy Bots is for automated trading plans. It works best after KYC is complete and your wallet is funded, so you can compare plans and activate one with less friction.",
      suggestions: contextualPrompts,
      actions: sanitizeActions([
        buildAction(isAuthenticated && isKycComplete ? "bots" : isAuthenticated ? "kyc" : "login", {
          variant: "primary",
        }),
        buildAction(isAuthenticated ? "deposits" : "signup"),
        buildAction(isAuthenticated ? "subscription" : "help"),
      ]),
    };
  }

  if (/stake|staking/.test(normalized)) {
    return {
      topic: "stake",
      reply:
        "Stake focuses on locked earning plans. Make sure your account is verified and funded before opening a staking position so the flow remains smooth.",
      suggestions: contextualPrompts,
      actions: sanitizeActions([
        buildAction(isAuthenticated && isKycComplete ? "stake" : isAuthenticated ? "kyc" : "login", {
          variant: "primary",
        }),
        buildAction(isAuthenticated ? "deposits" : "signup"),
        buildAction(isAuthenticated ? "transactions" : "help"),
      ]),
    };
  }

  if (/mine|mining/.test(normalized)) {
    return {
      topic: "mining",
      reply:
        "Mining lets you enter package-based earning cycles. Review your balance first, then open Mining when you are ready to compare active options.",
      suggestions: contextualPrompts,
      actions: sanitizeActions([
        buildAction(isAuthenticated && isKycComplete ? "mining" : isAuthenticated ? "kyc" : "login", {
          variant: "primary",
        }),
        buildAction(isAuthenticated ? "deposits" : "signup"),
        buildAction(isAuthenticated ? "dashboard" : "help"),
      ]),
    };
  }

  if (/place trade|trade|roi/.test(normalized)) {
    return {
      topic: "trading",
      reply: isAuthenticated
        ? `Active trades: ${toNumber(userData?.revenue?.activeTrades, 0) || toNumber(tradingStats?.liveTrades, 0)}. Recent modelled profit factor: ${toNumber(performanceMetrics?.profitFactor, 1).toFixed(2)}. Use Place Trade to open positions and Trades ROI to review outcomes.`
        : "Sign in to access trading tools, then use Place Trade to open and manage positions.",
      suggestions: contextualPrompts,
      actions: sanitizeActions([
        buildAction(isAuthenticated && isKycComplete ? "placeTrade" : isAuthenticated ? "kyc" : "login", {
          variant: "primary",
        }),
        buildAction(isAuthenticated ? "tradesRoi" : "signup"),
        buildAction(isAuthenticated ? "dashboard" : "help"),
      ]),
    };
  }

  if (/referral|invite/.test(normalized)) {
    return {
      topic: "referrals",
      reply:
        "Use Referrals to copy your invite link, track referral performance, and monitor reward activity from shared signups.",
      suggestions: contextualPrompts,
      actions: sanitizeActions([
        buildAction(isAuthenticated ? "referrals" : "login", { variant: "primary" }),
        buildAction(isAuthenticated ? "dashboard" : "signup"),
      ]),
    };
  }

  if (/plan|subscription|upgrade/.test(normalized)) {
    return {
      topic: "subscription",
      reply: isAuthenticated
        ? `Your current plan is ${planLabel}. ${canSendDirectMessages ? "Direct admin messaging is available in Messages." : "Direct admin messaging is reserved for higher plans, but Help remains available."}`
        : "Sign in first to view your active plan and upgrade options.",
      suggestions: contextualPrompts,
      actions: sanitizeActions([
        buildAction(isAuthenticated ? "subscription" : "login", { variant: "primary" }),
        buildAction(canSendDirectMessages ? "messages" : "help"),
      ]),
    };
  }

  if (/messages|support reply|unread reply|contact support|support|help/.test(normalized)) {
    return {
      topic: "support",
      reply: canSendDirectMessages
        ? "Use Messages for direct admin conversations tied to your account, and use Help when you want product guidance or step-by-step instructions."
        : "Help is available for product guidance right now. Direct admin messaging becomes available on higher plans such as Platinum and Elite.",
      suggestions: contextualPrompts,
      actions: sanitizeActions([
        buildAction(canSendDirectMessages ? "messages" : "help", { variant: "primary" }),
        buildAction(canSendDirectMessages ? "help" : "subscription"),
        buildAction("account"),
      ]),
    };
  }

  if (/this page|current page|where am i/.test(normalized)) {
    return {
      topic: "current_page",
      reply: pageMeta?.title
        ? `You are on ${pageMeta.title}. ${pageMeta.subtitle || "This section is part of your signed-in workspace."}`
        : "You are inside your signed-in workspace.",
      suggestions: contextualPrompts,
      actions: sanitizeActions([
        buildAction("dashboard", { variant: "primary" }),
        buildAction("help"),
      ]),
    };
  }

  const quickMatch = cryptoQuestions.find((item) =>
    normalized.includes((item.keyword || "").toLowerCase())
  );

  if (quickMatch?.response) {
    return {
      topic: "project_help",
      reply: quickMatch.response,
      suggestions: contextualPrompts,
      actions: sanitizeActions([
        buildAction(isAuthenticated ? "dashboard" : "signup", { variant: "primary" }),
        buildAction(isAuthenticated ? "help" : "login"),
      ]),
    };
  }

  return {
    topic: "project_help",
    reply: PROJECT_FALLBACK_REPLY,
    suggestions: contextualPrompts,
    actions: sanitizeActions([
      buildAction(isAuthenticated ? "dashboard" : "signup", { variant: "primary" }),
      buildAction(isAuthenticated && !isKycComplete ? "kyc" : "help"),
      buildAction(isAuthenticated ? "transactions" : "login"),
    ]),
  };
};
