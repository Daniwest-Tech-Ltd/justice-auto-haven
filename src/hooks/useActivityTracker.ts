import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";

export const useActivityTracker = () => {
  const location = useLocation();
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Log activity
  const logActivity = async (
    actionType: string,
    targetTable?: string,
    targetId?: string,
    details?: any
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("activity_logs").insert({
        user_id: user.id,
        action_type: actionType,
        target_table: targetTable,
        target_id: targetId,
        details: details || {},
      });
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  // Start session on login
  const startSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("sessions")
        .insert({
          user_id: user.id,
          client_info: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
          },
        })
        .select()
        .single();

      if (error) throw error;
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

      await supabase
        .from("sessions")
        .update({
          logout_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .eq("id", sessionIdRef.current);

      stopHeartbeat();
      sessionIdRef.current = null;
    } catch (error) {
      console.error("Error ending session:", error);
    }
  };

  // Update last activity (heartbeat)
  const updateActivity = async () => {
    try {
      if (!sessionIdRef.current) return;

      await supabase
        .from("sessions")
        .update({
          last_activity_at: new Date().toISOString(),
        })
        .eq("id", sessionIdRef.current);
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
    logActivity("page_view", undefined, undefined, {
      path: location.pathname,
      timestamp: new Date().toISOString(),
    });
  }, [location.pathname]);

  // Initialize session tracking
  useEffect(() => {
    const initSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && !sessionIdRef.current) {
        await startSession();
      }
    };

    initSession();

    // Cleanup on unmount or tab close
    const handleBeforeUnload = () => {
      endSession();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      stopHeartbeat();
    };
  }, []);

  return {
    logActivity,
    startSession,
    endSession,
  };
};
