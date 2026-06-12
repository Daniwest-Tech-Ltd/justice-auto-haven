import { useState, useEffect, useRef } from "react"; /* eslint-disable react/no-unknown-property, react-native/no-inline-styles */
import type { Session } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Mail,
  Eye,
  EyeOff,
  Lock,
  UserPlus,
  ShieldCheck,
  Globe,
  Trophy,
  Activity,
  ArrowRight,
  User,
  ArrowLeft,
  ShieldCheck as Shield,
  CheckCircle
} from "lucide-react";
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
import HeroSlider from "@/components/HeroSlider";
import { SuspendedUserModal } from "@/components/SuspendedUserModal";
import { TwoFactorDialog } from "@/components/TwoFactorDialog";

import { useSecurityLogger } from "@/hooks/useSecurityLogger";
import { useTurnstile } from "@/hooks/useTurnstile";
import maintenanceGif from "@/assets/maintenance.gif";
import googleIcon from "@/assets/google-icon.svg";
import githubIcon from "@/assets/github-icon.svg";
import facebookIcon from "@/assets/facebook-icon.svg";
import kenyaLocations from "@/data/kenya-locations.json";
import { Combobox } from "@/components/ui/combobox";
import { PhoneInputWithCountryCode } from "@/components/PhoneInputWithCountryCode";
import HolidayBanner from "@/components/HolidayBanner";
import { Snowfall } from "@/components/SeasonalEffects";
import useDisableRightClick from "@/hooks/useDisableRightClick";
import { getCurrentSale } from "@/lib/currentSale";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import AIChatFloat from "@/components/AIChatFloat";

const TURNSTILE_SITE_KEY = "0x4AAAAAACB3OcIZy30ifRMd";

const Auth = () => {
  useDisableRightClick();
  const sale = getCurrentSale();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showSuspendedModal, setShowSuspendedModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [suspendedUntil, setSuspendedUntil] = useState<string>();
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [pendingUserEmail, setPendingUserEmail] = useState("");
  const [available2FAMethods, setAvailable2FAMethods] = useState({ email: true, totp: false, fingerprint: false, whatsapp: true });
  const [preferred2FAMethod, setPreferred2FAMethod] = useState("email_otp");
  const [otpTimeLeft, setOtpTimeLeft] = useState(600); // 10 minutes
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oauthSearch = searchParams.toString();
  const oauthCallbackHandledRef = useRef<string | null>(null);
  const { toast } = useToast();
  const { logLoginAttempt, logSuspiciousActivity } = useSecurityLogger();
  const userIpRef = useRef<string | null>(null);
  
  const loginTurnstile = useTurnstile(TURNSTILE_SITE_KEY);
  const signupTurnstile = useTurnstile(TURNSTILE_SITE_KEY);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [gender, setGender] = useState<string[]>([]);
  const [countyCity, setCountyCity] = useState("");
  const [exactLocation, setExactLocation] = useState("");
  const [preferredContact, setPreferredContact] = useState("email");
  const [availableTowns, setAvailableTowns] = useState<string[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [countryCode, setCountryCode] = useState("+254");

  const [maintenanceMode, setMaintenanceMode] = useState<{
    is_active: boolean;
    end_time: string | null;
    message: string;
  } | null>(null);
  const [maintenanceCountdown, setMaintenanceCountdown] = useState("");

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then(res => res.json())
      .then(data => { userIpRef.current = data.ip; })
      .catch(() => { userIpRef.current = null; });
  }, []);

  useEffect(() => {
    checkMaintenanceMode();
    const resetSuccess = searchParams.get("reset");
    if (resetSuccess === "success") {
      toast({
        title: "Password Reset Successful",
        description: "Your password has been reset. Please login with your new password.",
      });
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
      const { data } = await supabase
        .from("system_maintenance")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        const endTime = new Date(data.end_time);
        if (endTime > new Date()) {
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
    } catch { setMaintenanceMode(null); }
  };

  useEffect(() => {
    if (countyCity) {
      const county = kenyaLocations.counties.find((c: any) => c.name === countyCity);
      setAvailableTowns(county?.towns || []);
      setExactLocation("");
    }
  }, [countyCity]);

  useEffect(() => {
    if (show2FADialog && otpTimeLeft > 0) {
      const timer = setInterval(() => {
        setOtpTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            toast({ title: "OTP Expired", description: "Verification code expired.", variant: "destructive" });
            setShow2FADialog(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [show2FADialog, otpTimeLeft]);

  useEffect(() => { if (show2FADialog) setOtpTimeLeft(600); }, [show2FADialog]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const isNative = window.location.hostname === 'localhost' || !window.location.origin.startsWith('http');
      const redirectUrl = isNative ? 'com.justice.ultimateautomobiles://auth' : `${window.location.origin}/auth`;
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectUrl } });
      if (error) throw error;
    } catch (error: any) {
      toast({ title: "Google Login Error", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleGitHubLogin = async () => {
    try {
      setLoading(true);
      const isNative = window.location.hostname === 'localhost' || !window.location.origin.startsWith('http');
      const redirectUrl = isNative ? 'com.justice.ultimateautomobiles://auth' : `${window.location.origin}/auth`;
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: redirectUrl } });
      if (error) throw error;
    } catch (error: any) {
      toast({ title: "GitHub Login Error", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleFacebookLogin = async () => {
    try {
      setLoading(true);
      const isNative = window.location.hostname === 'localhost' || !window.location.origin.startsWith('http');
      const redirectUrl = isNative ? 'com.justice.ultimateautomobiles://auth' : `${window.location.origin}/auth`;
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'facebook', options: { redirectTo: redirectUrl, scopes: 'email' } });
      if (error) throw error;
    } catch (error: any) {
      toast({ title: "Facebook Login Error", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const ADMIN_EMAILS = ['daniwesttechnologies@gmail.com', 'justicevincentt@gmail.com'];

  useEffect(() => {
    const currentSearchParams = new URLSearchParams(oauthSearch);
    const isGoogleCallback = currentSearchParams.get("google_callback") === "true";
    const isGitHubCallback = currentSearchParams.get("github_callback") === "true";
    const isFacebookCallback = currentSearchParams.get("facebook_callback") === "true";
    const hasOAuthCode = Boolean(currentSearchParams.get("code"));
    const hasOAuthError = Boolean(currentSearchParams.get("error") || currentSearchParams.get("error_description"));
    const hasLegacyHashToken = window.location.hash.includes("access_token");

    const isOAuthCallback = isGoogleCallback || isGitHubCallback || isFacebookCallback || hasOAuthCode || hasLegacyHashToken || hasOAuthError;

    if (!isOAuthCallback) return;

    const callbackKey = `${window.location.pathname}?${oauthSearch}#${window.location.hash}`;
    if (oauthCallbackHandledRef.current === callbackKey) return;
    oauthCallbackHandledRef.current = callbackKey;

    const callbackProvider = isFacebookCallback ? "facebook" : isGitHubCallback ? "github" : isGoogleCallback ? "google" : null;
    let isActive = true;
    let handled = false;

    const cleanupCallbackUrl = () => { if (window.location.pathname === "/auth") window.history.replaceState({}, document.title, "/auth"); };

    const processOAuthSession = async (session: Session) => {
      const userEmail = session.user.email?.toLowerCase() || "";
      const isAdmin = ADMIN_EMAILS.includes(userEmail);
      const sessionProvider = session.user.app_metadata?.provider as string | undefined;
      const authProvider = callbackProvider || sessionProvider || "google";
      const oauthName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split("@")[0] || "User";
      const oauthAvatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture;

      const { data: existingProfile } = await supabase.from("profiles").select("id, full_name, password_set, auth_provider").eq("user_id", session.user.id).maybeSingle();

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
        await supabase.from("user_roles").upsert({ user_id: session.user.id, role: assignedRole }, { onConflict: "user_id,role", ignoreDuplicates: true });
        supabase.functions.invoke("send-welcome-email", { body: { email: session.user.email, name: oauthName, authProvider } }).catch(() => {});
      } else {
        supabase.from("profiles").update({ is_online: true, last_seen: new Date().toISOString() }).eq("user_id", session.user.id).then(() => {});
      }

      new Audio("/sounds/notification.mp3").play().catch(() => {});
      const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
      if (isAdmin) await supabase.from("user_roles").upsert({ user_id: session.user.id, role: "admin" }, { onConflict: "user_id,role", ignoreDuplicates: true });

      const isAdminUser = isAdmin || Boolean(roleRows?.some((row) => row.role === "admin"));
      const staffRole = roleRows?.find((row) => ["hr_manager", "hr_staff", "sales_manager", "sales_rep", "marketing_manager", "marketing_staff", "ceo", "system_administrator"].includes(row.role))?.role;
      const isStaffUser = !isAdminUser && Boolean(roleRows?.some((row) => row.role === "staff") || staffRole);
      const isHRStaff = staffRole && (staffRole.includes("hr") || staffRole === "ceo");
      const isSalesStaff = staffRole && (staffRole.includes("sales") || staffRole.includes("marketing"));
      
      const displayName = existingProfile?.full_name || oauthName || session.user.email;
      sonnerToast.success(`Welcome back, ${displayName}! 🎉`, { description: `Logged in as ${isAdminUser ? "admin" : isStaffUser ? "staff" : "customer"}` });

      if (isActive) {
        let dest = "/customer-dashboard";
        if (isAdminUser) dest = "/admin-dashboard";
        else if (isHRStaff) dest = "/hr-dashboard";
        else if (isSalesStaff) dest = "/sales-dashboard";
        else if (isStaffUser) dest = "/staff-dashboard";
        navigate(dest, { replace: true });
      }
    };

    const handleAuthFailure = async (message: string) => {
      await supabase.auth.signOut({ scope: "local" });
      cleanupCallbackUrl();
      if (isActive) {
        setLoading(false);
        toast({ title: "Login Failed", description: message, variant: "destructive" });
      }
    };

    const tryHandleSession = async (session: Session | null) => {
      if (!isActive || handled || !session?.user) return;
      handled = true;
      try { await processOAuthSession(session); } catch (error: any) {
        console.error("OAuth callback error:", error);
        await handleAuthFailure(error?.message || "Could not establish session.");
      } finally { cleanupCallbackUrl(); if (isActive) setLoading(false); }
    };

    setLoading(true);
    if (hasOAuthError) {
      handleAuthFailure(currentSearchParams.get("error_description") || currentSearchParams.get("error") || "OAuth error.");
      return () => { isActive = false; };
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isActive || handled) return;
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") tryHandleSession(session);
    });
    const bootstrapTimer = window.setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await tryHandleSession(session);
      if (!handled && isActive) handleAuthFailure("Could not establish OAuth session.");
    }, 300);
    return () => { isActive = false; window.clearTimeout(bootstrapTimer); subscription.unsubscribe(); };
  }, [navigate, oauthSearch, toast]);

  const checkPasswordStrength = (pwd: string) => {
    const minLength = pwd.length >= 8;
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);
    const score = Number(minLength) + Number(hasUpperCase) + Number(hasLowerCase) + Number(hasNumber) + Number(hasSpecialChar);
    if (score < 3) return "weak";
    if (score < 5) return "medium";
    return "strong";
  };

  const passwordStrength = checkPasswordStrength(regPassword);

  const completeLogin = async (userId: string, userName?: string, userEmail?: string) => {
    try {
      logLoginAttempt(userEmail || email, true, userIpRef.current || undefined);
      new Audio('/sounds/notification.mp3').play().catch(() => {});
      supabase.from("profiles").update({ is_online: true, last_seen: new Date().toISOString(), login_attempts: 0 }).eq("user_id", userId).then(() => {});

      let displayName = userName || "User";
      let actualEmail = (userEmail || '').toLowerCase();
      if (!userName || !userEmail) {
        const { data: profileData } = await supabase.from("profiles").select("full_name, email").eq("user_id", userId).maybeSingle();
        if (profileData) {
          displayName = userName || profileData.full_name || "User";
          actualEmail = (userEmail || profileData.email || '').toLowerCase();
        }
      }
      const isAdminEmail = ADMIN_EMAILS.includes(actualEmail);
      if (isAdminEmail) await supabase.from("user_roles").upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role", ignoreDuplicates: true });
      const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      const isAdmin = isAdminEmail || Boolean(roleRows?.some((row) => row.role === "admin"));
      const staffRole = roleRows?.find((row) => ["hr_manager", "hr_staff", "sales_manager", "sales_rep", "marketing_manager", "marketing_staff", "ceo", "system_administrator"].includes(row.role))?.role;
      const isStaff = !isAdmin && Boolean(roleRows?.some((row) => row.role === "staff") || staffRole);
      const isHR = staffRole && (staffRole.includes("hr") || staffRole === "ceo");
      const isSales = staffRole && (staffRole.includes("sales") || staffRole.includes("marketing"));
      
      sonnerToast.success(`Welcome back, ${displayName}! 🎉`, { description: `Logged in as ${isAdmin ? "admin" : isStaff ? "staff" : "customer"}` });
      let dest = "/customer-dashboard";
      if (isAdmin) dest = "/admin-dashboard";
      else if (isHR) dest = "/hr-dashboard";
      else if (isSales) dest = "/sales-dashboard";
      else if (isStaff) dest = "/staff-dashboard";
      navigate(dest, { replace: true });
    } catch { navigate("/customer-dashboard", { replace: true }); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const captchaToken = loginTurnstile.getToken();
    if (window.location.hostname !== 'localhost' && loginTurnstile.isReady && !captchaToken) {
      toast({ title: "CAPTCHA Required", description: "Please complete CAPTCHA", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data: profileData } = await supabase.from("profiles").select("user_id, email, full_name, is_suspended, account_status, suspended_reason, suspended_at, login_attempts, two_fa_enabled, preferred_2fa, totp_enabled, fingerprint_enabled").eq("email", email).maybeSingle();

      if (profileData?.is_suspended || profileData?.account_status === "suspended" || profileData?.account_status === "blocked") {
        if (profileData?.account_status === "blocked") {
          setShowSuspendedModal(true); setSuspensionReason(profileData.suspended_reason || "Account blocked.");
          setLoading(false); return;
        }
        if (profileData.suspended_at) {
          const until = new Date(new Date(profileData.suspended_at).getTime() + 60 * 60000);
          if (new Date() < until) {
            setSuspendedUntil(until.toISOString()); setShowSuspendedModal(true);
            setSuspensionReason(profileData.suspended_reason || "Account suspended");
            setLoading(false); return;
          } else {
            await supabase.from("profiles").update({ is_suspended: false, account_status: "active", suspended_reason: null, suspended_at: null, activation_code: null }).eq("user_id", profileData.user_id);
          }
        } else {
          setShowSuspendedModal(true); setSuspensionReason(profileData.suspended_reason || "Account suspended");
          setLoading(false); return;
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password, options: captchaToken ? { captchaToken } : undefined });

      if (error) {
        loginTurnstile.reset();
        if (profileData) {
          const newAttempts = (profileData.login_attempts || 0) + 1;
          const now = new Date().toISOString();
          if (newAttempts >= 3) {
            const activationCode = Math.random().toString(36).substring(2, 10).toUpperCase();
            const updateData: any = { login_attempts: newAttempts, last_login_attempt: now, suspended_at: now, is_suspended: true, account_status: "suspended", suspended_reason: "3 failed login attempts. Suspended for 1 hour.", activation_code: activationCode };
            await supabase.from("profiles").update(updateData).eq("user_id", profileData.user_id);
            await logLoginAttempt(email, false, userIpRef.current || undefined);
            setSuspensionReason(updateData.suspended_reason); setShowSuspendedModal(true);
          } else {
            await supabase.from("profiles").update({ login_attempts: newAttempts, last_login_attempt: now }).eq("user_id", profileData.user_id);
            toast({ title: "Login Failed", description: `Invalid credentials. ${3 - newAttempts} attempts left.`, variant: "destructive" });
          }
        } else {
          await logLoginAttempt(email, false, userIpRef.current || undefined);
          toast({ title: "Login Failed", description: error.message, variant: "destructive" });
        }
        setLoading(false); return;
      }

      if (data.user) {
        // Fetch extended 2FA capabilities
        const { data: fingerData } = await supabase.from("user_fingerprints").select("id").eq("user_id", data.user.id).limit(1);

        setPendingUserId(data.user.id); setPendingUserEmail(email);
        setAvailable2FAMethods({
          email: true,
          totp: profileData?.totp_enabled || false,
          fingerprint: (profileData?.fingerprint_enabled || (fingerData && fingerData.length > 0)) || false,
          whatsapp: true
        });
        setPreferred2FAMethod(profileData?.preferred_2fa || "email_otp");
        setShow2FADialog(true);
        setLoading(false);
      }
    } catch (error: any) {
      loginTurnstile.reset();
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const captchaToken = signupTurnstile.getToken();
    if (window.location.hostname !== 'localhost' && signupTurnstile.isReady && !captchaToken) {
      toast({ title: "CAPTCHA Required", description: "Complete CAPTCHA", variant: "destructive" }); return;
    }
    if (!termsAccepted) { toast({ title: "Terms Required", description: "Agree to terms", variant: "destructive" }); return; }
    if (regPassword !== regConfirmPassword) { toast({ title: "Mismatch", description: "Passwords do not match", variant: "destructive" }); return; }
    if (passwordStrength === "weak") { toast({ title: "Weak Password", description: "Use a stronger password", variant: "destructive" }); return; }

    setLoading(true);
    try {
      const isNative = window.location.hostname === 'localhost' || !window.location.origin.startsWith('http');
      const redirectUrl = isNative ? 'com.justice.ultimateautomobiles://auth' : `${window.location.origin}/auth`;
      const fullPhone = `${countryCode}${regPhone}`;
      const { data, error } = await supabase.auth.signUp({ email: regEmail, password: regPassword, options: { emailRedirectTo: redirectUrl, data: { full_name: regFullName, phone: fullPhone } } });
      if (error) throw error;
      if (data.user) {
        await supabase.from("profiles").update({ gender: gender[0], county_city: countyCity, exact_location: exactLocation, preferred_contact: preferredContact, country_code: countryCode }).eq("user_id", data.user.id);
        setShowSuccessDialog(true);
      }
    } catch (error: any) {
      signupTurnstile.reset();
      toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  if (maintenanceMode?.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden text-left">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.05),transparent_70%)]" />
        <Card className="w-full max-w-md shadow-2xl relative z-10 border-border bg-background">
          <CardContent className="pt-10 pb-8 space-y-6 text-center">
            <img src={maintenanceGif} alt="Maintenance" className="w-32 h-32 mx-auto" />
            <h2 className="text-xl font-black uppercase tracking-widest">System Maintenance</h2>
            <p className="text-xs text-muted-foreground uppercase font-bold">{maintenanceMode.message}</p>
            {maintenanceCountdown && (
              <div className="bg-secondary/10 p-4 rounded-md border border-border">
                <p className="text-[10px] font-black uppercase mb-1">Restoration Cycle Remaining</p>
                <p className="text-2xl font-black text-brand-red tracking-tighter">{maintenanceCountdown}</p>
              </div>
            )}
            <div className="flex gap-3">
              <Button onClick={() => navigate("/")} variant="outline" className="flex-1 uppercase font-black text-[10px] h-12">Home Hub</Button>
              <Button onClick={() => navigate("/catalogue")} className="flex-1 uppercase font-black text-[10px] h-12">Catalogue</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background selection:bg-brand-red selection:text-white font-sans antialiased overflow-x-hidden text-left">
      <Header />
      <div className="pt-20">
        <Snowfall />
        <HolidayBanner />

        {/* Background Overlays */}
        <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,hsl(var(--primary)/0.1),transparent_70%)]" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        </div>

        {/* Professional Marquee - Institutional Branding */}
        <div className="bg-primary/80 backdrop-blur-md text-white py-2 overflow-hidden border-b border-white/5 relative z-30 shadow-2xl">
          <div className="flex whitespace-nowrap animate-marquee-professional">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center shrink-0">
                <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                  <ShieldCheck className="h-3 w-3 text-brand-red" />
                  Secure Identity Terminal
                </span>
                <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                  <Globe className="h-3 w-3 text-brand-red" />
                  Global Access Network
                </span>
                <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                  <Trophy className="h-3 w-3 text-brand-red" />
                  Justice Verified Authority
                </span>
                <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                  <Shield className="h-3 w-3 text-brand-red" />
                  Institutional Security Ledger
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Secondary Marquee - Identity Insights */}
        <div className="bg-black/90 text-white/60 py-1.5 overflow-hidden border-b border-white/5 relative z-30">
          <div className="flex whitespace-nowrap animate-marquee-professional" style={{ animationDirection: 'reverse', animationDuration: '60s' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center shrink-0">
                <span className="mx-12 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.4em]">
                  <Lock className="h-2.5 w-2.5 text-primary" />
                  Slide 2: Encrypted Session active
                </span>
                <span className="mx-12 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.4em]">
                  <Activity className="h-2.5 w-2.5 text-primary" />
                  Biometric Gateway Ready
                </span>
                <span className="mx-12 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.4em]">
                  <CheckCircle className="h-2.5 w-2.5 text-primary" />
                  Certified Access Protocol
                </span>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes marquee-professional {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee-professional {
            animation: marquee-professional 40s linear infinite;
          }
        `}</style>

        {/* Hero Header */}
        <section className="relative flex items-center justify-center border-b border-border py-16 sm:py-24 overflow-hidden">
          <HeroSlider />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-700">
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand-red">Identity Gate: {sale.year}</p>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground uppercase">
                Identity <span className="text-brand-red">Terminal.</span>
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
                Authenticate via our secure protocol to access the Justice Ultimate ecosystem. <br />
                Enterprise-grade encryption and 2FA protection active.
              </p>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8 md:py-12 relative z-10">
          <div className="max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-5 gap-8 lg:gap-12 items-start">

            {/* Auth Card (3 columns on large, full on small) */}
            <div className="w-full lg:col-span-3 order-1 lg:order-1">
              <Card className="border-border bg-background shadow-2xl rounded-md overflow-hidden animate-in zoom-in duration-500 h-full">
                <CardHeader className="border-b border-border/50 bg-secondary/5 p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                           {isSignUp ? <UserPlus className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                        </div>
                        <div>
                           <CardTitle className="text-sm font-black uppercase tracking-widest leading-none">
                              {isSignUp ? "Account Registration" : "Authentication Required"}
                           </CardTitle>
                           <CardDescription className="text-[10px] font-bold uppercase tracking-tighter mt-1">
                              {isSignUp ? "Create a new corporate identity" : "Access your secure workspace"}
                           </CardDescription>
                        </div>
                     </div>
                     <Button
                       variant="ghost"
                       className="text-[10px] font-black uppercase tracking-widest text-brand-red hover:bg-brand-red/5 p-0 h-auto sm:h-10 sm:px-4 shrink-0"
                       onClick={() => {
                         setIsSignUp(!isSignUp);
                         window.scrollTo({ top: 0, behavior: 'smooth' });
                       }}
                     >
                        {isSignUp ? "Already Registered? Sign In" : "New Client? Register Here"}
                     </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-8">
                  {/* Login Form */}
                  {!isSignUp ? (
                    <form onSubmit={handleLogin} className="space-y-6 w-full max-w-lg mx-auto">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Authorized Email</Label>
                         <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="email" placeholder="email@corporate.com" className="h-12 pl-10 rounded-sm text-xs border-border w-full" value={email} onChange={(e) => setEmail(e.target.value)} required />
                         </div>
                      </div>

                      <div className="space-y-2">
                         <div className="flex justify-between items-center">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Encryption Passcode</Label>
                            <Link to="/reset-password" id="forgot-password-link" className="text-[9px] font-black uppercase text-brand-red hover:underline">Reset Passcode</Link>
                         </div>
                         <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type={showLoginPassword ? "text" : "password"} placeholder="••••••••" className="h-12 pl-10 pr-10 rounded-sm text-xs border-border w-full" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                               {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                         </div>
                      </div>

                      <div ref={loginTurnstile.containerRef} className="flex justify-center py-2" />

                      <Button type="submit" disabled={loading} className="w-full h-14 bg-brand-red hover:bg-brand-red/90 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-md shadow-xl btn-signal">
                         {loading ? <Activity className="h-5 w-5 animate-spin mr-2" /> : <ShieldCheck className="h-5 w-5 mr-2" />}
                         Secure Login
                      </Button>

                      <div className="relative py-4">
                         <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                         <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.3em]"><span className="bg-background px-4 text-muted-foreground text-center">Social Auth Gateways</span></div>
                      </div>

                      <div className="flex justify-center gap-4">
                         {[
                           { icon: googleIcon, onClick: handleGoogleLogin, label: "Google" },
                           { icon: githubIcon, onClick: handleGitHubLogin, label: "GitHub", invert: true },
                           { icon: facebookIcon, onClick: handleFacebookLogin, label: "Facebook" }
                         ].map((p, i) => (
                           <Button key={i} type="button" variant="outline" className="h-12 w-12 sm:h-14 sm:w-14 rounded-full border-border hover:border-primary/50 transition-all p-0" onClick={p.onClick} disabled={loading}>
                              <img src={p.icon} alt={p.label} className={`h-5 w-5 sm:h-6 sm:w-6 ${p.invert ? 'dark:invert' : ''}`} />
                           </Button>
                         ))}
                      </div>
                    </form>
                  ) : (
                    /* Registration Form */
                    <form onSubmit={handleRegister} className="space-y-6 w-full">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Legal Name</Label>
                            <div className="relative">
                               <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                               <Input className="h-12 pl-10 rounded-sm text-xs border-border w-full" placeholder="John Doe" value={regFullName} onChange={(e) => setRegFullName(e.target.value)} required />
                            </div>
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Corporate Email</Label>
                            <div className="relative">
                               <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                               <Input className="h-12 pl-10 rounded-sm text-xs border-border w-full" type="email" placeholder="john@company.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
                            </div>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contact Number</Label>
                            <PhoneInputWithCountryCode value={regPhone} onChange={setRegPhone} countryCode={countryCode} onCountryCodeChange={setCountryCode} required />
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identity Passcode</Label>
                            <div className="relative">
                               <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                               <Input type={showRegPassword ? "text" : "password"} className="h-12 pl-10 pr-10 rounded-sm text-xs border-border w-full" placeholder="••••••••" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
                               <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {regPassword && <p className={`text-[8px] font-black uppercase tracking-widest ${passwordStrength === 'strong' ? 'text-emerald-500' : passwordStrength === 'medium' ? 'text-amber-500' : 'text-brand-red'}`}>Strength: {passwordStrength}</p>}
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Location (County)</Label>
                            <Combobox options={kenyaLocations.counties.map((c: any) => c.name)} value={countyCity} onValueChange={setCountyCity} placeholder="Select County" />
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Town / Station</Label>
                            <Combobox options={availableTowns} value={exactLocation} onValueChange={setExactLocation} placeholder={countyCity ? "Select Town" : "Select County First"} />
                         </div>
                      </div>

                      <div className="flex items-start space-x-3 bg-secondary/5 p-4 rounded-md border border-border">
                         <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(c) => setTermsAccepted(c === true)} className="mt-1" />
                         <Label htmlFor="terms" className="text-[9px] font-bold uppercase leading-relaxed text-muted-foreground cursor-pointer">
                            I acknowledge the Justice Ultimate <Link to="/terms" className="text-brand-red underline">Terms of Engagement</Link> and data protocols.
                         </Label>
                      </div>

                      <div ref={signupTurnstile.containerRef} className="flex justify-center py-2" />

                      <Button type="submit" disabled={loading} className="w-full h-14 bg-brand-red hover:bg-brand-red/90 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-md shadow-xl btn-signal">
                         {loading ? <Activity className="h-5 w-5 animate-spin mr-2" /> : <UserPlus className="h-5 w-5 mr-2" />}
                         Initiate Registration
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Information (2 columns on large, full on small) */}
            <div className="w-full lg:col-span-2 space-y-6 md:space-y-8 order-2 lg:order-2">
              <Card className="rounded-md border-border bg-secondary/5 overflow-hidden">
                 <CardHeader className="pb-3 border-b border-border/50">
                    <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em]">Security Protocol</CardTitle>
                 </CardHeader>
                 <CardContent className="pt-6 space-y-6">
                    {[
                      { icon: ShieldCheck, title: "Biometric Capable", desc: "Access via fingerprint or face ID available post-auth." },
                      { icon: Globe, title: "Encrypted Network", desc: "All sessions are proxied via secure Justice relay." },
                      { icon: Trophy, title: "Verified Identity", desc: "Only authorized personnel and clients gain access." }
                    ].map((p, i) => (
                      <div key={i} className="flex gap-4">
                         <div className="h-8 w-8 rounded bg-background border border-border flex items-center justify-center shrink-0">
                            <p.icon className="h-4 w-4 text-primary" />
                         </div>
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-tight">{p.title}</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase leading-tight">{p.desc}</p>
                         </div>
                      </div>
                    ))}
                 </CardContent>
              </Card>

              <Card className="rounded-md border-border bg-background shadow-sm">
                 <CardHeader className="pb-3 border-b border-border/50">
                    <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em]">Business Integrity</CardTitle>
                 </CardHeader>
                 <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                       <CheckCircle className="h-4 w-4 text-emerald-500" />
                       <p className="text-[9px] font-black uppercase">GDPR & Data Act Compliant</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <Activity className="h-4 w-4 text-primary animate-pulse" />
                       <p className="text-[9px] font-black uppercase text-primary">System Monitoring Active</p>
                    </div>
                 </CardContent>
              </Card>

              <Card className="rounded-md border-border bg-primary text-white overflow-hidden relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--accent)/0.2),transparent_50%)]" />
                <CardContent className="pt-8 pb-6 text-center space-y-4 relative z-10">
                  <Lock className="h-8 w-8 text-brand-red mx-auto" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Support Terminal</h3>
                  <p className="text-xl font-black font-mono tracking-tighter">0722 827 458</p>
                  <Button variant="outline" className="w-full bg-white/5 border-white/20 text-[10px] font-black uppercase tracking-widest h-10 rounded-sm hover:bg-white hover:text-primary transition-all" onClick={() => window.open("https://wa.me/254722827458")}>Secure Inquiry</Button>
                </CardContent>
              </Card>

              <Button variant="outline" className="w-full h-12 rounded-md border-border text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-secondary" onClick={() => navigate("/")}>
                 <ArrowLeft className="h-3 w-3" /> Return to Terminal
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>

      {/* Modals & Dialogs */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="border-border bg-background">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-widest">Identity Verified</DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <p className="text-[10px] font-bold uppercase">Credential activation dispatch sent to {regEmail}.</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 uppercase font-black text-[10px]" onClick={() => window.open("https://gmail.com", "_blank")}>Open Dispatch</Button>
                <Button className="flex-1 uppercase font-black text-[10px]" onClick={() => { setShowSuccessDialog(false); setIsSignUp(false); }}>Go to Login</Button>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <SuspendedUserModal isOpen={showSuspendedModal} reason={suspensionReason} suspendedUntil={suspendedUntil} onSuccess={() => { setShowSuspendedModal(false); sonnerToast.success("Account reactivated!"); }} />

      <TwoFactorDialog
        open={show2FADialog}
        onClose={async () => { await supabase.auth.signOut(); setShow2FADialog(false); toast({ title: "Auth Cancelled", variant: "destructive" }); }}
        userId={pendingUserId || ""}
        email={pendingUserEmail}
        availableMethods={available2FAMethods}
        preferredMethod={preferred2FAMethod}
        onSuccess={async () => { if (pendingUserId) { setShow2FADialog(false); await completeLogin(pendingUserId, undefined, pendingUserEmail); } }}
      />
      <AIChatFloat />
    </div>
  );
};

export default Auth;
