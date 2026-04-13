import { motion } from "framer-motion";
import px1 from "../../pictures/px1.png";
import px2 from "../../pictures/px2.png";
import px3 from "../../pictures/px3.png";
import px4 from "../../pictures/px4.png";
import backgroundImage from "../../pictures/backgroundImage.jpg";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faEye,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { faBitcoin } from "@fortawesome/free-brands-svg-icons";

// Import profile images - you'll need to add these to your pictures folder
import profile1 from "../../pictures/tr2.jpg";
import profile2 from "../../pictures/tr14.avif";
import profile3 from "../../pictures/tr27.jpg";

export default function HeroPage() {
  // Modern animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.4,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const floatingVariants = {
    float1: {
      y: [0, -20, 0],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
    float2: {
      y: [0, -25, 0],
      transition: {
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
    float3: {
      y: [0, -15, 0],
      transition: {
        duration: 7,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const gridVariants = {
    pulse: {
      opacity: [0.10, 0.15, 0.05],
      transition: {
        duration: 4,
        repeat: Infinity,
        repeatType: "loop",
        ease: "easeInOut",
      },
    },
  };

  // Array of profile images
  const profileImages = [profile1, profile2, profile3];

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Modern gradient background */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background: `linear-gradient(135deg, rgba(10,15,35,0.95) 0%, rgba(5,12,28,0.98) 100%), url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundBlendMode: "soft-light",
        }}
      />

      {/* Subtle animated grid overlay */}
      <motion.div
        className="absolute inset-0 z-20"
        variants={gridVariants}
        animate="pulse"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCI+CiAgPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSJub25lIi8+CiAgPHBhdGggZD0iTTAgMEw1MCA1ME01MCAwTDAgNTAiIHN0cm9rZT0iIzEwZjBmMCIgc3Ryb2tlLXdpZHRoPSIwLjUiLz4KPC9zdmc+')]"></div>
      </motion.div>

      {/* Foreground Content */}
      <motion.div
        className="flex flex-col relative z-50 md:flex-row items-center gap-8 md:gap-16 justify-between px-6 py-16 md:px-16 min-h-screen"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Left Content */}
        <motion.div
          className="text-center md:text-left md:w-1/2 relative"
          variants={itemVariants}
        >
          {/* Modern accent element */}
          <div className="absolute -left-2 md:-left-4 top-0 h-full w-1 bg-gradient-to-b from-teal-400 via-purple-900 to-cyan-900 rounded-full"></div>

          <motion.div
            className="flex items-center justify-center md:justify-start mb-6"
            variants={itemVariants}
          >
            <div className="relative">
              <div className="absolute -inset-1 bg-teal-500 rounded-full blur opacity-30"></div>
              <button className="relative bg-gray-800 bg-opacity-60 backdrop-blur-sm border border-teal-400/30 text-teal-300 px-5 py-2.5 rounded-full flex items-center gap-2 group transition-all hover:border-teal-400/60">
                <FontAwesomeIcon
                  className="h-4 text-teal-400 group-hover:text-cyan-300 transition-colors"
                  icon={faEye}
                />
                <span>AI Auto Trading Assistant</span>
              </button>
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl text-white font-bold mb-6 leading-tight"
            variants={itemVariants}
          >
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-teal-500 bg-clip-text text-transparent">
              Next Generation
            </span>{" "}
            Invest in the future of cryptocurrency with CoinQuestX
          </motion.h1>

          <motion.h4
            className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl leading-relaxed"
            variants={itemVariants}
          >
            Our cutting-edge technology and expert team make it easy for anyone
            to get involved in the world of digital assets. Join us today and
            start growing your wealth.
          </motion.h4>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 mb-10"
            variants={itemVariants}
          >
            <Link to="/Dashboard">
              <button className="relative group bg-gradient-to-r from-cyan-500 to-teal-600 text-gray-900 font-bold px-8 py-4 rounded-xl flex items-center gap-3 transition-all hover:shadow-lg hover:shadow-cyan-500/30">
                <FontAwesomeIcon
                  className="h-5 transition-transform group-hover:scale-110"
                  icon={faBitcoin}
                />
                <span>Start Trading</span>
                <FontAwesomeIcon
                  className="h-4 ml-1 transition-transform group-hover:translate-x-1"
                  icon={faArrowRight}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
              </button>
            </Link>

            <Link to="/about">
              {" "}
              <button className="px-8 py-4 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800/30 hover:text-white transition-colors">
                Learn More
              </button>
            </Link>
          </motion.div>

          <motion.div
            className="flex items-center justify-center md:justify-start gap-3 text-gray-400"
            variants={itemVariants}
          >
            <div className="flex items-center gap-2 bg-gray-800/40 backdrop-blur-sm px-4 py-2.5 rounded-lg border border-gray-700">
              <FontAwesomeIcon
                className="text-white bg-teal-500 rounded-full p-1 w-4 h-4"
                icon={faCheck}
              />
              <span className="text-sm md:text-base">Android & iOS Apps</span>
            </div>

            <div className="h-1 w-1 bg-gray-600 rounded-full"></div>

            <div className="flex items-center">
              <div className="flex -space-x-2">
                {profileImages.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Trader ${index + 1}`}
                    className="h-8 w-8 rounded-full border-2 border-gray-800 object-cover"
                  />
                ))}
              </div>
              <span className="ml-3 text-sm">1M+ Active Traders</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Images - Kept exactly as original */}
        <motion.div
          className="relative md:w-1/2 flex justify-center mt-12 md:mt-0"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 1.5,
            ease: "easeOut",
            delay: 0.5,
          }}
        >
          <img src={px2} alt="" className="max-w-md" />
          <motion.img
            src={px1}
            alt=""
            className="absolute -left-10 md:-left-16 top-10 md:top-20 w-48 md:w-72 h-auto"
            variants={floatingVariants}
            animate="float1"
          />
          <motion.img
            src={px3}
            alt=""
            className="absolute -right-5 md:-right-7 top-20 md:top-32 w-48 md:w-72 h-auto"
            variants={floatingVariants}
            animate="float2"
          />
          <motion.img
            src={px4}
            alt=""
            className="absolute -left-20 md:-left-32 -bottom-5 w-48 md:w-72 h-auto"
            variants={floatingVariants}
            animate="float3"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
