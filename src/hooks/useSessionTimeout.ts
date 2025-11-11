import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const WARNING_TIME = 1 * 60 * 1000; // 1 minute before timeout

export const useSessionTimeout = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SESSION_TIMEOUT);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const resetTimer = useCallback(() => {
    setLastActivity(Date.now());
    setTimeLeft(SESSION_TIMEOUT);
    setShowWarning(false);
  }, []);

  const extendSession = useCallback(async () => {
    try {
      const { error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      resetTimer();
      toast.success("Session extended successfully");
    } catch (error) {
      console.error("Failed to extend session:", error);
      toast.error("Failed to extend session");
    }
  }, [resetTimer]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }, []);

  useEffect(() => {
    const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];
    
    const handleActivity = () => {
      resetTimer();
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [resetTimer]);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivity;
      const remaining = SESSION_TIMEOUT - elapsed;

      setTimeLeft(remaining);

      if (remaining <= WARNING_TIME && remaining > 0 && !showWarning) {
        setShowWarning(true);
      }

      if (remaining <= 0) {
        handleLogout();
        toast.error("Session expired. Please login again.");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastActivity, showWarning, handleLogout]);

  return {
    showWarning,
    timeLeft: Math.ceil(timeLeft / 1000),
    extendSession,
    handleLogout,
  };
};
