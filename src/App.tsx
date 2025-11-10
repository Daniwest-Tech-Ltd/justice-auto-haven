import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Services from "./pages/Services";
import Catalogue from "./pages/Catalogue";
import Videos from "./pages/Videos";
import Blogs from "./pages/Blogs";
import RentalBooking from "./pages/RentalBooking";
import TradeInSubmission from "./pages/TradeInSubmission";
import AdminSettings from "./pages/AdminSettings";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import CarManagement from "./pages/CarManagement";
import AddCar from "./pages/AddCar";
import EditCar from "./pages/EditCar";
import AdminCustomers from "./pages/AdminCustomers";
import CustomerBadge from "./pages/CustomerBadge";
import BrandManagement from "./pages/BrandManagement";
import VideoManagement from "./pages/VideoManagement";
import BlogManagement from "./pages/BlogManagement";
import SalesAnalytics from "./pages/SalesAnalytics";
import RentalsManagement from "./pages/RentalsManagement";
import TradeInsManagement from "./pages/TradeInsManagement";
import NotFound from "./pages/NotFound";
import CarDetails from "./pages/CarDetails";
import Unauthorized from "./pages/Unauthorized";
import Forbidden from "./pages/Forbidden";
import ServerError from "./pages/ServerError";
import ProtectedRoute from "./components/ProtectedRoute";
import HRManagement from "./pages/HRManagement";
import AddStaff from "./pages/AddStaff";
import StaffBadge from "./pages/StaffBadge";
import CRMManagement from "./pages/CRMManagement";
import CustomerProfile from "./pages/CustomerProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes with Layout */}
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/about" element={<Layout><About /></Layout>} />
          <Route path="/contact" element={<Layout><Contact /></Layout>} />
          <Route path="/services" element={<Layout><Services /></Layout>} />
          <Route path="/catalogue" element={<Layout><Catalogue /></Layout>} />
          <Route path="/videos" element={<Layout><Videos /></Layout>} />
          <Route path="/blogs" element={<Layout><Blogs /></Layout>} />
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
