import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Facebook, Instagram, Linkedin, ArrowLeft, Mail, Chrome, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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
import { SuspendedUserModal } from "@/components/SuspendedUserModal";
import { TwoFactorDialog } from "@/components/TwoFactorDialog";
import { useSecurityLogger } from "@/hooks/useSecurityLogger";
import { useTurnstile } from "@/hooks/useTurnstile";
import authBg from "@/assets/auth-bg.jpg";
import carLotOverlay from "@/assets/car-lot-overlay.jpg";
import maintenanceGif from "@/assets/maintenance.gif";
import kenyaLocations from "@/data/kenya-locations.json";
import { Combobox } from "@/components/ui/combobox";

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
  const [available2FAMethods, setAvailable2FAMethods] = useState({ email: true, totp: false, fingerprint: false });
  const [preferred2FAMethod, setPreferred2FAMethod] = useState("email_otp");
  const [otpTimeLeft, setOtpTimeLeft] = useState(600); // 10 minutes in seconds
  const navigate = useNavigate();
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

  const [maintenanceMode, setMaintenanceMode] = useState<{
    is_active: boolean;
    end_time: string | null;
    message: string;
  } | null>(null);
  const [maintenanceCountdown, setMaintenanceCountdown] = useState("");

  useEffect(() => {
    // Check maintenance once on mount, don't check repeatedly
    checkMaintenanceMode();
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

  // Google OAuth login
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://www.justiceultimateautomobiles.com'
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

  const completeLogin = async (userId: string, userName?: string) => {
    try {
      // Fetch role and update profile in parallel
      const [roleResult, profileResult] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
        supabase.from("profiles").update({
          is_online: true,
          last_seen: new Date().toISOString(),
          login_attempts: 0
        }).eq("user_id", userId).select("full_name").single()
      ]);

      const displayName = userName || profileResult.data?.full_name || "User";
      
      sonnerToast.success(`Welcome back, ${displayName}! 🎉`, {
        description: `Logged in as ${roleResult.data?.role || "customer"}`,
      });

      // Redirect based on role immediately
      if (roleResult.data?.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/customer-dashboard");
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
        await completeLogin(pendingUserId);
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
      await completeLogin(pendingUserId);
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
    
    // Get Turnstile CAPTCHA token
    const captchaToken = loginTurnstile.getToken();
    
    if (!captchaToken) {
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
        options: {
          captchaToken,
        },
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

        if (cachedProfile?.two_fa_enabled) {
          setAvailable2FAMethods({
            email: true,
            totp: cachedProfile.totp_enabled || false,
            fingerprint: cachedProfile.fingerprint_enabled || false,
          });
          setPreferred2FAMethod(cachedProfile.preferred_2fa || "email_otp");
          setPendingUserId(currentUserId);
          setPendingUserEmail(email);
          setShow2FADialog(true);
          setLoading(false);
          return;
        }

        // Log and complete login with cached name
        logLoginAttempt(email, true);
        await completeLogin(currentUserId, cachedProfile?.full_name);
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
      
      const { data, error } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          emailRedirectTo: redirectUrl,
          captchaToken,
          data: {
            full_name: regFullName,
            phone: regPhone,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Update profile with additional details
        await supabase.from("profiles").update({
          gender: gender[0],
          county_city: countyCity,
          exact_location: exactLocation,
          preferred_contact: preferredContact,
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

  if (maintenanceMode?.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 space-y-6">
            <div className="text-center space-y-4">
              <img 
                src={maintenanceGif} 
                alt="System under maintenance" 
                className="w-32 h-32 mx-auto object-contain"
              />
              <h2 className="text-2xl font-bold">System Under Maintenance</h2>
              <p className="text-muted-foreground">{maintenanceMode.message}</p>
              
              {maintenanceCountdown && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Back online in:</p>
                  <p className="text-2xl font-bold text-primary">{maintenanceCountdown}</p>
                </div>
              )}
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
            <form onSubmit={handleLogin} className="auth-form-glass rounded-2xl p-6 md:p-12 flex flex-col items-center justify-center text-center space-y-4 md:space-y-6 w-full max-w-md my-4 md:my-0">
              <h1 className="text-4xl font-bold mb-6 text-white drop-shadow-lg">Login</h1>
              <Input 
                type="email" 
                placeholder="Email" 
                className="w-full auth-input" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="relative w-full">
                <Input 
                  type={showLoginPassword ? "text" : "password"} 
                  placeholder="Password" 
                  className="w-full auth-input pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                  aria-label={showLoginPassword ? "Hide password" : "Show password"}
                >
                  {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Cloudflare Turnstile CAPTCHA */}
              <div ref={loginTurnstile.containerRef} className="w-full flex justify-center" />
              
              <Link to="/reset-password" className="text-sm text-white hover:text-accent transition-colors">
                Forgot Password?
              </Link>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-semibold" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
              
              <div className="relative w-full my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/30" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-transparent px-2 text-white/80">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                variant="outline"
                className="w-full border-2 border-white/30 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all duration-300"
              >
                <Chrome className="mr-2 h-5 w-5 text-[#4285F4]" />
                Continue with Google
              </Button>
            </form>
          </div>

          {/* Sign Up Form */}
          <div className="auth-form-container sign-up-container absolute top-0 left-0 w-full md:w-1/2 h-full z-10 md:opacity-0 transition-all duration-700 overflow-y-auto bg-gradient-to-br from-background/98 via-card/98 to-background/98">
            <form onSubmit={handleRegister} className="auth-form-glass p-4 md:p-6 flex flex-col text-center space-y-2 md:space-y-3 w-full max-w-md mt-4 mb-4 mx-auto">
              <h1 className="text-2xl font-bold mb-2 text-foreground drop-shadow-lg">Registration</h1>
              
              <Input 
                type="text" 
                placeholder="Full Name" 
                className="w-full auth-input"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                required
              />
              <Input 
                type="email" 
                placeholder="Email" 
                className="w-full auth-input"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />
              <Input 
                type="tel" 
                placeholder="Phone (e.g., +254...)" 
                className="w-full auth-input"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                required
              />
              
              <div className="w-full space-y-2">
                <div className="relative">
                  <Input 
                    type={showRegPassword ? "text" : "password"} 
                    placeholder="Password" 
                    className="w-full auth-input pr-10"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                  className="w-full auth-input pr-10"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-semibold" disabled={loading}>
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

              <Button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                variant="outline"
                className="w-full border-2 border-border/50 hover:border-primary/50 hover:bg-accent transition-all duration-300"
              >
                <Chrome className="mr-2 h-5 w-5 text-[#4285F4]" />
                Continue with Google
              </Button>
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
                <div className="relative z-10">
                  <h1 className="text-5xl font-bold text-white mb-6" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)' }}>
                    Welcome Back to Justice System
                  </h1>
                  <p className="text-xl text-white mb-8" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>
                    Already have an account?
                  </p>
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-white text-primary border-2 border-white hover:bg-white/90 hover:scale-105 transition-all shadow-xl font-semibold px-8 py-6 text-lg"
                    onClick={() => setIsSignUp(false)}
                    type="button"
                  >
                    Login
                  </Button>
                </div>
              </div>

              {/* Right Overlay - Shows on Login (with car lot image) */}
              <div 
                className="overlay-panel overlay-right absolute right-0 flex items-center justify-center flex-col px-12 text-center top-0 h-full w-1/2 transform transition-transform duration-700 bg-cover bg-center"
                style={{ backgroundImage: `url(${carLotOverlay})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-primary/60 via-primary/50 to-primary/70 backdrop-blur-[2px]" />
                <div className="relative z-10">
                  <h1 className="text-5xl font-bold text-white mb-6" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)' }}>
                    Hello, Welcome to Justice Ultimate System
                  </h1>
                  <p className="text-xl text-white mb-8" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>
                    Don't have an account?
                  </p>
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-white text-primary border-2 border-white hover:bg-white/90 hover:scale-105 transition-all shadow-xl font-semibold px-8 py-6 text-lg"
                    onClick={() => setIsSignUp(true)}
                    type="button"
                  >
                    Register
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
              className="text-xs"
            >
              Login
            </Button>
            <Button
              type="button"
              size="sm"
              variant={isSignUp ? "default" : "outline"}
              onClick={() => setIsSignUp(true)}
              className="text-xs"
            >
              Register
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
            await completeLogin(pendingUserId);
          }
        }}
      />
    </>
  );
};

export default Auth;
