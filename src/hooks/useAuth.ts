import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  gender?: string;
  county_city?: string;
  exact_location?: string;
  preferred_contact?: string;
  account_status?: "active" | "suspended" | "blocked";
  is_suspended?: boolean;
  avatar_url?: string | null;
}

export type AppRole = "super_admin" | "admin" | "staff" | "customer";

export interface UserRole {
  role: AppRole;
}

// Helper to check if role is an admin-type role
export const isAdminRole = (role: AppRole | undefined): boolean => {
  return role === "super_admin" || role === "admin";
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth changes first to avoid missing events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        setLoading(true);
        // Defer Supabase calls to avoid auth deadlocks
        setTimeout(() => {
          fetchUserData(session.user.id);
        }, 0);
      } else {
        setProfile(null);
        setRole(null);
        setLoading(false);
      }
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setLoading(true);
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      // Fetch role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      setProfile(profileData as UserProfile | null);
      setRole(roleData as UserRole | null);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRole(null);
  };

  return { user, profile, role, loading, signOut };
};

export const getGreeting = (name: string) => {
  const hour = new Date().getHours();
  let timeGreeting = "Good evening";
  
  if (hour < 12) {
    timeGreeting = "Good morning";
  } else if (hour < 17) {
    timeGreeting = "Good afternoon";
  } else if (hour < 21) {
    timeGreeting = "Good evening";
  } else {
    timeGreeting = "Good night";
  }
  
  return `${timeGreeting}, ${name}`;
};
