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
  const mountedRef = useRef(true);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const isAuthError = (error: any) => {
    const status = error?.status ?? error?.code;
    return status === 401 || status === 403 || status === "401" || status === "403";
  };

  // All timer/state logic uses refs and direct function calls — no useCallback chains
  const clearAllTimers = () => {
    if (warningTimerRef.current) { clearTimeout(warningTimerRef.current); warningTimerRef.current = null; }
    if (logoutTimerRef.current) { clearTimeout(logoutTimerRef.current); logoutTimerRef.current = null; }
    if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
  };

  const updateTrackedSession = async (payload: Record<string, string>) => {
    if (!sessionIdRef.current || trackingBlockedRef.current) return;
    const { error } = await supabase
      .from("sessions")
      .update(payload)
      .eq("id", sessionIdRef.current);
    if (error && isAuthError(error)) {
      trackingBlockedRef.current = true;
    }
  };

  const doLogout = async () => {
    if (!mountedRef.current) return;
    clearAllTimers();
    if (mountedRef.current) setShowWarning(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        supabase.from("profiles").update({ is_online: false }).eq("user_id", session.user.id).then(() => {});
      }
      if (sessionIdRef.current && !trackingBlockedRef.current) {
        supabase.from("sessions").update({
          logout_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        }).eq("id", sessionIdRef.current).then(() => {});
      }
    } catch (e) {
      // ignore
    }
    await supabase.auth.signOut();
    toast.error("Session expired. Please login again.");
    window.location.href = "/auth";
  };

  const startTimer = () => {
    if (!enabledRef.current) return;
    clearAllTimers();

    warningTimerRef.current = setTimeout(() => {
      if (!mountedRef.current || !enabledRef.current) return;
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= WARNING_TIME) {
        setShowWarning(true);
        setCountdown(COUNTDOWN_DURATION);
        countdownIntervalRef.current = setInterval(() => {
          if (!mountedRef.current) return;
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
        startTimer();
      }
    }, WARNING_TIME);
  };

  const extendSession = useCallback(async () => {
    if (!enabledRef.current) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { void doLogout(); return; }
      updateTrackedSession({ last_activity_at: new Date().toISOString() });
      if (mountedRef.current) {
        setShowWarning(false);
        setCountdown(COUNTDOWN_DURATION);
      }
      lastActivityRef.current = Date.now();
      startTimer();
      toast.success("Session extended successfully");
    } catch (error) {
      console.error("Failed to extend session:", error);
      toast.error("Failed to extend session");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = useCallback(async () => {
    void doLogout();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Activity handler
  useEffect(() => {
    if (!enabled) return;

    const onActivity = () => {
      lastActivityRef.current = Date.now();
      if (!activityThrottleRef.current) {
        activityThrottleRef.current = setTimeout(() => {
          updateTrackedSession({ last_activity_at: new Date().toISOString() });
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return {
    showWarning,
    countdown,
    timeLeft: countdown,
    extendSession,
    handleLogout,
  };
};
