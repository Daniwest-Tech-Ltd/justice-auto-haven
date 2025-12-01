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

// Lazy load pages
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Services = lazy(() => import("./pages/Services"));
const Catalogue = lazy(() => import("./pages/Catalogue"));
const Videos = lazy(() => import("./pages/Videos"));
const Blogs = lazy(() => import("./pages/Blogs"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const RentalBooking = lazy(() => import("./pages/RentalBooking"));
const RentalsManagement = lazy(() => import("./pages/RentalsManagement"));
const TradeInSubmission = lazy(() => import("./pages/TradeInSubmission"));
const TradeInsManagement = lazy(() => import("./pages/TradeInsManagement"));
const RentalCatalogue = lazy(() => import("./pages/RentalCatalogue"));
const RentalCarDetails = lazy(() => import("./pages/RentalCarDetails"));
const AddRentalCar = lazy(() => import("./pages/AddRentalCar"));
const RentalManagement = lazy(() => import("./pages/RentalManagement"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard"));
const CustomerVehicles = lazy(() => import("./pages/CustomerVehicles"));
const CustomerBookings = lazy(() => import("./pages/CustomerBookings"));
const CustomerSettings = lazy(() => import("./pages/CustomerSettings"));
const CarManagement = lazy(() => import("./pages/CarManagement"));
const AddCar = lazy(() => import("./pages/AddCar"));
const EditCar = lazy(() => import("./pages/EditCar"));
const VehicleAnalytics = lazy(() => import("./pages/VehicleAnalytics"));
const AdminCustomers = lazy(() => import("./pages/AdminCustomers"));
const CustomerBadge = lazy(() => import("./pages/CustomerBadge"));
const BrandManagement = lazy(() => import("./pages/BrandManagement"));
const VideoManagement = lazy(() => import("./pages/VideoManagement"));
const BlogManagement = lazy(() => import("./pages/BlogManagement"));
const SalesAnalytics = lazy(() => import("./pages/SalesAnalytics"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CarDetails = lazy(() => import("./pages/CarDetails"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const Forbidden = lazy(() => import("./pages/Forbidden"));
const ServerError = lazy(() => import("./pages/ServerError"));
const HRManagement = lazy(() => import("./pages/HRManagement"));
const AddStaff = lazy(() => import("./pages/AddStaff"));
const StaffManagement = lazy(() => import("./pages/StaffManagement"));
const StaffBadge = lazy(() => import("./pages/StaffBadge"));
const PayrollManagement = lazy(() => import("./pages/PayrollManagement"));
const AttendanceManagement = lazy(() => import("./pages/AttendanceManagement"));
const BusinessCard = lazy(() => import("./pages/BusinessCard"));
const AdminMessages = lazy(() => import("./pages/AdminMessages"));
const CustomerMessages = lazy(() => import("./pages/CustomerMessages"));
const CRMManagement = lazy(() => import("./pages/CRMManagement"));
const CustomerProfile = lazy(() => import("./pages/CustomerProfile"));
const CustomerNotifications = lazy(() => import("./pages/CustomerNotifications"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const DailyReports = lazy(() => import("./pages/DailyReports"));
const ActivityAnalytics = lazy(() => import("./pages/ActivityAnalytics"));
const StaffPerformance = lazy(() => import("./pages/StaffPerformance"));
const LiveAttendanceMonitor = lazy(() => import("./pages/LiveAttendanceMonitor"));
const Compare = lazy(() => import("./pages/Compare"));
const SalesForecasting = lazy(() => import("./pages/SalesForecasting"));
const AISecurityDashboard = lazy(() => import("./pages/AISecurityDashboard"));
const Orders = lazy(() => import("./pages/Orders"));
const CustomerOrderStatus = lazy(() => import("./pages/CustomerOrderStatus"));
const VIPAnalytics = lazy(() => import("./pages/VIPAnalytics"));
const OTPManagement = lazy(() => import("./pages/OTPManagement"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const FAQs = lazy(() => import("./pages/FAQs"));
const HelpSupport = lazy(() => import("./pages/HelpSupport"));
const SystemHealth = lazy(() => import("./pages/SystemHealth"));
const SystemAuthDetails = lazy(() => import("./pages/SystemAuthDetails"));
const SystemDatabaseDetails = lazy(() => import("./pages/SystemDatabaseDetails"));
const SystemStorageDetails = lazy(() => import("./pages/SystemStorageDetails"));
const SystemSecurityDetails = lazy(() => import("./pages/SystemSecurityDetails"));
const CookieManagement = lazy(() => import("./pages/CookieManagement"));
import CookieConsentBanner from "./components/CookieConsentBanner";

const queryClient = new QueryClient();

const AppContent = () => {
  const { logActivity } = useActivityTracker();
  const location = useLocation();
  const navigate = useNavigate();
  const { showWarning, timeLeft, extendSession, handleLogout } = useSessionTimeout();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Defer Supabase calls to avoid auth deadlocks
        setTimeout(async () => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("theme")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (profile?.theme) {
            applyTheme(profile.theme as Theme);
          }
        }, 0);
      } else {
        // Apply saved theme from localStorage when not logged in
        const savedTheme = localStorage.getItem("theme") as Theme | null;
        if (savedTheme) {
          applyTheme(savedTheme);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  // Redirect to home on initial load if not on a specific route
  useEffect(() => {
    const isInitialLoad = sessionStorage.getItem('initialLoadComplete') !== 'true';
    if (isInitialLoad && location.pathname === '/') {
      sessionStorage.setItem('initialLoadComplete', 'true');
    }
  }, [location.pathname]);

  return (
    <Suspense fallback={<LoadingScreen />}>
      <SessionTimeoutModal
        isOpen={showWarning}
        timeLeft={timeLeft}
        onExtend={extendSession}
        onLogout={handleLogout}
      />
      <Routes>
          {/* Public Routes with Layout */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/about" element={<Layout><About /></Layout>} />
          <Route path="/contact" element={<Layout><Contact /></Layout>} />
          <Route path="/services" element={<Layout><Services /></Layout>} />
          <Route path="/catalogue" element={<Layout><Catalogue /></Layout>} />
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
          
          {/* Car Details Route */}
          <Route path="/car/:id" element={<Layout><CarDetails /></Layout>} />
          
          {/* Auth Routes (no layout) */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Protected Dashboard Routes */}
          <Route 
            path="/admin-dashboard" 
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
          
          {/* Admin Analytics Routes */}
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
          
          {/* Protected Admin Routes */}
          <Route 
            path="/admin/cars" 
            element={
              <ProtectedRoute requiredRole="admin">
                <CarManagement />
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
            path="/admin/messages" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminMessages />
              </ProtectedRoute>
            } 
          />
          
          {/* Customer Routes */}
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
          
          {/* HR & Staff Routes */}
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
          
          {/* CRM Route */}
          <Route 
            path="/admin/crm" 
            element={
              <ProtectedRoute requiredRole="admin">
                <CRMManagement />
              </ProtectedRoute>
            } 
          />
          
          {/* System Health Detail Routes */}
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
          
          {/* Error Pages */}
          <Route path="/401" element={<Unauthorized />} />
          <Route path="/403" element={<Forbidden />} />
          <Route path="/500" element={<ServerError />} />
          
          {/* Catch-all */}
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
