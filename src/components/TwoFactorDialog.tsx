import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Smartphone, Mail, Fingerprint, Clock, MessageCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { startAuthentication } from '@simplewebauthn/browser';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric } from 'capacitor-native-biometric';

interface TwoFactorDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  email: string;
  availableMethods: {
    email: boolean;
    totp: boolean;
    fingerprint: boolean;
    whatsapp: boolean;
  };
  preferredMethod: string;
  onSuccess: () => void;
}

export const TwoFactorDialog = ({ 
  open, 
  onClose, 
  userId, 
  email,
  availableMethods,
  preferredMethod,
  onSuccess 
}: TwoFactorDialogProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(preferredMethod);
  const [otpSent, setOtpSent] = useState(false);
  const [whatsappOtpSent, setWhatsappOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 minutes in seconds
  const [whatsappCountdown, setWhatsappCountdown] = useState(300); // 5 minutes for WhatsApp
  const { toast } = useToast();
  const verifyingRef = useRef(false);

  // Define verification executors first so they are safely available to your effects hooks below
  const verifyEmailOTP = async () => {
    if (code.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-email-otp', {
        body: { userId, code, purpose: 'login' }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || "Invalid or expired code");
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyWhatsAppOTP = async () => {
    if (code.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-email-otp', {
        body: { userId, code, purpose: 'login' }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || "Invalid or expired code");
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyTOTP = async () => {
    if (code.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit code from your authenticator app",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-totp-login', {
        body: { userId, code }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || "Invalid code");
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-verify effect when 6 digits are typed out completely
  useEffect(() => {
    if (code.length === 6 && !verifyingRef.current && !loading) {
      verifyingRef.current = true;
      setVerifying(true);
      
      const executeVerification = async () => {
        if (selectedMethod === 'email_otp' && countdown > 0) {
          await verifyEmailOTP();
        } else if (selectedMethod === 'whatsapp_otp' && whatsappCountdown > 0) {
          await verifyWhatsAppOTP();
        } else if (selectedMethod === 'totp') {
          await verifyTOTP();
        }
        verifyingRef.current = false;
        setVerifying(false);
      };
      
      executeVerification();
    }
  }, [code, selectedMethod]);

  // ALWAYS auto-send BOTH email OTP AND WhatsApp OTP when dialog opens
  useEffect(() => {
    if (open && !otpSent) {
      handleEmailOTP();
    }
    if (open && !whatsappOtpSent && availableMethods.whatsapp) {
      const timer = setTimeout(() => {
        handleWhatsAppOTP();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Countdown timer rules tracking intervals
  useEffect(() => {
    if (otpSent && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [otpSent, countdown]);

  useEffect(() => {
    if (whatsappOtpSent && whatsappCountdown > 0) {
      const timer = setInterval(() => {
        setWhatsappCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [whatsappOtpSent, whatsappCountdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEmailOTP = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-email-otp', {
        body: { userId, purpose: 'login' }
      });

      if (error) throw error;

      setOtpSent(true);
      setCountdown(600);
      toast({
        title: "Code Sent",
        description: "Check your email for the verification code (valid for 10 minutes)",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppOTP = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-whatsapp-otp', {
        body: { userId, purpose: 'login' }
      });

      if (error) {
        console.log("WhatsApp OTP not sent (optional):", error.message);
      }

      setWhatsappOtpSent(true);
      setWhatsappCountdown(300);
      toast({
        title: "Code Sent",
        description: "Check your WhatsApp for the verification code (valid for 5 minutes)",
      });
    } catch (error: any) {
      console.log("WhatsApp OTP error (non-critical):", error?.message);
      setWhatsappOtpSent(true);
      toast({
        title: "Code Sent",
        description: "If you have WhatsApp configured, check for your verification code",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyFingerprint = async () => {
    setLoading(true);
    try {
      if (Capacitor.isNativePlatform()) {
        const biometricAvailable = await NativeBiometric.isAvailable();
        
        if (!biometricAvailable.isAvailable) {
          throw new Error("Biometric hardware authentication is not set up or available on this device.");
        }

        await NativeBiometric.verifyIdentity({
          reason: "Log in securely to your Justice Ultimate Automobiles account",
          title: "Biometric Authentication",
          subtitle: "Verify your identity using fingerprint or Face ID",
          description: "Place your finger on the device sensor to continue",
          useFallback: true
        });

        await supabase
          .from("user_fingerprints")
          .update({ last_used: new Date().toISOString() })
          .eq("user_id", userId);

        onSuccess();
        return;
      }

      const { data: credentials, error: credError } = await supabase
        .from("user_fingerprints")
        .select("*")
        .eq("user_id", userId);

      if (credError || !credentials || credentials.length === 0) {
        throw new Error("No fingerprint registered");
      }

      const challengeBytes = crypto.getRandomValues(new Uint8Array(32));
      const challenge = btoa(String.fromCharCode(...challengeBytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      const authOptions = {
        challenge,
        allowCredentials: credentials.map(cred => ({
          id: cred.credential_id,
          type: "public-key" as const,
        })),
        userVerification: "required" as const,
        timeout: 60000,
        rpId: window.location.hostname,
      };

      const authResult = await startAuthentication({ optionsJSON: authOptions });
      const credentialExists = credentials.some(c => c.credential_id === authResult.id);

      if (credentialExists) {
        await supabase
          .from("user_fingerprints")
          .update({ last_used: new Date().toISOString() })
          .eq("credential_id", authResult.id);

        onSuccess();
      } else {
        throw new Error("Invalid credential");
      }
    } catch (error: any) {
      console.error("Fingerprint auth error:", error);
      toast({
        title: "Authentication Failed",
        description: error.message || "Fingerprint authentication failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const methodCount = [
    availableMethods.email,
    availableMethods.whatsapp,
    availableMethods.totp,
    availableMethods.fingerprint
  ].filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass-strong" aria-describedby="2fa-description">
        <DialogHeader>
          <DialogTitle>Two-Factor Authentication</DialogTitle>
          <DialogDescription id="2fa-description">
            Choose your preferred verification method to complete login
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedMethod} onValueChange={setSelectedMethod} className="w-full">
          <TabsList className={`grid w-full grid-cols-${methodCount}`}>
            {availableMethods.email && (
              <TabsTrigger value="email_otp" title="Email OTP">
                <Mail className="h-4 w-4" />
              </TabsTrigger>
            )}
            {availableMethods.whatsapp && (
              <TabsTrigger value="whatsapp_otp" title="WhatsApp OTP">
                <MessageCircle className="h-4 w-4" />
              </TabsTrigger>
            )}
            {availableMethods.totp && (
              <TabsTrigger value="totp" title="Authenticator App">
                <Smartphone className="h-4 w-4" />
              </TabsTrigger>
            )}
            {availableMethods.fingerprint && (
              <TabsTrigger value="fingerprint" title="Fingerprint/Face ID">
                <Fingerprint className="h-4 w-4" />
              </TabsTrigger>
            )}
          </TabsList>

          {availableMethods.email && (
            <TabsContent value="email_otp" className="space-y-4">
              <div className="text-center space-y-2">
                <div className="text-sm text-muted-foreground">
                  {otpSent ? `Code sent to ${email}` : `Sending code to ${email}...`}
                </div>
                {otpSent && countdown > 0 && (
                  <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
                    <Clock className="h-4 w-4" />
                    <span>Valid for: {formatTime(countdown)}</span>
                  </div>
                )}
                {countdown === 0 && (
                  <div className="text-sm text-destructive">Code expired</div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-center block">Enter 6-digit code</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={code}
                    onChange={(value) => setCode(value)}
                    disabled={countdown === 0 || verifying}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              {verifying && (
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">Verifying...</span>
                </div>
              )}

              <div className="flex justify-center">
                <Button 
                  onClick={() => {
                    setCode("");
                    setOtpSent(false);
                    handleEmailOTP();
                  }} 
                  disabled={loading || countdown > 540 || verifying}
                  variant="outline"
                  size="sm"
                >
                  Resend Code
                </Button>
              </div>
            </TabsContent>
          )}

          {availableMethods.whatsapp && (
            <TabsContent value="whatsapp_otp" className="space-y-4">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                  {whatsappOtpSent ? "Code sent to your WhatsApp" : "Sending code via WhatsApp..."}
                </div>
                {whatsappOtpSent && whatsappCountdown > 0 && (
                  <div className="flex items-center justify-center gap-2 text-sm font-medium text-green-600">
                    <Clock className="h-4 w-4" />
                    <span>Valid for: {formatTime(whatsappCountdown)}</span>
                  </div>
                )}
                {whatsappCountdown === 0 && (
                  <div className="text-sm text-destructive">Code expired</div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-center block">Enter 6-digit code from WhatsApp</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={code}
                    onChange={(value) => setCode(value)}
                    disabled={whatsappCountdown === 0 || verifying}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              {verifying && (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">Verifying...</span>
                </div>
              )}

              <div className="flex justify-center">
                <Button 
                  onClick={() => {
                    setCode("");
                    setWhatsappOtpSent(false);
                    handleWhatsAppOTP();
                  }} 
                  disabled={loading || whatsappCountdown > 240 || verifying}
                  variant="outline"
                  size="sm"
                >
                  Resend Code
                </Button>
              </div>
            </TabsContent>
          )}

          {availableMethods.totp && (
            <TabsContent value="totp" className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                Enter the 6-digit code from your authenticator app
              </div>

              <div className="space-y-2">
                <Label className="text-center block">Authenticator Code</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={code}
                    onChange={(value) => setCode(value)}
                    disabled={verifying}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              {verifying && (
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">Verifying...</span>
                </div>
              )}

              <div className="text-xs text-center text-muted-foreground">
                Lost your device? Use a backup code instead
              </div>
            </TabsContent>
          )}

          {availableMethods.fingerprint && (
            <TabsContent value="fingerprint" className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                Use your fingerprint or Face ID to verify
              </div>

              <div className="flex justify-center py-8">
                <Fingerprint className="h-24 w-24 text-primary animate-pulse" />
              </div>

              <Button 
                onClick={verifyFingerprint} 
                disabled={loading}
                className="w-full"
              >
                <Fingerprint className="mr-2 h-4 w-4" />
                {loading ? "Authenticating..." : "Use Fingerprint"}
              </Button>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};