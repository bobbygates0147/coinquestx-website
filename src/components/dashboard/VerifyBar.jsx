import { Link } from "react-router-dom";

export default function VerifyAccount({ theme, isKycVerified }) {
  if (isKycVerified) {
    // If already verified, don't show the button
    return null;
  }

  return (
    <Link to="/kyc-verification" className="w-full">
      <button
        className={`w-full bg-gradient-to-r ${
          theme === "dark"
            ? "from-teal-950 to-teal-700"
            : "from-teal-600 to-teal-800"
        } text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition hover:from-teal-400 dark:hover:from-teal-800 duration-300 shadow-lg mb-6 hover:shadow-xl hover:scale-95 hover:shadow-teal-400/50 text-sm lg:text-base`}
      >
        VERIFY ACCOUNT
      </button>
    </Link>
  );
}
