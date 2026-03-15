import { useState, useEffect, useRef } from "react";
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
  const fetchingForUserRef = useRef<string | null>(null);
  const isReadyRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async (userId: string, sessionUser: User) => {
      // Prevent duplicate fetches for the same user
      if (fetchingForUserRef.current === userId) return;
      fetchingForUserRef.current = userId;

      try {
        const [{ data: profileData, error: profileError }, { data: roleRows, error: rolesError }] =
          await Promise.all([
            supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
            supabase.from("user_roles").select("role").eq("user_id", userId),
          ]);

        if (!isMounted) return;

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Profile fetch error:", profileError);
        }
        if (rolesError) {
          console.error("Roles fetch error:", rolesError);
        }

        const userEmail = (sessionUser.email || "").toLowerCase();
        const roleList = (roleRows || []).map((row) => String(row.role));
        const hasAdminRole =
          ADMIN_EMAILS.includes(userEmail) || roleList.includes("admin") || roleList.includes("staff");

        const resolvedRole: UserRole = { role: hasAdminRole ? "admin" : "customer" };

        // Auto-provision role if missing
        if (!roleRows || roleRows.length === 0) {
          supabase
            .from("user_roles")
            .upsert({ user_id: userId, role: resolvedRole.role }, { onConflict: "user_id,role", ignoreDuplicates: true })
            .then(() => {});
        }

        let resolvedProfile = profileData as UserProfile | null;

        // Auto-provision profile if missing
        if (!resolvedProfile) {
          const fallbackName =
            sessionUser.user_metadata?.full_name ||
            sessionUser.user_metadata?.name ||
            sessionUser.email?.split("@")[0] ||
            "User";
          const fallbackEmail = sessionUser.email || "";

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

          if (!isMounted) return;

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

        if (isMounted) {
          setProfile(resolvedProfile);
          setRole(resolvedRole);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (isMounted) {
          // Still set a default role so redirect works
          const userEmail = (sessionUser.email || "").toLowerCase();
          const isAdmin = ADMIN_EMAILS.includes(userEmail);
          setRole({ role: isAdmin ? "admin" : "customer" });
          setLoading(false);
        }
      }
    };

    // Step 1: Restore session from storage FIRST
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        fetchUserData(sessionUser.id, sessionUser);
      } else {
        setLoading(false);
      }
      isReadyRef.current = true;
    });

    // Step 2: Listen for SUBSEQUENT auth changes (sign-in, sign-out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      // Skip TOKEN_REFRESHED - no need to re-fetch
      if (event === "TOKEN_REFRESHED") return;

      // Skip INITIAL_SESSION since getSession handles it
      if (event === "INITIAL_SESSION") return;

      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        // Reset fetch ref so we re-fetch on new sign-in
        if (event === "SIGNED_IN") {
          fetchingForUserRef.current = null;
          setLoading(true);
          // Defer to avoid auth deadlocks
          setTimeout(() => {
            if (isMounted) fetchUserData(sessionUser.id, sessionUser);
          }, 0);
        }
      } else {
        // Signed out
        fetchingForUserRef.current = null;
        setProfile(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    fetchingForUserRef.current = null;
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
