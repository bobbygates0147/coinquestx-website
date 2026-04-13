import { normalizeDashboardPath } from "../../constants/dashboardPageMeta";
import { KYC_VERIFICATION_PATH } from "../../utils/kycAccess";

export const CHAT_STORAGE_KEY = "coinquestx_chat_messages_v5";
export const CHAT_PREFS_KEY = "coinquestx_chat_prefs_v5";
export const MAX_PERSISTED_MESSAGES = 80;

export const PUBLIC_PROMPTS = [
  "How do I create my account?",
  "How do I complete KYC?",
  "What can I do after signing in?",
  "Where do I fund my wallet?",
];

export const PROJECT_FALLBACK_REPLY =
  "I can guide you through your account, KYC, wallet funding, withdrawals, trading tools, referrals, support, and the next best action to take inside CoinQuestX.";

const LEGACY_PROMPT_MAP = {
  "what's bitcoin's price?": "What can I do after signing in?",
  "how is my portfolio doing?": "Show my account pulse",
  "give me the latest project pulse": "Show my account pulse",
  "any crypto market news today?": "What should I do next?",
};

const PAGE_PROMPT_MAP = {
  "/dashboard": [
    "Show my account pulse",
    "What should I do next?",
    "Where do I fund my wallet?",
    "How do I complete KYC?",
  ],
  "/assets": [
    "What does Assets help me track?",
    "Where can I monitor my balance?",
    "What should I do next?",
    "How do I buy crypto?",
  ],
  "/deposits": [
    "Summarize my deposit status",
    "How do I submit payment proof?",
    "Where can I see my transactions?",
    "What if my KYC is pending?",
  ],
  "/withdrawal": [
    "Summarize my withdrawal status",
    "Why is KYC required here?",
    "Where can I see my transactions?",
    "How do withdrawals work?",
  ],
  "/transactions": [
    "Summarize my transaction history",
    "How do I track pending requests?",
    "Where do I make a deposit?",
    "Where do I make a withdrawal?",
  ],
  "/placetrade": [
    "Summarize my active trades",
    "How does place trade work?",
    "What should I do next?",
    "Where is trades ROI?",
  ],
  "/mytraders": [
    "How does copy trade work?",
    "Summarize my copied traders",
    "What should I do next?",
    "Where can I track performance?",
  ],
  "/mycopytraders": [
    "Summarize my copied traders",
    "How do I manage copied traders?",
    "Where can I track performance?",
    "What should I do next?",
  ],
  "/buybots": [
    "How do trading bots work here?",
    "What should I do before buying a bot?",
    "Where can I see my balance?",
    "What should I do next?",
  ],
  "/mining": [
    "How does mining work here?",
    "What should I do before starting mining?",
    "Where can I track results?",
    "What should I do next?",
  ],
  "/stake": [
    "How does staking work here?",
    "What should I do before staking?",
    "Where can I track returns?",
    "What should I do next?",
  ],
  "/subscription": [
    "What does my plan allow?",
    "How do I upgrade my plan?",
    "How do I contact support?",
    "What should I do next?",
  ],
  "/referrals": [
    "How do referrals work?",
    "Where is my referral link?",
    "How do I track referral rewards?",
    "What should I do next?",
  ],
  "/account": [
    "What can I update in my account?",
    "How do I secure my profile?",
    "How do I complete KYC?",
    "What should I do next?",
  ],
  "/kyc-verification": [
    "What details do I need for KYC?",
    "How long does KYC review take?",
    "Why do deposits need KYC?",
    "What should I do next?",
  ],
  "/messages": [
    "Do I have unread support replies?",
    "How do I send a message to admin?",
    "What does my plan allow?",
    "How do I contact support?",
  ],
  "/help": [
    "How do I contact support?",
    "How do I complete KYC?",
    "Where do I fund my wallet?",
    "What can I do after signing in?",
  ],
};

const ACTION_REGISTRY = {
  signup: { type: "navigate", label: "Create Account", to: "/SignUpPage" },
  login: { type: "navigate", label: "Open Login", to: "/LoginPage" },
  forgotPassword: { type: "navigate", label: "Reset Password", to: "/ForgotPassword" },
  dashboard: { type: "navigate", label: "Open Dashboard", to: "/Dashboard" },
  assets: { type: "navigate", label: "Open Assets", to: "/Assets" },
  account: { type: "navigate", label: "Open Account", to: "/Account" },
  settings: { type: "navigate", label: "Open Settings", to: "/Settings" },
  notifications: { type: "navigate", label: "Open Alerts", to: "/Notification" },
  kyc: { type: "navigate", label: "Open KYC", to: KYC_VERIFICATION_PATH },
  deposits: { type: "navigate", label: "Open Deposits", to: "/Deposits", requiresKyc: true },
  withdrawal: { type: "navigate", label: "Open Withdrawal", to: "/Withdrawal", requiresKyc: true },
  paymentProof: { type: "navigate", label: "Open Payment Proof", to: "/PaymentProof" },
  transactions: { type: "navigate", label: "Open Transactions", to: "/Transactions" },
  placeTrade: { type: "navigate", label: "Open Place Trade", to: "/PlaceTrade", requiresKyc: true },
  myTraders: { type: "navigate", label: "Open Copy Trade", to: "/MyTraders", requiresKyc: true },
  myCopytraders: { type: "navigate", label: "Open My Copy Trade", to: "/MyCopytraders", requiresKyc: true },
  subscription: { type: "navigate", label: "Open Subscription", to: "/Subscription", requiresKyc: true },
  dailySignal: { type: "navigate", label: "Open Daily Signal", to: "/DailySignal", requiresKyc: true },
  bots: { type: "navigate", label: "Open Buy Bots", to: "/BuyBots", requiresKyc: true },
  mining: { type: "navigate", label: "Open Mining", to: "/Mining", requiresKyc: true },
  stake: { type: "navigate", label: "Open Stake", to: "/Stake", requiresKyc: true },
  buyCrypto: { type: "navigate", label: "Open Buy Crypto", to: "/BuyCrypto", requiresKyc: true },
  realEstate: { type: "navigate", label: "Open Real Estate", to: "/RealEstate", requiresKyc: true },
  tradesRoi: { type: "navigate", label: "Open Trades ROI", to: "/TradesRoi", requiresKyc: true },
  referrals: { type: "navigate", label: "Open Referrals", to: "/Referrals" },
  messages: { type: "navigate", label: "Open Messages", to: "/Messages" },
  help: { type: "navigate", label: "Open Help", to: "/Help" },
};

export const buildAction = (key, overrides = {}) =>
  ACTION_REGISTRY[key] ? { ...ACTION_REGISTRY[key], ...overrides } : null;

export const sanitizeSuggestedPrompts = (suggestions = [], fallback = PUBLIC_PROMPTS) => {
  const prompts = suggestions
    .map((item) => `${item || ""}`.trim())
    .filter(Boolean)
    .map((item) => LEGACY_PROMPT_MAP[item.toLowerCase()] || item)
    .filter((item, index, list) => list.indexOf(item) === index)
    .slice(0, 4);

  return prompts.length > 0 ? prompts : fallback;
};

const sanitizeAction = (action) => {
  if (!action || typeof action !== "object") return null;
  const label = `${action.label || action.prompt || ""}`.trim();
  if (!label) return null;

  return {
    type: action.type === "prompt" || (!action.to && action.prompt) ? "prompt" : "navigate",
    label: label.slice(0, 48),
    to: typeof action.to === "string" ? action.to.trim() : "",
    prompt: typeof action.prompt === "string" ? action.prompt.trim() : "",
    requiresKyc: Boolean(action.requiresKyc),
    variant: action.variant === "primary" ? "primary" : "secondary",
  };
};

export const sanitizeActions = (actions = []) =>
  actions
    .map(sanitizeAction)
    .filter(Boolean)
    .filter((action, index, list) => {
      const key = `${action.type}:${action.label}:${action.to || action.prompt || ""}`;
      return (
        list.findIndex(
          (candidate) =>
            `${candidate.type}:${candidate.label}:${candidate.to || candidate.prompt || ""}` ===
            key
        ) === index
      );
    })
    .slice(0, 3);

export const parseStoredMessages = (raw) => {
  try {
    const parsed = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((message) => ({
        id: message.id,
        sender: message.sender === "user" ? "user" : "bot",
        text: `${message.text || ""}`,
        topic: typeof message.topic === "string" ? message.topic : null,
        actions: sanitizeActions(message.actions),
        timestamp: message.timestamp || new Date().toISOString(),
        isTyping: false,
      }))
      .slice(-MAX_PERSISTED_MESSAGES);
  } catch {
    return [];
  }
};

export const isPublicPath = (pathname) =>
  ["/", "/about", "/services", "/contact", "/loginpage", "/login", "/signuppage", "/forgotpassword"].includes(
    normalizeDashboardPath(pathname)
  );

export const getContextualPrompts = ({
  pathname,
  isAuthenticated,
  isKycComplete,
  canSendDirectMessages,
}) => {
  if (!isAuthenticated) {
    return PUBLIC_PROMPTS;
  }

  const prompts = PAGE_PROMPT_MAP[normalizeDashboardPath(pathname)];
  return sanitizeSuggestedPrompts(
    prompts || [
      "Show my account pulse",
      isKycComplete ? "Where do I fund my wallet?" : "How do I complete KYC?",
      canSendDirectMessages ? "Do I have unread support replies?" : "How do I contact support?",
      "What should I do next?",
    ]
  );
};
