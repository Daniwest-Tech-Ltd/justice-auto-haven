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
  suspended_reason?: string;
  suspended_at?: string;
  blocked_at?: string;
  deleted_at?: string;
  lock_until?: string;
  reactivation_otp?: string;
  reactivation_otp_expires?: string;
  avatar_url?: string | null;
}

export interface UserRole {
  role: "admin" | "customer" | "super_admin" | "staff";
}

export interface AccountStatus {
  canLogin: boolean;
  reason?: 'suspended' | 'blocked' | 'deleted' | 'locked' | 'profile_not_found';
  message?: string;
  requiresOtp?: boolean;
  lockUntil?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);

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
        setAccountStatus(null);
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

  const checkAccountStatus = async (userId: string): Promise<AccountStatus> => {
    try {
      const { data, error } = await supabase.rpc('can_user_login', { _user_id: userId });
      
      if (error) {
        console.error("Error checking account status:", error);
        return { canLogin: true }; // Default to allowing login if check fails
      }

      const result = data as { 
        can_login: boolean; 
        reason?: string; 
        message?: string;
        requires_otp?: boolean;
        lock_until?: string;
      };

      return {
        canLogin: result.can_login,
        reason: result.reason as AccountStatus['reason'],
        message: result.message,
        requiresOtp: result.requires_otp,
        lockUntil: result.lock_until
      };
    } catch (error) {
      console.error("Error in checkAccountStatus:", error);
      return { canLogin: true };
    }
  };

  const fetchUserData = async (userId: string) => {
    try {
      // Check account status first
      const status = await checkAccountStatus(userId);
      setAccountStatus(status);

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
    // Update online status before signing out
    if (user?.id) {
      await supabase.from("profiles").update({
        is_online: false,
        last_seen: new Date().toISOString()
      }).eq("user_id", user.id);
    }
    
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRole(null);
    setAccountStatus(null);
  };

  const refreshAccountStatus = async () => {
    if (user?.id) {
      const status = await checkAccountStatus(user.id);
      setAccountStatus(status);
      return status;
    }
    return null;
  };

  return { 
    user, 
    profile, 
    role, 
    loading, 
    signOut, 
    accountStatus,
    refreshAccountStatus,
    isBlocked: accountStatus?.reason === 'blocked',
    isSuspended: accountStatus?.reason === 'suspended',
    isDeleted: accountStatus?.reason === 'deleted',
    isLocked: accountStatus?.reason === 'locked'
  };
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
