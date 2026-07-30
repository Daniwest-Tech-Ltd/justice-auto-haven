import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Mail, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const PRODUCTION_URL = "https://www.justiceultimateautomobiles.com";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [isResetMode, setIsResetMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Password strength checker
  const checkPasswordStrength = (pwd: string) => {
    const hasLength = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    
    const strength = [hasLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    
    return {
      isStrong: strength >= 4,
      strength,
      requirements: {
        length: hasLength,
        upper: hasUpper,
        lower: hasLower,
        number: hasNumber,
        special: hasSpecial
      }
    };
  };

  const passwordStrength = checkPasswordStrength(newPassword);

  useEffect(() => {
    let isMounted = true;
    
    // Set up auth state listener FIRST - this is critical
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth event received:", event);
      
      if (!isMounted) return;
      
      if (event === "PASSWORD_RECOVERY") {
        console.log("PASSWORD_RECOVERY event - showing reset form");
        setIsResetMode(true);
        setIsLoading(false);
      } else if (event === "SIGNED_IN" && session) {
        // User might have been signed in via recovery token
        // Check if we came from a recovery flow
        const url = window.location.href;
        if (url.includes('type=recovery') || url.includes('reset-password')) {
          console.log("SIGNED_IN after recovery - showing reset form");
          setIsResetMode(true);
          setIsLoading(false);
        }
      }
    });

    // Establish a session from the recovery tokens in the URL
    const checkRecoveryTokens = async () => {
      const hash = window.location.hash;
      const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
      const searchParams = new URLSearchParams(window.location.search);

      const accessToken = hashParams.get("access_token") || searchParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token") || searchParams.get("refresh_token");
      const type = hashParams.get("type") || searchParams.get("type");
      const code = searchParams.get("code");
      const errorDescription = hashParams.get("error_description") || searchParams.get("error_description");

      if (errorDescription) {
        toast({
          title: "Reset link invalid",
          description: errorDescription,
          variant: "destructive",
        });
        if (isMounted) setIsLoading(false);
        return;
      }

      // 1) Implicit recovery link (#access_token=...&type=recovery)
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        // Strip tokens from the URL so they aren't reused/leaked
        window.history.replaceState({}, document.title, window.location.pathname);

        if (!isMounted) return;

        if (error) {
          console.error("setSession failed:", error);
          toast({
            title: "Reset link expired",
            description: "This password reset link is no longer valid. Please request a new one.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        setIsResetMode(true);
        setIsLoading(false);
        return;
      }

      // 2) PKCE recovery link (?code=...)
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        window.history.replaceState({}, document.title, window.location.pathname);

        if (!isMounted) return;

        if (error) {
          console.error("exchangeCodeForSession failed:", error);
          toast({
            title: "Reset link expired",
            description: "This password reset link is no longer valid. Please request a new one.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        setIsResetMode(true);
        setIsLoading(false);
        return;
      }

      // 3) Tokens already consumed by the client — fall back to existing session
      const { data: { session } } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (session && (type === "recovery" || hash === "#" || hash === "")) {
        setIsResetMode(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
    };

    const timeoutId = setTimeout(() => {
      checkRecoveryTokens();
    }, 0);


    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const sendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use production URL for redirect
      const redirectUrl = window.location.hostname === "localhost" 
        ? `${window.location.origin}/reset-password`
        : `${PRODUCTION_URL}/reset-password`;

      // Use edge function to bypass captcha requirement
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { 
          email: email,
          redirectTo: redirectUrl 
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setEmailSent(true);
      toast({
        title: "Password Reset Email Sent",
        description: "If an account exists with this email, you will receive a reset link shortly.",
      });
    } catch (error: any) {
      console.error("Error sending reset email:", error);
      toast({
        title: "Error",
        description: error.message || "Unable to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (!passwordStrength.isStrong) {
      toast({
        title: "Weak Password",
        description: "Please use a stronger password with at least 8 characters, including uppercase, lowercase, number, and special character.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      // Get current user to send notification email
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email) {
        // Send password change notification email (fire and forget)
        supabase.functions.invoke('send-password-change-notification', {
          body: { 
            email: user.email,
            name: user.user_metadata?.full_name || 'User'
          }
        }).catch(err => console.log('Email notification skipped:', err));
      }

      // Sign out the user to force fresh login with new password
      await supabase.auth.signOut();

      setResetSuccess(true);
      toast({
        title: "Password Reset Successful",
        description: "Your password has been successfully reset. Please login with your new password.",
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/auth?reset=success");
      }, 3000);

    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast({
        title: "Password Reset Failed",
        description: error.message || "The reset link may be invalid or expired. Please request a new one.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verifying your request...</p>
        </div>
      </div>
    );
  }

  // Success screen after email sent
  if (emailSent && !isResetMode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
        <div className="glass-strong rounded-3xl p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Check Your Email</h1>
          <p className="text-muted-foreground mb-6">
            We've sent a password reset link to:
          </p>
          <p className="font-semibold text-lg mb-6">{email}</p>
          <p className="text-sm text-muted-foreground mb-8">
            Click the link in the email to reset your password. The link will expire in 1 hour.
          </p>
          <div className="space-y-4">
            <Button 
              onClick={() => setEmailSent(false)} 
              variant="outline" 
              className="w-full"
            >
              Send to a different email
            </Button>
            <Link to="/auth">
              <Button className="w-full">
                Back to Login
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-6">
            Didn't receive the email? Check your spam folder or try again.
          </p>
        </div>
      </div>
    );
  }

  // Success screen after password reset
  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
        <div className="glass-strong rounded-3xl p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-4 text-green-600">Password Reset Successful!</h1>
          <p className="text-muted-foreground mb-6">
            Your password has been successfully updated.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            You will be redirected to the login page in a few seconds...
          </p>
          <Link to="/auth?reset=success">
            <Button className="w-full" size="lg">
              Login Now
            </Button>
          </Link>
          <div className="mt-8 p-4 bg-muted rounded-lg text-left">
            <p className="text-sm font-medium mb-2">Security Notice:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• A confirmation email has been sent to your registered email</li>
              <li>• Your old password can no longer be used</li>
              <li>• Please use your new password to login</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <div className="glass-strong rounded-3xl p-12 max-w-md w-full">
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>

        {!isResetMode ? (
          <>
            <h1 className="text-4xl font-bold mb-4">Forgot Password?</h1>
            <p className="text-muted-foreground mb-8">
              Enter your email address and we'll send you a secure link to reset your password.
            </p>

            <form onSubmit={sendResetEmail} className="space-y-6">
              <div>
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12"
                  required
                />
              </div>

              <Button className="w-full" size="lg" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Remember your password?{" "}
                <Link to="/auth" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </form>

            <div className="mt-8 p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> The password reset link will be sent to your registered email address. 
                The link expires in 1 hour for security purposes.
              </p>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-bold mb-4">Set New Password</h1>
            <p className="text-muted-foreground mb-8">
              Create a strong password for your account.
            </p>

            <form onSubmit={handlePasswordReset} className="space-y-6">
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pr-10 h-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {newPassword && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-all ${
                            level <= passwordStrength.strength
                              ? passwordStrength.strength <= 2
                                ? "bg-red-500"
                                : passwordStrength.strength === 3
                                ? "bg-yellow-500"
                                : "bg-green-500"
                              : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Password Strength: {" "}
                      <span className={
                        passwordStrength.strength <= 2 
                          ? "text-red-500 font-medium" 
                          : passwordStrength.strength === 3 
                          ? "text-yellow-500 font-medium" 
                          : "text-green-500 font-medium"
                      }>
                        {passwordStrength.strength <= 2 ? "Weak" : passwordStrength.strength === 3 ? "Medium" : "Strong"}
                      </span>
                    </p>
                    <div className="text-xs space-y-1 text-muted-foreground">
                      <p className={passwordStrength.requirements.length ? "text-green-600" : ""}>
                        {passwordStrength.requirements.length ? "✓" : "○"} At least 8 characters
                      </p>
                      <p className={passwordStrength.requirements.upper ? "text-green-600" : ""}>
                        {passwordStrength.requirements.upper ? "✓" : "○"} One uppercase letter
                      </p>
                      <p className={passwordStrength.requirements.lower ? "text-green-600" : ""}>
                        {passwordStrength.requirements.lower ? "✓" : "○"} One lowercase letter
                      </p>
                      <p className={passwordStrength.requirements.number ? "text-green-600" : ""}>
                        {passwordStrength.requirements.number ? "✓" : "○"} One number
                      </p>
                      <p className={passwordStrength.requirements.special ? "text-green-600" : ""}>
                        {passwordStrength.requirements.special ? "✓" : "○"} One special character (!@#$%^&*...)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pr-10 h-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
                {confirmPassword && newPassword === confirmPassword && confirmPassword.length > 0 && (
                  <p className="text-xs text-green-500 mt-1">✓ Passwords match</p>
                )}
              </div>

              <Button 
                className="w-full" 
                size="lg" 
                disabled={loading || !passwordStrength.isStrong || newPassword !== confirmPassword}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                After resetting, you will be redirected to the login page to sign in with your new password.
              </p>
            </form>
          </>
        )}

        {/* Company Footer */}
        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            <strong>Justice Ultimate Automobiles</strong>
          </p>
          <p className="text-xs text-muted-foreground">
            Phone: 0722827458 | Website: www.justiceultimateautomobiles.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
