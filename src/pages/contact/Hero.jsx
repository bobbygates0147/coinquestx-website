import { motion } from "framer-motion";
import HomeHeaderPage from "../../components/home/layout/HomeHeader";
import backgroundImage from "../../pictures/backgroundImage.jpg";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ContactUs from "../../components/contact/ContactIndex";
import FooterPage from "../../components/home/layout/Footer";
import { faMessage, faPaperPlane } from "@fortawesome/free-regular-svg-icons";
import {
  faSquarePhone,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";

export default function ContactPage() {
  const contactMethods = [
    {
      icon: faLocationDot,
      iconColor: "bg-orange-500",
      title: "Address Info",
      description:
        "C/O Vistra (BVI) Limited, Vistra Corporate Services Centre, Wickhams Cay II, Road Town, Tortola, VG1110",
    },
    {
      icon: faMessage,
      iconColor: "bg-blue-500",
      title: "Email Address",
      description: "support@coinquestx.com",
    },
    {
      icon: faSquarePhone,
      iconColor: "bg-teal-500",
      title: "Phone Number",
      description: "+44 7529 419490",
    },
  ];

  return (
    <>
      <HomeHeaderPage />

      {/* Enhanced Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background with Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover"
            src={backgroundImage}
            alt="Modern crypto platform background"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 to-slate-950/80"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.1)_0%,rgba(0,0,0,0)_70%)]"></div>
        </div>

        {/* Hero Content */}
        <motion.div
          className="z-10 px-4 text-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.h1
            className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-300 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Let's Connect
          </motion.h1>

          <motion.div
            className="flex justify-center items-center text-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <Link to="/" className="hover:text-teal-400 transition-colors">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-teal-400 font-medium">Contact Us</span>
          </motion.div>
        </motion.div>
      </section>

      {/* Enhanced Contact Info Cards */}
      <section className="bg-gradient-to-b from-slate-950 to-slate-900 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block bg-teal-900/30 text-teal-400 text-sm font-medium px-4 py-2 rounded-full mb-4">
              Get In Touch
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              We're Here to Help
            </h2>
            <p className="max-w-2xl mx-auto text-gray-400">
              Have questions about our crypto services? Reach out to our team
              through any of these channels.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {contactMethods.map((method, index) => (
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

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start gap-4 mb-6">
                    <div
                      className={`${method.iconColor} p-3 rounded-xl text-white flex-shrink-0`}
                    >
                      <FontAwesomeIcon icon={method.icon} className="text-xl" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white mb-2">
                        {method.title}
                      </h2>
                      <p className="text-gray-300">{method.description}</p>
                    </div>
                  </div>

                  <div className="mt-auto pt-6">
                    <a
                      href="#"
                      className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors group"
                    >
                      <span className="font-medium">More details</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <ContactUs />
      <FooterPage />
    </>
  );
}
