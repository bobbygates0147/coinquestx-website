import { useEffect, useMemo, useState } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import {
  BellRing,
  ChevronLeft,
  CreditCard,
  Gauge,
  Layers3,
  Menu,
  MessageSquare,
  Moon,
  Radar,
  Settings,
  Shield,
  Sun,
  Users,
} from "lucide-react";
import UserTable from "./UserTable";
import FinanceSection from "./FinanceSection";
import SecuritySection from "./SecuritySection";
import SystemTools from "./SystemTools";
import OptionalFeatures from "./OptionalFeatures";
import MessageCenter from "./MessageCenter";
import ActivitySection from "./ActivitySection";
import AdminNotificationBar from "./AdminNotificationBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { useTransactions } from "../../context/TransactionContext";

const SIDEBAR_STORAGE_KEY = "admin_sidebar_collapsed";

function AdminDashboardContent() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";
  const [activeTab, setActiveTab] = useState("users");
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return stored === "1";
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [messageBadgeCount, setMessageBadgeCount] = useState(0);
  const [now, setNow] = useState(Date.now());
  const { pendingRequests = [] } = useTransactions();

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (isDesktop) {
      setIsMobileSidebarOpen(false);
    }
  }, [isDesktop]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, isSidebarCollapsed ? "1" : "0");
  }, [isSidebarCollapsed]);

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  const pendingCount = pendingRequests.length;
  const openAdminTab = (tab) => {
    setActiveTab(tab);
    setIsMobileSidebarOpen(false);
  };

  const navItems = useMemo(
    () => [
      { value: "users", icon: Users, label: "Users" },
      { value: "finance", icon: CreditCard, label: "Finance", badge: pendingCount },
      { value: "activity", icon: Radar, label: "Activity" },
      { value: "security", icon: Shield, label: "Security" },
      { value: "system", icon: Settings, label: "System Tools" },
      { value: "messages", icon: MessageSquare, label: "Messages", badge: messageBadgeCount },
      { value: "optional", icon: Layers3, label: "Extra Features" },
    ],
    [messageBadgeCount, pendingCount]
  );

  const sidebarClass = isSidebarCollapsed ? "w-[88px]" : "w-72";
  const desktopMainOffsetClass = isSidebarCollapsed ? "lg:ml-[88px]" : "lg:ml-72";

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200/20 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-teal-500/20 p-2 text-teal-400">
              <Gauge className="h-5 w-5" />
            </div>
            {!isSidebarCollapsed && (
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">KOIN-FU</p>
                <h1 className="text-lg font-semibold">Admin Control</h1>
              </div>
            )}
          </div>
          {isDesktop && (
            <button
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className={`rounded-lg p-1.5 ${
                isDark ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"
              }`}
              aria-label="Toggle sidebar"
            >
              <ChevronLeft
                className={`h-4 w-4 transition-transform ${isSidebarCollapsed ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </div>
        {!isSidebarCollapsed && (
          <p className="mt-3 text-xs text-slate-500">
            Live operations center synced with user activity streams.
          </p>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.value}>
              <button
                onClick={() => {
                  setActiveTab(item.value);
                  setIsMobileSidebarOpen(false);
                }}
                className={`flex w-full items-center ${
                  isSidebarCollapsed ? "justify-center px-2" : "justify-between px-3"
                } rounded-xl py-2 text-sm transition ${
                  activeTab === item.value
                    ? isDark
                      ? "bg-slate-800 text-teal-300"
                      : "bg-teal-50 text-teal-700"
                    : isDark
                    ? "text-slate-300 hover:bg-slate-800"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
                title={item.label}
              >
                <span className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  {!isSidebarCollapsed && item.label}
                </span>
                {!isSidebarCollapsed && item.badge > 0 && (
                  <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );

  return (
    <div
      className={`min-h-screen w-full ${
        isDark ? "bg-zinc-950 text-slate-100" : "bg-gray-50 text-slate-900"
      }`}
    >
      <div className="flex min-h-screen">
        {isDesktop && (
          <aside
            className={`fixed inset-y-0 left-0 z-30 border-r transition-all duration-300 ${
              isDark ? "border-slate-800 bg-slate-900/90" : "border-slate-200 bg-white"
            } ${sidebarClass}`}
          >
            {sidebarContent}
          </aside>
        )}

        {!isDesktop && isMobileSidebarOpen && (
          <div className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden" onClick={() => setIsMobileSidebarOpen(false)}>
            <aside
              className={`h-full w-72 border-r ${
                isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
              }`}
              onClick={(event) => event.stopPropagation()}
            >
              {sidebarContent}
            </aside>
          </div>
        )}

        <main
          className={`min-w-0 flex-1 overflow-x-hidden px-4 py-4 transition-[margin] duration-300 sm:px-6 lg:px-8 ${
            isDesktop ? desktopMainOffsetClass : ""
          }`}
        >
          <div
            className={`rounded-2xl border p-4 ${
              isDark ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                {!isDesktop && (
                  <button
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className={`rounded-lg p-2 ${
                      isDark ? "text-slate-200 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-100"
                    }`}
                    aria-label="Open admin menu"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                )}
                <div>
                  <h2 className="text-xl font-semibold">Admin Dashboard</h2>
                  <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                    Live governance layer for users, finance, security, and support.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                    isDark
                      ? "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                    {isDark ? "Light" : "Dark"} mode
                  </span>
                </button>
                <div className="rounded-xl border border-slate-300/30 px-3 py-1.5 text-xs">
                  <span className="text-slate-500">Time</span>
                  <p className="font-semibold">{new Date(now).toLocaleTimeString()}</p>
                </div>
                <div className="rounded-xl border border-slate-300/30 px-3 py-1.5 text-xs">
                  <span className="text-slate-500">Pending Requests</span>
                  <p className="font-semibold text-amber-500">{pendingCount}</p>
                </div>
                <div className="rounded-xl border border-slate-300/30 px-3 py-1.5 text-xs">
                  <span className="text-slate-500">Support Alerts</span>
                  <p className="flex items-center gap-1 font-semibold text-teal-500">
                    <BellRing className="h-3.5 w-3.5" />
                    Live
                  </p>
                </div>
              </div>
            </div>
          </div>

          <AdminNotificationBar
            isDark={isDark}
            pendingRequestsCount={pendingCount}
            onOpenMessages={() => openAdminTab("messages")}
            onOpenFinance={() => openAdminTab("finance")}
            onOpenSecurity={() => openAdminTab("security")}
            onMessageCountChange={setMessageBadgeCount}
          />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <div className="overflow-x-auto pb-2">
              <TabsList
                className={`w-max rounded-xl border p-1 ${
                  isDark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
                }`}
              >
                {navItems.map((item) => (
                  <TabsTrigger
                    key={item.value}
                    value={item.value}
                    className="rounded-lg px-3 py-2 text-xs font-semibold data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-500"
                  >
                    <span className="flex items-center gap-1.5">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div
              className={`mt-3 rounded-2xl border ${
                isDark ? "border-slate-700 bg-slate-900/80" : "border-slate-200 bg-white"
              }`}
            >
              <TabsContent value="users" className="m-0">
                <UserTable />
              </TabsContent>
              <TabsContent value="finance" className="m-0">
                <FinanceSection />
              </TabsContent>
              <TabsContent value="activity" className="m-0">
                <ActivitySection />
              </TabsContent>
              <TabsContent value="security" className="m-0">
                <SecuritySection />
              </TabsContent>
              <TabsContent value="system" className="m-0">
                <SystemTools />
              </TabsContent>
              <TabsContent value="messages" className="m-0">
                <MessageCenter />
              </TabsContent>
              <TabsContent value="optional" className="m-0">
                <OptionalFeatures />
              </TabsContent>
            </div>
          </Tabs>
        </main>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AdminDashboardContent />
    </ThemeProvider>
  );
}
