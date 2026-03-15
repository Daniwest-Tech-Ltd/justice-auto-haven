import { ReactNode, useEffect, useRef, useState } from "react";
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

  const lastCheckedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      lastCheckedUserIdRef.current = null;
      setCheckingStatus(false);
      return;
    }

    if (lastCheckedUserIdRef.current === user.id) {
      setCheckingStatus(false);
      return;
    }

    lastCheckedUserIdRef.current = user.id;
    setCheckingStatus(true);
    void checkAccountStatus(user.id);
  }, [user?.id]);

  const checkAccountStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("account_status, suspended_reason, suspended_at")
        .eq("user_id", userId)
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
    } catch (error: any) {
      if (error?.code !== "PGRST116") {
        console.error("Error checking account status:", error);
      }
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
        onSuccess={() => {
          if (user?.id) {
            void checkAccountStatus(user.id);
          }
        }}
      />
    );
  }

  if (requiredRole && effectiveRole !== requiredRole) {
    return <Navigate to={effectiveRole === "admin" ? "/admin-dashboard" : "/customer-dashboard"} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

