import { useEffect } from "react";
import PropTypes from "prop-types";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useUser } from "../../context/UserContext";
import Loader from "../ui/Loader";
import {
  getFeatureAccessBlockedMessage,
  getFeatureRedirectPath,
  getFeatureRequiredPlans,
  hasFeatureAccess,
  normalizePlanName,
} from "../../utils/subscriptionAccess";

export default function SubscriptionProtectedRoute({ children, feature }) {
  const location = useLocation();
  const { userData, isLoading } = useUser();
  const currentPlan = normalizePlanName(userData?.subscriptionPlan);
  const hasAccess = hasFeatureAccess(currentPlan, feature);
  const redirectTo = getFeatureRedirectPath(feature);
  const requiredPlans = getFeatureRequiredPlans(feature);

  useEffect(() => {
    if (!isLoading && !hasAccess) {
      toast.error(getFeatureAccessBlockedMessage(feature, currentPlan), {
        toastId: `feature-lock-${feature}-${location.pathname}`,
      });
    }
  }, [currentPlan, feature, hasAccess, isLoading, location.pathname]);

  if (isLoading) {
    return (
      <Loader
        label="Checking Plan Access"
        subtext="Validating subscription entitlements for this trading module"
      />
    );
  }

  if (!hasAccess) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{
          from: location.pathname,
          blockedPath: location.pathname,
          lockedFeature: feature,
          requiredPlans,
          currentPlan,
        }}
      />
    );
  }

  return children;
}

SubscriptionProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  feature: PropTypes.string.isRequired,
};
