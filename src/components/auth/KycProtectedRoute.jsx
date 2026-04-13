import { useEffect } from "react";
import PropTypes from "prop-types";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useUser } from "../../context/UserContext";
import Loader from "../ui/Loader";
import {
  getKycBlockedMessage,
  hasCompletedKyc,
  KYC_VERIFICATION_PATH,
} from "../../utils/kycAccess";

export default function KycProtectedRoute({ children }) {
  const location = useLocation();
  const { userData, isLoading } = useUser();
  const isKycComplete = hasCompletedKyc(userData);

  useEffect(() => {
    if (!isLoading && !isKycComplete) {
      toast.error(getKycBlockedMessage(location.pathname));
    }
  }, [isKycComplete, isLoading, location.pathname]);

  if (isLoading) {
    return (
      <Loader
        label="Checking Verification"
        subtext="Reviewing account approval state before opening this feature"
      />
    );
  }

  if (!isKycComplete) {
    return (
      <Navigate
        to={KYC_VERIFICATION_PATH}
        replace
        state={{ from: location.pathname, blockedPath: location.pathname }}
      />
    );
  }

  return children;
}

KycProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
