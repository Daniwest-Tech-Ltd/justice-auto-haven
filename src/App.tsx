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
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import CarManagement from "./pages/CarManagement";
import AddCar from "./pages/AddCar";
import NotFound from "./pages/NotFound";
import CarDetails from "./pages/CarDetails";
import Unauthorized from "./pages/Unauthorized";
import Forbidden from "./pages/Forbidden";
import ServerError from "./pages/ServerError";
import ProtectedRoute from "./components/ProtectedRoute";

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
