import { motion } from "framer-motion";
import HomeHeaderPage from "../../components/home/layout/HomeHeader";
import backgroundImage from "../../pictures/backgroundImage.jpg";
import px6 from "../../pictures/ft1.png";
import px7 from "../../pictures/ft2.webp";
import px8 from "../../pictures/ft3.png";

import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine,
  faCheck,
  faHeadset,
  faShieldAlt,
  faTachometerAlt,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import { faMessage } from "@fortawesome/free-regular-svg-icons";
import FooterPage from "../../components/home/layout/Footer";
import PricingSection from "../home/PricingPlan";

const features = [
  {
    image: px6,
    title: "Investment Plans",
    description:
      "Choose from our tiered investment portfolios designed for all experience levels, from beginner to advanced traders. Our automated tools help optimize your returns while maintaining risk parameters tailored to your financial goals.",
    icon: faChartLine,
    color: "text-orange-400",
  },
  {
    image: px7,
    title: "User Dashboard",
    description:
      "Our comprehensive dashboard provides real-time analytics, portfolio tracking, and market insights in one intuitive interface. Monitor performance, track trends, and execute trades seamlessly across all your devices.",
    icon: faTachometerAlt,
    color: "text-teal-400",
  },
  {
    image: px8,
    title: "Security First",
    description:
      "We employ military-grade encryption, multi-signature wallets, and cold storage solutions to safeguard your assets. Regular third-party audits ensure our security protocols meet institutional-grade standards.",
    icon: faShieldAlt,
    color: "text-blue-400",
  },
  {
    image: px8,
    title: "Expert Support",
    description:
      "Access our team of certified crypto specialists 24/7 for personalized investment guidance. From market analysis to technical support, we provide white-glove service at every step of your investment journey.",
    icon: faHeadset,
    color: "text-purple-400",
  },
];

export default function ServicePage() {
  return (
    <>
      <HomeHeaderPage />

      {/* Hero Section - Modernized */}
      <div className="relative h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-slate-950/95 z-0"></div>
        <img
          src={backgroundImage}
          alt="Modern finance background"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 to-slate-950/80"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.1)_0%,rgba(0,0,0,0)_70%)]"></div>

        <motion.div
          className="container mx-auto px-6 z-10 text-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.h1
            className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-300 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Services
          </motion.h1>
          <motion.div
            className="flex justify-center items-center text-sm md:text-base text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <Link to="/" className="hover:text-teal-400 transition-colors">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-teal-400">Services</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Features Section - Enhanced */}
      <div className="bg-gradient-to-b from-slate-950 to-slate-900 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="inline-block bg-teal-900/30 text-teal-400 text-sm font-medium px-4 py-2 rounded-full mb-6">
              Enterprise Solutions
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Institutional-Grade{" "}
              <span className="text-teal-400">Crypto Platform</span>
            </h2>
            <p className="max-w-3xl mx-auto text-gray-400 text-lg">
              Harness the full potential of digital assets with our platform
              designed for both retail and professional investors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-gradient-to-b from-slate-900/50 to-slate-900 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm hover:border-teal-500/30 transition-all duration-300 overflow-hidden relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-r from-teal-500/10 to-purple-500/10 rounded-full blur-xl z-0"></div>

                <div className="relative z-10">
                  <div
                    className={`mb-6 p-4 rounded-2xl bg-slate-800/30 w-fit ${feature.color.replace(
                      "text",
                      "bg"
                    )} bg-opacity-10`}
                  >
                    <FontAwesomeIcon
                      icon={feature.icon}
                      className={`text-2xl ${feature.color}`}
                    />
                  </div>

                  <h3 className={`text-xl font-bold mb-4 ${feature.color}`}>
                    {feature.title}
                  </h3>

                  <p className="text-gray-400 mb-6 leading-relaxed">
                    {feature.description}
                  </p>

                  <a
                    href="#"
                    className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors group"
                  >
                    <span className="font-medium">Learn more</span>
                    <FontAwesomeIcon
                      icon={faArrowRight}
                      className="text-xs transition-transform group-hover:translate-x-1"
                    />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section - Modernized */}
      <div className="relative bg-gradient-to-r from-slate-950 to-slate-900 overflow-hidden py-24">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('../../pictures/backgroundImage.jpg')] bg-cover opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 to-slate-900/70"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.05)_0%,rgba(0,0,0,0)_70%)]"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto bg-slate-900/30 backdrop-blur-md border border-slate-800 rounded-3xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-10">
              <div className="flex-1">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Need Crypto Expertise?
                </h2>
                <p className="text-gray-400 text-lg leading-relaxed">
                  At CoinQuestX, we're committed to delivering premium
                  cryptocurrency services. Join our community of investors and
                  build your crypto portfolio with confidence.
                </p>
              </div>

              <motion.button
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white px-8 py-4 rounded-xl font-medium flex items-center gap-3 transition-all duration-300 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 whitespace-nowrap"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FontAwesomeIcon icon={faMessage} className="h-4 w-4" />
                Contact Our Experts
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <PricingSection />
      <FooterPage />
    </>
  );
}
