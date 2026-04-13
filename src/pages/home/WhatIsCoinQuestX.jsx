import px5 from "../../pictures/px5.png";
import { faBitcoin } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { motion } from "framer-motion";

export default function WhatIsCoinQuestXPage() {
  return (
    <div className="bg-slate-900 flex flex-col md:flex-row items-center justify-center p-8 gap-12 z-50 relative">
      {/* Image Section */}
      <motion.div
        className="flex justify-center md:justify-start w-full md:w-auto"
        initial={{ opacity: 0, x: -100 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        <img
          src={px5}
          alt="CoinQuestX platform"
          className="max-w-full md:max-w-lg rounded-lg rotate-slowly"
        />
      </motion.div>

      {/* Text Content Section */}
      <motion.div
        className="max-w-2xl text-center md:text-left"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        viewport={{ once: true }}
      >
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-800">
          What Is CoinQuestX?
        </h2>

        <h4 className="text-white text-2xl font-bold mb-6">
          Leading Cryptocurrency Investment Platform
        </h4>

        <p className="text-gray-400 mb-4">
          CoinQuestX is a leading cryptocurrency investment platform that allows
          anyone to participate in the exciting world of digital assets. Our
          platform is designed to simplify the process of investing in
          cryptocurrency and earning a return on your investment.
        </p>
        <p className="text-gray-400 mb-4">
          With low fees and reliable mining operations, CoinQuestX ensures your
          investments are secure and profitable. We use state-of-the-art
          facilities and equipment to maximize efficiency, and our team of
          experienced professionals is dedicated to delivering the best returns.
        </p>
        <p className="text-gray-400 mb-6">
          Transparency is at the core of what we do. With CoinQuestX, you'll always
          know exactly how your investments are performing, thanks to our clear
          and detailed reporting.
        </p>
        <p className="text-gray-400 mb-6">
          CoinQuestX Ltd is a registered company in the British Virgin Islands (BVI
          Company Number 2086929). Our registered office is located at C/O
          Vistra (BVI) Limited, Vistra Corporate Services Centre, Wickhams Cay
          II, Road Town, Tortola, VG1110.
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gray-600 bg-opacity-40 border-opacity-70 border border-teal-300 text-white px-6 py-3 rounded-full flex items-center justify-center gap-2 mx-auto md:mx-0 hover:bg-teal-300 hover:text-slate-900 hover:shadow-teal-300 hover:shadow-lg transition duration-300"
        >
          <FontAwesomeIcon icon={faBitcoin} />
          Read More
        </motion.button>
      </motion.div>
    </div>
  );
}
