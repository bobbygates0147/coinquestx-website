import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { API_BASE_URL } from "../../config/api";
import coinquestxLogoLight from "../../pictures/coinquestxlogolight.png";

const inputClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 pl-11 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";

const iconWrapperClassName =
  "pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400";

const AdminSignup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSignupLoading, setIsSignupLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAuthCode, setShowAuthCode] = useState(false);

  const navigate = useNavigate();

  const signupAdmin = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!email || !password || !authCode) {
      const message = "All fields are required.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    if (password.length < 6) {
      const message = "Password must be at least 6 characters.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    setIsSignupLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/Admin/Register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password: password.trim(),
          authCode,
          firstName: "Admin",
          lastName: "User",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Signup failed. Please try again.");
      }

      toast.success("Admin account created successfully.");
      navigate("/AdminLogin", { replace: true });
    } catch (error) {
      const message = error?.message || "Signup failed. Please try again.";
      console.error("Signup error:", error);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSignupLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-teal-900 via-teal-950 to-slate-950 px-4 py-8">
      <div className="pointer-events-none absolute -left-24 top-16 h-56 w-56 rounded-full bg-teal-400/20 blur-3xl" />
      <div className="pointer-events-none absolute right-10 top-24 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center">
        <div className="grid w-full overflow-hidden rounded-2xl border border-white/10 bg-white/95 shadow-2xl md:grid-cols-2">
          <div className="hidden bg-gradient-to-br from-teal-700 to-teal-900 p-8 text-white md:flex md:flex-col md:justify-between">
            <div>
              <img
                src={coinquestxLogoLight}
                alt="CoinQuestX logo"
                className="h-12 w-auto object-contain"
              />
              <h1 className="mt-4 text-3xl font-bold leading-tight">
                Provision New Admin Access
              </h1>
              <p className="mt-3 text-sm text-teal-100">
                Create a secure admin account for finance workflows, compliance
                reviews, and platform operations.
              </p>
            </div>

            <div className="space-y-3 text-sm text-teal-50">
              <div className="rounded-lg border border-white/20 bg-white/10 px-4 py-3">
                Authorization-code gated onboarding for internal admins.
              </div>
              <div className="rounded-lg border border-white/20 bg-white/10 px-4 py-3">
                Access control aligned with dashboard approvals and user
                management.
              </div>
              <div className="rounded-lg border border-white/20 bg-white/10 px-4 py-3">
                Clean entry point that matches the rest of the CoinQuestX admin
                workspace.
              </div>
            </div>

            <div className="rounded-xl border border-white/15 bg-slate-950/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">
                Existing Admin
              </p>
              <p className="mt-2 text-sm text-teal-50">
                Return to the admin login page if this account has already been
                provisioned.
              </p>
              <Link
                to="/AdminLogin"
                className="mt-4 inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-50"
              >
                Go to Admin Login
              </Link>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.2} />
                Admin Access
              </div>
              <h2 className="mt-4 text-2xl font-bold text-slate-900">
                Create Admin Account
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Register with your admin email, password, and authorization
                code.
              </p>
            </div>

            <form onSubmit={signupAdmin} className="space-y-4">
              <div>
                <label
                  htmlFor="authCode"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Authorization code
                </label>
                <div className="relative">
                  <span className={iconWrapperClassName}>
                    <KeyRound className="h-4.5 w-4.5" strokeWidth={2.1} />
                  </span>
                  <input
                    id="authCode"
                    type={showAuthCode ? "text" : "password"}
                    value={authCode}
                    onChange={(event) => setAuthCode(event.target.value)}
                    placeholder="Enter admin authorization code"
                    autoComplete="off"
                    disabled={isSignupLoading}
                    className={`${inputClassName} pr-16`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAuthCode((prev) => !prev)}
                    disabled={isSignupLoading}
                    className="absolute inset-y-0 right-0 px-4 text-xs font-semibold text-teal-700 transition hover:text-teal-600"
                  >
                    {showAuthCode ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Email address
                </label>
                <div className="relative">
                  <span className={iconWrapperClassName}>
                    <Mail className="h-4.5 w-4.5" strokeWidth={2.1} />
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@coinquestx.com"
                    autoComplete="email"
                    disabled={isSignupLoading}
                    className={inputClassName}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <div className="relative">
                  <span className={iconWrapperClassName}>
                    <LockKeyhole className="h-4.5 w-4.5" strokeWidth={2.1} />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create a secure password"
                    autoComplete="new-password"
                    disabled={isSignupLoading}
                    className={`${inputClassName} pr-16`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={isSignupLoading}
                    className="absolute inset-y-0 right-0 px-4 text-xs font-semibold text-teal-700 transition hover:text-teal-600"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Use at least 6 characters for admin access security.
                </p>
              </div>

              {errorMessage && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSignupLoading}
                className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition ${
                  isSignupLoading
                    ? "cursor-not-allowed bg-teal-400"
                    : "bg-teal-600 hover:bg-teal-700"
                }`}
              >
                {isSignupLoading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-l-transparent" />
                ) : (
                  <>
                    <UserPlus className="h-4.5 w-4.5" strokeWidth={2.2} />
                    Create Admin Account
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 space-y-2 text-sm text-slate-600">
              <p>
                Already have an admin account?{" "}
                <Link
                  to="/AdminLogin"
                  className="font-semibold text-teal-700 hover:text-teal-600"
                >
                  Sign in
                </Link>
              </p>
              <p>
                User login instead?{" "}
                <Link
                  to="/LoginPage"
                  className="font-semibold text-teal-700 hover:text-teal-600"
                >
                  Go to user login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSignup;
