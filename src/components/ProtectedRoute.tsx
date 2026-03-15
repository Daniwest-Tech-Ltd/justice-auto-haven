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
    if (user) {
      checkAccountStatus();
    } else {
      setCheckingStatus(false);
    }
  }, [user, role]);

  const checkAccountStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("account_status, suspended_reason, suspended_at, password_set, auth_provider")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;

      setAccountStatus(data?.account_status || "active");
      
      // Check if Google/GitHub/Facebook OAuth user without password set
      if ((data?.auth_provider === 'google' || data?.auth_provider === 'github' || data?.auth_provider === 'facebook') && data?.password_set === false) {
        setNeedsPasswordSetup(true);
      } else {
        setNeedsPasswordSetup(false);
      }
      
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

  // Redirect to auth page if OAuth user needs to set password
  if (needsPasswordSetup) {
    return <Navigate to="/auth?complete_profile=true" replace />;
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

  if (requiredRole && role?.role !== requiredRole) {
    return <Navigate to={role?.role === "admin" ? "/admin-dashboard" : "/customer-dashboard"} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
