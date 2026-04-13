import { useEffect, useState } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { CopyTradersProvider } from "../../../context/CopyTraderContext";
import ScrollToTop from "../../../components/ui/ScrollToTop";
import GlowingLine from "../../../components/ui/GlowingLine";
import ChatBot from "../../chatbot/ChatBot";
import Sidebar from "./SideBar";
import HeaderPage from "./Header";
import FooterDash from "./Footer";
import PropTypes from "prop-types";

const DESKTOP_SIDEBAR_STORAGE_KEY = "coinquestx.desktop-sidebar-open";

const isDesktopViewport = () =>
  typeof window !== "undefined" && window.innerWidth >= 768;

const getInitialSidebarState = () => {
  if (!isDesktopViewport()) return false;

  const storedValue = window.sessionStorage.getItem(
    DESKTOP_SIDEBAR_STORAGE_KEY
  );

  if (storedValue === null) {
    return false;
  }

  return storedValue === "true";
};

const Layout = ({ children, user }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(getInitialSidebarState);

  useEffect(() => {
    if (!isDesktopViewport()) return;

    window.sessionStorage.setItem(
      DESKTOP_SIDEBAR_STORAGE_KEY,
      String(isSidebarOpen)
    );
  }, [isSidebarOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const syncSidebarStateWithViewport = () => {
      if (!isDesktopViewport()) {
        setIsSidebarOpen(false);
        return;
      }

      const storedValue = window.sessionStorage.getItem(
        DESKTOP_SIDEBAR_STORAGE_KEY
      );

      setIsSidebarOpen(storedValue === "true");
    };

    window.addEventListener("resize", syncSidebarStateWithViewport);
    return () =>
      window.removeEventListener("resize", syncSidebarStateWithViewport);
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <CopyTradersProvider>
        <LayoutContent
          user={user}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        >
          {children}
        </LayoutContent>
      </CopyTradersProvider>
    </ThemeProvider>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  user: PropTypes.object, // adjust shape if you know the exact fields
};

const LayoutContent = ({ children, user, isSidebarOpen, setIsSidebarOpen }) => {
  const { theme } = useTheme();
  const desktopMainOffset = isSidebarOpen ? "md:ml-64" : "md:ml-16";
  const desktopHeaderOffset = isSidebarOpen ? "md:left-64" : "md:left-16";

  return (
    <div
      className={`min-h-screen overflow-x-hidden ${
        theme === "dark" ? "bg-zinc-950" : "bg-gray-50"
      }`}
    >
      <GlowingLine isActive isDarkMode={theme === "dark"} duration={76000} />
      <div className="flex">
        <ScrollToTop />
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        <div className="flex-1 min-w-0 flex flex-col">
          <div
            data-dashboard-navbar="true"
            className={`fixed top-0 left-0 right-0 h-16 z-40 transition-all duration-200 ${desktopHeaderOffset} ${
              theme === "dark"
                ? "border-slate-800/90 bg-zinc-950/86 shadow-[0_18px_48px_rgba(2,8,23,0.48)]"
                : "border-white/70 bg-white/88 shadow-[0_18px_42px_rgba(15,23,42,0.12)]"
            } border-b backdrop-blur-xl`}
          >
            <HeaderPage
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
              user={user}
            />
          </div>

          <main
            className={`flex-1 pt-16 pb-24 transition-all duration-200 ${desktopMainOffset} ${
              theme === "dark" ? "bg-zinc-950" : "bg-gray-50"
            }`}
          >
            <div className="h-full w-full min-w-0 overflow-x-hidden">
              {children}
            </div>
          </main>

          <FooterDash isSidebarOpen={isSidebarOpen} />
          <ChatBot />
        </div>
      </div>
    </div>
  );
};

LayoutContent.propTypes = {
  children: PropTypes.node.isRequired,
  user: PropTypes.object,
  isSidebarOpen: PropTypes.bool.isRequired,
  setIsSidebarOpen: PropTypes.func.isRequired,
};

export default Layout;
