"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";
import { resolveCurrencyInfo } from "../utils/currency";

export const UserContext = createContext();

const defaultUserData = {
  balance: 0,
  name: "",
  email: "",
  uid: "",
  photoURL: "",
  coverImageURL: "",
  displayName: "",
  firstName: "",
  lastName: "",
  userId: "",
  phoneNumber: "",
  country: "",
  currencyCode: "USD",
  currencySymbol: "$",
  kycVerified: false,
  kycStatus: "not_verified",
  subscriptionPlan: "Basic",
  role: "user",
  stats: {},
  revenue: {},
  securitySettings: {
    twoFactorEnabled: false,
    loginAlerts: true,
    withdrawalProtection: true,
    withdrawalCooldownMinutes: 30,
    whitelistMode: "enforced",
    antiPhishingPhrase: "",
    sessionTimeoutMinutes: 30,
    trustedDeviceLabel: "",
    lastSecurityReviewAt: null,
    lastTwoFactorChallengeAt: null,
    lastTwoFactorVerifiedAt: null,
    lastWithdrawalRequestedAt: null,
  },
  notificationSettings: {
    depositEmails: true,
    withdrawalEmails: true,
    kycEmails: true,
    tradeEmails: true,
    referralEmails: true,
    subscriptionEmails: true,
    supportEmails: true,
  },
  walletWhitelist: [],
  onboarding: {
    dismissed: false,
    completedSteps: [],
    lastDismissedAt: null,
  },
  lastLoginAt: null,
  lastLoginDevice: "",
  createdAt: null,
  updatedAt: null,
};

const normalizeSecuritySettings = (value = {}, fallback = defaultUserData.securitySettings) => ({
  ...defaultUserData.securitySettings,
  ...(fallback || {}),
  ...(value && typeof value === "object" ? value : {}),
});

const normalizeNotificationSettings = (
  value = {},
  fallback = defaultUserData.notificationSettings
) => ({
  ...defaultUserData.notificationSettings,
  ...(fallback || {}),
  ...(value && typeof value === "object" ? value : {}),
});

const normalizeWalletWhitelist = (value = []) =>
  Array.isArray(value)
    ? value.map((entry) => ({
        id: entry?.id || entry?._id || "",
        label: entry?.label || "",
        paymentMethod: entry?.paymentMethod || "",
        network: entry?.network || "",
        maskedDestination: entry?.maskedDestination || "",
        destinationSummary: entry?.destinationSummary || "",
        status: entry?.status || "active",
        addedAt: entry?.addedAt || null,
        lastUsedAt: entry?.lastUsedAt || null,
      }))
    : [];

const normalizeOnboarding = (value = {}, fallback = defaultUserData.onboarding) => ({
  ...defaultUserData.onboarding,
  ...(fallback || {}),
  ...(value && typeof value === "object" ? value : {}),
  completedSteps: Array.isArray(value?.completedSteps)
    ? [...new Set(value.completedSteps.filter(Boolean))]
    : Array.isArray(fallback?.completedSteps)
    ? [...new Set(fallback.completedSteps.filter(Boolean))]
    : [],
});

const extractSubscriptionPlanFromData = (payload) => {
  if (!payload) return null;
  const candidates = [
    payload.subscriptionPlan,
    payload.currentPlan,
    payload.plan,
    payload.planName,
    payload.membershipPlan,
    payload.membership?.name,
    payload.membership?.plan,
    payload.membership?.planName,
    payload.subscription?.name,
    payload.subscription?.planName,
    payload.subscription?.plan,
    payload.planType,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
};

const getStoredUserData = () => {
  try {
    const stored = localStorage.getItem("userData");
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return null;
    const { currencyCode, currencySymbol } = resolveCurrencyInfo(parsed);
    return {
      ...defaultUserData,
      ...parsed,
      currencyCode,
      currencySymbol,
      securitySettings: normalizeSecuritySettings(parsed.securitySettings),
      notificationSettings: normalizeNotificationSettings(
        parsed.notificationSettings
      ),
      walletWhitelist: normalizeWalletWhitelist(parsed.walletWhitelist),
      onboarding: normalizeOnboarding(parsed.onboarding),
    };
  } catch (error) {
    console.warn("Failed to read stored user data", error);
    return null;
  }
};

export function UserProvider({ children }) {
  const [userData, setUserData] = useState(() => {
    const stored = getStoredUserData();
    return stored || defaultUserData;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 🔥 FIXED: Extract user ID from JWT token
  const extractUserIdFromToken = (token) => {
    if (!token) return null;
    
    try {
      // JWT token has 3 parts: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      // Decode the payload (middle part)
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      
      // Try different possible fields for user ID
      return payload.sub || payload.userId || payload.nameid || payload.uid || null;
    } catch (error) {
      console.error("Error decoding JWT token:", error);
      return null;
    }
  };

  const getStoredToken = () => {
    const token = localStorage.getItem("authToken");
    if (!token) return null;
    
    // Remove any quotes from the token
    const cleanToken = token.replace(/^["']|["']$/g, '').trim();
    return cleanToken;
  };

  const storeToken = (token) => {
    // Store token without quotes
    const cleanToken = token.replace(/^["']|["']$/g, '').trim();
    localStorage.setItem("authToken", cleanToken);
  };

  // Test token validity
  const testTokenValidity = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/User/Dashboard`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    const initializeUser = async () => {
      const token = getStoredToken();
      console.log("🔄 Initializing user - Clean token available:", !!token);

      if (!token) {
        setUserData(defaultUserData);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        // Test token validity first
        const isValid = await testTokenValidity(token);
        if (!isValid) {
          console.log("❌ Token is invalid, clearing auth data");
          clearAuthData();
          setIsLoading(false);
          return;
        }

        console.log("✅ Token is valid, fetching user data...");
        await refreshUser();
        setIsAuthenticated(true);
        
      } catch (error) {
        console.error("❌ Failed to initialize user:", error.message);
        setIsAuthenticated(false);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, []);

  const clearAuthData = (clearStorage = true) => {
    console.log("🧹 Clearing auth data");
    setUserData(defaultUserData);
    setIsAuthenticated(false);
    if (clearStorage) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");
      localStorage.removeItem("kycLastSubmitted");
    }
  };

  const fetchUserProfileSnapshot = async (token) => {
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/User/Profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      const profileData = result?.data || result?.user || null;
      return profileData && typeof profileData === "object"
        ? profileData
        : null;
    } catch (error) {
      console.warn("Profile fetch skipped:", error?.message || error);
      return null;
    }
  };

  const refreshUser = async () => {
    try {
      const token = getStoredToken();
      if (!token) {
        console.warn("Refresh failed: No authToken found.");
        setIsAuthenticated(false);
        return userData;
      }
      
      console.log("🔑 Attempting user refresh via DASHBOARD endpoint...");

      const response = await fetch(`${API_BASE_URL}/User/Dashboard`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Dashboard data refreshed successfully:", result);
        
        if (result.success && result.data) {
          const dashboardData = result.data;
          const profileData = await fetchUserProfileSnapshot(token);
          const { currencyCode, currencySymbol } = resolveCurrencyInfo(
            dashboardData,
            profileData,
            userData
          );
          
          // 🔥 IMPORTANT: Extract user ID from token
          const userIdFromToken = extractUserIdFromToken(token);
          const dashboardSubscriptionPlan =
            extractSubscriptionPlanFromData(dashboardData) ||
            extractSubscriptionPlanFromData(profileData) ||
            userData.subscriptionPlan ||
            "Basic";
          
          const rawBalance = dashboardData.balance ?? userData.balance ?? 0;
          const updatedUserData = {
            balance: Math.max(0, Number(rawBalance) || 0),
            name:
              dashboardData.firstName ||
              profileData?.firstName ||
              userData.name ||
              "User",
            email:
              dashboardData.email || profileData?.email || userData.email || "",
            uid: userIdFromToken || userData.uid || "",
            photoURL:
              dashboardData.photoURL ||
              profileData?.photoURL ||
              userData.photoURL ||
              "",
            coverImageURL:
              dashboardData.coverImageURL ||
              profileData?.coverImageURL ||
              userData.coverImageURL ||
              "",
            displayName:
              dashboardData.firstName ||
              profileData?.firstName ||
              userData.displayName ||
              "User",
            firstName:
              dashboardData.firstName ||
              profileData?.firstName ||
              userData.firstName ||
              "",
            lastName:
              dashboardData.lastName ||
              profileData?.lastName ||
              userData.lastName ||
              "",
            userId: userIdFromToken || userData.userId || "", // 🔥 Use extracted ID
            phoneNumber:
              dashboardData.phoneNumber ||
              profileData?.phoneNumber ||
              userData.phoneNumber ||
              "",
            country:
              dashboardData.country ||
              profileData?.country ||
              userData.country ||
              "",
            currencyCode,
            currencySymbol,
            subscriptionPlan: dashboardSubscriptionPlan,
            kycVerified: dashboardData.kycVerified || dashboardData.isKycVerified || userData.kycVerified || false,
            kycStatus: dashboardData.kycStatus || userData.kycStatus || "not_verified",
            role: dashboardData.role || profileData?.role || userData.role || "user",
            stats:
              dashboardData.stats && typeof dashboardData.stats === "object"
                ? dashboardData.stats
                : userData.stats || {},
            revenue:
              dashboardData.revenue && typeof dashboardData.revenue === "object"
                ? dashboardData.revenue
                : userData.revenue || {},
            securitySettings: normalizeSecuritySettings(
              dashboardData.securitySettings || profileData?.securitySettings,
              userData.securitySettings
            ),
            notificationSettings: normalizeNotificationSettings(
              dashboardData.notificationSettings ||
                profileData?.notificationSettings,
              userData.notificationSettings
            ),
            walletWhitelist: normalizeWalletWhitelist(
              dashboardData.walletWhitelist || profileData?.walletWhitelist
            ),
            onboarding: normalizeOnboarding(
              dashboardData.onboarding || profileData?.onboarding,
              userData.onboarding
            ),
            lastLoginAt:
              dashboardData.lastLoginAt ||
              profileData?.lastLoginAt ||
              userData.lastLoginAt ||
              null,
            lastLoginDevice:
              dashboardData.lastLoginDevice ||
              profileData?.lastLoginDevice ||
              userData.lastLoginDevice ||
              "",
            createdAt:
              dashboardData.createdAt ||
              profileData?.createdAt ||
              userData.createdAt ||
              null,
            updatedAt:
              dashboardData.updatedAt ||
              profileData?.updatedAt ||
              userData.updatedAt ||
              null,
          };
          
          console.log("🔄 Updated user data after dashboard refresh:", updatedUserData);
          console.log("🔑 User ID from token:", userIdFromToken);
          setUserData(updatedUserData);
          setIsAuthenticated(true);
          localStorage.setItem("userData", JSON.stringify(updatedUserData));
          
          return updatedUserData;
        }
      } else {
        if (response.status === 401) {
          console.log("❌ Token expired during refresh");
          clearAuthData();
        }
        console.warn("⚠️ Dashboard refresh failed");
        return userData;
      }
    } catch (error) {
      console.error("💥 Error refreshing user:", error.message);
      return userData;
    }
  };

  const loginUser = async (email, password, options = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}/Authentication/Login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password: password,
          ...(options.requireAdmin
            ? {
                requireAdmin: true,
                authCode: options.authCode?.trim() || "",
              }
            : {}),
          ...(options.challengeId
            ? { challengeId: options.challengeId }
            : {}),
          ...(options.twoFactorCode
            ? { twoFactorCode: options.twoFactorCode }
            : {}),
        }),
      });

      if (response.status === 202) {
        const twoFactorResult = await response.json();
        if (twoFactorResult?.requiresTwoFactor) {
          return {
            requiresTwoFactor: true,
            challengeId: twoFactorResult?.data?.challengeId || "",
            expiresAt: twoFactorResult?.data?.expiresAt || null,
            message:
              twoFactorResult?.message ||
              "Verification code sent to your email.",
          };
        }
      }

      if (!response.ok) {
        const contentType = response.headers.get("content-type") || "";
        let errorMessage = `Login failed: ${response.status}`;

        if (contentType.includes("application/json")) {
          const errorPayload = await response.json();
          errorMessage =
            errorPayload?.message || errorPayload?.error || errorMessage;
        } else {
          const errorText = await response.text();
          if (errorText && !errorText.trim().startsWith("<")) {
            errorMessage = errorText;
          }
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("📦 Login API Response:", result);
      
      const token = result.data?.token || result.token;
      
      if (!token) {
        throw new Error("Authentication token not received from server.");
      }

      // 🔥 Store token properly without quotes
      storeToken(token);
      
      // Extract user ID from token immediately
      const userIdFromToken = extractUserIdFromToken(token);
      console.log("🔑 Extracted User ID from token:", userIdFromToken);

      const userDataFromApi = result.data || result;
      const resolvedBalance = Number(userDataFromApi.balance);
      const loginSubscriptionPlan =
        extractSubscriptionPlanFromData(userDataFromApi) || "Basic";
      const { currencyCode, currencySymbol } = resolveCurrencyInfo(
        userDataFromApi,
        userData
      );
      
        const newUserData = {
        uid: userIdFromToken || `user-${Date.now()}`,
        userId: userIdFromToken || `user-${Date.now()}`,
        email: userDataFromApi.email || email,
        name: userDataFromApi.firstName || userDataFromApi.name || "User",
        firstName: userDataFromApi.firstName || "",
        lastName: userDataFromApi.lastName || "",
        balance: Number.isFinite(resolvedBalance) ? resolvedBalance : 0,
        photoURL: userDataFromApi.photoURL || "",
        coverImageURL: userDataFromApi.coverImageURL || "",
        displayName: userDataFromApi.firstName || userDataFromApi.name || "User",
        phoneNumber: userDataFromApi.phoneNumber || "",
        country: userDataFromApi.country || "",
        currencyCode,
        currencySymbol,
        subscriptionPlan: loginSubscriptionPlan,
          kycVerified: userDataFromApi.kycVerified || userDataFromApi.isKycVerified || false,
          kycStatus: userDataFromApi.kycStatus || "not_verified",
          role: userDataFromApi.role || "user",
          stats:
            userDataFromApi.stats && typeof userDataFromApi.stats === "object"
              ? userDataFromApi.stats
              : {},
          revenue:
            userDataFromApi.revenue && typeof userDataFromApi.revenue === "object"
              ? userDataFromApi.revenue
              : {},
          securitySettings: normalizeSecuritySettings(
            userDataFromApi.securitySettings,
            userData.securitySettings
          ),
          notificationSettings: normalizeNotificationSettings(
            userDataFromApi.notificationSettings,
            userData.notificationSettings
          ),
          walletWhitelist: normalizeWalletWhitelist(
            userDataFromApi.walletWhitelist
          ),
          onboarding: normalizeOnboarding(
            userDataFromApi.onboarding,
            userData.onboarding
          ),
          lastLoginAt: userDataFromApi.lastLoginAt || null,
          lastLoginDevice: userDataFromApi.lastLoginDevice || "",
          createdAt: userDataFromApi.createdAt || null,
          updatedAt: userDataFromApi.updatedAt || null,
      };

      localStorage.setItem("userData", JSON.stringify(newUserData));
      setUserData(newUserData);
      setIsAuthenticated(true);
      
      // Refresh with dashboard data
      await refreshUser();
      
      console.log("🎉 LOGIN SUCCESSFUL! User ID:", newUserData.userId);
      return newUserData;
    } catch (error) {
      console.error("💥 LOGIN ERROR:", error.message);
      setIsAuthenticated(false);
      clearAuthData();
      throw error;
    }
  };

  const registerUser = async (registrationData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/User/Register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          firstName: registrationData.firstName.trim(),
          lastName: registrationData.lastName.trim(),
          email: registrationData.email.toLowerCase().trim(),
          phoneNumber: registrationData.phoneNumber.trim(),
          sex: registrationData.sex,
          country: registrationData.country,
          currencyCode: registrationData.currencyCode,
          currencySymbol: registrationData.currencySymbol,
          password: registrationData.password,
          confirmPassword: registrationData.confirmPassword,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Registration failed: ${response.status}`);
      }

      const result = await response.json();
      
      const token = result.token || result.data?.token;
      
      if (token) {
        const userIdFromToken = extractUserIdFromToken(token);
      const user = result.user || result.data?.user || result.data || result;
      const resolvedBalance = Number(user.balance);
      const registerSubscriptionPlan =
        extractSubscriptionPlanFromData(user) || "Basic";
      const { currencyCode, currencySymbol } = resolveCurrencyInfo(
        user,
        registrationData
      );

      const newUserData = {
        uid: userIdFromToken || `user-${Date.now()}`,
          userId: userIdFromToken || `user-${Date.now()}`,
          email: user.email || registrationData.email,
          name: registrationData.firstName,
          firstName: registrationData.firstName,
          lastName: registrationData.lastName,
          balance: Number.isFinite(resolvedBalance) ? resolvedBalance : 0,
          photoURL: user.photoURL || "",
          coverImageURL: user.coverImageURL || "",
          displayName: `${registrationData.firstName} ${registrationData.lastName}`,
          phoneNumber: user.phoneNumber || registrationData.phoneNumber || "",
          country: user.country || registrationData.country || "",
          currencyCode,
          currencySymbol,
          subscriptionPlan: registerSubscriptionPlan,
          role: user.role || "user",
          stats: user.stats && typeof user.stats === "object" ? user.stats : {},
          revenue:
            user.revenue && typeof user.revenue === "object" ? user.revenue : {},
          securitySettings: normalizeSecuritySettings(
            user.securitySettings,
            userData.securitySettings
          ),
          notificationSettings: normalizeNotificationSettings(
            user.notificationSettings,
            userData.notificationSettings
          ),
          walletWhitelist: normalizeWalletWhitelist(user.walletWhitelist),
          onboarding: normalizeOnboarding(
            user.onboarding,
            userData.onboarding
          ),
          lastLoginAt: user.lastLoginAt || null,
          lastLoginDevice: user.lastLoginDevice || "",
          createdAt: user.createdAt || null,
          updatedAt: user.updatedAt || null,
      };

        storeToken(token);
        localStorage.setItem("userData", JSON.stringify(newUserData));
        setUserData(newUserData);
        setIsAuthenticated(true);
        
        await refreshUser();
        
        return { success: true, autoLogin: true, userData: newUserData };
      }
      
      return { success: true, autoLogin: false };
    } catch (error) {
      console.error("💥 REGISTRATION ERROR:", error.message);
      throw error;
    }
  };

  const logoutUser = async () => {
    try {
      const token = getStoredToken();
      if (token) {
        await fetch(`${API_BASE_URL}/User/Logout`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }).catch(err => console.error("Logout API error:", err));
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuthData();
      console.log("👋 User logged out");
    }
  };

  const parseJsonSafely = async (response) => {
    const text = await response.text();
    try {
      return { json: JSON.parse(text), text };
    } catch (error) {
      return { json: null, text };
    }
  };

  const updateUserBalance = async (amount) => {
    void amount;
    return {
      success: false,
      error:
        "Direct client wallet mutations are disabled. Use secured feature actions instead.",
    };
  };

  const updateUserProfile = (updates) => {
    let persisted = true;
    setUserData((prev) => {
      const { currencyCode, currencySymbol } = resolveCurrencyInfo(
        updates,
        prev
      );
      const updated = {
        ...prev,
        ...updates,
        currencyCode,
        currencySymbol,
        securitySettings: normalizeSecuritySettings(
          updates.securitySettings,
          prev.securitySettings
        ),
        notificationSettings: normalizeNotificationSettings(
          updates.notificationSettings,
          prev.notificationSettings
        ),
        walletWhitelist:
          updates.walletWhitelist !== undefined
            ? normalizeWalletWhitelist(updates.walletWhitelist)
            : prev.walletWhitelist,
        onboarding: normalizeOnboarding(
          updates.onboarding,
          prev.onboarding
        ),
      };
      try {
        localStorage.setItem("userData", JSON.stringify(updated));
      } catch (error) {
        console.warn("Failed to persist user data", error);
        persisted = false;
      }
      return updated;
    });
    return persisted;
  };

  const saveUserProfile = async (updates) => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_BASE_URL}/User/Profile`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(updates),
    });

    const { json: result, text } = await parseJsonSafely(response);
    if (!response.ok || !result?.success) {
      throw new Error(
        result?.message || text || "Failed to update profile"
      );
    }

    updateUserProfile({ ...updates, ...(result.data || {}) });
    return result.data;
  };

  const refreshKYCStatus = async () => {
    try {
      const token = getStoredToken();
      if (!token) {
        console.warn("🔐 Cannot refresh KYC status: No auth token found");
        return false;
      }

      console.log("🔄 Refreshing KYC status from backend...");
      
      const response = await fetch(`${API_BASE_URL}/User/Dashboard?t=${Date.now()}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn("⚠️ Failed to refresh KYC status from backend");
        return false;
      }

      const result = await response.json();
      if (result.success && result.data) {
        const dashboardData = result.data;
        const kycVerified = dashboardData.kycVerified || dashboardData.isKycVerified || false;
        const kycStatus = dashboardData.kycStatus || "not_verified";

        console.log(`✅ Backend KYC Status Updated - Verified: ${kycVerified}, Status: ${kycStatus}`);

        setUserData(prev => {
          const updated = {
            ...prev,
            kycVerified,
            kycStatus,
          };
          localStorage.setItem("userData", JSON.stringify(updated));
          return updated;
        });

        return kycVerified;
      }

      return false;
    } catch (error) {
      console.error("💥 Error refreshing KYC status:", error.message);
      return false;
    }
  };

  // Get cleaned token
  const getAuthToken = () => getStoredToken();

  const hasValidToken = () => {
    const token = getStoredToken();
    return !!token && isAuthenticated;
  };

  // 🔥 FIXED: Get user ID from token if not in userData
  const getUserId = () => {
    if (userData.userId) return userData.userId;
    
    const token = getStoredToken();
    if (token) {
      const userIdFromToken = extractUserIdFromToken(token);
      if (userIdFromToken) {
        console.log("🔑 User ID extracted from token:", userIdFromToken);
        return userIdFromToken;
      }
    }
    
    console.warn("⚠️ No user ID found");
    return null;
  };

  return (
    <UserContext.Provider
      value={{
        userData,
        isLoading,
        isAuthenticated,
        loginUser,
        registerUser,
        logoutUser,
        updateUserBalance,
        refreshUser,
        refreshKYCStatus,
        updateUserProfile,
        saveUserProfile,
        getAuthToken,
        hasValidToken,
        getUserId,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
