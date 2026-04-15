import { motion } from "framer-motion";
import backgroundImage from "../../pictures/backgroundImage.jpg";
import px5 from "../../pictures/px5.png";
import px6 from "../../pictures/ft1.png";
import px7 from "../../pictures/ft2.webp";
import px8 from "../../pictures/ft3.png";
import { Link } from "react-router-dom";
import HomeHeaderPage from "../../components/home/layout/HomeHeader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import brand from "../../../public/brand.png";
import brand2 from "../../../public/brand2.png";
import brand3 from "../../../public/brand3.png";
import brand4 from "../../../public/brand4.png";
import FooterPage from "../../components/home/layout/Footer";
import { useState, useEffect } from "react";
import SkillsSection from "./Skill";

const features = [
 {
    image: px6,
    title: "Early Bonus Cash",
    description:
      "Get a head start on growing your wealth with CoinQuestX's early cash bonus offer - a limited-time opportunity to earn extra returns on your investment.",
    lineColor: "#FFA726", // Brighter orange
  },
  {
    image: px7,
    title: "Secure Transactions",
    description:
      "Enjoy peace of mind with CoinQuestX's state-of-the-art security measures, ensuring your transactions and investments are always protected.",
    lineColor: "#26C6DA", // Brighter teal
  },
  {
    image: px8,
    title: "Transparent Reporting",
    description:
      "Stay informed with CoinQuestX's transparent reporting system, providing real-time updates on your investment performance.",
    lineColor: "#29B6F6", // Brighter sky blue
  },
];

export default function AboutPage() {
  const stats = [
    {
      id: "digital-products",
      label: "Digital Products",
      value: 58745,
      suffix: "M+",
      prefix: "$",
    },
    {
      id: "active-users",
      label: "Happy Active Users",
      value: 680000,
      suffix: "+",
    },
    {
      id: "transactions",
      label: "Transactions Done",
      value: 600547000,
      prefix: "$",
      suffix: "+",
    },
    {
      id: "community-btc",
      label: "Community BTC",
      value: 445875,
      suffix: "+",
    },
  ];

  const [hasAnimated, setHasAnimated] = useState(false);
  const [animatedValues, setAnimatedValues] = useState(
    stats.reduce((acc, stat) => ({ ...acc, [stat.id]: 0 }), {})
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          startCounting();
        }
      },
      { threshold: 0.25 }
    );

    const statsSection = document.getElementById("stats-section");
    if (statsSection) observer.observe(statsSection);

    return () => observer.disconnect();
  }, [hasAnimated]);

  const formatNumber = (num) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + "B";
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toLocaleString();
  };

  const animateValue = (id, start, end, duration) => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const currentValue = Math.floor(progress * (end - start) + start);

      setAnimatedValues((prev) => ({
        ...prev,
        [id]: currentValue,
      }));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  };

  const startCounting = () => {
    stats.forEach((stat) => {
      animateValue(stat.id, 0, stat.value, 2000);
    });
  };
  return (
    <>
      <HomeHeaderPage />
      <section className="relative flex h-screen items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            className="h-full w-full object-cover"
            src={backgroundImage}
            alt="Modern crypto platform background"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 to-slate-950/80"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.1)_0%,rgba(0,0,0,0)_70%)]"></div>

        <motion.div
          className="z-10 px-4 text-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.h1
            className="mb-4 bg-gradient-to-r from-teal-400 to-cyan-300 bg-clip-text text-4xl font-bold text-transparent md:text-6xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            About Us
          </motion.h1>

          <motion.div
            className="flex items-center justify-center text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <Link to="/" className="transition-colors hover:text-teal-400">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="font-medium text-teal-400">About Us</span>
          </motion.div>
        </motion.div>
      </section>

      <div className="bg-slate-900 flex flex-col md:flex-row items-center justify-center p-8 gap-12 relative z-50  ">
        {/* Image Section */}
        <figure className="flex justify-center md:justify-start w-full md:w-auto">
          <img
            src={px5}
            alt="CoinQuestX platform dashboard"
            className="max-w-full md:max-w-lg rounded-lg animate-spin-slow"
          />
        </figure>

        {/* Content Section */}
        <section className="max-w-2xl text-center md:text-left mx-4 md:mx-0">
          <header className="mb-6">
            <h2 className="text-teal-600 font-semibold text-lg mb-2">
              About CoinQuestX
            </h2>
            <h1 className="text-white text-2xl md:text-3xl font-bold">
              Leading Cryptocurrency Investment Platform
            </h1>
          </header>

          <p className="text-gray-400 mb-6 text-xl leading-relaxed">
            CoinQuestX is a premier cryptocurrency investment platform designed to
            democratize access to digital assets. We simplify cryptocurrency
            investing with low fees, reliable mining operations, and
            user-friendly tools to help you maximize your returns.
          </p>

          <ul className="space-y-3">
            <li className="flex items-center text-white text-xl">
              <FontAwesomeIcon
                icon={faCheck}
                className="text-white bg-teal-400 rounded-full p-1 w-5 h-5 mr-2 flex-shrink-0"
              />
              Customer-focused feature prioritization
            </li>
            <li className="flex items-center text-white text-xl">
              <FontAwesomeIcon
                icon={faCheck}
                className="text-white bg-teal-400 rounded-full p-1 w-5 h-5 mr-2 flex-shrink-0"
              />
              Bank-grade security and reliability
            </li>
            <li className="flex items-center text-white text-xl">
              <FontAwesomeIcon
                icon={faCheck}
                className="text-white bg-teal-400 rounded-full p-1 w-5 h-5 mr-2 flex-shrink-0"
              />
              Competitive low fee structure
            </li>
          </ul>
        </section>
      </div>

      <div className="relative overflow-hidden bg-slate-950 py-10">
        <div className="inline-flex items-center animate-infinite-scroll whitespace-nowrap">
          {/* Duplicate the brands for seamless looping */}
          <img
            src={brand}
            alt="Brand 1"
            className="mx-8 h-12 w-auto object-contain"
          />
          <img
            src={brand}
            alt="Brand 1"
            className="mx-8 h-12 w-auto object-contain"
          />
          <img
            src={brand2}
            alt="Brand 2"
            className="mx-8 h-12 w-auto object-contain"
          />
          <img
            src={brand3}
            alt="Brand 3"
            className="mx-8 h-12 w-auto object-contain"
          />
          <img
            src={brand4}
            alt="Brand 4"
            className="mx-8 h-12 w-auto object-contain"
          />
          {/* Repeat the same set */}
          <img
            src={brand}
            alt="Brand 1"
            className="mx-8 h-12 w-auto object-contain"
          />
          <img
            src={brand}
            alt="Brand 1"
            className="mx-8 h-12 w-auto object-contain"
          />
          <img
            src={brand2}
            alt="Brand 2"
            className="mx-8 h-12 w-auto object-contain"
          />
          <img
            src={brand3}
            alt="Brand 3"
            className="mx-8 h-12 w-auto object-contain"
          />
          <img
            src={brand4}
            alt="Brand 4"
            className="mx-8 h-12 w-auto object-contain"
          />
        </div>
      </div>

      <div className="bg-gray-950 relative z-50 py-12 px-8 md:px-16">
        {/* Heading Section */}
        <div className="text-center mb-12">
          <h1 className="text-teal-600 text-lg font-semibold mb-3">
            CoinQuestX Features
          </h1>
          <h2 className="text-white text-3xl font-bold mb-4">
            Crypto Best Features
          </h2>
          <h4 className="text-gray-400 text-xl max-w-2xl mx-auto">
            Investing in cryptocurrency is a smart choice for those who want to
            capitalize on the growth of this rapidly-evolving field.
          </h4>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-gradient-to-b from-gray-800/30 to-gray-900/10 backdrop-blur-lg border border-gray-700/30 rounded-2xl p-6 transition-all duration-500 hover:border-teal-400/50 hover:-translate-y-2"
              style={{
                boxShadow: "0 10px 30px -15px rgba(0,0,0,0.5)",
                backgroundImage:
                  "radial-gradient(at top right, rgba(31,41,55,0.4) 0%, rgba(15,23,42,0.1) 60%)",
              }}
            >
              {/* Gradient Border Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-700/10 to-gray-900/10 border border-gray-700/30 pointer-events-none" />

              {/* Animated Image Container */}
              <div className="relative mb-4 flex justify-center">
                <div className="relative">
                  {/* Floating image effect */}
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-28 h-28 z-10 relative transition-all duration-500 group-hover:scale-110 group-hover:rotate-[5deg]"
                  />

                  {/* Animated gradient ring */}
                  <div
                    className="absolute inset-0 rounded-full opacity-70 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `conic-gradient(${feature.lineColor}, transparent 240deg)`,
                      mask: "radial-gradient(black 50%, transparent 65%)",
                      WebkitMask: "radial-gradient(black 50%, transparent 65%)",
                    }}
                  />
                </div>
              </div>

              {/* Vertical Line with Gradient */}
              <div className="flex justify-center mb-5">
                <div
                  className="w-1 h-12"
                  style={{
                    background: `linear-gradient(to bottom, ${feature.lineColor} 0%, transparent 100%)`,
                  }}
                />
              </div>

              {/* Animated content with merged color effect */}
              <div className="text-center relative z-10">
                <h3 className="text-xl font-bold mb-3.5">
                  <span
                    className="transition-all duration-500"
                    style={{
                      background: `linear-gradient(to right, #fff, #d1d5db)`,
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    {feature.title}
                  </span>
                </h3>
                <p
                  className="text-gray-400/90 transition-colors duration-500 leading-relaxed"
                  style={{
                    color: "rgba(156, 163, 175, 0.9)",
                  }}
                >
                  {feature.description}
                </p>
              </div>

              {/* Hover gradient effect */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(400px circle at center, ${feature.lineColor}15, transparent 70%)`,
                }}
              />

              {/* Floating particles for card */}
              <div className="absolute -inset-4 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute rounded-full animate-float"
                    style={{
                      width: `${Math.random() * 6 + 2}px`,
                      height: `${Math.random() * 6 + 2}px`,
                      backgroundColor: feature.lineColor,
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${i * 0.3}s`,
                      opacity: Math.random() * 0.5 + 0.3,
                    }}
                  />
                ))}
              </div>

              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                <div
                  className="absolute -top-full -left-full w-[200%] h-[200%] opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{
                    background: `linear-gradient(45deg, transparent 40%, ${feature.lineColor}80 50%, transparent 60%)`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <SkillsSection />

      <div
        id="stats-section"
        className="bg-gray-950 py-16 px-4 sm:px-8 lg:px-20"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={stat.id}
              className={`flex flex-col items-center text-center p-6 ${
                index < stats.length - 1 ? "lg:border-r lg:border-gray-700" : ""
              }`}
            >
              <h3 className="text-gray-300 text-lg font-medium mb-3">
                {stat.label}
              </h3>
              <p className="text-teal-400 text-3xl font-bold">
                {stat.prefix || ""}
                {formatNumber(animatedValues[stat.id])}
                {stat.suffix || ""}
              </p>
            </div>
          ))}
        </div>
      </div>

      <FooterPage />
    </>
  );
}
