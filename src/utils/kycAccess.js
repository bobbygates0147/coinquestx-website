export const KYC_VERIFICATION_PATH = "/kyc-verification";

const VERIFIED_KYC_STATUS = "verified";

const KYC_PROTECTED_ROUTES = [
  { path: "/Deposits", label: "deposits" },
  { path: "/Withdrawal", label: "withdrawals" },
  { path: "/PlaceTrade", label: "place trade" },
  { path: "/MyTraders", label: "copy trade" },
  { path: "/MyCopytraders", label: "copy trade management" },
  { path: "/Subscription", label: "subscriptions" },
  { path: "/DailySignal", label: "daily signals" },
  { path: "/BuyBots", label: "buy bots" },
  { path: "/Mining", label: "mining" },
  { path: "/Stake", label: "staking" },
  { path: "/RealEstate", label: "real estate" },
  { path: "/TradesRoi", label: "trade history" },
  { path: "/BuyCrypto", label: "buy crypto" },
];

const normalizePath = (pathname = "") => {
  if (!pathname) return "";
  return pathname.startsWith("/") ? pathname.toLowerCase() : `/${pathname}`.toLowerCase();
};

const matchProtectedRoute = (pathname = "") => {
  const normalizedPath = normalizePath(pathname);

  return (
    KYC_PROTECTED_ROUTES.find(({ path }) => {
      const normalizedRoute = normalizePath(path);
      return (
        normalizedPath === normalizedRoute ||
        normalizedPath.startsWith(`${normalizedRoute}/`)
      );
    }) || null
  );
};

export const normalizeKycStatus = (userData) => {
  const rawStatus = `${userData?.kycStatus || ""}`.trim().toLowerCase();

  if (rawStatus) {
    return rawStatus;
  }

  return userData?.kycVerified ? VERIFIED_KYC_STATUS : "not_verified";
};

export const hasCompletedKyc = (userData) =>
  Boolean(userData?.kycVerified) &&
  normalizeKycStatus(userData) === VERIFIED_KYC_STATUS;

export const isKycProtectedPath = (pathname) => Boolean(matchProtectedRoute(pathname));

export const getKycBlockedMessage = (pathname) => {
  const matchedRoute = matchProtectedRoute(pathname);
  const label = matchedRoute?.label || "this feature";

  return `Complete KYC verification to access ${label}.`;
};
