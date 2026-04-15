import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useUser } from "../../../context/UserContext";
import coinquestxLogoDark from "../../../pictures/coinquestxlogodark.png";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [otpExpiresAt, setOtpExpiresAt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingCode, setIsResendingCode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { loginUser } = useUser();
  const requiresTwoFactor = Boolean(challengeId);

  const requestTwoFactorCode = async () => {
    const result = await loginUser(email, password);
    if (result?.requiresTwoFactor) {
      setChallengeId(result.challengeId || "");
      setOtpExpiresAt(result.expiresAt || "");
      setTwoFactorCode("");
      toast.success(result.message || "Verification code sent to your email.");
      return true;
    }

    throw new Error("Could not send a new verification code.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password || (requiresTwoFactor && !twoFactorCode.trim())) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const result = requiresTwoFactor
        ? await loginUser(email, password, {
            challengeId,
            twoFactorCode: twoFactorCode.trim(),
          })
        : await loginUser(email, password);

      if (result?.requiresTwoFactor) {
        setChallengeId(result.challengeId || "");
        setOtpExpiresAt(result.expiresAt || "");
        setTwoFactorCode("");
        toast.success(result.message || "Verification code sent to your email.");
        setIsLoading(false);
        return;
      }

      toast.success("Welcome back!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      toast.error(err.message || "Login failed");
      setIsLoading(false);
    }
  };

  const handleResendTwoFactorCode = async () => {
    if (!email || !password) {
      toast.error("Enter your email and password first.");
      return;
    }

    setIsResendingCode(true);
    try {
      await requestTwoFactorCode();
    } catch (error) {
      console.error("Two-factor resend error:", error);
      toast.error(error.message || "Could not resend verification code.");
    } finally {
      setIsResendingCode(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 to-teal-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="text-center">
            <img
              src={coinquestxLogoDark}
              alt="CoinQuestX logo"
              className="mx-auto h-12 w-auto object-contain sm:h-14"
            />
            <h2 className="mt-2 text-xl font-semibold text-gray-800">
              Welcome back
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent pr-12"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-teal-600"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {requiresTwoFactor && (
              <div>
                <label
                  htmlFor="twoFactorCode"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email verification code
                </label>
                <input
                  id="twoFactorCode"
                  type="text"
                  inputMode="numeric"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent tracking-[0.35em]"
                  placeholder="123456"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  disabled={isLoading}
                />
                <p className="mt-2 text-xs text-gray-500">
                  Enter the 6-digit code sent to {email}.
                  {otpExpiresAt ? ` Expires ${new Date(otpExpiresAt).toLocaleTimeString()}.` : ""}
                </p>
                <button
                  type="button"
                  onClick={handleResendTwoFactorCode}
                  disabled={isLoading || isResendingCode}
                  className="mt-3 text-sm font-medium text-teal-600 hover:text-teal-700 disabled:cursor-not-allowed disabled:text-teal-300"
                >
                  {isResendingCode ? "Sending..." : "Resend code"}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white ${
                isLoading
                  ? "bg-teal-400 cursor-not-allowed"
                  : "bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                requiresTwoFactor ? "Verify and sign in" : "Sign in"
              )}
            </button>
          </form>

          <div className="text-center text-sm text-gray-600">
            <p>
              Dont have an account?{" "}
              <Link to="/SignUpPage" className="font-medium text-teal-600 hover:text-teal-500">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
