import { useRef } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import DashboardSidebar from "../../../constants/DashboardSidebar";
import { useTheme } from "next-themes";
import PropTypes from "prop-types";
import coinquestxLogoDark from "../../../pictures/coinquestxlogodark.png";
import coinquestxLogoLight from "../../../pictures/coinquestxlogolight.png";
import coinquestxMark from "../../../pictures/coinquestxlogo small.png";

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen }) {
  const { theme } = useTheme();
  const sidebarRef = useRef(null);
  const showFullSidebar = isSidebarOpen;
  const isDark = theme === "dark";

  const sidebarBg = isDark ? "bg-zinc-950" : "bg-white/95";
  const headerBg = isDark
    ? "bg-slate-900/80"
    : "bg-gradient-to-b from-white to-slate-50/95";
  const hoverBg =
    isDark
      ? "hover:bg-slate-800 hover:text-teal-200"
      : "hover:bg-slate-100 hover:text-teal-700";
  const borderColor = isDark
    ? "border-slate-800/90"
    : "border-slate-200/90";
  const shellShadow = isDark
    ? "shadow-[0_20px_60px_rgba(2,8,23,0.28)]"
    : "shadow-[0_20px_50px_rgba(15,23,42,0.08)]";
  const activeLogo = isDark ? coinquestxLogoLight : coinquestxLogoDark;

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div
        ref={sidebarRef}
        className={`fixed left-0 bottom-0 top-0 z-50 transition-all duration-200 ease-in-out md:z-40 ${
          showFullSidebar ? "w-64" : "w-16"
        } ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } overflow-x-hidden`}
      >
        {/* Inner Wrapper with Spacing */}
        <div className={`h-full ${showFullSidebar ? "md:p-1.5" : "md:p-1"}`}>
          {/* Main Sidebar Content */}
          <div
            data-dashboard-sidebar="true"
            className={`flex h-full flex-col overflow-hidden rounded-r-[1.6rem] border backdrop-blur-xl md:rounded-[1.6rem] ${sidebarBg} ${borderColor} ${shellShadow}`}
          >
            {/* Header Section */}
            <div
              className={`flex h-16 items-center border-b px-3 ${
                showFullSidebar
                  ? `justify-between md:justify-start ${headerBg}`
                  : "justify-center"
              } ${isDark ? "border-slate-800/90" : "border-slate-200/80"}`}
            >
              {showFullSidebar ? (
                <div className="flex items-center">
                  <img
                    src={activeLogo}
                    alt="CoinQuestX logo"
                    className="h-9 w-auto object-contain md:h-10"
                  />
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 text-slate-950 shadow-[0_0_24px_rgba(45,212,191,0.38)] transition-transform hover:scale-105 md:hidden ${hoverBg}`}
                    aria-label="Expand sidebar"
                  >
                    <PanelLeftOpen className="h-5 w-5" strokeWidth={2.4} />
                  </button>
                  <div className="hidden md:flex items-center justify-center" aria-hidden="true">
                    <img
                      src={coinquestxMark}
                      alt=""
                      className="h-9 w-9 object-contain"
                    />
                  </div>
                </>
              )}
              {showFullSidebar && (
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className={`mr-1 rounded-2xl border p-2.5 transition-all ${
                    isDark
                      ? "border-slate-800 bg-slate-900/70 text-slate-300"
                      : "border-slate-200 bg-white text-slate-600 shadow-sm"
                  } ${hoverBg} md:hidden`}
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose className="h-4 w-4" strokeWidth={2.3} />
                </button>
              )}
            </div>

            {/* Content Section */}
            <div
              className={`flex-1 ${
                showFullSidebar ? "overflow-y-auto" : "overflow-hidden"
              } overflow-x-hidden ${showFullSidebar ? "px-2 py-3" : "px-1 py-3"}`}
            >
              <div className="overflow-x-hidden">
                <DashboardSidebar isCollapsed={!showFullSidebar} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

Sidebar.propTypes = {
  isSidebarOpen: PropTypes.bool.isRequired,
  setIsSidebarOpen: PropTypes.func.isRequired,
};
