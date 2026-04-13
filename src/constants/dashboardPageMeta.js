const PAGE_META = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Monitor balances, trades, and account performance at a glance.",
    parent: "Dashboard",
  },
  "/search": {
    title: "Search",
    subtitle: "Search features, account records, and live activity from one workspace.",
    parent: "Workspace",
  },
  "/assets": {
    title: "Assets",
    subtitle: "Track your portfolio, market prices, and live crypto news.",
    parent: "Portfolio",
  },
  "/placetrade": {
    title: "Place Trade",
    subtitle: "Open, monitor, and manage trade positions from one workspace.",
    parent: "Trading",
  },
  "/mining": {
    title: "Mining",
    subtitle: "Control miners, cycles, and projected mining payouts.",
    parent: "Trading",
  },
  "/deposits": {
    title: "Deposit",
    subtitle: "Fund your account securely and view available payment options.",
    parent: "Wallet",
  },
  "/withdrawal": {
    title: "Withdrawal",
    subtitle: "Request payouts and track withdrawal status in real time.",
    parent: "Wallet",
  },
  "/paymentproof": {
    title: "Payment Proof",
    subtitle: "Upload and review proof records for completed payments.",
    parent: "Wallet",
  },
  "/transactions": {
    title: "Transactions",
    subtitle: "Review deposit, withdrawal, and trading transaction history.",
    parent: "Wallet",
  },
  "/referrals": {
    title: "Referrals",
    subtitle: "Track referral performance, rewards, and invite activity.",
    parent: "Growth",
  },
  "/mytraders": {
    title: "Copy Trade",
    subtitle: "Manage copied traders and monitor linked strategy performance.",
    parent: "Trading",
  },
  "/mycopytraders": {
    title: "My Copy Trade",
    subtitle: "View your active copied traders and current outcomes.",
    parent: "Trading",
  },
  "/subscription": {
    title: "Subscription",
    subtitle: "Manage plan status, renewals, and active service access.",
    parent: "Trading",
  },
  "/dailysignal": {
    title: "Daily Signal",
    subtitle: "Access daily signal updates and subscription information.",
    parent: "Trading",
  },
  "/buybots": {
    title: "Buy Bots",
    subtitle: "Purchase, activate, and manage trading bot plans.",
    parent: "Trading",
  },
  "/stake": {
    title: "Stake",
    subtitle: "Stake assets, monitor returns, and review staking history.",
    parent: "Trading",
  },
  "/tradesroi": {
    title: "Trades ROI",
    subtitle: "Analyze trade outcomes, ROI trends, and performance metrics.",
    parent: "Trading",
  },
  "/buycrypto": {
    title: "Buy Crypto",
    subtitle: "Purchase crypto quickly with supported payment channels.",
    parent: "Trading",
  },
  "/realestate": {
    title: "Real Estate",
    subtitle: "Explore projects, investment entries, and portfolio exposure.",
    parent: "Investments",
  },
  "/account": {
    title: "My Profile",
    subtitle: "Update personal details, balances, and account preferences.",
    parent: "Account",
  },
  "/verifyaccount": {
    title: "KYC Verification",
    subtitle: "Redirecting to the KYC verification flow.",
    parent: "Account",
  },
  "/updatephotopage": {
    title: "Update Media",
    subtitle: "Upload a profile photo and cover image to personalize your account.",
    parent: "Account",
  },
  "/passwordupdate": {
    title: "Update Password",
    subtitle: "Secure your profile with a new account password.",
    parent: "Account",
  },
  "/emailupdate": {
    title: "Update Email",
    subtitle: "Change your email and keep login details current.",
    parent: "Account",
  },
  "/kyc-verification": {
    title: "KYC Verification",
    subtitle: "Submit verification details to maintain account compliance.",
    parent: "Account",
  },
  "/settings": {
    title: "Settings",
    subtitle: "Adjust platform preferences, controls, and account behavior.",
    parent: "Account",
  },
  "/messages": {
    title: "Messages",
    subtitle: "Chat directly with admin support and track thread replies live.",
    parent: "Account",
  },
  "/watchlist": {
    title: "Watchlist",
    subtitle: "Track saved assets, alert targets, and live market movement from one desk.",
    parent: "Trading",
  },
  "/help": {
    title: "Help Center",
    subtitle: "Find guides, FAQs, and support information quickly.",
    parent: "Support",
  },
  "/notification": {
    title: "Notifications",
    subtitle: "View alerts for trading activity, funds, and account events.",
    parent: "Account",
  },
};

const ACRONYMS = {
  roi: "ROI",
  kyc: "KYC",
  usd: "USD",
  btc: "BTC",
  eth: "ETH",
};

export const normalizeDashboardPath = (pathname = "") => {
  if (!pathname) return "/";
  const trimmed = pathname.replace(/\/+$/, "");
  return (trimmed || "/").toLowerCase();
};

const toTitleCase = (value = "") =>
  value
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      const normalized = word.toLowerCase();
      if (ACRONYMS[normalized]) return ACRONYMS[normalized];
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    })
    .join(" ");

const inferTitleFromPath = (pathname) => {
  const key = pathname.split("/").filter(Boolean).pop() || "dashboard";
  const withSpaces = key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ");
  return toTitleCase(withSpaces);
};

export const getDashboardPageMeta = (pathname = "") => {
  const normalizedPath = normalizeDashboardPath(pathname);
  const mappedMeta = PAGE_META[normalizedPath];
  if (mappedMeta) {
    return {
      ...mappedMeta,
      path: normalizedPath,
    };
  }

  const inferredTitle = inferTitleFromPath(normalizedPath);
  return {
    title: inferredTitle,
    subtitle: `Manage ${inferredTitle.toLowerCase()} and keep your account up to date.`,
    parent: "Dashboard",
    path: normalizedPath,
  };
};
