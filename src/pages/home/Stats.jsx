import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";

export default function StatsPage() {
  const stats = [
    { id: "users-count", label: "USERS", value: "850K" },
    { id: "countries-count", label: "COUNTRIES", value: "84" },
    { id: "payouts-count", label: "PAYOUTS", value: "$600.547M+" },
    { id: "trades-count", label: "ACTIVE TRADES", value: "446K+" },
  ];

  const [hasAnimated, setHasAnimated] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const statsSection = document.getElementById("stats-section");
    if (!statsSection) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            startCounting();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(statsSection);
    return () => observer.disconnect();
  }, [hasAnimated]);

  const seededRandom = (seed) => {
    const x = Math.sin(seed * 999) * 10000;
    return x - Math.floor(x);
  };

  const particleDots = useMemo(() => {
    const count = isSmallScreen ? 48 : 180;
    return Array.from({ length: count }, (_, index) => {
      const seed = index + 1;
      const opacity = 0.28 + seededRandom(seed + 41) * 0.58;
      const isBright = seededRandom(seed + 37) > 0.5;
      return {
        id: `stats-particle-${seed}`,
        left: `${seededRandom(seed + 7) * 100}%`,
        size: 1.8 + seededRandom(seed + 13) * 3.8,
        duration: 18 + seededRandom(seed + 19) * 18,
        delay: seededRandom(seed + 23) * -14,
        drift: `${(seededRandom(seed + 29) - 0.5) * 130}px`,
        opacity,
        color: isBright ? "rgba(236, 254, 255, 0.95)" : "rgba(153, 246, 228, 0.9)",
        glow: isBright
          ? "0 0 10px rgba(236, 254, 255, 0.85)"
          : "0 0 12px rgba(45, 212, 191, 0.95)",
      };
    });
  }, [isSmallScreen]);

  const formatNumber = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(3).replace(/\.?0+$/, "")}M+`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toLocaleString();
  };

  const startCounting = () => {
    const countUp = (id, start, end, duration, suffix = "") => {
      const element = document.getElementById(id);
      if (!element) return;

      let startTime = null;
      const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;
        const value = Math.min(start + (end - start) * (progress / duration), end);
        element.innerText = formatNumber(value) + suffix;
        if (progress < duration) {
          window.requestAnimationFrame(step);
        } else {
          element.innerText = formatNumber(end) + suffix;
        }
      };
      window.requestAnimationFrame(step);
    };

    countUp("users-count", 0, 850000, 2000);
    countUp("countries-count", 0, 84, 3000);
    countUp("payouts-count", 0, 600547000, 5000);
    countUp("trades-count", 0, 446000, 3000, "+");
  };

  return (
    <section
      id="stats-section"
      className={`relative isolate overflow-hidden ${
        isSmallScreen
          ? "bg-gray-900"
          : "bg-gradient-to-r from-gray-900/50 via-teal-900/50 to-gray-800/50"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 z-0">
        {particleDots.map((dot) => (
          <span
            key={dot.id}
            className="stats-particle-rise absolute bottom-[-14px] rounded-full bg-white"
            style={{
              left: dot.left,
              width: `${dot.size}px`,
              height: `${dot.size}px`,
              opacity: dot.opacity,
              backgroundColor: dot.color,
              boxShadow: dot.glow,
              animationDuration: `${dot.duration}s`,
              animationDelay: `${dot.delay}s`,
              "--drift-x": dot.drift,
              "--particle-opacity": dot.opacity,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-wrap justify-between space-y-6 p-20 text-center text-white sm:flex-nowrap sm:space-x-8 sm:space-y-0">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.id}
            className={`flex w-full flex-col items-center border-teal-600/50 pb-6 sm:w-1/4 sm:pb-0 ${
              index !== stats.length - 1 ? "sm:border-b-0 sm:border-r" : ""
            }`}
            initial={{ opacity: 0, y: 40 }}
            animate={hasAnimated ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: index * 0.2, duration: 0.6, ease: "easeOut" }}
          >
            <h2 className="font-semibold">{stat.label}</h2>
            <p
              id={stat.id}
              className="min-w-[100px] text-2xl font-semibold text-teal-300"
            >
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
