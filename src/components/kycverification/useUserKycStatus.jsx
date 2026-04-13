// src/hooks/useKycStatus.js
import { useState, useEffect } from "react";
import { API_BASE_URL } from "../../config/api";

export function useKycStatus() {
  const [kycStatus, setKycStatus] = useState("not_verified");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkKycStatus = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          setLoading(false);
          return;
        }

        // Check for temporary verification first
        const kycTempVerified = localStorage.getItem("kycTempVerified") === "true" || 
                               sessionStorage.getItem("kycTempVerified") === "true";
        
        if (kycTempVerified) {
          setKycStatus("pending");
          setLoading(false);
          return;
        }

        // Check API for actual status
        const response = await fetch(`${API_BASE_URL}/User/KycStatus`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const kycData = await response.json();
          setKycStatus(kycData.status || "not_verified");
        }
      } catch (error) {
        console.error("Error checking KYC status:", error);
        // Fallback to localStorage
        const kycSubmission = localStorage.getItem("kycSubmission");
        if (kycSubmission) {
          const submissionData = JSON.parse(kycSubmission);
          setKycStatus(submissionData.kycStatus || "not_verified");
        }
      } finally {
        setLoading(false);
      }
    };

    checkKycStatus();
  }, []);

  return { kycStatus, loading };
}
