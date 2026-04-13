import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useUser } from "../../context/UserContext";
import coinquestxLogoLight from "../../pictures/coinquestxlogolight.png";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAuthCode, setShowAuthCode] = useState(false);

  const navigate = useNavigate();
  const { loginUser, logoutUser } = useUser();

  const loginAdmin = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (!email || !password || !authCode) {
      const message = "All fields are required.";
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    setIsLoginLoading(true);
    try {
      const user = await loginUser(email, password, {
        requireAdmin: true,
        authCode,
      });
      if (user?.role !== "admin") {
        await logoutUser();
        throw new Error("You do not have admin access.");
      }

      toast.success("Welcome back, Admin.");
      navigate("/AdminDashboard", { replace: true });
    } catch (error) {
      const message = error?.message || "Admin login failed.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoginLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-teal-900 via-teal-950 to-slate-950 px-4 py-8">
      <div className="pointer-events-none absolute -left-24 top-16 h-56 w-56 rounded-full bg-teal-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

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
                Admin Control Access
              </h1>
              <p className="mt-3 text-sm text-teal-100">
                Secure sign in for governance, finance approvals, user messages,
                and compliance controls.
              </p>
            </div>

            <div className="space-y-3 text-sm text-teal-50">
              <p className="rounded-lg border border-white/20 bg-white/10 px-3 py-2">
                Real-time request queues and transaction approvals.
              </p>
              <p className="rounded-lg border border-white/20 bg-white/10 px-3 py-2">
                Message center with unread support thread tracking.
              </p>
              <p className="rounded-lg border border-white/20 bg-white/10 px-3 py-2">
                KYC and security operations from one admin workspace.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Admin Login</h2>
              <p className="mt-1 text-sm text-slate-600">
                Sign in with your admin credentials and authorization code.
              </p>
            </div>

            <form onSubmit={loginAdmin} className="space-y-4">
              <div>
                <label
                  htmlFor="authCode"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Authorization code
                </label>
                <div className="relative">
                  <input
                    id="authCode"
                    type={showAuthCode ? "text" : "password"}
                    value={authCode}
                    onChange={(event) => setAuthCode(event.target.value)}
                    placeholder="Enter admin authorization code"
                    autoComplete="off"
                    disabled={isLoginLoading}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 pr-16 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAuthCode((prev) => !prev)}
                    disabled={isLoginLoading}
                    className="absolute inset-y-0 right-0 px-4 text-xs font-semibold text-teal-700 hover:text-teal-600"
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
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@company.com"
                  autoComplete="email"
                  disabled={isLoginLoading}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={isLoginLoading}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 pr-16 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={isLoginLoading}
                    className="absolute inset-y-0 right-0 px-4 text-xs font-semibold text-teal-700 hover:text-teal-600"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoginLoading}
                className={`flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold text-white transition ${
                  isLoginLoading
                    ? "cursor-not-allowed bg-teal-400"
                    : "bg-teal-600 hover:bg-teal-700"
                }`}
              >
                {isLoginLoading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-l-transparent" />
                ) : (
                  "Enter Admin Portal"
                )}
              </button>
            </form>

            <div className="mt-6 space-y-2 text-sm text-slate-600">
              <p>
                Need admin access?{" "}
                <Link to="/AdminSignup" className="font-semibold text-teal-700 hover:text-teal-600">
                  Create admin account
                </Link>
              </p>
              <p>
                User login instead?{" "}
                <Link to="/LoginPage" className="font-semibold text-teal-700 hover:text-teal-600">
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

export default AdminLogin;
