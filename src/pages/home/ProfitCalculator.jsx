import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import moon1 from "../../pictures/bg16.avif";
import { Link } from "react-router-dom";


export default function ProfitCalculator() {
  const [plan, setPlan] = useState("basic");
  const [amount, setAmount] = useState("");
  const [profit, setProfit] = useState("0.00");
  const [isCalculating, setIsCalculating] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  // Create refs for scroll animations
  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const calculatorRef = useRef(null);
  const planRef = useRef(null);
  const inputRef = useRef(null);
  const resultRef = useRef(null);
  const ctaRef = useRef(null);
  const videoRef = useRef(null);

  // Check if elements are in view
  const isTitleInView = useInView(titleRef, { once: true, margin: "0px 0px -100px 0px" });
  const isCalculatorInView = useInView(calculatorRef, { once: true, margin: "0px 0px -100px 0px" });
  const isPlanInView = useInView(planRef, { once: true });
  const isInputInView = useInView(inputRef, { once: true });
  const isResultInView = useInView(resultRef, { once: true });
  const isCtaInView = useInView(ctaRef, { once: true });

  const profitMultipliers = {
    basic: [4, 7],
    standard: [5, 8],
    premium: [6, 9],
    platinum: [7, 10],
    elite: [8, 12],
  };

  const planInfo = {
    basic: { name: "Basic Package", color: "from-slate-500 to-gray-900" },
    standard: {
      name: "Standard Package",
      color: "from-emerald-500 to-orange-800",
    },
    premium: { name: "Premium Package", color: "from-cyan-500 to-teal-500" },
    platinum: { name: "Platinum Package", color: "from-blue-500 to-cyan-900" },
    elite: { name: "Elite Package", color: "from-purple-500 to-cyan-800" },
  };

  useEffect(() => {
    if (!amount) {
      setProfit("0.00");
      return;
    }

    const timer = setTimeout(() => {
      const investAmount = parseFloat(amount);
      if (!isNaN(investAmount)) {
        const [minMultiplier, maxMultiplier] = profitMultipliers[plan];
        const randomMultiplier =
          Math.random() * (maxMultiplier - minMultiplier) + minMultiplier;
        setProfit((investAmount * randomMultiplier).toFixed(2));
      }
      setIsCalculating(false);
    }, 600); // brief delay for smoother UX

    setIsCalculating(true);
    return () => clearTimeout(timer);
  }, [amount, plan]);

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  const handlePlanChange = (key) => {
    setPlan(key);
    setAmount("");
    setProfit("0.00");
    setIsCalculating(false);
  };

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.8; // Slow down video slightly for better effect
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2,
      },
    },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "backOut" },
    },
  };

  const slideInLeft = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const slideInRight = {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      ref={containerRef}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative min-h-screen w-full overflow-hidden text-white"
    >
      {/* Video Background with Dark Overlay */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={handleVideoLoad}
          className="w-full h-full object-cover"
          poster={moon1} // Fallback image while video loads
          style={{ opacity: isVideoLoaded ? 1 : 0, transition: 'opacity 1s ease-in' }}
        >
          <source src="/videos/vd.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Fallback image background if video doesn't load */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${moon1})`, opacity: isVideoLoaded ? 0 : 1 }}
        />
        
        {/* Dark overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950/95 via-slate-900/90 to-black/95" />
      </div>

      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1, duration: 1 }}
          className="absolute rounded-full bg-teal-500/20 animate-float"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 10 + 2}px`,
            height: `${Math.random() * 10 + 2}px`,
            animationDuration: `${Math.random() * 10 + 10}s`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}

      <div className="relative z-10 container mx-auto px-4 py-16 lg:py-24">
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 40 }}
          animate={isTitleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 0.77, 0.47, 0.97] }}
          className="text-center mb-16"
        >
          <motion.div 
            className="inline-block relative mb-5 text-lg uppercase"
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-teal-500 font-semibold tracking-wider px-4 py-1.5 rounded-full bg-gradient-to-r from-teal-700 to-cyan-900">
              Profit Calculator
            </span>
            <div className="absolute inset-0 bg-teal-400 rounded-full blur-lg opacity-20 -z-10 animate-pulse" />
          </motion.div>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={isTitleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="max-w-2xl mx-auto text-lg md:text-xl text-gray-300 font-light"
          >
            Calculate your potential returns before investing. Our calculator
            provides accurate projections so you can invest with confidence.
          </motion.p>
        </motion.div>

        <motion.div
          ref={calculatorRef}
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={isCalculatorInView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ 
            duration: 0.8, 
            ease: [0.16, 0.77, 0.47, 0.97],
            delay: 0.3 
          }}
          className="max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl"
        >
          <div className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/90 backdrop-blur-xl p-6 sm:p-8 lg:p-10 border border-gray-700/50">
            {/* Plan Selector */}
            <motion.div
              ref={planRef}
              initial="hidden"
              animate={isPlanInView ? "visible" : "hidden"}
              variants={containerVariants}
              className="mb-10"
            >
              <motion.h2 
                variants={fadeUp}
                className="text-xl font-medium text-gray-300 mb-4"
              >
                Investment Plan
              </motion.h2>
              <motion.div 
                variants={containerVariants}
                className="grid grid-cols-2 sm:grid-cols-5 gap-2"
              >
                {Object.entries(planInfo).map(([key, { name, color }], index) => (
                  <motion.button
                    key={key}
                    variants={fadeUp}
                    custom={index}
                    onClick={() => handlePlanChange(key)}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      plan === key
                        ? `bg-gradient-to-r ${color} text-white shadow-lg`
                        : "bg-gray-800/60 text-gray-300 hover:bg-gray-700/50"
                    }`}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {name.split(" ")[0]}
                  </motion.button>
                ))}
              </motion.div>
              <motion.div 
                variants={fadeUp}
                className="mt-4 text-center"
              >
                <span
                  className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r ${planInfo[plan].color} bg-opacity-20`}
                >
                  {planInfo[plan].name}
                </span>
              </motion.div>
            </motion.div>

            {/* Input Field */}
            <motion.div
              ref={inputRef}
              initial="hidden"
              animate={isInputInView ? "visible" : "hidden"}
              variants={slideInLeft}
              className="mb-8"
            >
              <label className="block text-lg font-medium mb-3 text-gray-300">
                Investment Amount
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-xl">$</span>
                </div>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={handleAmountChange}
                  className="w-full pl-10 pr-4 py-4 bg-gray-800/70 border border-gray-700 rounded-xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                />
              </div>
            </motion.div>

            {/* Result Display */}
            <motion.div
              ref={resultRef}
              initial="hidden"
              animate={isResultInView ? "visible" : "hidden"}
              variants={slideInRight}
              className="mb-10"
            >
              <label className="block text-lg font-medium mb-3 text-gray-300">
                Estimated Return
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-xl">$</span>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={profit + isCalculating}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="w-full pl-10 pr-4 py-4 bg-gradient-to-r from-teal-900/30 to-cyan-900/20 border border-cyan-500/30 rounded-xl text-white text-xl font-medium"
                  >
                    {isCalculating ? (
                      <div className="flex items-center">
                        <span className="mr-2">Calculating</span>
                        <div className="flex space-x-1">
                          {[...Array(3)].map((_, i) => (
                            <motion.div
                              key={i}
                              animate={{ y: [0, -5, 0] }}
                              transition={{
                                repeat: Infinity,
                                duration: 0.6,
                                delay: i * 0.2,
                              }}
                              className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span>{profit}</span>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              ref={ctaRef}
              initial={{ opacity: 0, y: 30 }}
              animate={isCtaInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(6, 182, 212, 0.4)" }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 px-6 bg-gradient-to-r from-teal-600 to-cyan-700 rounded-xl text-white font-bold text-lg shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all"
              >
                <Link to="/LoginPage">
                  Start Investing Now <span className="ml-2">→</span>
                </Link>
              </motion.button>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={isCtaInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.4 }}
                className="mt-6 text-center text-gray-400 text-sm"
              >
                <p>
                  {planInfo[plan].name} offers {profitMultipliers[plan][0]}x -{" "}
                  {profitMultipliers[plan][1]}x returns
                </p>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Floating Glow Elements */}
      <motion.div
        className="absolute bottom-10 left-1/4 w-6 h-6 rounded-full bg-cyan-500/30 blur-xl"
        initial={{ opacity: 0 }}
        animate={isTitleInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.5 }}
      />
      <motion.div
        className="absolute top-1/3 right-1/4 w-8 h-8 rounded-full bg-teal-500/20 blur-xl"
        initial={{ opacity: 0 }}
        animate={isTitleInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.7 }}
      />
    </motion.div>
  );
}