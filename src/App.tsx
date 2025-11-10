import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

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
const TradeInSubmission = lazy(() => import("./pages/TradeInSubmission"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard"));
const CarManagement = lazy(() => import("./pages/CarManagement"));
const AddCar = lazy(() => import("./pages/AddCar"));
const EditCar = lazy(() => import("./pages/EditCar"));
const AdminCustomers = lazy(() => import("./pages/AdminCustomers"));
const CustomerBadge = lazy(() => import("./pages/CustomerBadge"));
const BrandManagement = lazy(() => import("./pages/BrandManagement"));
const VideoManagement = lazy(() => import("./pages/VideoManagement"));
const BlogManagement = lazy(() => import("./pages/BlogManagement"));
const SalesAnalytics = lazy(() => import("./pages/SalesAnalytics"));
const RentalsManagement = lazy(() => import("./pages/RentalsManagement"));
const TradeInsManagement = lazy(() => import("./pages/TradeInsManagement"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CarDetails = lazy(() => import("./pages/CarDetails"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const Forbidden = lazy(() => import("./pages/Forbidden"));
const ServerError = lazy(() => import("./pages/ServerError"));
const HRManagement = lazy(() => import("./pages/HRManagement"));
const AddStaff = lazy(() => import("./pages/AddStaff"));
const StaffBadge = lazy(() => import("./pages/StaffBadge"));
const PayrollManagement = lazy(() => import("./pages/PayrollManagement"));
const AttendanceManagement = lazy(() => import("./pages/AttendanceManagement"));
const BusinessCard = lazy(() => import("./pages/BusinessCard"));
const AdminMessages = lazy(() => import("./pages/AdminMessages"));
const CustomerMessages = lazy(() => import("./pages/CustomerMessages"));
const CRMManagement = lazy(() => import("./pages/CRMManagement"));
const CustomerProfile = lazy(() => import("./pages/CustomerProfile"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
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
          <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
          <Route path="/cookies" element={<Layout><CookiePolicy /></Layout>} />
          <Route path="/rental-booking" element={<Layout><RentalBooking /></Layout>} />
          <Route path="/trade-in" element={<Layout><TradeInSubmission /></Layout>} />
          
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
            path="/admin/rentals" 
            element={
              <ProtectedRoute requiredRole="admin">
                <RentalsManagement />
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
            path="/customer/profile" 
            element={
              <ProtectedRoute requiredRole="customer">
                <CustomerProfile />
              </ProtectedRoute>
            } 
          />
          
          {/* HR Routes */}
          <Route 
            path="/admin/hr" 
            element={
              <ProtectedRoute requiredRole="admin">
                <HRManagement />
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
          
          {/* Error Pages */}
          <Route path="/401" element={<Unauthorized />} />
          <Route path="/403" element={<Forbidden />} />
          <Route path="/500" element={<ServerError />} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
