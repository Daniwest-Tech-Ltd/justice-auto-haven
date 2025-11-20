import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import LoadingScreen from "./LoadingScreen";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "admin" | "customer";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If a specific role is required and we have the role data
  if (requiredRole && role) {
    // If user doesn't have the required role, redirect to their appropriate dashboard
    if (role.role !== requiredRole) {
      return <Navigate to={role.role === "admin" ? "/admin-dashboard" : "/customer-dashboard"} replace />;
    }
  }

  // If requiredRole is specified but role is still null (error or not found)
  if (requiredRole && !role) {
    return <Navigate to="/customer-dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
