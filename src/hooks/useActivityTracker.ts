import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";

export const useActivityTracker = (enabled = true) => {
  const location = useLocation();
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackingBlockedRef = useRef(false);

  const isAuthError = (error: any) => {
    const status = error?.status ?? error?.code;
    return status === 401 || status === 403 || status === "401" || status === "403";
  };

  // Log activity - uses getSession (cache) instead of getUser (network)
  const logActivity = async (
    actionType: string,
    targetTable?: string,
    targetId?: string,
    details?: any
  ) => {
    if (!enabled || trackingBlockedRef.current) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase.from("activity_logs").insert({
        user_id: session.user.id,
        action_type: actionType,
        target_table: targetTable,
        target_id: targetId,
        details: details || {},
      });

      if (error) {
        if (isAuthError(error)) {
          trackingBlockedRef.current = true;
          return;
        }

        throw error;
      }
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  // Start session on login
  const startSession = async () => {
    if (!enabled || trackingBlockedRef.current || sessionIdRef.current) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: existingSession, error: existingSessionError } = await supabase
        .from("sessions")
        .select("id")
        .eq("user_id", session.user.id)
        .is("logout_at", null)
        .order("login_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSessionError) {
        if (isAuthError(existingSessionError)) {
          trackingBlockedRef.current = true;
          return;
        }

        throw existingSessionError;
      }

      if (existingSession?.id) {
        sessionIdRef.current = existingSession.id;
        startHeartbeat();
        return;
      }

      const { data, error } = await supabase
        .from("sessions")
        .insert({
          user_id: session.user.id,
          client_info: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
          },
        })
        .select()
        .maybeSingle();

      if (error) {
        if (isAuthError(error)) {
          trackingBlockedRef.current = true;
          return;
        }

        throw error;
      }

      if (!data?.id) return;
      sessionIdRef.current = data.id;

      // Start heartbeat
      startHeartbeat();
    } catch (error) {
      console.error("Error starting session:", error);
    }
  };

  // End session on logout
  const endSession = async () => {
    try {
      if (!sessionIdRef.current) return;

      const { error } = await supabase
        .from("sessions")
        .update({
          logout_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .eq("id", sessionIdRef.current);

      if (error && !isAuthError(error)) {
        throw error;
      }

      stopHeartbeat();
      sessionIdRef.current = null;
    } catch (error) {
      console.error("Error ending session:", error);
    }
  };

  // Update last activity (heartbeat)
  const updateActivity = async () => {
    if (!enabled || trackingBlockedRef.current) return;

    try {
      if (!sessionIdRef.current) return;

      const { error } = await supabase
        .from("sessions")
        .update({
          last_activity_at: new Date().toISOString(),
        })
        .eq("id", sessionIdRef.current);

      if (error) {
        if (isAuthError(error)) {
          trackingBlockedRef.current = true;
          stopHeartbeat();
          sessionIdRef.current = null;
          return;
        }

        throw error;
      }
    } catch (error) {
      console.error("Error updating activity:", error);
    }
  };

  // Start heartbeat (every 2 minutes)
  const startHeartbeat = () => {
    if (heartbeatIntervalRef.current) return;

    heartbeatIntervalRef.current = setInterval(() => {
      updateActivity();
    }, 2 * 60 * 1000); // 2 minutes
  };

  // Stop heartbeat
  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  // Log page views
  useEffect(() => {
    if (!enabled) return;

    logActivity("page_view", undefined, undefined, {
      path: location.pathname,
      timestamp: new Date().toISOString(),
    });
  }, [enabled, location.pathname]);

  // Initialize session tracking
  useEffect(() => {
    if (!enabled) {
      stopHeartbeat();
      sessionIdRef.current = null;
      trackingBlockedRef.current = false;
      return;
    }

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && !sessionIdRef.current) {
          await startSession();
        }
      } catch (error) {
        console.error("Error initializing session:", error);
      }
    };

    void initSession();

    // Cleanup on unmount or tab close
    const handleBeforeUnload = () => {
      endSession();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      stopHeartbeat();
    };
  }, [enabled]);

  return {
    logActivity,
    startSession,
    endSession,
  };
};
