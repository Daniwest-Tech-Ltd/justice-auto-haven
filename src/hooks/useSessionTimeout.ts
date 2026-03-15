import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const WARNING_TIME = 9 * 60 * 1000; // Show warning after 9 minutes (1 min before timeout)
const COUNTDOWN_DURATION = 60; // 60 seconds countdown

export const useSessionTimeout = (enabled = true) => {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const activityThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  }, []);

  const extendSession = useCallback(async () => {
    if (!enabled) return;

    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) throw error;

      // Update session activity
      if (sessionId) {
        await supabase
          .from("sessions")
          .update({ last_activity_at: new Date().toISOString() })
          .eq("id", sessionId);
      }

      setShowWarning(false);
      setCountdown(COUNTDOWN_DURATION);
      resetTimers();
      lastActivityRef.current = Date.now();

      // Restart session timer
      startSessionTimer();

      toast.success("Session extended successfully");
    } catch (error) {
      console.error("Failed to extend session:", error);
      toast.error("Failed to extend session");
    }
  }, [enabled, resetTimers, sessionId]);

  const handleLogout = useCallback(async () => {
    if (!enabled) return;

    resetTimers();
    setShowWarning(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Mark user as offline
      if (user) {
        await supabase
          .from("profiles")
          .update({ is_online: false })
          .eq("user_id", user.id);
      }

      // Mark session as logged out
      if (sessionId) {
        await supabase
          .from("sessions")
          .update({ logout_at: new Date().toISOString() })
          .eq("id", sessionId);
      }

      await supabase.auth.signOut();
      toast.error("Session expired. Please login again.");
      window.location.href = "/auth";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/auth";
    }
  }, [enabled, sessionId, resetTimers]);

  const startCountdown = useCallback(() => {
    if (!enabled) return;

    setCountdown(COUNTDOWN_DURATION);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [enabled, handleLogout]);

  const startSessionTimer = useCallback(() => {
    if (!enabled) return;

    resetTimers();

    // Show warning after 9 minutes
    warningTimerRef.current = setTimeout(() => {
      // Only show warning if user hasn't been active recently
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      if (timeSinceLastActivity >= WARNING_TIME) {
        setShowWarning(true);
        startCountdown();
      } else {
        // User was active, restart timer
        startSessionTimer();
      }
    }, WARNING_TIME);
  }, [enabled, resetTimers, startCountdown]);

  const handleUserActivity = useCallback(() => {
    if (!enabled) return;

    const now = Date.now();
    lastActivityRef.current = now;

    // If warning is showing and user becomes active, auto-extend
    if (showWarning) {
      extendSession();
    }

    // Throttle database updates to every 30 seconds
    if (!activityThrottleRef.current) {
      activityThrottleRef.current = setTimeout(async () => {
        if (sessionId) {
          await supabase
            .from("sessions")
            .update({ last_activity_at: new Date().toISOString() })
            .eq("id", sessionId);
        }
        activityThrottleRef.current = null;
      }, 30000);
    }
  }, [enabled, showWarning, extendSession, sessionId]);

  // Initialize session tracking
  useEffect(() => {
    if (!enabled) {
      resetTimers();
      setShowWarning(false);
      if (activityThrottleRef.current) {
        clearTimeout(activityThrottleRef.current);
        activityThrottleRef.current = null;
      }
      return;
    }

    const initSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check for existing active sessions
        const { data: existingSessions } = await supabase
          .from("sessions")
          .select("id")
          .eq("user_id", user.id)
          .is("logout_at", null)
          .order("login_at", { ascending: false });

        if (existingSessions && existingSessions.length > 0) {
          // Log out all other sessions (single session enforcement)
          const otherSessionIds = existingSessions.slice(1).map((s) => s.id);
          if (otherSessionIds.length > 0) {
            await supabase
              .from("sessions")
              .update({ logout_at: new Date().toISOString() })
              .in("id", otherSessionIds);
          }
          setSessionId(existingSessions[0].id);
        } else {
          // Create new session
          const { data: newSession } = await supabase
            .from("sessions")
            .insert({
              user_id: user.id,
              login_at: new Date().toISOString(),
              last_activity_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (newSession) {
            setSessionId(newSession.id);
          }
        }
      }
    };

    initSession();
  }, [enabled, resetTimers]);

  // Start session timer once session is initialized
  useEffect(() => {
    if (enabled && sessionId) {
      startSessionTimer();
    }
  }, [enabled, sessionId, startSessionTimer]);

  // Activity detection
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
      }
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [enabled, handleUserActivity, resetTimers]);

  return {
    showWarning,
    countdown,
    timeLeft: countdown, // For backwards compatibility
    extendSession,
    handleLogout,
  };
};