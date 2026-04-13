import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faX,
  faHouse,
  faCircleInfo,
  faCogs,
  faEnvelope,
  faUserPlus,
  faSignInAlt,
} from "@fortawesome/free-solid-svg-icons";
import coinquestxLogoLight from "../../../pictures/coinquestxlogolight.png";
import LanguageSelectControl from "../../ui/LanguageSelectControl";

export default function HomeHeaderPage() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);
  const hamburgerRef = useRef(null);

  // Navigation links with icons
  const navLinks = [
    { path: "/", label: "HOME", icon: faHouse },
    { path: "/about", label: "ABOUT", icon: faCircleInfo },
    { path: "/services", label: "SERVICES", icon: faCogs },
    { path: "/contact", label: "CONTACT", icon: faEnvelope },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(event.target)
      ) {
        setIsSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSidebarOpen]);

  useEffect(() => {
    const canvas = document.querySelector("canvas");
    if (canvas) canvas.style.pointerEvents = "none";
  }, []);

  return (
    <>
      {/* Main Navigation Bar */}
      <nav className="relative top-0 left-0 w-full z-50 bg-slate-950/95 backdrop-blur-sm p-3 flex justify-between items-center text-white border-b border-teal-900/50">
        {/* Mobile Hamburger */}
        <div className="flex items-center gap-2 lg:hidden" ref={hamburgerRef}>
          <FontAwesomeIcon
            className="h-6 cursor-pointer text-gray-300 hover:text-white transition-colors"
            icon={faBars}
            onClick={(e) => {
              e.stopPropagation();
              setIsSidebarOpen(!isSidebarOpen);
            }}
            aria-label="Toggle Sidebar"
          />
        </div>

        {/* Logo */}
        <div className="flex items-center lg:ml-4">
          <img
            src={coinquestxLogoLight}
            alt="CoinQuestX logo"
            className="h-10 w-auto object-contain transition-transform hover:scale-105 md:h-12"
          />
        </div>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8 ml-10">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`relative flex items-center gap-2 py-2 px-1 transition-all duration-300 hover:text-teal-400 ${
                location.pathname === link.path
                  ? "text-teal-400 font-medium"
                  : "text-gray-300"
              }`}
            >
              <FontAwesomeIcon icon={link.icon} className="h-4" />
              {link.label}
              {location.pathname === link.path && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-teal-500 rounded-full"></span>
              )}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <LanguageSelectControl variant="home" />
        </div>

        {/* Desktop Sign In Button */}
        <div className="hidden lg:flex items-center gap-3 mr-4">
          <LanguageSelectControl variant="home" />
          <Link to="/LoginPage">
            <button
              className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-6 py-2.5 rounded-full font-medium hover:from-teal-500 hover:to-emerald-500 transition-all duration-300 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              <FontAwesomeIcon icon={faSignInAlt} />
              Sign In
            </button>
          </Link>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <div
          ref={sidebarRef}
          className="fixed inset-0 z-[60] opacity-100 visible transition-all duration-500 ease-in-out"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsSidebarOpen(false);
            }}
          />

          {/* Sidebar Panel */}
          <div className="absolute top-0 right-0 h-full w-4/5 max-w-sm bg-gray-900 shadow-2xl transition-transform duration-500 ease-in-out translate-x-0">
            <div className="bg-slate-900 p-4 h-full flex flex-col">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between mb-8">
                <img
                  src={coinquestxLogoLight}
                  alt="CoinQuestX logo"
                  className="h-12 w-auto object-contain"
                />
                <FontAwesomeIcon
                  className="h-6 cursor-pointer text-gray-400 hover:text-white transition-colors"
                  icon={faX}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSidebarOpen(false);
                  }}
                  aria-label="Close Sidebar"
                />
              </div>

              {/* Sidebar Nav */}
              <nav className="flex-1 overflow-y-auto">
                <div className="space-y-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center gap-3 p-4 text-lg rounded-md transition-all ${
                        location.pathname === link.path
                          ? "bg-slate-800 text-teal-400 font-medium"
                          : "text-gray-300 hover:bg-slate-800"
                      }`}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <FontAwesomeIcon icon={link.icon} />
                      {link.label}
                    </Link>
                  ))}
                </div>

                {/* Mobile Auth Buttons */}
                <div className="mt-8 space-y-4 px-4">
                  <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200">
                    <span>GLOBAL LANGUAGE</span>
                    <LanguageSelectControl variant="home" />
                  </div>

                  <Link
                    to="/SignUpPage"
                    className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:from-teal-500 hover:to-emerald-500 transition-all duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <FontAwesomeIcon icon={faUserPlus} />
                    REGISTER
                  </Link>

                  <Link
                    to="/LoginPage"
                    className="flex items-center justify-center gap-2 w-full bg-gray-800 border border-gray-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <FontAwesomeIcon icon={faSignInAlt} />
                    SIGN IN
                  </Link>
                </div>
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
