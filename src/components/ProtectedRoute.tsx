import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import LoadingScreen from "./LoadingScreen";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "admin" | "customer";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // Get user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      setUserRole(roleData?.role || null);
      setLoading(false);
    } catch (error) {
      console.error("Auth check error:", error);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to={userRole === "admin" ? "/admin-dashboard" : "/customer-dashboard"} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
