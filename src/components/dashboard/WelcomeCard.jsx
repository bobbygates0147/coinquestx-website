import { useEffect, useState } from "react";
import { ArrowUpRight, Bitcoin } from "lucide-react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useUser } from "../../context/UserContext";

const ROTATING_TAGLINES = [
  "Your gateway to the exciting world of cryptocurrency trading.",
  "Track markets, place trades, and grow your portfolio with confidence.",
  "Stay ahead with live insights, copy trading, and smart automation.",
  "Everything you need for trading, staking, mining, and portfolio control.",
  "Move faster with real-time signals and performance-focused dashboards.",
];

export default function WelcomeCard({
  theme,
  borderColor,
  secondaryText,
  desktopHeightClass = "lg:h-[15rem]",
}) {
  const { userData, isLoading } = useUser();
  const [taglineIndex, setTaglineIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % ROTATING_TAGLINES.length);
    }, 3600);

    return () => clearInterval(interval);
  }, []);
  
  if (isLoading) {
    return (
      <div className={`bg-gradient-to-r ${
        theme === "dark" ? "from-teal-700 to-teal-950" : "from-teal-500 to-teal-700"
      } ${borderColor} ${desktopHeightClass} mb-6 hidden rounded-lg border-2 p-4 shadow-lg lg:block lg:px-6 lg:py-5`}>
        <div className="flex h-full animate-pulse flex-col gap-4">
          <div>
            <div className="mb-2 h-6 w-3/4 rounded bg-teal-400"></div>
            <div className="mb-4 h-4 w-full rounded bg-teal-300"></div>
          </div>
          <div className="h-10 w-32 rounded bg-teal-400"></div>
        </div>
      </div>
    );
  }

  // Better username detection
  const getUserName = () => {
    if (!userData) return 'User';
    
    // Try different possible name fields
    const name = userData.firstName || 
                 userData.name || 
                 userData.displayName || 
                 userData.email?.split('@')[0] || 
                 'User';
    
    console.log("User data for welcome card:", userData);
    console.log("Derived username:", name);
    
    return name;
  };

  const userName = getUserName();
  
  return (
    <div
      className={`bg-gradient-to-r ${
        theme === "dark"
          ? "from-teal-700 to-teal-950"
          : "from-teal-500 to-teal-700"
      } ${borderColor} ${desktopHeightClass} mb-6 hidden rounded-lg border-2 p-4 shadow-lg transition-shadow duration-300 hover:shadow-xl lg:block lg:px-6 lg:py-5`}
    >
      <div className="flex h-full flex-col">
        <div>
          <h1 className="mb-2 text-xl font-bold text-white lg:text-2xl">
            Welcome{" "}
            <span className="inline-block max-w-[180px] truncate align-bottom text-teal-200">
              {userName}
            </span>{" "}
            to CoinQuestX!
          </h1>
          <div className="min-h-[56px]">
            <AnimatePresence mode="wait">
              <motion.p
                key={taglineIndex}
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.45, ease: "easeInOut" }}
                className={`max-w-[40ch] text-[15px] leading-6 text-teal-100 lg:text-[1.05rem] ${secondaryText}`}
              >
                {ROTATING_TAGLINES[taglineIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
        <div className="mt-auto flex items-center pt-4">
          <Link
            to="/Assets"
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition duration-300 lg:text-base ${
              theme === "dark"
                ? "bg-slate-950/50 text-teal-200 hover:bg-white hover:text-slate-950"
                : "bg-white/95 text-teal-700 hover:bg-slate-950 hover:text-white"
            }`}
          >
            <Bitcoin className="h-4 w-4" strokeWidth={2.4} />
            Crypto Update
            <ArrowUpRight className="h-4 w-4" strokeWidth={2.4} />
          </Link>
        </div>
      </div>
    </div>
  );
}
