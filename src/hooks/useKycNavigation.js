import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useUser } from "../context/UserContext";
import {
  getKycBlockedMessage,
  hasCompletedKyc,
  isKycProtectedPath,
  KYC_VERIFICATION_PATH,
} from "../utils/kycAccess";

export const useKycNavigation = () => {
  const navigate = useNavigate();
  const { userData } = useUser();
  const isKycComplete = hasCompletedKyc(userData);

  const navigateWithKycCheck = useCallback(
    (to, options = {}) => {
      const requiresKyc = options.requiresKyc ?? isKycProtectedPath(to);

      if (!requiresKyc || isKycComplete) {
        navigate(to, options.navigateOptions);
        return true;
      }

      toast.error(options.message || getKycBlockedMessage(to));
      navigate(KYC_VERIFICATION_PATH, {
        state: { from: to, blockedPath: to },
      });
      return false;
    },
    [isKycComplete, navigate]
  );

  return {
    isKycComplete,
    navigateWithKycCheck,
  };
};
