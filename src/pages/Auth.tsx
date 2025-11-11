import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Facebook, Instagram, Linkedin, ArrowLeft, Mail } from "lucide-react";
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
import authBg from "@/assets/auth-bg.jpg";
import carLotOverlay from "@/assets/car-lot-overlay.jpg";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showSuspendedModal, setShowSuspendedModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

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
      message: strength >= 4 
        ? "Strong password" 
        : "Password must have: 8+ chars, uppercase, lowercase, number, special char",
      requirements: {
        length: hasLength,
        upper: hasUpper,
        lower: hasLower,
        number: hasNumber,
        special: hasSpecial
      }
    };
  };

  const passwordStrength = checkPasswordStrength(regPassword);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Check user role with maybeSingle to avoid errors
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .maybeSingle();

        console.log("Role data:", roleData);
        console.log("User ID:", data.user.id);

        toast({
          title: "Login Successful!",
          description: "Welcome back to Justice Ultimate Automobiles",
        });

        // Redirect based on role - wait a moment for state to update
        setTimeout(() => {
          if (roleData && roleData.role === "admin") {
            navigate("/admin-dashboard");
          } else {
            navigate("/customer-dashboard");
          }
        }, 100);
      }
    } catch (error: any) {
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
    
    if (regPassword !== regConfirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (!passwordStrength.isStrong) {
      toast({
        title: "Weak Password",
        description: passwordStrength.message,
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
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
            <form onSubmit={handleLogin} className="glass rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-6 w-full max-w-md">
              <h1 className="text-4xl font-bold mb-6">Login</h1>
              <Input 
                type="email" 
                placeholder="Email" 
                className="w-full" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input 
                type="password" 
                placeholder="Password" 
                className="w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Link to="/reset-password" className="text-sm text-primary hover:underline">
                Forgot Password?
              </Link>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
              <p className="text-sm text-muted-foreground">or login with social platforms</p>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 rounded-full bg-muted hover:bg-primary flex items-center justify-center transition-colors">
                  <span className="text-xs font-bold">G</span>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-muted hover:bg-primary flex items-center justify-center transition-colors">
                  <Facebook className="h-4 w-4" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-muted hover:bg-primary flex items-center justify-center transition-colors">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-muted hover:bg-primary flex items-center justify-center transition-colors">
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </form>
          </div>

          {/* Sign Up Form */}
          <div className="auth-form-container sign-up-container absolute top-0 left-0 w-1/2 h-full flex items-center justify-center z-10 opacity-0 transition-all duration-700 overflow-y-auto">
            <form onSubmit={handleRegister} className="glass rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 w-full max-w-md my-8">
              <h1 className="text-3xl font-bold mb-4">Registration</h1>
              
              <Input 
                type="text" 
                placeholder="Full Name" 
                className="w-full"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                required
              />
              <Input 
                type="email" 
                placeholder="Email" 
                className="w-full"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />
              <Input 
                type="tel" 
                placeholder="Phone (e.g., +254...)" 
                className="w-full"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                required
              />
              
              <div className="w-full space-y-2">
                <Input 
                  type="password" 
                  placeholder="Password" 
                  className="w-full"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
                {regPassword && (
                  <p className={`text-xs ${passwordStrength.isStrong ? 'text-green-500' : 'text-destructive'}`}>
                    {passwordStrength.message}
                  </p>
                )}
              </div>

              <Input 
                type="password" 
                placeholder="Confirm Password" 
                className="w-full"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                required
              />

              <div className="w-full text-left space-y-2">
                <Label className="text-sm">Gender (Optional)</Label>
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
                      <label htmlFor={g} className="text-sm capitalize">
                        {g.replace("_", " ")}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Input 
                type="text" 
                placeholder="County / City" 
                className="w-full"
                value={countyCity}
                onChange={(e) => setCountyCity(e.target.value)}
              />
              
              <Input 
                type="text" 
                placeholder="Exact Location / Estate" 
                className="w-full"
                value={exactLocation}
                onChange={(e) => setExactLocation(e.target.value)}
              />

              <div className="w-full text-left space-y-2">
                <Label className="text-sm">Preferred Contact Method</Label>
                <RadioGroup value={preferredContact} onValueChange={setPreferredContact}>
                  <div className="flex gap-4">
                    {["email", "phone", "whatsapp"].map((method) => (
                      <div key={method} className="flex items-center space-x-2">
                        <RadioGroupItem value={method} id={method} />
                        <Label htmlFor={method} className="capitalize">{method}</Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Registering..." : "Register"}
              </Button>
              
              <p className="text-sm text-muted-foreground">or register with social platforms</p>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 rounded-full bg-muted hover:bg-primary flex items-center justify-center transition-colors">
                  <span className="text-xs font-bold">G</span>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-muted hover:bg-primary flex items-center justify-center transition-colors">
                  <Facebook className="h-4 w-4" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-muted hover:bg-primary flex items-center justify-center transition-colors">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-muted hover:bg-primary flex items-center justify-center transition-colors">
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
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
    </>
  );
};

export default Auth;
