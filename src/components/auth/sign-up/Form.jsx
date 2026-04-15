import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import countryData from "./CountryData.json";
import { API_BASE_URL } from "../../../config/api";
import coinquestxLogoDark from "../../../pictures/coinquestxlogodark.png";
import coinquestxLogoLight from "../../../pictures/coinquestxlogolight.png";

const SignUpPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    sex: "",
    country: "",
    currencyCode: "",
    currencySymbol: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationChallengeId, setRegistrationChallengeId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState("");
  const [isResendingCode, setIsResendingCode] = useState(false);
  const requiresVerification = Boolean(registrationChallengeId);
  const uniqueCountries = useMemo(() => {
    const seen = new Set();
    return countryData.filter((country) => {
      if (!country?.name || seen.has(country.name)) {
        return false;
      }
      seen.add(country.name);
      return true;
    });
  }, []);

  useEffect(() => {
    if (formData.country) {
      const selectedCountry = uniqueCountries.find(
        (country) => country.name === formData.country
      );
      if (selectedCountry) {
        setFormData((prevData) => ({
          ...prevData,
          currencyCode: selectedCountry.currencyCode,
          currencySymbol: selectedCountry.currencySymbol,
        }));
      }
    }
  }, [formData.country, uniqueCountries]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get("ref") || params.get("referral");
    if (ref) {
      setFormData((prev) => ({
        ...prev,
        referralCode: ref.trim(),
      }));
    }
  }, [location.search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = "Phone number is required";
    }

    if (!formData.sex) {
      newErrors.sex = "Please select your gender";
    }

    if (!formData.country) {
      newErrors.country = "Please select your country";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getApiSexValue = (sex = "") => {
    switch (`${sex}`.toLowerCase()) {
      case "male":
        return "Male";
      case "female":
        return "Female";
      case "other":
        return "Other";
      default:
        return sex;
    }
  };

  const buildRegistrationPayload = () => ({
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    email: formData.email.toLowerCase().trim(),
    phoneNumber: formData.phoneNumber.trim(),
    sex: getApiSexValue(formData.sex),
    country: formData.country,
    currencyCode: formData.currencyCode,
    currencySymbol: formData.currencySymbol,
    password: formData.password,
    confirmPassword: formData.confirmPassword,
    referralCode: formData.referralCode,
  });

  const parseResponsePayload = async (response) => {
    let result = null;
    const responseText = await response.text();
    if (responseText) {
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
    }
    return result;
  };

  const requestRegistrationVerification = async () => {
    const userData = buildRegistrationPayload();
    const response = await fetch(`${API_BASE_URL}/User/Register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(userData),
    });

    const result = await parseResponsePayload(response);

    if (response.status === 202 && result?.requiresVerification) {
      setRegistrationChallengeId(result?.data?.challengeId || "");
      setOtpExpiresAt(result?.data?.expiresAt || "");
      setVerificationCode("");
      toast.success(
        <div className="p-4 bg-teal-700 text-white rounded-lg shadow-lg">
          <p className="font-bold">Verification Code Sent</p>
          <p className="text-sm mt-1">
            Enter the OTP sent to {result?.data?.email || userData.email}.
          </p>
        </div>
      );
      return;
    }

    let errorMessage = "Registration failed";
    if (result?.errors) {
      const errorKeys = Object.keys(result.errors);
      if (errorKeys.length > 0) {
        const firstError = result.errors[errorKeys[0]];
        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
      }
    } else if (result?.message) {
      errorMessage = result.message;
    }

    throw new Error(errorMessage);
  };

  const handleResendVerificationCode = async () => {
    if (!validateForm()) {
      return;
    }

    setIsResendingCode(true);
    try {
      await requestRegistrationVerification();
    } catch (error) {
      console.error("Verification resend error:", error);
      toast.error(error.message || "Could not resend verification code.");
    } finally {
      setIsResendingCode(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!requiresVerification && !validateForm()) {
      return;
    }

    if (requiresVerification && !verificationCode.trim()) {
      toast.error(
        <div className="p-4 bg-red-600 text-white rounded-lg shadow-lg">
          <p className="font-bold">Verification Required</p>
          <p className="text-sm mt-1">Enter the 6-digit code sent to your email.</p>
        </div>
      );
      return;
    }

    setIsLoading(true);

    try {
      if (!requiresVerification) {
        await requestRegistrationVerification();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/User/Register/Confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          challengeId: registrationChallengeId,
          code: verificationCode.trim(),
        }),
      });

      const result = await parseResponsePayload(response);

      if (response.ok && requiresVerification) {
        const token = result?.data?.token || result?.token;
        const authenticatedUser = result?.data?.user || result?.data || null;

        if (token) {
          localStorage.setItem("authToken", token.replace(/^['\"]|['\"]$/g, "").trim());
        }
        if (authenticatedUser) {
          localStorage.setItem("userData", JSON.stringify(authenticatedUser));
        }

        toast.success(
          <div className="p-4 bg-teal-700 text-white rounded-lg shadow-lg">
            <p className="font-bold">Email Verified</p>
            <p className="text-sm mt-1">
              Your account is now active. Redirecting to your dashboard.
            </p>
          </div>
        );

        setTimeout(() => window.location.assign("/Dashboard"), 900);
        return;
      }

      if (response.ok) {
        toast.success(
          <div className="p-4 bg-teal-700 text-white rounded-lg shadow-lg">
            <p className="font-bold">Registration Started</p>
            <p className="text-sm mt-1">
              Check your email and enter the verification code to continue.
            </p>
          </div>
        );
        return;
      }

      let errorMessage = requiresVerification
        ? "Email verification failed"
        : "Registration failed";
      if (result && result.errors) {
        const errorKeys = Object.keys(result.errors);
        if (errorKeys.length > 0) {
          const firstError = result.errors[errorKeys[0]];
          errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
        }
      } else if (result?.message) {
        errorMessage = result.message;
      }

      throw new Error(errorMessage);
    } catch (err) {
      console.error("Registration error:", err);
      let errorMessage = requiresVerification
        ? "Verification failed. Please try again."
        : "Sign up failed. Please try again.";
      
      // Enhanced error handling
      const errMsg = err.message.toLowerCase();
      if (errMsg.includes("email") || errMsg.includes("already exists") || errMsg.includes("duplicate")) {
        errorMessage = "This email is already registered. Try logging in instead.";
      } else if (errMsg.includes("verify")) {
        errorMessage = err.message || "Verify your email with the OTP we sent.";
      } else if (errMsg.includes("password")) {
        errorMessage = "Password requirements not met. Please ensure passwords match and are at least 6 characters.";
      } else if (errMsg.includes("phone")) {
        errorMessage = "Please enter a valid phone number.";
      } else if (errMsg.includes("sex")) {
        errorMessage = "Please select Male, Female, or Other for gender.";
      } else if (errMsg.includes("invalid json")) {
        errorMessage = "Server error. Please try again later.";
      } else {
        errorMessage = err.message || "Registration failed. Please check your information and try again.";
      }

      toast.error(
        <div className="p-4 bg-red-600 text-white rounded-lg shadow-lg">
          <p className="font-bold">{requiresVerification ? "Verification Error" : "Registration Error"}</p>
          <p className="text-sm mt-1">{errorMessage}</p>
        </div>
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 to-teal-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl flex bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Left Side - Visual */}
        <div className="hidden md:flex flex-col justify-between w-1/2 bg-gradient-to-br from-teal-600 to-teal-800 p-8 text-white">
          <div>
            <img
              src={coinquestxLogoLight}
              alt="CoinQuestX logo"
              className="h-12 w-auto object-contain"
            />
            <p className="mt-2 text-teal-100">
              Your journey to financial freedom starts here
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <div className="bg-teal-500 rounded-full p-2 mr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <p>Secure and encrypted transactions</p>
            </div>

            <div className="flex items-center">
              <div className="bg-teal-500 rounded-full p-2 mr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <p>Manage multiple currencies</p>
            </div>

            <div className="flex items-center">
              <div className="bg-teal-500 rounded-full p-2 mr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <p>Real-time financial insights</p>
            </div>
          </div>

          <div className="mt-8 border-t border-teal-400 pt-4">
            <p className="text-sm text-teal-200">Already have an account?</p>
            <Link
              to="/loginpage"
              className="mt-2 inline-block bg-white text-teal-700 px-4 py-2 rounded-lg font-medium hover:bg-teal-100 transition"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8">
          <div className="text-center mb-8">
            <img
              src={coinquestxLogoDark}
              alt="CoinQuestX logo"
              className="mx-auto mb-4 h-12 w-auto object-contain md:hidden"
            />
            <h1 className="text-3xl font-bold text-teal-700">
              Create Your Account
            </h1>
            <p className="mt-2 text-gray-600">
              {requiresVerification
                ? `Enter the 6-digit code sent to ${formData.email}`
                : "Join thousands of users managing their finances with CoinQuestX"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="firstName"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.firstName ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-teal-500 focus:border-transparent`}
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="lastName"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.lastName ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-teal-500 focus:border-transparent`}
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                name="email"
                type="email"
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.email ? "border-red-500" : "border-gray-300"
                } focus:ring-2 focus:ring-teal-500 focus:border-transparent`}
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                name="phoneNumber"
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.phoneNumber ? "border-red-500" : "border-gray-300"
                } focus:ring-2 focus:ring-teal-500 focus:border-transparent`}
                placeholder="+1 234 567 8900"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  name="sex"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.sex ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-teal-500 focus:border-transparent`}
                  onChange={handleChange}
                  value={formData.sex}
                  required
                >
                  <option value="">Select your gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.sex && (
                  <p className="mt-1 text-sm text-red-600">{errors.sex}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  name="country"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.country ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-teal-500 focus:border-transparent`}
                  onChange={handleChange}
                  value={formData.country}
                  required
                >
                  <option value="">Select your country</option>
                  {uniqueCountries && uniqueCountries.map((country) => (
                    <option key={country.name} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
                {errors.country && (
                  <p className="mt-1 text-sm text-red-600">{errors.country}</p>
                )}
              </div>
            </div>

            {formData.currencyCode && (
              <div className="p-3 bg-teal-50 rounded-lg">
                <p className="text-sm text-teal-700">
                  Selected currency: <strong>{formData.currencyCode}</strong> ({formData.currencySymbol})
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-teal-500 focus:border-transparent pr-12`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-teal-600"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 6 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.confirmPassword
                      ? "border-red-500"
                      : "border-gray-300"
                  } focus:ring-2 focus:ring-teal-500 focus:border-transparent pr-12`}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-teal-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {requiresVerification && (
              <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
                <label className="block text-sm font-medium text-teal-700 mb-1">
                  Email Verification Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full rounded-lg border border-teal-300 bg-white px-4 py-3 tracking-[0.35em] text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  required
                />
                <p className="mt-2 text-xs text-teal-700">
                  We sent the OTP to <strong>{formData.email}</strong>.
                  {otpExpiresAt
                    ? ` Expires ${new Date(otpExpiresAt).toLocaleTimeString()}.`
                    : ""}
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleResendVerificationCode}
                    disabled={isLoading || isResendingCode}
                    className="text-sm font-medium text-teal-700 hover:text-teal-900 disabled:cursor-not-allowed disabled:text-teal-400"
                  >
                    {isResendingCode ? "Sending..." : "Resend code"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRegistrationChallengeId("");
                      setVerificationCode("");
                      setOtpExpiresAt("");
                    }}
                    className="text-sm font-medium text-teal-700 hover:text-teal-900"
                  >
                    Edit registration details
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                required
              />
              <label
                htmlFor="terms"
                className="ml-2 block text-sm text-gray-700"
              >
                I agree to the{" "}
                <Link to="/terms" className="text-teal-600 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-teal-600 hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white ${
                isLoading
                  ? "bg-teal-400"
                  : "bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              }`}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {requiresVerification ? "Verifying Email..." : "Creating Account..."}
                </>
              ) : (
                requiresVerification ? "Verify Email and Continue" : "Create Account"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/loginpage"
                className="font-medium text-teal-600 hover:text-teal-500"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
