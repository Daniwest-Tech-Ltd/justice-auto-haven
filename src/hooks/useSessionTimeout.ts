import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SESSION_TIMEOUT = 10 * 60 * 1000;
const WARNING_TIME = 9 * 60 * 1000;
const COUNTDOWN_DURATION = 60;

export const useSessionTimeout = (enabled = true) => {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);
  const sessionIdRef = useRef<string | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const activityThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const trackingBlockedRef = useRef(false);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const isAuthError = (error: any) => {
    const status = error?.status ?? error?.code;
    return status === 401 || status === 403 || status === "401" || status === "403";
  };

  const clearAllTimers = useCallback(() => {
    if (warningTimerRef.current) { clearTimeout(warningTimerRef.current); warningTimerRef.current = null; }
    if (logoutTimerRef.current) { clearTimeout(logoutTimerRef.current); logoutTimerRef.current = null; }
    if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
  }, []);

  const updateTrackedSession = useCallback(async (payload: Record<string, string>) => {
    if (!sessionIdRef.current || trackingBlockedRef.current) return;
    const { error } = await supabase
      .from("sessions")
      .update(payload)
      .eq("id", sessionIdRef.current);
    if (error) {
      if (isAuthError(error)) { trackingBlockedRef.current = true; return; }
      console.error("Session tracking update failed:", error);
    }
  }, []);

  const doLogout = useCallback(async () => {
    if (!enabledRef.current) return;
    clearAllTimers();
    setShowWarning(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      if (user) {
        await supabase.from("profiles").update({ is_online: false }).eq("user_id", user.id);
      }
      if (sessionIdRef.current && !trackingBlockedRef.current) {
        await supabase.from("sessions").update({
          logout_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        }).eq("id", sessionIdRef.current);
      }
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      await supabase.auth.signOut();
      toast.error("Session expired. Please login again.");
      window.location.href = "/auth";
    }
  }, [clearAllTimers]);

  const startTimer = useCallback(() => {
    if (!enabledRef.current) return;
    clearAllTimers();

    warningTimerRef.current = setTimeout(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= WARNING_TIME) {
        setShowWarning(true);
        setCountdown(COUNTDOWN_DURATION);
        countdownIntervalRef.current = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        logoutTimerRef.current = setTimeout(() => { void doLogout(); }, COUNTDOWN_DURATION * 1000);
      } else {
        // Re-schedule
        startTimer();
      }
    }, WARNING_TIME);
  }, [clearAllTimers, doLogout]);

  const extendSession = useCallback(async () => {
    if (!enabledRef.current) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { await doLogout(); return; }
      await updateTrackedSession({ last_activity_at: new Date().toISOString() });
      setShowWarning(false);
      setCountdown(COUNTDOWN_DURATION);
      lastActivityRef.current = Date.now();
      startTimer();
      toast.success("Session extended successfully");
    } catch (error) {
      console.error("Failed to extend session:", error);
      toast.error("Failed to extend session");
    }
  }, [doLogout, startTimer, updateTrackedSession]);

  // Activity handler — uses refs to avoid circular deps
  useEffect(() => {
    if (!enabled) return;

    const onActivity = () => {
      lastActivityRef.current = Date.now();
      // Don't auto-extend if warning is showing — user must click
      if (!activityThrottleRef.current) {
        activityThrottleRef.current = setTimeout(async () => {
          await updateTrackedSession({ last_activity_at: new Date().toISOString() });
          activityThrottleRef.current = null;
        }, 30000);
      }
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach(e => window.addEventListener(e, onActivity));
    return () => {
      events.forEach(e => window.removeEventListener(e, onActivity));
      if (activityThrottleRef.current) { clearTimeout(activityThrottleRef.current); activityThrottleRef.current = null; }
    };
  }, [enabled, updateTrackedSession]);

  // Init session tracking
  useEffect(() => {
    if (!enabled) {
      clearAllTimers();
      setShowWarning(false);
      sessionIdRef.current = null;
      trackingBlockedRef.current = false;
      return;
    }

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        lastActivityRef.current = Date.now();
        if (trackingBlockedRef.current) return;

        const { data: existing, error: selErr } = await supabase
          .from("sessions").select("id").eq("user_id", session.user.id)
          .is("logout_at", null).order("login_at", { ascending: false }).limit(1).maybeSingle();

        if (selErr) {
          if (isAuthError(selErr)) { trackingBlockedRef.current = true; return; }
          throw selErr;
        }
        if (existing?.id) { sessionIdRef.current = existing.id; startTimer(); return; }

        const { data: newSess, error: insErr } = await supabase
          .from("sessions").insert({
            user_id: session.user.id,
            login_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString(),
          }).select("id").maybeSingle();

        if (insErr) {
          if (isAuthError(insErr)) { trackingBlockedRef.current = true; return; }
          throw insErr;
        }
        if (newSess?.id) { sessionIdRef.current = newSess.id; startTimer(); }
      } catch (error) {
        console.error("Error starting session:", error);
      }
    };

    void init();
    return () => { clearAllTimers(); };
  }, [enabled, clearAllTimers, startTimer]);

  return {
    showWarning,
    countdown,
    timeLeft: countdown,
    extendSession,
    handleLogout: doLogout,
  };
};
