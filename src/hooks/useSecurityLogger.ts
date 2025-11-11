import { supabase } from "@/integrations/supabase/client";

export const useSecurityLogger = () => {
  const logSecurityEvent = async (
    eventType: string,
    severity: "low" | "medium" | "high" | "critical",
    title: string,
    description?: string,
    sourceIp?: string,
    metadata?: any
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("security_events").insert({
        event_type: eventType,
        severity,
        title,
        description,
        source_ip: sourceIp,
        user_id: user?.id,
        metadata: metadata || {},
      });

      if (error) {
        console.error("Failed to log security event:", error);
      }
    } catch (error) {
      console.error("Security logging error:", error);
    }
  };

  const logLoginAttempt = async (email: string, success: boolean, ip?: string) => {
    await logSecurityEvent(
      "login_attempt",
      success ? "low" : "medium",
      success ? "Successful Login" : "Failed Login Attempt",
      `Login attempt for ${email}`,
      ip,
      { email, success }
    );
  };

  const logSuspiciousActivity = async (
    title: string,
    description: string,
    ip?: string,
    metadata?: any
  ) => {
    await logSecurityEvent(
      "suspicious_activity",
      "high",
      title,
      description,
      ip,
      metadata
    );
  };

  const logAccountSuspension = async (
    targetUserId: string,
    reason: string,
    ip?: string
  ) => {
    await logSecurityEvent(
      "account_suspension",
      "critical",
      "Account Suspended",
      reason,
      ip,
      { target_user_id: targetUserId, reason }
    );
  };

  return {
    logSecurityEvent,
    logLoginAttempt,
    logSuspiciousActivity,
    logAccountSuspension,
  };
};
