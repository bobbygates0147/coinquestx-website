import { motion } from "framer-motion";
import px6 from "../../pictures/ft1.png";
import px7 from "../../pictures/ft2.webp";
import px8 from "../../pictures/ft3.png";
import px9 from "../../pictures/ft4.svg";
import px10 from "../../pictures/ft5.png";
import px11 from "../../pictures/ft6.webp";


const features = [
  {
    image: px6,
    title: "Early Bonus Cash",
    description:
      "Get a head start on growing your wealth with CoinQuestX's early cash bonus offer - a limited-time opportunity to earn extra returns on your investment.",
    lineColor: "#FFA726",
  },
  {
    image: px7,
    title: "Secure Transactions",
    description:
      "Enjoy peace of mind with CoinQuestX's state-of-the-art security measures, ensuring your transactions and investments are always protected.",
    lineColor: "#26C6DA",
  },
  {
    image: px8,
    title: "Transparent Reporting",
    description:
      "Stay informed with CoinQuestX's transparent reporting system, providing real-time updates on your investment performance.",
    lineColor: "#29B6F6",
  },
  {
    image: px9,
    title: "Low Fees",
    description:
      "CoinQuestX offers some of the lowest fees in the industry, ensuring you keep more of your profits.",
    lineColor: "#AB47BC",
  },
  {
    image: px10,
    title: "24/7 Support",
    description:
      "Our dedicated support team is available around the clock to assist you with any questions or issues.",
    lineColor: "#5C6BC0",
  },
  {
    image: px11,
    title: "Global Access",
    description:
      "Access your investments from anywhere in the world with CoinQuestX's globally available platform.",
    lineColor: "#EF5350",
  },
];

const ParticleBackground = () => (
  <div className="absolute inset-0 overflow-hidden -z-10">
    {[...Array(100)].map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full animate-particle-float"
        style={{
          width: `${Math.random() * 4 + 1}px`,
          height: `${Math.random() * 4 + 1}px`,
          backgroundColor: `rgba(${Math.random() > 0.5 ? 38 : 198}, ${
            Math.random() > 0.5 ? 198 : 234
          }, 255, ${Math.random() * 0.2})`,
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 20}s`,
          animationDuration: `${Math.random() * 30 + 20}s`,
        }}
      />
    ))}
  </div>
);

export default function FeaturesSection() {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 relative py-24 px-4 sm:px-8 overflow-hidden">
      <ParticleBackground />
      <div className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-teal-500/5 rounded-full blur-[100px] -z-10" />
      <div className="absolute -bottom-1/4 -left-1/4 w-[700px] h-[700px] bg-indigo-500/5 rounded-full blur-[100px] -z-10" />

      <div className="text-center mb-16 max-w-4xl mx-auto relative">
        <div className="inline-block relative mb-5">
          <span className="text-teal-300 text-sm font-semibold tracking-wider uppercase bg-teal-400/10 px-4 py-1.5 rounded-full backdrop-blur-md border border-teal-500/20">
            CoinQuestX Features
          </span>
          <div className="absolute inset-0 bg-teal-400 rounded-full blur-lg opacity-20 -z-10 animate-pulse" />
        </div>

        <h2 className="text-white text-4xl md:text-5xl font-bold mb-5 bg-clip-text text-transparent bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-500 animate-text-shimmer">
          Crypto Best Features
        </h2>

        <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
          Investing in cryptocurrency is a smart choice for those who want to
          capitalize on the growth of this rapidly-evolving field.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2, duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
            className="group relative bg-gradient-to-b from-gray-800/30 to-gray-900/10 backdrop-blur-lg border border-gray-700/30 rounded-2xl p-6 transition-all duration-500 hover:border-teal-400/50 hover:-translate-y-2"
            style={{
              boxShadow: "0 10px 30px -15px rgba(0,0,0,0.5)",
              backgroundImage:
                "radial-gradient(at top right, rgba(31,41,55,0.4) 0%, rgba(15,23,42,0.1) 60%)",
            }}
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gray-700/10 to-gray-900/10 border border-gray-700/30 pointer-events-none" />

            <div className="relative mb-4 flex justify-center">
              <div className="relative">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-28 h-28 z-10 relative transition-all duration-500 group-hover:scale-110 group-hover:rotate-[5deg] rounded-full"
                />
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

            <div className="flex justify-center mb-5">
              <div
                className="w-1 h-12"
                style={{
                  background: `linear-gradient(to bottom, ${feature.lineColor} 0%, transparent 100%)`,
                }}
              />
            </div>

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
              <p className="text-gray-400/90 transition-colors duration-500 leading-relaxed">
                {feature.description}
              </p>
            </div>

            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: `radial-gradient(400px circle at center, ${feature.lineColor}15, transparent 70%)`,
              }}
            />

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

            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              <div
                className="absolute -top-full -left-full w-[200%] h-[200%] opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{
                  background: `linear-gradient(45deg, transparent 40%, ${feature.lineColor}80 50%, transparent 60%)`,
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
