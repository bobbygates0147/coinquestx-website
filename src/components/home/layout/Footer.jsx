import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import {
  faFacebook,
  faInstagram,
  faPinterest,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";
import px12 from "../../../pictures/px12.png";
import coinquestxLogoLight from "../../../pictures/coinquestxlogolight.png";

const PLATFORM_LINKS = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Services", to: "/services" },
  { label: "Contact", to: "/contact" },
  { label: "Sign In", to: "/LoginPage" },
];

const TRUST_LINKS = [
  { label: "Fees & Charges", to: "/fees" },
  { label: "Risk Disclosure", to: "/risk-disclosure" },
  { label: "Terms of Service", to: "/terms" },
  { label: "Privacy Policy", to: "/privacy" },
  { label: "AML / KYC Policy", to: "/aml-kyc-policy" },
  { label: "Proof of Process", to: "/proof-of-process" },
];

export default function FooterPage() {
  return (
    <footer className="relative z-40 bg-gradient-to-br from-gray-900 to-gray-950 pb-8 pt-16 text-white">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-16 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-6">
            <div className="flex items-center">
              <img
                src={coinquestxLogoLight}
                alt="CoinQuestX logo"
                className="h-12 w-auto object-contain sm:h-14"
              />
            </div>
            <p className="leading-relaxed text-gray-300">
              Expert insights, stronger account controls, and transparent policy pages
              designed to make CoinQuestX feel safer and easier to trust.
            </p>

            <div className="flex gap-4">
              {[faFacebook, faTwitter, faInstagram, faPinterest].map((icon, index) => (
                <button
                  key={index}
                  className="group flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 transition-all duration-300 hover:scale-110 hover:bg-teal-500"
                  type="button"
                >
                  <FontAwesomeIcon
                    icon={icon}
                    className="text-lg text-gray-300 group-hover:text-white"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="relative pb-2 text-xl font-bold tracking-wide after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-12 after:bg-teal-500">
              Platform
            </h2>
            <ul className="space-y-4">
              {PLATFORM_LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="group flex items-center text-gray-300 transition-colors duration-300 hover:text-teal-400"
                  >
                    <span className="mr-3 h-1.5 w-1.5 rounded-full bg-gray-600 transition-colors group-hover:bg-teal-400" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h2 className="relative pb-2 text-xl font-bold tracking-wide after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-12 after:bg-teal-500">
              Trust Center
            </h2>
            <ul className="space-y-4">
              {TRUST_LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="group flex items-center text-gray-300 transition-colors duration-300 hover:text-teal-400"
                  >
                    <span className="mr-3 h-1.5 w-1.5 rounded-full bg-gray-600 transition-colors group-hover:bg-teal-400" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <h2 className="relative pb-2 text-xl font-bold tracking-wide after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-12 after:bg-teal-500">
              Newsletter
            </h2>
            <p className="text-gray-300">
              Get platform updates, feature releases, and trust-policy changes delivered
              to your inbox.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-grow">
                <input
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-500 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500"
                  type="email"
                  placeholder="Enter Your Email"
                />
              </div>
              <button className="flex items-center justify-center whitespace-nowrap rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-3 font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:from-teal-600 hover:to-cyan-700">
                <span className="mr-2">Subscribe</span>
                <FontAwesomeIcon icon={faPaperPlane} />
              </button>
            </div>
          </div>
        </div>

        <div className="my-8 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

        <div className="flex flex-col items-center justify-between gap-6 text-sm text-gray-400 md:flex-row">
          <p>&copy; 2025 CoinQuestX Ltd. All Rights Reserved</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="transition-colors hover:text-teal-400">
              Privacy Policy
            </Link>
            <Link to="/terms" className="transition-colors hover:text-teal-400">
              Terms & Conditions
            </Link>
          </div>
          <div className="flex items-center">
            <span className="mr-2 text-gray-500">Secured by</span>
            <div className="rounded-lg bg-gray-800 p-2">
              <img src={px12} alt="Security badge" className="h-6" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
