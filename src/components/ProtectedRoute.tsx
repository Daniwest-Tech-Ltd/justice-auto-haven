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

const ADMIN_EMAILS = ["daniwesttechnologies@gmail.com", "justicevincentt@gmail.com"];

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
    if (!user?.id) {
      setCheckingStatus(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("account_status, suspended_reason, suspended_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (!data) {
        setAccountStatus("active");
        return;
      }

      setAccountStatus(data.account_status || "active");

      if (data.account_status === "suspended" || data.account_status === "blocked") {
        setSuspensionDetails({
          reason: data.suspended_reason,
          until: data.suspended_at,
        });
      }
    } catch (error) {
      console.error("Error checking account status:", error);
      setAccountStatus("active");
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

  const isAdminEmail = ADMIN_EMAILS.includes((user.email || "").toLowerCase());
  const effectiveRole = role?.role || (isAdminEmail ? "admin" : "customer");

  // Check if customer account is suspended or blocked
  if (effectiveRole === "customer" && (accountStatus === "suspended" || accountStatus === "blocked")) {
    return (
      <SuspendedUserModal
        isOpen={true}
        reason={suspensionDetails.reason}
        suspendedUntil={suspensionDetails.until}
        onSuccess={checkAccountStatus}
      />
    );
  }

  if (requiredRole && effectiveRole !== requiredRole) {
    return <Navigate to={effectiveRole === "admin" ? "/admin-dashboard" : "/customer-dashboard"} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

