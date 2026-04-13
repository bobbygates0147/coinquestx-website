import React, { Suspense, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from "react-router-dom";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import SideImg from "./components/contact/ContactImg.jsx";
import ContactUs from "./components/contact/ContactIndex.jsx";
import TradingViewChart from "./components/coinapi/Tradingview.jsx";
import CryptocurrencyMarketWidget from "./components/coinapi/CryptocurrencyMarketWidget.jsx";
import LoginPage from "./app/(auth)/login/LoginPage.jsx";
import SignUpPage from "./components/auth/sign-up/Form.jsx";
import { PrivateRoute } from "./PrivateRoute.jsx";
import Layout from "./components/dashboard/layout/Layout.jsx";
import KycProtectedRoute from "./components/auth/KycProtectedRoute.jsx";
import SubscriptionProtectedRoute from "./components/auth/SubscriptionProtectedRoute.jsx";
import { ToastContainer } from "react-toastify";
import { Toaster } from "react-hot-toast";
import "react-toastify/dist/ReactToastify.css";
import AdminSignup from "./app/admin/AdminSignup.jsx";
import AdminLogin from "./app/admin/AdminLogin.jsx";
import ProtectedAdminRoute from "../src/app/admin/ProtectedAdminRoute.jsx";
import ForgotPassword from "./app/(auth)/login/ForgotPassword";
import { NotificationProvider } from "./context/NotificationContext";
import { UserProvider } from "./context/UserContext";
import { TransactionProvider } from "./context/TransactionContext";
import { CopyTradersProvider } from "./context/CopyTraderContext";
import { LanguageProvider } from "./context/LanguageContext";
import Loader from "./components/ui/Loader";
import { lazyWithRetry as lazy, setupChunkLoadRecovery } from "./utils/lazyWithRetry";

const AboutPage = lazy(() => import("./pages/about/Hero"));
const ServicePage = lazy(() => import("./pages/services/Hero"));
const ContactPage = lazy(() => import("./pages/contact/Hero"));
const HomePage = lazy(() => import("./pages/home/Home"));
const MyCopyTradersPage = lazy(() =>
  import("./pages/copytraders/MyCopytraders").then((module) => ({
    default: module.MyCopyTradersPage,
  }))
);
const DashPage = lazy(() => import("./pages/dashboard/Hero"));
const SearchPage = lazy(() => import("./pages/dashboard/Search"));
const WithdrawalPage = lazy(() => import("./pages/transactions/Withdrawal"));
const AssetPage = lazy(() => import("./pages/crypto assets/Assets"));
const PlaceTradePage = lazy(() => import("./pages/trades/PlaceTrade"));
const MiningPage = lazy(() => import("./pages/trades/Mining"));
const Deposit = lazy(() => import("./pages/transactions/deposit/Deposits"));
const BuyCrypto = lazy(() => import("./pages/trades/BuyCrypto"));
const AccountPage = lazy(() => import("./pages/account/Account"));
const PasswordUpdate = lazy(() => import("./pages/account/PasswordUpdate"));
const ReferralsPage = lazy(() => import("./pages/referrals/Referrals"));
const EmailUpdatePage = lazy(() => import("./pages/account/EmailUpdate"));
const Transactions = lazy(() => import("./pages/transactions/Transactions"));
const PaymentProofPage = lazy(() => import("./components/transactions/PaymentProof"));
const Notification = lazy(() => import("./pages/transactions/Notification"));
const TradesRoiPage = lazy(() => import("./pages/trades/TradesRoi"));
const BuyBotPage = lazy(() => import("./pages/trades/BuyBots"));
const StakePage = lazy(() => import("./pages/trades/Stake"));
const SubscriptionPage = lazy(() => import("./pages/subscription/Subscription"));
const DailySignalPage = lazy(() => import("./pages/dailysignal/DailySignal"));
const RealestPage = lazy(() => import("./pages/real estate/RealEstate"));
const ProjectDetail = lazy(() => import("./components/real estate/RealEstatedetails"));
const Modal = lazy(() => import("./pages/copytraders/Modal"));
const KycVerification = lazy(() => import("./components/kycverification/KYCVerification"));
const MyTraderPage = lazy(() => import("./components/traders/MyTraders"));
const SettingsPage = lazy(() => import("./pages/settings/Settings"));
const MessagesPage = lazy(() => import("./pages/messages/Messages"));
const WatchlistPage = lazy(() => import("./pages/watchlist/Watchlist"));
const HelpPage = lazy(() => import("./pages/help/Help"));
const TrustPage = lazy(() => import("./pages/trust/TrustPage"));
const UpdatePhotoPage = lazy(() => import("./pages/account/UpdatePhotoPage"));
const AdminDashboard = lazy(() => import("./app/admin/AdminDashboard.jsx"));

const root = ReactDOM.createRoot(document.getElementById("root"));
let hasCompletedInitialAppLoad = false;

setupChunkLoadRecovery();

const RouteLoader = () => (hasCompletedInitialAppLoad ? null : <Loader />);

const withSuspense = (element) => (
  <Suspense fallback={<RouteLoader />}>{element}</Suspense>
);

function DarkScrollbarRoute({ children }) {
  useEffect(() => {
    document.documentElement.classList.add("force-dark-scrollbars");
    document.body.classList.add("force-dark-scrollbars");

    return () => {
      document.documentElement.classList.remove("force-dark-scrollbars");
      document.body.classList.remove("force-dark-scrollbars");
    };
  }, []);

  return children;
}

const withDarkScrollbars = (element) => (
  <DarkScrollbarRoute>{withSuspense(element)}</DarkScrollbarRoute>
);

const withLayout = (element) => <Layout>{withSuspense(element)}</Layout>;

const withKycLayout = (element) => (
  <KycProtectedRoute>{withLayout(element)}</KycProtectedRoute>
);

const withKycFeatureLayout = (element, feature) => (
  <KycProtectedRoute>
    <SubscriptionProtectedRoute feature={feature}>
      {withLayout(element)}
    </SubscriptionProtectedRoute>
  </KycProtectedRoute>
);

function LanguageRouterShell() {
  return (
    <LanguageProvider>
      <Outlet />
    </LanguageProvider>
  );
}

const proRouter = createBrowserRouter([
  {
    element: <LanguageRouterShell />,
    children: [
  {
    path: "/",
    element: withDarkScrollbars(<HomePage />),
  },
  {
    path: "/about",
    element: withDarkScrollbars(<AboutPage />),
  },
  {
    path: "/services",
    element: withDarkScrollbars(<ServicePage />),
  },
  {
    path: "/contact",
    element: withDarkScrollbars(<ContactPage />),
  },
  {
    path: "/fees",
    element: withDarkScrollbars(<TrustPage pageKey="fees" />),
  },
  {
    path: "/risk-disclosure",
    element: withDarkScrollbars(<TrustPage pageKey="risk" />),
  },
  {
    path: "/terms",
    element: withDarkScrollbars(<TrustPage pageKey="terms" />),
  },
  {
    path: "/privacy",
    element: withDarkScrollbars(<TrustPage pageKey="privacy" />),
  },
  {
    path: "/aml-kyc-policy",
    element: withDarkScrollbars(<TrustPage pageKey="amlKyc" />),
  },
  {
    path: "/proof-of-process",
    element: withDarkScrollbars(<TrustPage pageKey="proof" />),
  },
  {
    path: "/LoginPage",
    element: withDarkScrollbars(<LoginPage />),
  },
  {
    path: "/login",
    element: <Navigate to="/LoginPage" replace />,
  },
  {
    path: "/SignUpPage",
    element: withDarkScrollbars(<SignUpPage />),
  },
  {
    path: "/ForgotPassword",
    element: withDarkScrollbars(<ForgotPassword />),
  },
  // Protected routes
  {
    element: <PrivateRoute />,
    children: [
      {
        path: "/Dashboard",
        element: withLayout(<DashPage />),
      },
      {
        path: "/Search",
        element: withLayout(<SearchPage />),
      },
      {
        path: "/Assets",
        element: withLayout(<AssetPage />),
      },
      {
        path: "/PlaceTrade",
        element: withKycLayout(<PlaceTradePage />),
      },
      {
        path: "/Mining",
        element: withKycLayout(<MiningPage />),
      },
      {
        path: "/Deposits",
        element: withKycLayout(<Deposit />),
      },
      {
        path: "/MyTraders",
        element: withKycLayout(<MyTraderPage />),
      },
      {
        path: "/BuyCrypto",
        element: withKycLayout(<BuyCrypto />),
      },
      {
        path: "/Account",
        element: withLayout(<AccountPage />),
      },
      {
        path: "/account",
        element: <Navigate to="/Account" replace />,
      },
      {
        path: "/Settings",
        element: withLayout(<SettingsPage />),
      },
      {
        path: "/settings",
        element: <Navigate to="/Settings" replace />,
      },
      {
        path: "/Messages",
        element: withLayout(<MessagesPage />),
      },
      {
        path: "/messages",
        element: <Navigate to="/Messages" replace />,
      },
      {
        path: "/PasswordUpdate",
        element: withLayout(<PasswordUpdate />),
      },
      {
        path: "/Referrals",
        element: withLayout(<ReferralsPage />),
      },
      {
        path: "/EmailUpdate",
        element: withLayout(<EmailUpdatePage />),
      },
      // {
      //   path: "/UpdatePhotoPage",
      //   element: <Update />,
      // },
      {
        path: "/Transactions",
        element: withLayout(<Transactions />),
      },
      {
        path: "/Transaction",
        element: <Navigate to="/Transactions" replace />,
      },
      {
        path: "/PaymentProof",
        element: withLayout(<PaymentProofPage />),
      },
      {
        path: "/Notification",
        element: withLayout(<Notification />),
      },
      {
        path: "/kyc-verification",
        element: withLayout(<KycVerification />),
      },
      {
        path: "/Withdrawal",
        element: withKycLayout(<WithdrawalPage />),
      },
      {
        path: "/TradesRoi",
        element: withKycLayout(<TradesRoiPage />),
      },
      {
        path: "/MyCopytraders",
        element: withKycLayout(<MyCopyTradersPage />),
      },
      {
        path: "/BuyBots",
        element: withKycFeatureLayout(<BuyBotPage />, "aiBots"),
      },
      {
        path: "/Stake",
        element: withKycLayout(<StakePage />),
      },
      {
        path: "/Subscription",
        element: withKycLayout(<SubscriptionPage />),
      },
      {
        path: "/DailySignal",
        element: withKycLayout(<DailySignalPage />),
      },
      {
        path: "/RealEstate",
        element: withKycLayout(<RealestPage />),
      },
      {
        path: "/VerifyAccount",
        element: <Navigate to="/kyc-verification" replace />,
      },
      {
        path: "/UpdatePhotoPage",
        element: withLayout(<UpdatePhotoPage />),
      },
      {
        path: "/Watchlist",
        element: withLayout(<WatchlistPage />),
      },
      {
        path: "/Help",
        element: withLayout(<HelpPage />),
      },
    ],
  },
  // Public routes (remain unchanged)
  {
    path: "/ContactIndex",
    element: withDarkScrollbars(<ContactUs />),
  },
  {
    path: "/RealEstateDetails",
    element: withDarkScrollbars(<ProjectDetail />),
  },
  {
    path: "/Modal",
    element: withDarkScrollbars(<Modal />),
  },

  {
    path: "/trading-view",
    element: <TradingViewChart />,
  },
  {
    path: "/CryptocurrencyMarketWidget",
    element: <CryptocurrencyMarketWidget />,
  },
  {
    path: "/ContactImg",
    element: <SideImg />,
  },
  //Admin URLS/route
  {
    path: "/AdminDashboard",
    element: (
      <ProtectedAdminRoute>
        {withSuspense(<AdminDashboard />)}
      </ProtectedAdminRoute>
    ),
  },

  {
    path: "/AdminSignup",
    element: withDarkScrollbars(<AdminSignup />),
  },
  {
    path: "/AdminLogin",
    element: withDarkScrollbars(<AdminLogin />),
  },
    ],
  },
]);

function AppRouter() {
  useEffect(() => {
    hasCompletedInitialAppLoad = true;
  }, []);

  return <RouterProvider router={proRouter} />;
}

root.render(
  <React.StrictMode>
    <UserProvider>
      <TransactionProvider>
        <CopyTradersProvider>
          <NotificationProvider>
            <AppRouter />
            <ToastContainer
              position="top-right"
              autoClose={4200}
              newestOnTop
              closeOnClick
              pauseOnHover
              draggable
              theme="dark"
              toastClassName={({ type }) =>
                `coinquestx-toast coinquestx-toast--${type || "default"}`
              }
              bodyClassName="coinquestx-toast-body"
              progressClassName="coinquestx-toast-progress"
            />
            <Toaster
              position="top-right"
              gutter={12}
              containerClassName="coinquestx-hot-toast-host"
              toastOptions={{
                className: "coinquestx-hot-toast",
                duration: 4200,
                style: {
                  background: "rgba(2, 6, 23, 0.94)",
                  color: "#f8fafc",
                  border: "1px solid rgba(45, 212, 191, 0.22)",
                  boxShadow: "0 20px 50px rgba(13, 148, 136, 0.24)",
                  padding: "14px 16px",
                  borderRadius: "18px",
                  backdropFilter: "blur(20px)",
                },
                success: {
                  iconTheme: {
                    primary: "#5eead4",
                    secondary: "#042f2e",
                  },
                },
                error: {
                  iconTheme: {
                    primary: "#fb7185",
                    secondary: "#3f0d14",
                  },
                },
              }}
            />
          </NotificationProvider>
        </CopyTradersProvider>
      </TransactionProvider>
    </UserProvider>
  </React.StrictMode>
);
