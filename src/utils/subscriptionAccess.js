export const PLAN_NAME_MAP = {
  basic: "Basic",
  standard: "Standard",
  premium: "Premium",
  platinum: "Platinum",
  elite: "Elite",
};

const FEATURE_ACCESS = {
  aiBots: {
    label: "AI trading bots",
    redirectTo: "/Subscription",
    requiredPlans: ["Premium", "Platinum", "Elite"],
  },
  directMessages: {
    label: "Direct admin messaging",
    redirectTo: "/Subscription",
    requiredPlans: ["Platinum", "Elite"],
  },
};

export const normalizePlanName = (value, fallback = "Basic") => {
  const key = `${value || ""}`.trim().toLowerCase();
  return PLAN_NAME_MAP[key] || fallback;
};

export const getSubscriptionFeatureConfig = (feature) =>
  FEATURE_ACCESS[feature] || null;

export const getFeatureRequiredPlans = (feature) =>
  getSubscriptionFeatureConfig(feature)?.requiredPlans || [];

export const getFeatureRedirectPath = (feature) =>
  getSubscriptionFeatureConfig(feature)?.redirectTo || "/Subscription";

export const getFeatureLabel = (feature) =>
  getSubscriptionFeatureConfig(feature)?.label || "This feature";

const formatRequiredPlans = (plans = []) => {
  if (plans.length <= 1) {
    return plans[0] || "";
  }

  if (plans.length === 2) {
    return `${plans[0]} or ${plans[1]}`;
  }

  return `${plans.slice(0, -1).join(", ")}, or ${plans[plans.length - 1]}`;
};

export const hasFeatureAccess = (planName, feature) => {
  const normalizedPlan = normalizePlanName(planName);
  return getFeatureRequiredPlans(feature).includes(normalizedPlan);
};

export const hasAiBotAccess = (planName) => hasFeatureAccess(planName, "aiBots");
export const hasDirectMessageAccess = (planName) =>
  hasFeatureAccess(planName, "directMessages");

export const getFeatureAccessBlockedMessage = (feature, planName) => {
  const normalizedPlan = normalizePlanName(planName);
  const label = getFeatureLabel(feature);
  const requiredPlans = getFeatureRequiredPlans(feature);

  if (requiredPlans.length === 0) {
    return `${label} is not available right now.`;
  }

  return `${label} require ${formatRequiredPlans(requiredPlans)} plans. Your current plan is ${normalizedPlan}.`;
};
