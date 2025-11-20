import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Facebook, Instagram, Linkedin, ArrowLeft, Mail, Chrome } from "lucide-react";
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
import { useSecurityLogger } from "@/hooks/useSecurityLogger";
import { useTurnstile } from "@/hooks/useTurnstile";
import authBg from "@/assets/auth-bg.jpg";
import carLotOverlay from "@/assets/car-lot-overlay.jpg";
import maintenanceGif from "@/assets/maintenance.gif";
import kenyaLocations from "@/data/kenya-locations.json";

const TURNSTILE_SITE_KEY = "0x4AAAAAACB3OcIZy30ifRMd";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showSuspendedModal, setShowSuspendedModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
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

  // Registration form
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
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
        .single();

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

  const completeLogin = async (userId: string) => {
    try {
      // Update online status and reset login attempts
      await supabase
        .from("profiles")
        .update({
          is_online: true,
          last_seen: new Date().toISOString(),
          login_attempts: 0
        })
        .eq("user_id", userId);

      // Check user role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      // Get profile for name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", userId)
        .single();

      sonnerToast.success(`Welcome back, ${profile?.full_name || "User"}! 🎉`, {
        description: `Logged in as ${roleData?.role || "customer"}`,
      });

      // Redirect based on role
      setTimeout(() => {
        if (roleData && roleData.role === "admin") {
          navigate("/admin-dashboard");
        } else {
          navigate("/customer-dashboard");
        }
      }, 500);
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
      // Verify 2FA code
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
      // First check if user profile exists and check suspension status
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (profileData?.is_suspended) {
        setShowSuspendedModal(true);
        setSuspensionReason(profileData.suspended_reason || "Account suspended");
        setLoading(false);
        return;
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
          
          if (newAttempts >= 3) {
            // Auto-suspend after 3 failed attempts
            const { data: codeData } = await supabase.rpc('generate_activation_code');
            const activationCode = codeData || Math.random().toString(36).substring(2, 10).toUpperCase();
            
            await supabase
              .from("profiles")
              .update({
                is_suspended: true,
                suspended_at: new Date().toISOString(),
                suspended_reason: "Too many failed login attempts",
                activation_code: activationCode,
                login_attempts: newAttempts
              })
              .eq("user_id", profileData.user_id);

            toast({
              title: "Account Suspended",
              description: "Too many failed login attempts. Contact admin for activation code.",
              variant: "destructive",
            });
            setShowSuspendedModal(true);
            setSuspensionReason("Too many failed login attempts");
          } else {
            await supabase
              .from("profiles")
              .update({ login_attempts: newAttempts, last_login_attempt: new Date().toISOString() })
              .eq("user_id", profileData.user_id);
            
            // Log failed attempt
            await logLoginAttempt(email, false);
            
            toast({
              title: "Login Failed",
              description: `Invalid password. Attempt ${newAttempts} of 3.`,
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
        // Log successful login attempt
        await logLoginAttempt(email, true);

        // Send 2FA code
        const { error: twoFAError } = await supabase.functions.invoke('send-2fa-code', {
          body: { email, userId: data.user.id }
        });

        if (twoFAError) {
          console.error("2FA error:", twoFAError);
          toast({
            title: "Warning",
            description: "Could not send 2FA code. Proceeding without 2FA.",
            variant: "destructive",
          });
        } else {
          // Show 2FA dialog
          setPendingUserId(data.user.id);
          setShow2FADialog(true);
          setLoading(false);
          return;
        }

        // If 2FA fails, continue with login
        await completeLogin(data.user.id);
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
          className={`glass-strong rounded-3xl shadow-2xl max-w-4xl w-full min-h-[600px] overflow-hidden relative transition-all duration-700 z-10 ${
            isSignUp ? "auth-panel-active" : ""
          }`}
        >
          {/* Sign In Form */}
          <div className="auth-form-container sign-in-container absolute top-0 left-0 w-1/2 h-full flex items-center justify-center z-20 transition-all duration-700">
            <form onSubmit={handleLogin} className="auth-form-glass rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-6 w-full max-w-md">
              <h1 className="text-4xl font-bold mb-6 text-white drop-shadow-lg">Login</h1>
              <Input 
                type="email" 
                placeholder="Email" 
                className="w-full auth-input" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input 
                type="password" 
                placeholder="Password" 
                className="w-full auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              
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
          <div className="auth-form-container sign-up-container absolute top-0 left-0 w-1/2 h-full flex items-center justify-center z-10 opacity-0 transition-all duration-700 overflow-y-auto bg-gradient-to-br from-background/98 via-card/98 to-background/98">
            <form onSubmit={handleRegister} className="auth-form-glass rounded-2xl p-8 pt-16 pb-12 flex flex-col items-center justify-center text-center space-y-4 w-full max-w-md mt-16 mb-12">
              <h1 className="text-3xl font-bold mb-4 text-foreground drop-shadow-lg">Registration</h1>
              
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
                <Input 
                  type="password" 
                  placeholder="Password" 
                  className="w-full auth-input"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
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

              <Input 
                type="password" 
                placeholder="Confirm Password" 
                className="w-full auth-input"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                required
              />

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

              <div className="w-full">
                <Label className="text-sm mb-2 text-foreground font-medium">County</Label>
                <Select value={countyCity} onValueChange={setCountyCity}>
                  <SelectTrigger className="w-full auth-select-trigger">
                    <SelectValue placeholder="Select County" />
                  </SelectTrigger>
                  <SelectContent>
                    {kenyaLocations.counties.map((county: any) => (
                      <SelectItem key={county.name} value={county.name}>
                        {county.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full">
                <Label className="text-sm mb-2 text-foreground font-medium">Town / Location</Label>
                <Select 
                  value={exactLocation} 
                  onValueChange={setExactLocation}
                  disabled={!countyCity}
                >
                  <SelectTrigger className="w-full auth-select-trigger">
                    <SelectValue placeholder={countyCity ? "Select Town" : "First select a county"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTowns.map((town: string) => (
                      <SelectItem key={town} value={town}>
                        {town}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

          {/* Overlay Container */}
          <div className="overlay-container absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 z-30">
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

          <style>{`
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
        onSuccess={() => {
          setShowSuspendedModal(false);
          sonnerToast.success("Account reactivated successfully! Please login again.");
        }}
      />

      {/* 2FA Verification Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle className="text-2xl">Two-Factor Authentication</DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <p>A 6-digit verification code has been sent to your email.</p>
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">
                  Please enter the code below to complete your login.
                </p>
                <p className="text-yellow-600 font-medium">
                  {Math.floor(otpTimeLeft / 60)}:{String(otpTimeLeft % 60).padStart(2, '0')}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                OTP expires in 10 minutes
              </p>
              <Input
                type="text"
                placeholder="Enter 6-digit code"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShow2FADialog(false);
                    setPendingUserId(null);
                    setTwoFactorCode("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={verify2FA}
                  disabled={loading || twoFactorCode.length !== 6}
                >
                  {loading ? "Verifying..." : "Verify"}
                </Button>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Auth;
