import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface UserPreferences {
  id?: string;
  user_id: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  whatsapp_notifications: boolean;
  security_alerts: boolean;
  hide_profile: boolean;
  hide_email: boolean;
  hide_phone: boolean;
  allow_session_tracking: boolean;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  device_info: string | null;
  ip_address: string | null;
  last_active: string;
  is_active: boolean;
  created_at: string;
}

const defaultPreferences: Omit<UserPreferences, 'user_id'> = {
  email_notifications: true,
  sms_notifications: false,
  push_notifications: true,
  whatsapp_notifications: false,
  security_alerts: true,
  hide_profile: false,
  hide_email: false,
  hide_phone: false,
  allow_session_tracking: true,
};

export const useUserPreferences = (userId: string | undefined) => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchPreferences();
      fetchSessions();
    }
  }, [userId]);

  const fetchPreferences = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPreferences(data as UserPreferences);
      } else {
        // Create default preferences if they don't exist
        const newPrefs = { ...defaultPreferences, user_id: userId };
        const { data: created, error: createError } = await supabase
          .from("user_preferences")
          .insert(newPrefs)
          .select()
          .single();

        if (createError) throw createError;
        setPreferences(created as UserPreferences);
      }
    } catch (error: any) {
      console.error("Error fetching preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("last_active", { ascending: false });

      if (error) throw error;
      setSessions((data || []) as UserSession[]);
    } catch (error: any) {
      console.error("Error fetching sessions:", error);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!userId || !preferences) return false;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("user_preferences")
        .update(updates)
        .eq("user_id", userId);

      if (error) throw error;

      setPreferences({ ...preferences, ...updates });
      toast({
        title: "Success",
        description: "Preferences saved successfully",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const logoutAllDevices = async () => {
    if (!userId) return false;

    setSaving(true);
    try {
      // Mark all sessions as inactive
      const { error: sessionError } = await supabase
        .from("user_sessions")
        .update({ is_active: false })
        .eq("user_id", userId);

      if (sessionError) throw sessionError;

      // Sign out the current user from Supabase Auth
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'global' });
      if (signOutError) throw signOutError;

      toast({
        title: "Success",
        description: "Logged out from all devices successfully",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const sendTestNotification = async (channel: 'email' | 'sms' | 'whatsapp') => {
    if (!userId) return false;

    try {
      // Get user profile for contact info
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email, phone, full_name")
        .eq("user_id", userId)
        .single();

      if (profileError) throw profileError;

      if (channel === 'email') {
        const { error } = await supabase.functions.invoke('send-notifications', {
          body: {
            type: 'test',
            email: profile.email,
            name: profile.full_name,
            subject: 'Test Email Notification',
            message: 'This is a test email notification from Justice Ultimate Automobiles. Your email notifications are working correctly!'
          }
        });
        if (error) throw error;
      } else if (channel === 'sms') {
        const { error } = await supabase.functions.invoke('send-sms', {
          body: {
            phone: profile.phone,
            message: 'Test SMS from Justice Ultimate Automobiles. Your SMS notifications are working correctly!'
          }
        });
        if (error) throw error;
      } else if (channel === 'whatsapp') {
        const { error } = await supabase.functions.invoke('send-whatsapp-message', {
          body: {
            phone: profile.phone,
            message: 'Test WhatsApp message from Justice Ultimate Automobiles. Your WhatsApp notifications are working correctly!'
          }
        });
        if (error) throw error;
      }

      toast({
        title: "Test Sent",
        description: `Test ${channel} notification sent successfully`,
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to send test ${channel}: ${error.message}`,
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    preferences,
    sessions,
    loading,
    saving,
    updatePreferences,
    logoutAllDevices,
    sendTestNotification,
    fetchSessions,
  };
};
