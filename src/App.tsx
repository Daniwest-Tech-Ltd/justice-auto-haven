import { Suspense, lazy, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useActivityTracker } from "./hooks/useActivityTracker";
import { useSessionTimeout } from "./hooks/useSessionTimeout";
import SessionTimeoutModal from "./components/SessionTimeoutModal";
import LoadingScreen from "./components/LoadingScreen";
import { applyTheme } from "./lib/theme";
import type { Theme } from "./lib/theme";
import { supabase } from "@/integrations/supabase/client";
import KillSwitchOverlay from "./components/KillSwitchOverlay";
import CookieConsentBanner from "./components/CookieConsentBanner";
import { checkAppUpdate, AppVersion } from './services/UpdateService';


// NATIVE MOBILE IMPORTS
import { App as CapacitorApp } from "@capacitor/app";
import { PushNotifications } from "@capacitor/push-notifications";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";

// Lazy load pages with retry logic for chunk loading failures
const lazyWithRetry = (componentImport: () => Promise<any>) =>
  lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.log('Chunk loading failed, refreshing...');
      window.location.reload();
      return { default: () => null };
    }
  });

const Home = lazyWithRetry(() => import("./pages/Home"));
const Contact = lazyWithRetry(() => import("./pages/Contact"));
const Services = lazyWithRetry(() => import("./pages/Services"));
const Catalogue = lazyWithRetry(() => import("./pages/Catalogue"));
const Videos = lazyWithRetry(() => import("./pages/Videos"));
const Blogs = lazyWithRetry(() => import("./pages/Blogs"));
const TermsOfUse = lazyWithRetry(() => import("./pages/TermsOfUse"));
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"));
const CookiePolicy = lazyWithRetry(() => import("./pages/CookiePolicy"));
const RentalBooking = lazyWithRetry(() => import("./pages/RentalBooking"));
const RentalsManagement = lazyWithRetry(() => import("./pages/RentalsManagement"));
const TradeInSubmission = lazyWithRetry(() => import("./pages/TradeInSubmission"));
const TradeInsManagement = lazyWithRetry(() => import("./pages/TradeInsManagement"));
const RentalCatalogue = lazyWithRetry(() => import("./pages/RentalCatalogue"));
const RentalCarDetails = lazyWithRetry(() => import("./pages/RentalCarDetails"));
const AddRentalCar = lazyWithRetry(() => import("./pages/AddRentalCar"));
const RentalManagement = lazyWithRetry(() => import("./pages/RentalManagement"));
const AdminSettings = lazyWithRetry(() => import("./pages/AdminSettings"));
const Auth = lazyWithRetry(() => import("./pages/Auth"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard"));
const AdminProjects = lazyWithRetry(() => import("./pages/AdminProjects"));
const CustomerDashboard = lazyWithRetry(() => import("./pages/CustomerDashboard"));
const CustomerVehicles = lazyWithRetry(() => import("./pages/CustomerVehicles"));
const CustomerBookings = lazyWithRetry(() => import("./pages/CustomerBookings"));
const CustomerSettings = lazyWithRetry(() => import("./pages/CustomerSettings"));
const CarManagement = lazyWithRetry(() => import("./pages/CarManagement"));
const AddCar = lazyWithRetry(() => import("./pages/AddCar"));
const EditCar = lazyWithRetry(() => import("./pages/EditCar"));
const VehicleAnalytics = lazyWithRetry(() => import("./pages/VehicleAnalytics"));
const AdminCustomers = lazyWithRetry(() => import("./pages/AdminCustomers"));
const CustomerBadge = lazyWithRetry(() => import("./pages/CustomerBadge"));
const BrandManagement = lazyWithRetry(() => import("./pages/BrandManagement"));
const VideoManagement = lazyWithRetry(() => import("./pages/VideoManagement"));
const BlogManagement = lazyWithRetry(() => import("./pages/BlogManagement"));
const SalesAnalytics = lazyWithRetry(() => import("./pages/SalesAnalytics"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const CarDetails = lazyWithRetry(() => import("./pages/CarDetails"));
const Unauthorized = lazyWithRetry(() => import("./pages/Unauthorized"));
const Forbidden = lazyWithRetry(() => import("./pages/Forbidden"));
const ServerError = lazyWithRetry(() => import("./pages/ServerError"));
const HRManagement = lazyWithRetry(() => import("./pages/HRManagement"));
const AddStaff = lazyWithRetry(() => import("./pages/AddStaff"));
const StaffManagement = lazyWithRetry(() => import("./pages/StaffManagement"));
const StaffBadge = lazyWithRetry(() => import("./pages/StaffBadge"));
const PayrollManagement = lazyWithRetry(() => import("./pages/PayrollManagement"));
const AttendanceManagement = lazyWithRetry(() => import("./pages/AttendanceManagement"));
const BusinessCard = lazyWithRetry(() => import("./pages/BusinessCard"));
const AdminMessages = lazyWithRetry(() => import("./pages/AdminMessages"));
const CustomerMessages = lazyWithRetry(() => import("./pages/CustomerMessages"));
const CRMManagement = lazyWithRetry(() => import("./pages/CRMManagement"));
const CustomerProfile = lazyWithRetry(() => import("./pages/CustomerProfile"));
const CustomerNotifications = lazyWithRetry(() => import("./pages/CustomerNotifications"));
const Wishlist = lazyWithRetry(() => import("./pages/Wishlist"));
const DailyReports = lazyWithRetry(() => import("./pages/DailyReports"));
const ActivityAnalytics = lazyWithRetry(() => import("./pages/ActivityAnalytics"));
const StaffPerformance = lazyWithRetry(() => import("./pages/StaffPerformance"));
const LiveAttendanceMonitor = lazyWithRetry(() => import("./pages/LiveAttendanceMonitor"));
const Compare = lazyWithRetry(() => import("./pages/Compare"));
const SalesForecasting = lazyWithRetry(() => import("./pages/SalesForecasting"));
const AISecurityDashboard = lazyWithRetry(() => import("./pages/AISecurityDashboard"));
const Orders = lazyWithRetry(() => import("./pages/Orders"));
const CustomerOrderStatus = lazyWithRetry(() => import("./pages/CustomerOrderStatus"));
const VIPAnalytics = lazyWithRetry(() => import("./pages/VIPAnalytics"));
const OTPManagement = lazyWithRetry(() => import("./pages/OTPManagement"));
const TrackOrder = lazyWithRetry(() => import("./pages/TrackOrder"));
const FAQs = lazyWithRetry(() => import("./pages/FAQs"));
const ComplianceHub = lazyWithRetry(() => import("./pages/ComplianceHub"));
const HelpSupport = lazyWithRetry(() => import("./pages/HelpSupport"));
const SystemHealth = lazyWithRetry(() => import("./pages/SystemHealth"));
const SystemAuthDetails = lazyWithRetry(() => import("./pages/SystemAuthDetails"));
const SystemDatabaseDetails = lazyWithRetry(() => import("./pages/SystemDatabaseDetails"));
const AISalesIntelligence = lazyWithRetry(() => import("./pages/AISalesIntelligence"));
const SystemStorageDetails = lazyWithRetry(() => import("./pages/SystemStorageDetails"));
const SystemSecurityDetails = lazyWithRetry(() => import("./pages/SystemSecurityDetails"));
const CookieManagement = lazyWithRetry(() => import("./pages/CookieManagement"));
const SMSManagement = lazyWithRetry(() => import("./pages/SMSManagement")); // note: preserved path matching yours
const AdminNotes = lazyWithRetry(() => import("./pages/AdminNotes"));
const BackupRecovery = lazyWithRetry(() => import("./pages/BackupRecovery"));
const PaymentsManagement = lazyWithRetry(() => import("./pages/PaymentsManagement"));
const AssetFinanceApplication = lazyWithRetry(() => import("./pages/AssetFinanceApplication"));
const AssetFinanceManagement = lazyWithRetry(() => import("./pages/AssetFinanceManagement"));
const AdminSocialEngagement = lazyWithRetry(() => import("./pages/AdminSocialEngagement"));
const StaffDashboard = lazyWithRetry(() => import("./pages/StaffDashboard"));
const HRDashboard = lazyWithRetry(() => import("./pages/HRDashboard"));
const SalesDashboard = lazyWithRetry(() => import("./pages/SalesDashboard"));
const SalesManagement = lazyWithRetry(() => import("./pages/SalesManagement"));
const CustomerDocuments = lazyWithRetry(() => import("./pages/CustomerDocuments"));
const MyOrders = lazyWithRetry(() => import("./pages/MyOrders"));
const OrderTracking = lazyWithRetry(() => import("./pages/OrderTracking"));
const SalesOrderManagement = lazyWithRetry(() => import("./pages/SalesOrderManagement"));
const CarDrafts = lazyWithRetry(() => import("./pages/CarDrafts"));
const SalesProspects = lazyWithRetry(() => import("./pages/SalesProspects"));
const CompanyDocuments = lazyWithRetry(() => import("./pages/CompanyDocuments"));
const MotorbikeCatalogue = lazyWithRetry(() => import("./pages/MotorbikeCatalogue"));
const MotorbikeManagement = lazyWithRetry(() => import("./pages/MotorbikeManagement"));
const MotorbikeDetails = lazyWithRetry(() => import("./pages/MotorbikeDetails"));
const Support = lazyWithRetry(() => import("./pages/Support"));
const HelpCenter = lazyWithRetry(() => import("./pages/HelpCenter"));
const BookAppointment = lazyWithRetry(() => import("./pages/BookAppointment"));
const About = lazyWithRetry(() => import("./pages/About"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: (failureCount, error: any) => {
        const status = error?.status ?? error?.code;
        if (status === 401 || status === 403 || status === 429) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = location.pathname === '/auth' || location.pathname === '/reset-password';
  
  const { logActivity } = useActivityTracker(!isAuthPage);
  const { showWarning, timeLeft, extendSession, handleLogout } = useSessionTimeout(!isAuthPage);

  // 🛡️ NATIVE HARDWARE BACK BUTTON INTERCEPTION ROUTINE
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backButtonListener = CapacitorApp.addListener("backButton", () => {
      if (window.location.pathname === "/" || window.location.pathname === "/auth" || window.location.pathname === "/customer-dashboard" || window.location.pathname === "/admin-dashboard") {
        CapacitorApp.exitApp();
      } else {
        navigate(-1);
      }
    });

    return () => {
      backButtonListener.then((listener) => listener.remove());
    };
  }, [navigate]);

  const [updateInfo, setUpdateInfo] = useState<AppVersion | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const runUpdateCheck = async () => {
      const result = await checkAppUpdate();
      if (result.updateAvailable) {
        setUpdateInfo(result.data || null);
      }
    };
    runUpdateCheck();
  }, []);

  // 🔥 FIREBASE PUSH NOTIFICATIONS PERMISSION & REGISTRATION GATEWAY
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const initializePushNotifications = async () => {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === "prompt") {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== "granted") {
        console.log("Push notification permissions missing or explicitly rejected.");
        return;
      }

      await PushNotifications.register();

      await PushNotifications.addListener("registration", async (token) => {
        console.log("FCM Registration Target Token Generated:", token.value);
        
        const session = (await supabase.auth.getSession()).data.session;
        if (session?.user) {
          await supabase
  .from("profiles")
  .update({ ["fcm_token" as any]: token.value })
  .eq("user_id", session.user.id);
        }
      });

      await PushNotifications.addListener("registrationError", (err) => {
        console.error("FCM Hardware Registration Error Details:", err.error);
      });
    };

    initializePushNotifications();
  }, []);

  // 🔄 AUTO-UPDATE CHECK
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const checkAppUpdate = async () => {
      try {
        const response = await fetch('https://[ccsfhblxkmyqdqqcgitt].supabase.co/storage/v1/object/public/mobile-app/version.json');
        const data = await response.json();
        
        const info = await CapacitorApp.getInfo();
        
        if (data.version > info.version) {
           await Browser.open({ url: data.url });
        }
      } catch (err) {
        console.error("Update check failed:", err);
      }
    };

    checkAppUpdate();
  }, []);
  useEffect(() => {
    if (isAuthPage) {
      const savedTheme = localStorage.getItem("theme") as Theme | null;
      if (savedTheme) {
        applyTheme(savedTheme);
      }
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        const savedTheme = localStorage.getItem("theme") as Theme | null;
        if (savedTheme) {
          applyTheme(savedTheme);
        }
        return;
      }

      if (event !== "SIGNED_IN" && event !== "INITIAL_SESSION") {
        return;
      }

      setTimeout(async () => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("theme, avatar_url")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (profile?.theme) {
          applyTheme(profile.theme as Theme);
        }

        const googleAvatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture;
        if (googleAvatar && (!profile?.avatar_url || profile.avatar_url !== googleAvatar)) {
          await supabase
            .from("profiles")
            .update({ avatar_url: googleAvatar })
            .eq("user_id", session.user.id);
        }
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, [isAuthPage]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const isInitialLoad = sessionStorage.getItem('initialLoadComplete') !== 'true';
    if (isInitialLoad && location.pathname === '/') {
      sessionStorage.setItem('initialLoadComplete', 'true');
    }
  }, [location.pathname]);

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
          {/* EMERGENCY LOCKDOWN - ALL ROUTES REDIRECT TO 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
        <CookieConsentBanner />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;