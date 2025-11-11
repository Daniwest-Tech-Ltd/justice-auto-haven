import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const WARNING_TIME = 1 * 60 * 1000; // 1 minute before timeout

export const useSessionTimeout = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SESSION_TIMEOUT);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [sessionId, setSessionId] = useState<string | null>(null);

  const resetTimer = useCallback(() => {
    setLastActivity(Date.now());
    setTimeLeft(SESSION_TIMEOUT);
    setShowWarning(false);
  }, []);

  const extendSession = useCallback(async () => {
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
      
      resetTimer();
      toast.success("Session extended successfully");
    } catch (error) {
      console.error("Failed to extend session:", error);
      toast.error("Failed to extend session");
    }
  }, [resetTimer, sessionId]);

  const handleLogout = useCallback(async () => {
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
      window.location.href = "/auth";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/auth";
    }
  }, [sessionId]);

  // Initialize session tracking
  useEffect(() => {
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
          // Log out all other sessions
          const otherSessionIds = existingSessions.slice(1).map(s => s.id);
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
  }, []);

  useEffect(() => {
    const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];
    
    const handleActivity = async () => {
      resetTimer();
      // Update last activity time in database
      if (sessionId) {
        await supabase
          .from("sessions")
          .update({ last_activity_at: new Date().toISOString() })
          .eq("id", sessionId);
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [resetTimer, sessionId]);

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
