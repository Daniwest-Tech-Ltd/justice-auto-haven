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

export interface UserRole {
  role: "admin" | "customer" | "super_admin";
}

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

      // Determine role via SECURITY DEFINER RPC to avoid RLS blocking role checks.
      // If RPC is unavailable, fall back to a tight superadmin email allowlist.
      let resolvedRole: UserRole | null = null;

      const SUPERADMIN_EMAILS = [
        "daniwesttechnologies@gmail.com",
        "justicevincentt@gmail.com",
      ];

      try {
        const { data: isAdmin } = await supabase.rpc(
          "has_role" as any,
          { _user_id: userId, _role: "admin" } as any
        );

        if (isAdmin) {
          // has_role('admin') returns true for both admin + super_admin
          resolvedRole = { role: "admin" };
        } else {
          resolvedRole = { role: "customer" };
        }
      } catch {
        const emailLower = (profileData?.email || "").toLowerCase();
        resolvedRole = SUPERADMIN_EMAILS.includes(emailLower)
          ? { role: "admin" }
          : { role: "customer" };
      }

      setProfile(profileData as UserProfile | null);
      setRole(resolvedRole);
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
