import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Facebook, Instagram, Linkedin, ArrowLeft, Mail, Chrome, Eye, EyeOff, Lock, UserPlus } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SuspendedUserModal } from "@/components/SuspendedUserModal";
import { TwoFactorDialog } from "@/components/TwoFactorDialog";
import { CompleteProfileDialog } from "@/components/CompleteProfileDialog";
import { useSecurityLogger } from "@/hooks/useSecurityLogger";
import { useTurnstile } from "@/hooks/useTurnstile";
import authBg from "@/assets/auth-bg.jpg";
import carLotOverlay from "@/assets/car-lot-overlay.jpg";
import maintenanceGif from "@/assets/maintenance.gif";
import googleIcon from "@/assets/google-icon.svg";
import githubIcon from "@/assets/github-icon.svg";
import facebookIcon from "@/assets/facebook-icon.svg";
import kenyaLocations from "@/data/kenya-locations.json";
import { Combobox } from "@/components/ui/combobox";
import { PhoneInputWithCountryCode } from "@/components/PhoneInputWithCountryCode";
import HolidayBanner from "@/components/HolidayBanner";
import { Snowfall } from "@/components/SeasonalEffects";

const TURNSTILE_SITE_KEY = "0x4AAAAAACB3OcIZy30ifRMd";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showSuspendedModal, setShowSuspendedModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [suspendedUntil, setSuspendedUntil] = useState<string>();
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [pendingUserEmail, setPendingUserEmail] = useState("");
  const [available2FAMethods, setAvailable2FAMethods] = useState({ email: true, totp: false, fingerprint: false, whatsapp: true });
  const [preferred2FAMethod, setPreferred2FAMethod] = useState("email_otp");
  const [otpTimeLeft, setOtpTimeLeft] = useState(600); // 10 minutes in seconds
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { logLoginAttempt, logSuspiciousActivity } = useSecurityLogger();
  
  // Turnstile CAPTCHA hooks for login and signup
  const loginTurnstile = useTurnstile(TURNSTILE_SITE_KEY);
  const signupTurnstile = useTurnstile(TURNSTILE_SITE_KEY);

  // Login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Registration form
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [gender, setGender] = useState<string[]>([]);
  const [countyCity, setCountyCity] = useState("");
  const [exactLocation, setExactLocation] = useState("");
  const [preferredContact, setPreferredContact] = useState("email");
  const [availableTowns, setAvailableTowns] = useState<string[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [countryCode, setCountryCode] = useState("+254"); // Default to Kenya

  const [maintenanceMode, setMaintenanceMode] = useState<{
    is_active: boolean;
    end_time: string | null;
    message: string;
  } | null>(null);
  const [maintenanceCountdown, setMaintenanceCountdown] = useState("");

  // Complete Profile Dialog state (for Google OAuth users who need to set password)
  const [showCompleteProfileDialog, setShowCompleteProfileDialog] = useState(false);
  const [completeProfileUserId, setCompleteProfileUserId] = useState("");
  const [completeProfileUserEmail, setCompleteProfileUserEmail] = useState("");
  const [completeProfileUserName, setCompleteProfileUserName] = useState("");
  const [pendingRedirectPath, setPendingRedirectPath] = useState("");

  useEffect(() => {
    // Check maintenance once on mount, don't check repeatedly
    checkMaintenanceMode();
    
    // Check for password reset success
    const resetSuccess = searchParams.get("reset");
    if (resetSuccess === "success") {
      toast({
        title: "Password Reset Successful",
        description: "Your password has been reset. Please login with your new password.",
      });
      // Clear the URL parameter
      window.history.replaceState({}, document.title, "/auth");
    }
    
    // Check if redirected from ProtectedRoute to complete profile
    const needsCompleteProfile = searchParams.get("complete_profile") === "true";
    if (needsCompleteProfile) {
      // Get current session and show the dialog
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, password_set, auth_provider")
            .eq("user_id", session.user.id)
            .maybeSingle();
          
          // Check for Google, GitHub, or Facebook OAuth users without password
          if (profile && (profile.auth_provider === 'google' || profile.auth_provider === 'github' || profile.auth_provider === 'facebook') && !profile.password_set) {
            const { data: roleData } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", session.user.id)
              .maybeSingle();
            
            const redirectPath = roleData?.role === "admin" ? "/admin-dashboard" : "/customer-dashboard";
            
            setCompleteProfileUserId(session.user.id);
            setCompleteProfileUserEmail(session.user.email || '');
            setCompleteProfileUserName(profile.full_name || session.user.email?.split('@')[0] || 'User');
            setPendingRedirectPath(redirectPath);
            setShowCompleteProfileDialog(true);
          }
        }
      });
      // Clear the URL parameter
      window.history.replaceState({}, document.title, "/auth");
    }
  }, []);

  useEffect(() => {
    if (maintenanceMode?.is_active && maintenanceMode.end_time) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const end = new Date(maintenanceMode.end_time!).getTime();
        const distance = end - now;

        if (distance < 0) {
          clearInterval(interval);
          setMaintenanceCountdown("System is back online!");
          checkMaintenanceMode();
          return;
        }

        const hours = Math.floor(distance / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setMaintenanceCountdown(`${hours}h ${minutes}m ${seconds}s`);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [maintenanceMode]);

  const checkMaintenanceMode = async () => {
    try {
      const { data, error } = await supabase
        .from("system_maintenance")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        const endTime = new Date(data.end_time);
        const now = new Date();
        if (endTime > now) {
          setMaintenanceMode({
            is_active: true,
            end_time: data.end_time,
            message: data.message || "System under maintenance. Please check back later."
          });
        } else {
          setMaintenanceMode(null);
        }
      } else {
        setMaintenanceMode(null);
      }
    } catch (error) {
      setMaintenanceMode(null);
    }
  };

  useEffect(() => {
    // Update available towns when county changes
    if (countyCity) {
      const county = kenyaLocations.counties.find((c: any) => c.name === countyCity);
      setAvailableTowns(county?.towns || []);
      setExactLocation(""); // Reset town when county changes
    }
  }, [countyCity]);

  // OTP countdown timer
  useEffect(() => {
    if (show2FADialog && otpTimeLeft > 0) {
      const timer = setInterval(() => {
        setOtpTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            toast({
              title: "OTP Expired",
              description: "Your verification code has expired. Please request a new one.",
              variant: "destructive",
            });
            setShow2FADialog(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [show2FADialog, otpTimeLeft]);

  // Reset OTP timer when dialog opens
  useEffect(() => {
    if (show2FADialog) {
      setOtpTimeLeft(600); // Reset to 10 minutes
    }
  }, [show2FADialog]);

  // Scroll register form to top when switching to sign up
  useEffect(() => {
    if (isSignUp) {
      const signUpContainer = document.querySelector('.sign-up-container');
      if (signUpContainer) {
        signUpContainer.scrollTop = 0;
      }
    }
  }, [isSignUp]);

  // Google OAuth login - redirects to dashboard after success
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/auth`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });

      if (error) {
        toast({
          title: "Google Login Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Google Login Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // GitHub OAuth login - redirects to dashboard after success
  const handleGitHubLogin = async () => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/auth`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: redirectUrl
        }
      });

      if (error) {
        toast({
          title: "GitHub Login Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "GitHub Login Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Facebook OAuth login - redirects to dashboard after success
  const handleFacebookLogin = async () => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/auth`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: redirectUrl,
          scopes: 'email'
        }
      });

      if (error) {
        toast({
          title: "Facebook Login Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Facebook Login Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Admin emails - these users always get admin role
  const ADMIN_EMAILS = [
    'daniwesttechnologies@gmail.com',
    'justicevincentt@gmail.com'
  ];

  // Handle OAuth callback (PKCE + legacy implicit) without duplicate code exchange
  useEffect(() => {
    const isGoogleCallback = searchParams.get("google_callback") === "true";
    const isGitHubCallback = searchParams.get("github_callback") === "true";
    const isFacebookCallback = searchParams.get("facebook_callback") === "true";
    const hasOAuthCode = Boolean(searchParams.get("code"));
    const hasOAuthError = Boolean(searchParams.get("error") || searchParams.get("error_description"));
    const hasLegacyHashToken = window.location.hash.includes("access_token");

    const isOAuthCallback =
      isGoogleCallback ||
      isGitHubCallback ||
      isFacebookCallback ||
      hasOAuthCode ||
      hasLegacyHashToken ||
      hasOAuthError;

    if (!isOAuthCallback) {
      return;
    }

    const callbackProvider = isFacebookCallback
      ? "facebook"
      : isGitHubCallback
      ? "github"
      : isGoogleCallback
      ? "google"
      : null;

    let isActive = true;
    let handled = false;

    const cleanupCallbackUrl = () => {
      if (window.location.pathname === "/auth") {
        window.history.replaceState({}, document.title, "/auth");
      }
    };

    const processOAuthSession = async (session: Session) => {
      const userEmail = session.user.email?.toLowerCase() || "";
      const isAdmin = ADMIN_EMAILS.includes(userEmail);
      const sessionProvider = session.user.app_metadata?.provider as string | undefined;
      const authProvider = callbackProvider || sessionProvider || "google";
      const oauthName =
        session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name ||
        session.user.email?.split("@")[0] ||
        "User";
      const oauthAvatar =
        session.user.user_metadata?.avatar_url ||
        session.user.user_metadata?.picture;

      const redirectPath = isAdmin ? "/admin-dashboard" : "/customer-dashboard";

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, full_name, password_set, auth_provider")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!existingProfile) {
        await supabase.from("profiles").insert({
          user_id: session.user.id,
          email: session.user.email || "",
          full_name: oauthName,
          phone: "",
          avatar_url: oauthAvatar,
          is_online: true,
          last_seen: new Date().toISOString(),
          password_set: false,
          auth_provider: authProvider,
        });

        const assignedRole = isAdmin ? "admin" : "customer";
        await supabase.from("user_roles").upsert(
          {
            user_id: session.user.id,
            role: assignedRole,
          },
          { onConflict: "user_id,role", ignoreDuplicates: true }
        );

        supabase.functions
          .invoke("send-welcome-email", {
            body: { email: session.user.email, name: oauthName, authProvider },
          })
          .catch(() => {});

        if (!isActive) return;
        setCompleteProfileUserId(session.user.id);
        setCompleteProfileUserEmail(userEmail);
        setCompleteProfileUserName(oauthName);
        setPendingRedirectPath(redirectPath);
        setShowCompleteProfileDialog(true);
        return;
      }

      const hasPassword = existingProfile.password_set === true;

      if (
        !hasPassword &&
        (existingProfile.auth_provider === "google" ||
          existingProfile.auth_provider === "github" ||
          existingProfile.auth_provider === "facebook")
      ) {
        supabase
          .from("profiles")
          .update({ is_online: true, last_seen: new Date().toISOString() })
          .eq("user_id", session.user.id)
          .then(() => {});

        const { data: roleRows } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);

        if (isAdmin) {
          await supabase
            .from("user_roles")
            .upsert({ user_id: session.user.id, role: "admin" }, { onConflict: "user_id,role", ignoreDuplicates: true });
        }

        const isAdminUser =
          isAdmin ||
          Boolean(roleRows?.some((row) => row.role === "admin" || row.role === "staff"));
        const finalRedirectPath = isAdminUser ? "/admin-dashboard" : "/customer-dashboard";

        if (!isActive) return;
        setCompleteProfileUserId(session.user.id);
        setCompleteProfileUserEmail(userEmail);
        setCompleteProfileUserName(existingProfile.full_name || oauthName);
        setPendingRedirectPath(finalRedirectPath);
        setShowCompleteProfileDialog(true);
        return;
      }

      const loginSound = new Audio("/sounds/notification.mp3");
      loginSound.volume = 0.5;
      loginSound.play().catch(() => {});

      supabase
        .from("profiles")
        .update({ is_online: true, last_seen: new Date().toISOString() })
        .eq("user_id", session.user.id)
        .then(() => {});

      const { data: roleRows } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      if (isAdmin) {
        await supabase
          .from("user_roles")
          .upsert({ user_id: session.user.id, role: "admin" }, { onConflict: "user_id,role", ignoreDuplicates: true });
      }

      const isAdminUser =
        isAdmin ||
        Boolean(roleRows?.some((row) => row.role === "admin" || row.role === "staff"));
      const displayName = existingProfile.full_name || session.user.email;

      sonnerToast.success(`Welcome back, ${displayName}! 🎉`, {
        description: `Logged in as ${isAdminUser ? "admin" : "customer"}`,
      });

      if (isActive) {
        navigate(isAdminUser ? "/admin-dashboard" : "/customer-dashboard", { replace: true });
      }
    };

    const handleAuthFailure = async (message: string) => {
      await supabase.auth.signOut({ scope: "local" });
      cleanupCallbackUrl();

      if (isActive) {
        setLoading(false);
        toast({
          title: "Login Failed",
          description: message,
          variant: "destructive",
        });
      }
    };

    const tryHandleSession = async (session: Session | null) => {
      if (!isActive || handled || !session?.user) return;

      handled = true;

      try {
        await processOAuthSession(session);
      } catch (error: any) {
        console.error("OAuth callback error:", error);
        await handleAuthFailure(error?.message || "Could not establish session. Please try again.");
      } finally {
        cleanupCallbackUrl();
        if (isActive) {
          setLoading(false);
        }
      }
    };

    setLoading(true);

    if (hasOAuthError) {
      const oauthError = searchParams.get("error_description") || searchParams.get("error") || "OAuth provider rejected the login request.";
      void handleAuthFailure(oauthError);
      return () => {
        isActive = false;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isActive || handled) return;
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        void tryHandleSession(session);
      }
    });

    const bootstrapTimer = window.setTimeout(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      await tryHandleSession(session);

      if (!handled && isActive) {
        await handleAuthFailure("Could not establish OAuth session. Please try again.");
      }
    }, 300);

    return () => {
      isActive = false;
      window.clearTimeout(bootstrapTimer);
      subscription.unsubscribe();
    };
  }, [navigate, searchParams, toast]);

  // Password strength checker
  const checkPasswordStrength = (pwd: string) => {
    const minLength = pwd.length >= 8;
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);

    const score =
      Number(minLength) +
      Number(hasUpperCase) +
      Number(hasLowerCase) +
      Number(hasNumber) +
      Number(hasSpecialChar);

    if (score < 3) return "weak";
    if (score < 5) return "medium";
    return "strong";
  };

  const passwordStrength = checkPasswordStrength(regPassword);

  const completeLogin = async (userId: string, userName?: string, userEmail?: string) => {
    try {
      // Play login success sound
      const loginSound = new Audio('/sounds/notification.mp3');
      loginSound.volume = 0.5;
      loginSound.play().catch(() => console.log('Audio play blocked'));
      
      // Fetch profile first to get email
      const { data: profileData } = await supabase
        .from("profiles")
        .update({
          is_online: true,
          last_seen: new Date().toISOString(),
          login_attempts: 0
        })
        .eq("user_id", userId)
        .select("full_name, email")
        .single();
      
      // Check if admin email - use provided email or fetch from profile
      const actualEmail = (userEmail || profileData?.email || '').toLowerCase();
      const isAdminEmail = ADMIN_EMAILS.includes(actualEmail);
      
      // If admin email, ensure admin role exists
      if (isAdminEmail) {
        await supabase
          .from("user_roles")
          .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role", ignoreDuplicates: true });
      }
      
      // Fetch the CURRENT role after any upgrade
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      
      const isAdmin = isAdminEmail || roleData?.role === "admin";
      const displayName = userName || profileData?.full_name || "User";
      
      sonnerToast.success(`Welcome back, ${displayName}! 🎉`, {
        description: `Logged in as ${isAdmin ? "admin" : "customer"}`,
      });

      // Redirect based on role - admins/superadmins go to admin-dashboard
      if (isAdmin) {
        navigate("/admin-dashboard", { replace: true });
      } else {
        navigate("/customer-dashboard", { replace: true });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const verify2FA = async () => {
    if (!pendingUserId || !twoFactorCode) {
      toast({
        title: "Error",
        description: "Please enter the verification code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Check if user has TOTP enabled
      if (preferred2FAMethod === "totp" && available2FAMethods.totp) {
        // Verify TOTP code using edge function
        const { data: totpResult, error: totpError } = await supabase.functions.invoke(
          'verify-totp-login',
          {
            body: {
              userId: pendingUserId,
              code: twoFactorCode
            }
          }
        );

        if (totpError || !totpResult?.success) {
          await logSuspiciousActivity(
            "Invalid TOTP Code",
            `Failed TOTP verification for user ${pendingUserId}`,
            undefined,
            { code: twoFactorCode }
          );
          
          toast({
            title: "Invalid Code",
            description: "The authenticator code is incorrect or expired",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // TOTP verified successfully
        setShow2FADialog(false);
        await completeLogin(pendingUserId, undefined, pendingUserEmail);
        return;
      }

      // Email OTP verification (existing logic)
      const { data: twoFAData, error: twoFAError } = await supabase
        .from("two_factor_auth")
        .select("*")
        .eq("user_id", pendingUserId)
        .eq("code", twoFactorCode)
        .eq("verified", false)
        .gte("expires_at", new Date().toISOString())
        .maybeSingle();

      if (twoFAError || !twoFAData) {
        await logSuspiciousActivity(
          "Invalid 2FA Code",
          `Failed 2FA verification for user ${pendingUserId}`,
          undefined,
          { code: twoFactorCode }
        );
        
        toast({
          title: "Invalid Code",
          description: "The verification code is incorrect or expired",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Mark code as verified
      await supabase
        .from("two_factor_auth")
        .update({ verified: true })
        .eq("id", twoFAData.id);

      setShow2FADialog(false);
      await completeLogin(pendingUserId, undefined, pendingUserEmail);
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSuspensionDuration = (): number => {
    return 60; // 1 hour suspension
  };

  const getEscalationReason = (isBlocked: boolean): string => {
    if (isBlocked) {
      return "Account blocked due to repeated failed login attempts after suspension period. Contact administrator for assistance.";
    }
    return "Account suspended for 1 hour due to 3 failed login attempts.";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get Turnstile CAPTCHA token (only enforce when widget is healthy)
    const captchaToken = loginTurnstile.getToken();

    if (loginTurnstile.isReady && !captchaToken) {
      toast({
        title: "CAPTCHA Required",
        description: "Please complete the CAPTCHA verification",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      // Check profile with optimized query (select only needed fields)
      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_id, email, full_name, is_suspended, account_status, suspended_reason, suspended_at, login_attempts, two_fa_enabled, preferred_2fa, totp_enabled, fingerprint_enabled")
        .eq("email", email)
        .maybeSingle();

      // Check if account is suspended or blocked - CANNOT LOGIN
      if (profileData?.is_suspended || profileData?.account_status === "suspended" || profileData?.account_status === "blocked") {
        // If account is blocked, always show the modal (requires admin intervention)
        if (profileData?.account_status === "blocked") {
          setShowSuspendedModal(true);
          setSuspensionReason(profileData.suspended_reason || "Account blocked. Contact administrator for assistance.");
          setLoading(false);
          return;
        }
        
        // For temporary suspensions, check if suspension has expired
        if (profileData.suspended_at) {
          const suspendedAt = new Date(profileData.suspended_at);
          const suspensionMinutes = getSuspensionDuration();
          const until = new Date(suspendedAt.getTime() + suspensionMinutes * 60000);
          
          // Check if suspension has expired
          if (new Date() < until) {
            setSuspendedUntil(until.toISOString());
            setShowSuspendedModal(true);
            setSuspensionReason(profileData.suspended_reason || "Account suspended");
            setLoading(false);
            return;
          } else {
            // Suspension expired, but keep login_attempts count to track if user fails again
            // DO NOT reset login_attempts here - only reset on successful login
            await supabase
              .from("profiles")
              .update({
                is_suspended: false,
                account_status: "active",
                suspended_reason: null,
                suspended_at: null,
                activation_code: null
                // Keep login_attempts to track if this is post-suspension failure
              })
              .eq("user_id", profileData.user_id);
          }
        } else {
          // No suspended_at timestamp, show modal anyway
          setShowSuspendedModal(true);
          setSuspensionReason(profileData.suspended_reason || "Account suspended");
          setLoading(false);
          return;
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: captchaToken ? { captchaToken } : undefined,
      });

      if (error) {
        // Reset CAPTCHA on error
        loginTurnstile.reset();
        
        // Track failed login attempt
        if (profileData) {
          const newAttempts = (profileData.login_attempts || 0) + 1;
          const now = new Date().toISOString();
          
          // Check if this is a post-suspension attempt (was previously suspended)
          const wasPreviouslySuspended = profileData.account_status === "suspended" || profileData.is_suspended;
          
          if (newAttempts >= 3) {
            // Generate activation code - try RPC first, fallback to random generation
            let activationCode = '';
            try {
              const { data: codeData, error: rpcError } = await supabase.rpc('generate_activation_code');
              if (rpcError) {
                console.error('RPC error generating activation code:', rpcError);
                activationCode = Math.random().toString(36).substring(2, 10).toUpperCase();
              } else {
                activationCode = codeData || Math.random().toString(36).substring(2, 10).toUpperCase();
              }
            } catch (err) {
              console.error('Failed to call RPC for activation code:', err);
              activationCode = Math.random().toString(36).substring(2, 10).toUpperCase();
            }
            
            console.log('Generated activation code on failed login:', activationCode);
            
            let updateData: any = {
              login_attempts: newAttempts,
              last_login_attempt: now,
              suspended_at: now,
            };
            
            // If user was previously suspended and failed again, block immediately
            if (wasPreviouslySuspended) {
              updateData.is_suspended = true;
              updateData.account_status = "blocked";
              updateData.suspended_reason = getEscalationReason(true);
              updateData.activation_code = activationCode;
              
              // Send blocked notification email
              try {
                await supabase.functions.invoke('send-suspension-notification', {
                  body: {
                    email: profileData.email,
                    name: profileData.full_name,
                    reason: updateData.suspended_reason,
                    isBlocked: true
                  }
                });
              } catch (emailError) {
                console.error("Failed to send block notification email:", emailError);
              }
              
              toast({
                title: "Account Blocked",
                description: "Your account has been blocked. Check your email for details.",
                variant: "destructive",
              });
            } else {
              // First time hitting 3 attempts: suspend for 1 hour
              updateData.is_suspended = true;
              updateData.account_status = "suspended";
              updateData.suspended_reason = getEscalationReason(false);
              updateData.activation_code = activationCode;
              
              const suspensionMinutes = getSuspensionDuration();
              const until = new Date(new Date(now).getTime() + suspensionMinutes * 60000);
              setSuspendedUntil(until.toISOString());
              
              // Send suspension notification email
              try {
                await supabase.functions.invoke('send-suspension-notification', {
                  body: {
                    email: profileData.email,
                    name: profileData.full_name,
                    reason: updateData.suspended_reason,
                    isBlocked: false
                  }
                });
              } catch (emailError) {
                console.error("Failed to send suspension notification email:", emailError);
              }
              
              toast({
                title: "Account Suspended",
                description: `Your account has been suspended for 1 hour. Check your email for details.`,
                variant: "destructive",
              });
            }
            
            const { error: updateError, data: updatedProfile } = await supabase
              .from("profiles")
              .update(updateData)
              .eq("user_id", profileData.user_id)
              .select();
            
            if (updateError) {
              console.error('Failed to update profile with suspension:', updateError);
            } else {
              console.log('Profile updated with activation code:', updatedProfile);
            }
            
            await logLoginAttempt(
              profileData.user_id,
              false,
              "Failed login attempt with incorrect password"
            );
            
            setSuspensionReason(updateData.suspended_reason);
            setShowSuspendedModal(true);
          } else {
            // Update attempts but don't suspend yet
            await supabase
              .from("profiles")
              .update({
                login_attempts: newAttempts,
                last_login_attempt: now
              })
              .eq("user_id", profileData.user_id);
            
            toast({
              title: "Login Failed",
              description: `Invalid credentials. ${3 - newAttempts} attempts remaining before suspension.`,
              variant: "destructive",
            });
          }
        } else {
          // Log failed attempt
          await logLoginAttempt(email, false);
          
          // Check if error is CAPTCHA related
          const isCaptchaError = error.message.toLowerCase().includes('captcha') || 
                                 error.message.toLowerCase().includes('turnstile');
          
          toast({
            title: isCaptchaError ? "CAPTCHA Verification Failed" : "Login Failed",
            description: isCaptchaError 
              ? "CAPTCHA verification failed. Please try again." 
              : error.message,
            variant: "destructive",
          });
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        const currentUserId = data.user.id;
        
        // Use cached profile data from earlier check
        const cachedProfile = profileData || await (async () => {
          const { data: profData } = await supabase
            .from("profiles")
            .select("two_fa_enabled, preferred_2fa, totp_enabled, fingerprint_enabled, full_name")
            .eq("user_id", currentUserId)
            .single();
          return profData;
        })();

        // ALWAYS require 2FA for ALL users - email OTP is the mandatory default
        // Additional methods available only if user has configured them
        const has2FAConfigured = cachedProfile?.two_fa_enabled;
        const hasTotp = cachedProfile?.totp_enabled || false;
        const hasFingerprint = cachedProfile?.fingerprint_enabled || false;
        
        setAvailable2FAMethods({
          email: true, // Email OTP always available and mandatory
          totp: hasTotp,
          fingerprint: hasFingerprint,
          whatsapp: true, // WhatsApp OTP available as alternative
        });
        
        // Always default to email_otp - user can switch if they have other methods
        setPreferred2FAMethod("email_otp");
        
        setPendingUserId(currentUserId);
        setPendingUserEmail(email);
        
        // The TwoFactorDialog will auto-send email OTP when it opens
        setShow2FADialog(true);
        setLoading(false);
        return;
      }
    } catch (error: any) {
      // Reset CAPTCHA on error
      loginTurnstile.reset();
      
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get Turnstile CAPTCHA token
    const captchaToken = signupTurnstile.getToken();
    
    if (!captchaToken) {
      toast({
        title: "CAPTCHA Required",
        description: "Please complete the CAPTCHA verification",
        variant: "destructive",
      });
      return;
    }

    if (!termsAccepted) {
      toast({
        title: "Terms Required",
        description: "You must agree to the Terms and Conditions to register",
        variant: "destructive",
      });
      return;
    }
    
    if (regPassword !== regConfirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordStrength === "weak") {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters with uppercase, lowercase, numbers, and special characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/auth`;
      
      // Format full phone number with country code
      const fullPhone = `${countryCode}${regPhone}`;
      
      const { data, error } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          emailRedirectTo: redirectUrl,
          captchaToken,
          data: {
            full_name: regFullName,
            phone: fullPhone,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Update profile with additional details including country code
        await supabase.from("profiles").update({
          gender: gender[0],
          county_city: countyCity,
          exact_location: exactLocation,
          preferred_contact: preferredContact,
          country_code: countryCode,
        }).eq("user_id", data.user.id);

        setShowSuccessDialog(true);
      }
    } catch (error: any) {
      // Reset CAPTCHA on error
      signupTurnstile.reset();
      
      // Check if error is CAPTCHA related
      const isCaptchaError = error.message.toLowerCase().includes('captcha') || 
                             error.message.toLowerCase().includes('turnstile');
      
      toast({
        title: isCaptchaError ? "CAPTCHA Verification Failed" : "Registration Failed",
        description: isCaptchaError 
          ? "CAPTCHA verification failed. Please try again." 
          : error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Snowfall is now handled by the SeasonalEffects component

  if (maintenanceMode?.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardContent className="pt-8 pb-8 space-y-6">
            <div className="text-center space-y-4">
              <img 
                src={maintenanceGif} 
                alt="System under maintenance" 
                className="w-40 h-40 mx-auto object-contain"
              />
              <h2 className="text-2xl font-bold text-foreground">System Under Maintenance</h2>
              <p className="text-muted-foreground">{maintenanceMode.message}</p>
              
              {maintenanceCountdown && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Estimated time remaining:</p>
                  <p className="text-3xl font-bold text-primary">{maintenanceCountdown}</p>
                </div>
              )}
              
              <p className="text-sm text-muted-foreground">
                We apologize for the inconvenience. Our team is working hard to improve your experience.
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => navigate("/")} 
                variant="outline" 
                className="flex-1"
              >
                Back to Home
              </Button>
              <Button 
                onClick={() => navigate("/catalogue")} 
                className="flex-1"
              >
                See Catalogue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Snowfall />
      <HolidayBanner />
      <div 
        className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${authBg})` }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
        
        <Link to="/" className="absolute top-4 left-4 z-50">
          <Button variant="outline" size="icon" className="glass">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>

        <div
          className={`glass-strong rounded-lg shadow-2xl max-w-4xl w-full min-h-[600px] md:max-h-[95vh] overflow-hidden relative transition-all duration-700 z-10 ${
            isSignUp ? "auth-panel-active" : ""
          }`}
        >
          {/* Sign In Form */}
          <div className="auth-form-container sign-in-container absolute top-0 left-0 w-full md:w-1/2 h-full flex items-center justify-center z-20 transition-all duration-700 overflow-y-auto md:overflow-hidden">
            <form onSubmit={handleLogin} className="auth-form-glass rounded-2xl p-6 md:p-12 flex flex-col items-center justify-center text-center space-y-4 md:space-y-6 w-full max-w-md my-4 md:my-0 shadow-[0_20px_60px_rgba(0,0,0,0.4)] hover:shadow-[0_25px_70px_rgba(0,0,0,0.5)] transition-all duration-300 transform hover:scale-[1.02]">
              <h1 className="text-4xl font-bold mb-6 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] animate-fade-in">Login</h1>
              <Input 
                type="email" 
                placeholder="Email" 
                className="h-12 px-4 bg-white/20 dark:bg-white/10 backdrop-blur-md border-2 border-white/30 dark:border-white/20 rounded-xl text-foreground placeholder:text-foreground/60 focus:border-primary focus:bg-white/30 dark:focus:bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.1)] focus:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="relative w-full">
                <Input 
                  type={showLoginPassword ? "text" : "password"} 
                  placeholder="Password" 
                  className="h-12 px-4 bg-white/20 dark:bg-white/10 backdrop-blur-md border-2 border-white/30 dark:border-white/20 rounded-xl text-foreground placeholder:text-foreground/60 focus:border-primary focus:bg-white/30 dark:focus:bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.1)] focus:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-200 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/70 hover:text-foreground transition-colors"
                  aria-label={showLoginPassword ? "Hide password" : "Show password"}
                >
                  {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Cloudflare Turnstile CAPTCHA */}
              <div ref={loginTurnstile.containerRef} className="w-full flex justify-center" />
              
              <Link to="/reset-password" className="text-sm text-white hover:text-accent transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">
                Forgot Password?
              </Link>
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-b from-[hsl(var(--primary))] to-[hsl(var(--primary)/0.7)] text-primary-foreground font-bold text-lg py-6 rounded-full border-4 border-muted shadow-[0_4px_6px_rgba(0,0,0,0.3),inset_0_2px_5px_rgba(255,255,255,0.6),inset_0_-3px_5px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_12px_rgba(0,0,0,0.4),inset_0_2px_5px_rgba(255,255,255,0.8),inset_0_-3px_5px_rgba(0,0,0,0.2)] hover:-translate-y-1 active:translate-y-0.5 transition-all duration-200"
              >
                <span className={`flex items-center justify-center w-10 h-10 rounded-full bg-background text-primary border-4 border-muted-foreground/30 shadow-[0_2px_4px_rgba(0,0,0,0.3),inset_0_2px_5px_rgba(255,255,255,0.8),inset_0_-2px_5px_rgba(0,0,0,0.2)] ${loading ? 'animate-padlock-open' : ''}`}>
                  <Lock className="w-5 h-5" />
                </span>
                {loading ? "Logging in..." : "Sign In"}
              </Button>
              
              <div className="relative w-full my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/30" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-transparent px-2 text-white/80">Or continue with</span>
                </div>
              </div>

              <TooltipProvider>
                <div className="flex justify-center gap-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        variant="outline"
                        size="icon"
                        className="w-14 h-14 rounded-full border-2 border-white/30 bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300 shadow-[0_6px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.5)] transform hover:scale-110 hover:-translate-y-1"
                      >
                        <img src={googleIcon} alt="Google" className="h-7 w-7" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-background border border-border shadow-lg">
                      <p className="font-semibold">Google</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        onClick={handleGitHubLogin}
                        disabled={loading}
                        variant="outline"
                        size="icon"
                        className="w-14 h-14 rounded-full border-2 border-white/30 bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300 shadow-[0_6px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.5)] transform hover:scale-110 hover:-translate-y-1"
                      >
                        <img src={githubIcon} alt="GitHub" className="h-7 w-7 invert" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-background border border-border shadow-lg">
                      <p className="font-semibold">GitHub</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        onClick={handleFacebookLogin}
                        disabled={loading}
                        variant="outline"
                        size="icon"
                        className="w-14 h-14 rounded-full border-2 border-white/30 bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300 shadow-[0_6px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.5)] transform hover:scale-110 hover:-translate-y-1"
                      >
                        <img src={facebookIcon} alt="Facebook" className="h-7 w-7" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-background border border-border shadow-lg">
                      <p className="font-semibold">Facebook</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </form>
          </div>

          {/* Sign Up Form */}
          <div className="auth-form-container sign-up-container absolute top-0 left-0 w-full md:w-1/2 h-full z-10 md:opacity-0 transition-all duration-700 overflow-y-auto bg-gradient-to-br from-background/98 via-card/98 to-background/98">
            <form onSubmit={handleRegister} className="auth-form-glass p-4 md:p-6 flex flex-col text-center space-y-2 md:space-y-3 w-full max-w-md mt-4 mb-4 mx-auto shadow-[0_20px_60px_rgba(0,0,0,0.4)] hover:shadow-[0_25px_70px_rgba(0,0,0,0.5)] transition-all duration-300 transform hover:scale-[1.02]">
              <h1 className="text-2xl font-bold mb-2 text-foreground drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] animate-fade-in">Registration</h1>
              
              <Input 
                type="text" 
                placeholder="Full Name" 
                className="h-12 px-4 bg-white/20 dark:bg-white/10 backdrop-blur-md border-2 border-white/30 dark:border-white/20 rounded-xl text-foreground placeholder:text-foreground/60 focus:border-primary focus:bg-white/30 dark:focus:bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.1)] focus:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-200"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                required
              />
              <Input 
                type="email" 
                placeholder="Email" 
                className="h-12 px-4 bg-white/20 dark:bg-white/10 backdrop-blur-md border-2 border-white/30 dark:border-white/20 rounded-xl text-foreground placeholder:text-foreground/60 focus:border-primary focus:bg-white/30 dark:focus:bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.1)] focus:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-200"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />
              <PhoneInputWithCountryCode
                value={regPhone}
                onChange={setRegPhone}
                countryCode={countryCode}
                onCountryCodeChange={setCountryCode}
                placeholder="Phone number"
                required
              />
              
              <div className="w-full space-y-2">
                <div className="relative">
                  <Input 
                    type={showRegPassword ? "text" : "password"} 
                    placeholder="Password" 
                    className="h-12 px-4 bg-white/20 dark:bg-white/10 backdrop-blur-md border-2 border-white/30 dark:border-white/20 rounded-xl text-foreground placeholder:text-foreground/60 focus:border-primary focus:bg-white/30 dark:focus:bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.1)] focus:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-200 pr-10"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/70 hover:text-foreground transition-colors"
                    aria-label={showRegPassword ? "Hide password" : "Show password"}
                  >
                    {showRegPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {regPassword && (
                  <p className={`text-xs ${
                    passwordStrength === "strong" ? 'text-green-400' : 
                    passwordStrength === "medium" ? 'text-yellow-400' : 
                    'text-red-400'
                  }`}>
                    Password strength: {passwordStrength}
                  </p>
                )}
              </div>

              <div className="relative w-full">
                <Input 
                  type={showRegConfirmPassword ? "text" : "password"} 
                  placeholder="Confirm Password" 
                  className="h-12 px-4 bg-white/20 dark:bg-white/10 backdrop-blur-md border-2 border-white/30 dark:border-white/20 rounded-xl text-foreground placeholder:text-foreground/60 focus:border-primary focus:bg-white/30 dark:focus:bg-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.1)] focus:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all duration-200 pr-10"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/70 hover:text-foreground transition-colors"
                  aria-label={showRegConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showRegConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <div className="w-full text-left space-y-2">
                <Label className="text-sm text-foreground font-medium">Gender (Optional)</Label>
                <div className="flex flex-wrap gap-4">
                  {["female", "male", "rather_not_say", "other"].map((g) => (
                    <div key={g} className="flex items-center space-x-2">
                      <Checkbox
                        id={g}
                        checked={gender.includes(g)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setGender([g]);
                          } else {
                            setGender([]);
                          }
                        }}
                      />
                      <label htmlFor={g} className="text-sm capitalize text-foreground cursor-pointer">
                        {g.replace("_", " ")}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="w-full">
                  <Label className="text-sm mb-2 text-foreground font-medium block text-left">County</Label>
                  <Combobox
                    options={kenyaLocations.counties.map((county: any) => county.name)}
                    value={countyCity}
                    onValueChange={setCountyCity}
                    placeholder="Search county..."
                    searchPlaceholder="Search counties..."
                    emptyMessage="No county found."
                  />
                </div>
                
                <div className="w-full">
                  <Label className="text-sm mb-2 text-foreground font-medium block text-left">Town / Location</Label>
                  <Combobox
                    options={availableTowns}
                    value={exactLocation}
                    onValueChange={setExactLocation}
                    placeholder={countyCity ? "Search town..." : "First select county"}
                    searchPlaceholder="Search towns..."
                    emptyMessage="No town found."
                  />
                </div>
              </div>

              <div className="w-full text-left space-y-2">
                <Label className="text-sm text-foreground font-medium">Preferred Contact Method</Label>
                <RadioGroup value={preferredContact} onValueChange={setPreferredContact}>
                  <div className="flex gap-4">
                    {["email", "phone", "whatsapp"].map((method) => (
                      <div key={method} className="flex items-center space-x-2">
                        <RadioGroupItem value={method} id={method} />
                        <Label htmlFor={method} className="capitalize text-foreground cursor-pointer">{method}</Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <div className="w-full flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  required
                />
                <Label htmlFor="terms" className="text-sm text-foreground cursor-pointer leading-relaxed">
                  I agree to the{" "}
                  <a 
                    href="https://www.justiceultimateautomobiles.com/terms" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-medium"
                  >
                    Terms and Conditions
                  </a>
                </Label>
              </div>
              
              {/* Cloudflare Turnstile CAPTCHA */}
              <div ref={signupTurnstile.containerRef} className="w-full flex justify-center" />

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-b from-[hsl(var(--primary))] to-[hsl(var(--primary)/0.7)] text-primary-foreground font-bold text-lg py-6 rounded-full border-4 border-muted shadow-[0_4px_6px_rgba(0,0,0,0.3),inset_0_2px_5px_rgba(255,255,255,0.6),inset_0_-3px_5px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_12px_rgba(0,0,0,0.4),inset_0_2px_5px_rgba(255,255,255,0.8),inset_0_-3px_5px_rgba(0,0,0,0.2)] hover:-translate-y-1 active:translate-y-0.5 transition-all duration-200"
              >
                <span className={`flex items-center justify-center w-10 h-10 rounded-full bg-background text-primary border-4 border-muted-foreground/30 shadow-[0_2px_4px_rgba(0,0,0,0.3),inset_0_2px_5px_rgba(255,255,255,0.8),inset_0_-2px_5px_rgba(0,0,0,0.2)] ${loading ? 'animate-register-pulse' : ''}`}>
                  <UserPlus className="w-5 h-5" />
                </span>
                {loading ? "Registering..." : "Register"}
              </Button>
              
              <div className="relative w-full my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <TooltipProvider>
                <div className="flex justify-center gap-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        variant="outline"
                        size="icon"
                        className="w-14 h-14 rounded-full border-2 border-border/50 hover:border-primary/50 hover:bg-accent transition-all duration-300 shadow-[0_6px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.5)] transform hover:scale-110 hover:-translate-y-1"
                      >
                        <img src={googleIcon} alt="Google" className="h-7 w-7" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-background border border-border shadow-lg">
                      <p className="font-semibold">Google</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        onClick={handleGitHubLogin}
                        disabled={loading}
                        variant="outline"
                        size="icon"
                        className="w-14 h-14 rounded-full border-2 border-border/50 hover:border-primary/50 hover:bg-accent transition-all duration-300 shadow-[0_6px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.5)] transform hover:scale-110 hover:-translate-y-1"
                      >
                        <img src={githubIcon} alt="GitHub" className="h-7 w-7 dark:invert" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-background border border-border shadow-lg">
                      <p className="font-semibold">GitHub</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        onClick={handleFacebookLogin}
                        disabled={loading}
                        variant="outline"
                        size="icon"
                        className="w-14 h-14 rounded-full border-2 border-border/50 hover:border-primary/50 hover:bg-accent transition-all duration-300 shadow-[0_6px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.5)] transform hover:scale-110 hover:-translate-y-1"
                      >
                        <img src={facebookIcon} alt="Facebook" className="h-7 w-7" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-background border border-border shadow-lg">
                      <p className="font-semibold">Facebook</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </form>
          </div>

          {/* Overlay Container - Hidden on Mobile */}
          <div className="overlay-container hidden md:block absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 z-30">
            <div className="overlay relative left-[-100%] h-full w-[200%] transform transition-transform duration-700 flex">
              {/* Left Overlay - Shows on Register (with car lot image) */}
              <div 
                className="overlay-panel overlay-left absolute flex items-center justify-center flex-col px-12 text-center top-0 h-full w-1/2 transform transition-transform duration-700 bg-cover bg-center"
                style={{ backgroundImage: `url(${carLotOverlay})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-primary/60 via-primary/50 to-primary/70 backdrop-blur-[2px]" />
                <div className="relative z-10 transform hover:scale-105 transition-all duration-300">
                  <h1 className="text-5xl font-bold text-white mb-6 animate-fade-in" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)' }}>
                    Welcome Back to Justice System
                  </h1>
                  <p className="text-xl text-white mb-8" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>
                    Already have an account?
                  </p>
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-white text-primary border-2 border-white hover:bg-white/90 hover:scale-110 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.7)] font-semibold px-8 py-6 text-lg transform hover:-translate-y-1"
                    onClick={() => setIsSignUp(false)}
                    type="button"
                  >
                    Sign In
                  </Button>
                </div>
              </div>

              {/* Right Overlay - Shows on Login (with car lot image) */}
              <div 
                className="overlay-panel overlay-right absolute right-0 flex items-center justify-center flex-col px-12 text-center top-0 h-full w-1/2 transform transition-transform duration-700 bg-cover bg-center"
                style={{ backgroundImage: `url(${carLotOverlay})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-primary/60 via-primary/50 to-primary/70 backdrop-blur-[2px]" />
                <div className="relative z-10 transform hover:scale-105 transition-all duration-300">
                  <h1 className="text-5xl font-bold text-white mb-6 animate-fade-in" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)' }}>
                    Hello, Welcome to Justice Ultimate System
                  </h1>
                  <p className="text-xl text-white mb-8" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>
                    Don't have an account?
                  </p>
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-white text-primary border-2 border-white hover:bg-white/90 hover:scale-110 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.7)] font-semibold px-8 py-6 text-lg transform hover:-translate-y-1"
                    onClick={() => setIsSignUp(true)}
                    type="button"
                  >
                    Sign Up
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Toggle Buttons */}
          <div className="md:hidden absolute top-4 right-4 z-50 flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={!isSignUp ? "default" : "outline"}
              onClick={() => setIsSignUp(false)}
              className="text-xs shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.6)] transform hover:scale-105 transition-all duration-300"
            >
              Sign In
            </Button>
            <Button
              type="button"
              size="sm"
              variant={isSignUp ? "default" : "outline"}
              onClick={() => setIsSignUp(true)}
              className="text-xs shadow-[0_4px_12px_rgba(0,0,0,0.4)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.6)] transform hover:scale-105 transition-all duration-300"
            >
              Sign Up
            </Button>
          </div>

          <style>{`
            /* Desktop Animations */
            @media (min-width: 768px) {
              .auth-panel-active .sign-in-container {
                transform: translateX(100%);
              }
              .auth-panel-active .sign-up-container {
                transform: translateX(100%);
                opacity: 1;
                z-index: 25;
              }
              .auth-panel-active .overlay-container {
                transform: translateX(-100%);
              }
              .auth-panel-active .overlay {
                transform: translateX(50%);
              }
              .auth-panel-active .overlay-left {
                transform: translateX(0);
              }
              .auth-panel-active .overlay-right {
                transform: translateX(20%);
              }
              .overlay-left {
                transform: translateX(-20%);
              }
            }
            @media (max-width: 767px) {
              .sign-in-container { display: ${!isSignUp ? 'flex' : 'none'} !important; position: static !important; width: 100% !important; }
              .sign-up-container { display: ${isSignUp ? 'flex' : 'none'} !important; position: static !important; width: 100% !important; }
            }
          `}</style>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle className="text-2xl">Registration Successful!</DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <p>Thank you for registering with Justice Ultimate Automobiles!</p>
              <p className="text-sm text-muted-foreground">
                A verification email has been sent to {regEmail}. Please verify your email before logging in.
              </p>
              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => window.open("https://gmail.com", "_blank")}
                >
                  <Mail className="h-4 w-4" />
                  Open Gmail
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setShowSuccessDialog(false);
                    setIsSignUp(false);
                  }}
                >
                  Go to Login
                </Button>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Suspended User Modal */}
      <SuspendedUserModal 
        isOpen={showSuspendedModal}
        reason={suspensionReason}
        suspendedUntil={suspendedUntil}
        onSuccess={() => {
          setShowSuspendedModal(false);
          setSuspensionReason("");
          setSuspendedUntil(undefined);
          sonnerToast.success("Account reactivated successfully! Please login again.");
        }}
      />

      {/* 2FA Verification Dialog */}
      <TwoFactorDialog
        open={show2FADialog}
        onClose={async () => {
          await supabase.auth.signOut();
          setShow2FADialog(false);
          setPendingUserId(null);
          setPendingUserEmail("");
          toast({
            title: "Login Cancelled",
            description: "You must complete 2FA verification to login.",
            variant: "destructive",
          });
        }}
        userId={pendingUserId || ""}
        email={pendingUserEmail}
        availableMethods={available2FAMethods}
        preferredMethod={preferred2FAMethod}
        onSuccess={async () => {
          if (pendingUserId) {
            setShow2FADialog(false);
            await completeLogin(pendingUserId, undefined, pendingUserEmail);
          }
        }}
      />

      {/* Complete Profile Dialog for Google OAuth users */}
      <CompleteProfileDialog
        isOpen={showCompleteProfileDialog}
        userId={completeProfileUserId}
        userEmail={completeProfileUserEmail}
        userName={completeProfileUserName}
        onComplete={() => {
          setShowCompleteProfileDialog(false);
          // Play success sound
          const successSound = new Audio('/sounds/notification.mp3');
          successSound.volume = 0.5;
          successSound.play().catch(() => {});
          // Navigate to the pending redirect path
          navigate(pendingRedirectPath, { replace: true });
        }}
      />
    </>
  );
};

export default Auth;
