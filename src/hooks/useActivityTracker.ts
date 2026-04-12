import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";

export const useActivityTracker = (enabled = true) => {
  const location = useLocation();
  const trackingBlockedRef = useRef(false);
  const lastLoggedPathRef = useRef<string | null>(null);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
    if (!enabled) {
      trackingBlockedRef.current = false;
    }
  }, [enabled]);

  const isAuthError = (error: any) => {
    const status = error?.status ?? error?.code;
    return status === 401 || status === 403 || status === "401" || status === "403";
  };

  // Log activity - fire-and-forget, no retries
  const logActivity = useCallback(async (
    actionType: string,
    targetTable?: string,
    targetId?: string,
    details?: any
  ) => {
    if (!enabledRef.current || trackingBlockedRef.current) return;

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
        // Silently fail - activity logging is non-critical
        console.warn("Activity log failed:", error.message);
      }
    } catch (error) {
      // Silently fail - never let logging break the app
      console.warn("Activity log error:", error);
    }
  }, []);

  // Log page views - deduplicated by path
  useEffect(() => {
    if (!enabled) return;
    if (lastLoggedPathRef.current === location.pathname) return;
    lastLoggedPathRef.current = location.pathname;

    logActivity("page_view", undefined, undefined, {
      path: location.pathname,
      timestamp: new Date().toISOString(),
    });
  }, [enabled, location.pathname, logActivity]);

  return { logActivity };
};
