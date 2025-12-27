import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import LoadingScreen from "./LoadingScreen";
import { SuspendedUserModal } from "./SuspendedUserModal";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "admin" | "customer";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();
  const [accountStatus, setAccountStatus] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [suspensionDetails, setSuspensionDetails] = useState<{ reason?: string; until?: string }>({});

  useEffect(() => {
    if (user && role?.role === "customer") {
      checkAccountStatus();
    } else {
      setCheckingStatus(false);
    }
  }, [user, role]);

  const checkAccountStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("account_status, suspended_reason, suspended_at")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;

      setAccountStatus(data?.account_status || "active");
      if (data?.account_status === "suspended" || data?.account_status === "blocked") {
        setSuspensionDetails({
          reason: data.suspended_reason,
          until: data.suspended_at
        });
      }
    } catch (error) {
      console.error("Error checking account status:", error);
    } finally {
      setCheckingStatus(false);
    }
  };

  if (loading || checkingStatus) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if customer account is suspended or blocked
  if (role?.role === "customer" && (accountStatus === "suspended" || accountStatus === "blocked")) {
    return (
      <SuspendedUserModal
        isOpen={true}
        reason={suspensionDetails.reason}
        suspendedUntil={suspensionDetails.until}
        onSuccess={checkAccountStatus}
      />
    );
  }

  const isAdmin = role?.role === "admin" || role?.role === "super_admin";

  if (requiredRole) {
    const hasRequiredRole = requiredRole === "admin" ? isAdmin : role?.role === requiredRole;
    if (!hasRequiredRole) {
      return <Navigate to={isAdmin ? "/admin-dashboard" : "/customer-dashboard"} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
