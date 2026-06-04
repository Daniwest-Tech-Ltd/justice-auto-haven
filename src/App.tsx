import { Suspense, lazy, useEffect } from "react";
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

// NATIVE MOBILE IMPORTS
import { App as CapacitorApp } from "@capacitor/app";
import { PushNotifications } from "@capacitor/push-notifications";
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
const About = lazyWithRetry(() => import("./pages/About"));
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
const HelpSupport = lazyWithRetry(() => import("./pages/HelpSupport"));
const SystemHealth = lazyWithRetry(() => import("./pages/SystemHealth"));
const SystemAuthDetails = lazyWithRetry(() => import("./pages/SystemAuthDetails"));
const SystemDatabaseDetails = lazyWithRetry(() => import("./pages/SystemDatabaseDetails"));
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  useEffect(() => {
    const isInitialLoad = sessionStorage.getItem('initialLoadComplete') !== 'true';
    if (isInitialLoad && location.pathname === '/') {
      sessionStorage.setItem('initialLoadComplete', 'true');
    }
  }, [location.pathname]);

  return (
    <Suspense fallback={<LoadingScreen />}>
      {!isAuthPage && (
        <SessionTimeoutModal
          isOpen={showWarning}
          timeLeft={timeLeft}
          onExtend={extendSession}
          onLogout={handleLogout}
        />
      )}
      <KillSwitchOverlay />
      <Routes>
          {/* Public Routes with Layout */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/about" element={<Layout><About /></Layout>} />
          <Route path="/contact" element={<Layout><Contact /></Layout>} />
          <Route path="/services" element={<Layout><Services /></Layout>} />
          <Route path="/catalogue" element={<Layout><Catalogue /></Layout>} />
          <Route path="/motorbikes" element={<Layout><MotorbikeCatalogue /></Layout>} />
          <Route path="/motorbike-catalogue" element={<Layout><MotorbikeCatalogue /></Layout>} />
          <Route path="/motorbike/:id" element={<Layout><MotorbikeDetails /></Layout>} />
          <Route path="/videos" element={<Layout><Videos /></Layout>} />
          <Route path="/blogs" element={<Layout><Blogs /></Layout>} />
          <Route path="/terms" element={<Layout><TermsOfUse /></Layout>} />
          <Route path="/terms-of-use" element={<Layout><TermsOfUse /></Layout>} />
          <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
          <Route path="/privacy-policy" element={<Layout><PrivacyPolicy /></Layout>} />
          <Route path="/cookies" element={<Layout><CookiePolicy /></Layout>} />
          <Route path="/cookie-policy" element={<Layout><CookiePolicy /></Layout>} />
          <Route path="/faqs" element={<Layout><FAQs /></Layout>} />
          <Route path="/help-support" element={<Layout><HelpSupport /></Layout>} />
          <Route path="/rental-booking" element={<Layout><RentalBooking /></Layout>} />
          <Route path="/rentals" element={<Layout><RentalCatalogue /></Layout>} />
          <Route path="/rental-catalogue" element={<Layout><RentalCatalogue /></Layout>} />
          <Route path="/rental/:id" element={<Layout><RentalCarDetails /></Layout>} />
          <Route path="/trade-in" element={<Layout><TradeInSubmission /></Layout>} />
          <Route path="/trade-in-submission" element={<Layout><TradeInSubmission /></Layout>} />
          <Route path="/track-order" element={<Layout><TrackOrder /></Layout>} />
          <Route path="/asset-finance" element={<Layout><AssetFinanceApplication /></Layout>} />
          <Route path="/apply-finance" element={<Layout><AssetFinanceApplication /></Layout>} />
          
          <Route path="/car/:id" element={<Layout><CarDetails /></Layout>} />
          
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/customer-dashboard" 
            element={
              <ProtectedRoute requiredRole="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route path="/customer/notifications" element={<CustomerNotifications />} />
          <Route path="/customer/messages" element={<CustomerMessages />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/order-status" element={<CustomerOrderStatus />} />
          
          <Route 
            path="/admin/reports" 
            element={
              <ProtectedRoute requiredRole="admin">
                <DailyReports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/analytics" 
            element={
              <ProtectedRoute requiredRole="admin">
                <ActivityAnalytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/performance" 
            element={
              <ProtectedRoute requiredRole="admin">
                <StaffPerformance />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/live-attendance" 
            element={
              <ProtectedRoute requiredRole="admin">
                <LiveAttendanceMonitor />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/orders" 
            element={
              <ProtectedRoute requiredRole="admin">
                <Orders />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/vip-analytics" 
            element={
              <ProtectedRoute requiredRole="admin">
                <VIPAnalytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/otp-management" 
            element={
              <ProtectedRoute requiredRole="admin">
                <OTPManagement />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/cars" 
            element={
              <ProtectedRoute requiredRole="admin">
                <CarManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/motorbikes" 
            element={
              <ProtectedRoute requiredRole="admin">
                <MotorbikeManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/projects" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminProjects />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/cars/add" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AddCar />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/cars/edit/:id" 
            element={
              <ProtectedRoute requiredRole="admin">
                <EditCar />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/vehicle-analytics" 
            element={
              <ProtectedRoute requiredRole="admin">
                <VehicleAnalytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/customers" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminCustomers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/brands" 
            element={
              <ProtectedRoute requiredRole="admin">
                <BrandManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/videos" 
            element={
              <ProtectedRoute requiredRole="admin">
                <VideoManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/blogs" 
            element={
              <ProtectedRoute requiredRole="admin">
                <BlogManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/sales" 
            element={
              <ProtectedRoute requiredRole="admin">
                <SalesAnalytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/sales/forecasting" 
            element={
              <ProtectedRoute requiredRole="admin">
                <SalesForecasting />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/security" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AISecurityDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/rentals"
            element={
              <ProtectedRoute requiredRole="admin">
                <RentalsManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/rental-management"
            element={
              <ProtectedRoute requiredRole="admin">
                <RentalManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/add-rental-car"
            element={
              <ProtectedRoute requiredRole="admin">
                <AddRentalCar />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/trade-ins" 
            element={
              <ProtectedRoute requiredRole="admin">
                <TradeInsManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/settings" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminSettings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/social-engagement" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminSocialEngagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/system-health" 
            element={
              <ProtectedRoute requiredRole="admin">
                <SystemHealth />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/cookie-management" 
            element={
              <ProtectedRoute requiredRole="admin">
                <CookieManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/sms" 
            element={
              <ProtectedRoute requiredRole="admin">
                <SMSManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/messages" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminMessages />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/notes" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminNotes />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/backup" 
            element={
              <ProtectedRoute requiredRole="admin">
                <BackupRecovery />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/payments" 
            element={
              <ProtectedRoute requiredRole="admin">
                <PaymentsManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/asset-finance" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AssetFinanceManagement />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/customer/badge" 
            element={
              <ProtectedRoute requiredRole="customer">
                <CustomerBadge />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/customer/vehicles" 
            element={
              <ProtectedRoute requiredRole="customer">
                <CustomerVehicles />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/customer/bookings" 
            element={
              <ProtectedRoute requiredRole="customer">
                <CustomerBookings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/customer/settings" 
            element={
              <ProtectedRoute requiredRole="customer">
                <CustomerSettings />
              </ProtectedRoute>
            } 
          />
          
          <Route path="/staff-dashboard" element={<StaffDashboard />} />
          <Route path="/hr-dashboard" element={<HRDashboard />} />
          <Route path="/sales-dashboard" element={<SalesDashboard />} />
          
          <Route 
            path="/admin/sales-management" 
            element={
              <ProtectedRoute requiredRole="admin">
                <SalesManagement />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/hr/documents" 
            element={
              <ProtectedRoute requiredRole="admin">
                <CustomerDocuments />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/sales-orders" 
            element={
              <ProtectedRoute requiredRole="admin">
                <SalesOrderManagement />
              </ProtectedRoute>
            } 
          />
          
          <Route path="/my-orders" element={<ProtectedRoute requiredRole="customer"><MyOrders /></ProtectedRoute>} />
          <Route path="/my-orders/:id" element={<ProtectedRoute requiredRole="customer"><OrderTracking /></ProtectedRoute>} />
          
          <Route path="/admin/cars/drafts" element={<ProtectedRoute requiredRole="admin"><CarDrafts /></ProtectedRoute>} />
          
          <Route path="/admin/sales-prospects" element={<ProtectedRoute requiredRole="admin"><SalesProspects /></ProtectedRoute>} />

          <Route path="/admin/company-documents" element={<ProtectedRoute requiredRole="admin"><CompanyDocuments /></ProtectedRoute>} />

          <Route 
            path="/admin/hr" 
            element={
              <ProtectedRoute requiredRole="admin">
                <HRManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/staff" 
            element={
              <ProtectedRoute requiredRole="admin">
                <StaffManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/hr/add-staff" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AddStaff />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/hr/staff-badge/:id" 
            element={
              <ProtectedRoute requiredRole="admin">
                <StaffBadge />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/hr/payroll" 
            element={
              <ProtectedRoute requiredRole="admin">
                <PayrollManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/hr/attendance" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AttendanceManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/hr/business-card/:id" 
            element={
              <ProtectedRoute requiredRole="admin">
                <BusinessCard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/crm" 
            element={
              <ProtectedRoute requiredRole="admin">
                <CRMManagement />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/system-auth-details" 
            element={
              <ProtectedRoute requiredRole="admin">
                <SystemAuthDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/system-database-details" 
            element={
              <ProtectedRoute requiredRole="admin">
                <SystemDatabaseDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/system-storage-details" 
            element={
              <ProtectedRoute requiredRole="admin">
                <SystemStorageDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/system-security-details" 
            element={
              <ProtectedRoute requiredRole="admin">
                <SystemSecurityDetails />
              </ProtectedRoute>
            } 
          />
          
          <Route path="/401" element={<Unauthorized />} />
          <Route path="/403" element={<Forbidden />} />
          <Route path="/500" element={<ServerError />} />
          
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