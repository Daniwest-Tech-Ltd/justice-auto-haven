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
  role: "admin" | "customer";
}

const ADMIN_EMAILS = ["daniwesttechnologies@gmail.com", "justicevincentt@gmail.com"];

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async (userId: string, sessionUser?: User) => {
      try {
        const [{ data: profileData, error: profileError }, { data: roleRows, error: rolesError }] =
          await Promise.all([
            supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
            supabase.from("user_roles").select("role").eq("user_id", userId),
          ]);

        if (profileError && profileError.code !== "PGRST116") {
          throw profileError;
        }

        if (rolesError) {
          throw rolesError;
        }

        const userEmail = (sessionUser?.email || "").toLowerCase();
        const roleList = (roleRows || []).map((row) => row.role);
        const hasAdminRole =
          ADMIN_EMAILS.includes(userEmail) || roleList.includes("admin") || roleList.includes("staff");

        let resolvedRole: UserRole = { role: hasAdminRole ? "admin" : "customer" };

        if (!roleRows || roleRows.length === 0) {
          await supabase
            .from("user_roles")
            .upsert({ user_id: userId, role: resolvedRole.role }, { onConflict: "user_id,role", ignoreDuplicates: true });
        }

        let resolvedProfile = profileData as UserProfile | null;

        if (!resolvedProfile) {
          const fallbackName =
            sessionUser?.user_metadata?.full_name ||
            sessionUser?.user_metadata?.name ||
            sessionUser?.email?.split("@")[0] ||
            "User";
          const fallbackEmail = sessionUser?.email || "";

          const { data: insertedProfile } = await supabase
            .from("profiles")
            .insert({
              user_id: userId,
              full_name: fallbackName,
              email: fallbackEmail,
              phone: "",
            })
            .select("*")
            .maybeSingle();

          resolvedProfile =
            (insertedProfile as UserProfile | null) ||
            ({
              id: userId,
              user_id: userId,
              full_name: fallbackName,
              email: fallbackEmail,
              phone: "",
            } as UserProfile);
        }

        setProfile(resolvedProfile);
        setRole(resolvedRole);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    // Listen for auth changes first to avoid missing events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        if (event === "TOKEN_REFRESHED") {
          return;
        }

        setLoading(true);
        // Defer Supabase calls to avoid auth deadlocks
        setTimeout(() => {
          fetchUserData(sessionUser.id, sessionUser);
        }, 0);
      } else {
        setProfile(null);
        setRole(null);
        setLoading(false);
      }
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) {
        setLoading(true);
        fetchUserData(sessionUser.id, sessionUser);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
