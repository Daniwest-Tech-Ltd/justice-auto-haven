import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SESSION_TIMEOUT = 10 * 60 * 1000;
const WARNING_TIME = 9 * 60 * 1000;
const COUNTDOWN_DURATION = 60;

export const useSessionTimeout = (enabled = true) => {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const activityThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackingBlockedRef = useRef(false);

  const isAuthError = (error: any) => {
    const status = error?.status ?? error?.code;
    return status === 401 || status === 403 || status === "401" || status === "403";
  };

  const resetTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  }, []);

  const updateTrackedSession = useCallback(async (payload: Record<string, string>) => {
    if (!sessionId || trackingBlockedRef.current) return;

    const { error } = await supabase
      .from("sessions")
      .update(payload)
      .eq("id", sessionId);

    if (error) {
      if (isAuthError(error)) {
        trackingBlockedRef.current = true;
        return;
      }

      console.error("Session tracking update failed:", error);
    }
  }, [sessionId]);

  const startSessionTimer = useCallback(() => {
    if (!enabled) return;

    resetTimers();

    warningTimerRef.current = setTimeout(() => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;

      if (timeSinceLastActivity >= WARNING_TIME) {
        setShowWarning(true);
        setCountdown(COUNTDOWN_DURATION);

        countdownIntervalRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
              return 0;
            }

            return prev - 1;
          });
        }, 1000);

        logoutTimerRef.current = setTimeout(() => {
          void handleLogout();
        }, COUNTDOWN_DURATION * 1000);
      } else {
        startSessionTimer();
      }
    }, WARNING_TIME);
  }, [enabled, resetTimers]);

  const extendSession = useCallback(async () => {
    if (!enabled) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        await handleLogout();
        return;
      }

      await updateTrackedSession({ last_activity_at: new Date().toISOString() });
      setShowWarning(false);
      setCountdown(COUNTDOWN_DURATION);
      lastActivityRef.current = Date.now();
      startSessionTimer();
      toast.success("Session extended successfully");
    } catch (error) {
      console.error("Failed to extend session:", error);
      toast.error("Failed to extend session");
    }
  }, [enabled, startSessionTimer, updateTrackedSession]);

  const handleLogout = useCallback(async () => {
    if (!enabled) return;

    resetTimers();
    setShowWarning(false);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user ?? null;

      if (user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ is_online: false })
          .eq("user_id", user.id);

        if (profileError) {
          console.error("Failed to mark user offline:", profileError);
        }
      }

      await updateTrackedSession({
        logout_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      await supabase.auth.signOut();
      toast.error("Session expired. Please login again.");
      window.location.href = "/auth";
    }
  }, [enabled, resetTimers, updateTrackedSession]);

  const handleUserActivity = useCallback(() => {
    if (!enabled) return;

    lastActivityRef.current = Date.now();

    if (showWarning) {
      void extendSession();
      return;
    }

    if (!activityThrottleRef.current) {
      activityThrottleRef.current = setTimeout(async () => {
        await updateTrackedSession({ last_activity_at: new Date().toISOString() });
        activityThrottleRef.current = null;
      }, 30000);
    }
  }, [enabled, showWarning, extendSession, updateTrackedSession]);

  useEffect(() => {
    if (!enabled) {
      resetTimers();
      setShowWarning(false);
      setSessionId(null);
      trackingBlockedRef.current = false;

      if (activityThrottleRef.current) {
        clearTimeout(activityThrottleRef.current);
        activityThrottleRef.current = null;
      }

      return;
    }

    const initSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const user = session?.user;

        if (!user) return;

        lastActivityRef.current = Date.now();

        if (trackingBlockedRef.current) {
          return;
        }

        const { data: existingSessions, error: selectError } = await supabase
          .from("sessions")
          .select("id")
          .eq("user_id", user.id)
          .is("logout_at", null)
          .order("login_at", { ascending: false });

        if (selectError) {
          if (isAuthError(selectError)) {
            trackingBlockedRef.current = true;
            return;
          }

          throw selectError;
        }

        if (existingSessions && existingSessions.length > 0) {
          setSessionId(existingSessions[0].id);
          return;
        }

        const { data: newSession, error: insertError } = await supabase
          .from("sessions")
          .insert({
            user_id: user.id,
            login_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString(),
          })
          .select("id")
          .maybeSingle();

        if (insertError) {
          if (isAuthError(insertError)) {
            trackingBlockedRef.current = true;
            return;
          }

          throw insertError;
        }

        if (newSession?.id) {
          setSessionId(newSession.id);
        }
      } catch (error) {
        console.error("Error starting session:", error);
      }
    };

    void initSession();
  }, [enabled, resetTimers]);

  useEffect(() => {
    if (enabled && sessionId) {
      startSessionTimer();
    }
  }, [enabled, sessionId, startSessionTimer]);

  useEffect(() => {
    if (!enabled) return;

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];

    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity);
    });

    return () => {
      resetTimers();

      if (activityThrottleRef.current) {
        clearTimeout(activityThrottleRef.current);
        activityThrottleRef.current = null;
      }

      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [enabled, handleUserActivity, resetTimers]);

  return {
    showWarning,
    countdown,
    timeLeft: countdown,
    extendSession,
    handleLogout,
  };
};