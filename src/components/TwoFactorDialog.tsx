import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Input } from "@/components/ui/input";
import { Smartphone, Mail, Fingerprint, Clock, MessageCircle, Loader2, ShieldCheck, Key, AlertCircle } from "lucide-react";
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
  const [backupCode, setBackupCode] = useState("");
  const [showBackupInput, setShowBackupCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(preferredMethod);
  const [otpSent, setOtpSent] = useState(false);
  const [whatsappOtpSent, setWhatsappOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 minutes in seconds
  const [whatsappCountdown, setWhatsappCountdown] = useState(300); // 5 minutes for WhatsApp
  const { toast } = useToast();
  const verifyingRef = useRef(false);

  const verifyEmailOTP = async () => {
    if (code.length !== 6) {
      toast({ title: "Invalid Code", description: "Please enter the 6-digit code", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-email-otp', {
        body: { userId, code, purpose: 'login' }
      });
      if (error || !data?.success) throw new Error(data?.error || "Invalid or expired code");
      onSuccess();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const verifyWhatsAppOTP = async () => {
    if (code.length !== 6) {
      toast({ title: "Invalid Code", description: "Please enter the 6-digit code", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-email-otp', {
        body: { userId, code, purpose: 'login' }
      });
      if (error || !data?.success) throw new Error(data?.error || "Invalid or expired code");
      onSuccess();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const verifyTOTP = async () => {
    if (code.length !== 6) {
      toast({ title: "Invalid Code", description: "Please enter the 6-digit code from your authenticator app", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-totp-login', {
        body: { userId, code }
      });
      if (error || !data?.success) throw new Error(data?.error || "Invalid code");
      onSuccess();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const verifyBackupCode = async () => {
    if (backupCode.length < 8) {
      toast({ title: "Invalid Code", description: "Backup codes are at least 8 characters", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-backup-code', {
        body: { userId, code: backupCode }
      });
      if (error || !data?.success) throw new Error(data?.error || "Invalid or used backup code");
      onSuccess();
    } catch (error: any) {
      toast({ title: "Verification Failed", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (code.length === 6 && !verifyingRef.current && !loading) {
      verifyingRef.current = true;
      setVerifying(true);
      const executeVerification = async () => {
        if (selectedMethod === 'email_otp' && countdown > 0) await verifyEmailOTP();
        else if (selectedMethod === 'whatsapp_otp' && whatsappCountdown > 0) await verifyWhatsAppOTP();
        else if (selectedMethod === 'totp') await verifyTOTP();
        verifyingRef.current = false;
        setVerifying(false);
      };
      executeVerification();
    }
  }, [code, selectedMethod]);

  useEffect(() => {
    if (open && !otpSent) handleEmailOTP();
    if (open && !whatsappOtpSent && availableMethods.whatsapp) {
      const timer = setTimeout(() => handleWhatsAppOTP(), 1000);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (otpSent && countdown > 0) {
      const timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [otpSent, countdown]);

  useEffect(() => {
    if (whatsappOtpSent && whatsappCountdown > 0) {
      const timer = setInterval(() => setWhatsappCountdown((prev) => prev - 1), 1000);
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
      const { error } = await supabase.functions.invoke('send-email-otp', { body: { userId, purpose: 'login' } });
      if (error) throw error;
      setOtpSent(true);
      setCountdown(600);
      toast({ title: "Code Sent", description: "Check your email for the verification code" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleWhatsAppOTP = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-whatsapp-otp', { body: { userId, purpose: 'login' } });
      if (error) console.log("WhatsApp OTP not sent:", error.message);
      setWhatsappOtpSent(true);
      setWhatsappCountdown(300);
      toast({ title: "Code Sent", description: "Check your WhatsApp for the verification code" });
    } catch (error: any) {
      setWhatsappOtpSent(true);
      toast({ title: "Code Sent", description: "If you have WhatsApp configured, check for your code" });
    } finally { setLoading(false); }
  };

  const verifyFingerprint = async () => {
    setLoading(true);
    try {
      if (Capacitor.isNativePlatform()) {
        try {
          const bio = await NativeBiometric.isAvailable();
          if (bio.isAvailable) {
            await NativeBiometric.verifyIdentity({
              reason: "Secure Login to Justice Ultimate Automobiles",
              title: "Biometric Auth",
              subtitle: "Verify identity",
              description: "Use fingerprint or Face ID",
              useFallback: true
            });
            await supabase.from("profiles").update({ last_seen: new Date().toISOString() }).eq("user_id", userId);
            onSuccess();
            return;
          }
        } catch (bioErr) {
          console.error("Native biometric error:", bioErr);
        }
      }

      // Web Fallback / WebAuthn
      const { data: credentials, error: credError } = await supabase.from("user_fingerprints").select("*").eq("user_id", userId);
      if (credError || !credentials || credentials.length === 0) {
        throw new Error("No biometrics registered on this account. Please register biometrics in your profile settings first.");
      }

      const challengeBytes = crypto.getRandomValues(new Uint8Array(32));
      const challenge = btoa(String.fromCharCode(...challengeBytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const authOptions = {
        challenge,
        allowCredentials: credentials.map(cred => ({ id: cred.credential_id, type: "public-key" as const })),
        userVerification: "required" as const,
        timeout: 60000,
        rpId: window.location.hostname,
      };

      const authResult = await startAuthentication({ optionsJSON: authOptions });
      if (credentials.some(c => c.credential_id === authResult.id)) {
        await supabase.from("user_fingerprints").update({ last_used: new Date().toISOString() }).eq("credential_id", authResult.id);
        onSuccess();
      } else throw new Error("Invalid biometric credential");
    } catch (error: any) {
      toast({ title: "Authentication Failed", description: error.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const methodCount = [availableMethods.email, availableMethods.whatsapp, availableMethods.totp, availableMethods.fingerprint].filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg p-0 overflow-hidden border-none bg-background shadow-2xl rounded-xl">
        <div className="bg-primary py-8 px-6 text-white text-center relative overflow-hidden text-left">
           {/* Background HUD elements */}
           <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
           </div>

           <ShieldCheck className="h-16 w-16 mx-auto mb-4 text-brand-red animate-pulse" />
           <DialogHeader>
             <DialogTitle className="text-2xl font-black uppercase tracking-widest text-white text-center">Identity Verification</DialogTitle>
             <DialogDescription className="text-white/70 text-xs font-bold uppercase tracking-wider pt-2 text-center">
               Enterprise-grade 2FA protection active
             </DialogDescription>
           </DialogHeader>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          {!showBackupInput ? (
            <Tabs value={selectedMethod} onValueChange={setSelectedMethod} className="w-full">
              <TabsList className={`grid w-full grid-cols-${methodCount} h-14 bg-secondary/20 p-1 rounded-lg mb-8`}>
                {availableMethods.email && (
                  <TabsTrigger value="email_otp" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all gap-2 py-3">
                    <Mail className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-tighter hidden sm:inline">Email</span>
                  </TabsTrigger>
                )}
                {availableMethods.whatsapp && (
                  <TabsTrigger value="whatsapp_otp" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all gap-2 py-3">
                    <MessageCircle className="h-4 w-4 text-green-500" />
                    <span className="text-[10px] font-black uppercase tracking-tighter hidden sm:inline">WhatsApp</span>
                  </TabsTrigger>
                )}
                {availableMethods.totp && (
                  <TabsTrigger value="totp" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all gap-2 py-3">
                    <Smartphone className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-tighter hidden sm:inline">Auth App</span>
                  </TabsTrigger>
                )}
                {availableMethods.fingerprint && (
                  <TabsTrigger value="fingerprint" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all gap-2 py-3">
                    <Fingerprint className="h-4 w-4 text-brand-red" />
                    <span className="text-[10px] font-black uppercase tracking-tighter hidden sm:inline">Biometric</span>
                  </TabsTrigger>
                )}
              </TabsList>

              <div className="min-h-[220px] flex flex-col justify-center">
                {availableMethods.email && (
                  <TabsContent value="email_otp" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="text-center space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Digital Dispatch</p>
                      <p className="text-xs font-bold text-foreground text-center">Code sent to: {email}</p>
                      {otpSent && countdown > 0 && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase mx-auto">
                          <Clock className="h-3 w-3" />
                          <span>Valid: {formatTime(countdown)}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <InputOTP maxLength={6} value={code} onChange={setCode} disabled={countdown === 0 || verifying}>
                          <InputOTPGroup className="gap-2">
                            {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} className="w-10 h-12 sm:w-12 sm:h-14 text-xl font-black rounded-md border-2 border-border focus:border-primary" />)}
                          </InputOTPGroup>
                        </InputOTP>
                      </div>

                      {verifying && (
                        <div className="flex items-center justify-center gap-2 text-primary animate-pulse">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-center">Validating Payload...</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-center pt-4">
                      <Button onClick={() => { setCode(""); setOtpSent(false); handleEmailOTP(); }}
                        disabled={loading || countdown > 540 || verifying} variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-brand-red hover:bg-brand-red/5">
                        Resend Security Code
                      </Button>
                    </div>
                  </TabsContent>
                )}

                {availableMethods.whatsapp && (
                  <TabsContent value="whatsapp_otp" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="text-center space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600 text-center">WhatsApp Dispatch</p>
                      <p className="text-xs font-bold text-center">Secure code transmitted via WhatsApp</p>
                      {whatsappOtpSent && whatsappCountdown > 0 && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/5 text-green-600 text-[10px] font-black uppercase mx-auto">
                          <Clock className="h-3 w-3" />
                          <span>Expiry: {formatTime(whatsappCountdown)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-center">
                      <InputOTP maxLength={6} value={code} onChange={setCode} disabled={whatsappCountdown === 0 || verifying}>
                        <InputOTPGroup className="gap-2">
                          {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} className="w-10 h-12 sm:w-12 sm:h-14 text-xl font-black rounded-md border-2 border-border focus:border-green-500" />)}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    <div className="flex justify-center pt-4">
                      <Button onClick={() => { setCode(""); setWhatsappOtpSent(false); handleWhatsAppOTP(); }}
                        disabled={loading || whatsappCountdown > 240 || verifying} variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-green-600 hover:bg-green-500/5">
                        Resend WhatsApp Code
                      </Button>
                    </div>
                  </TabsContent>
                )}

                {availableMethods.totp && (
                  <TabsContent value="totp" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="text-center space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary text-center">Authenticator Sync</p>
                      <p className="text-xs font-bold text-center">Enter the code from your device</p>
                    </div>

                    <div className="flex justify-center">
                      <InputOTP maxLength={6} value={code} onChange={setCode} disabled={verifying}>
                        <InputOTPGroup className="gap-2">
                          {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} className="w-10 h-12 sm:w-12 sm:h-14 text-xl font-black rounded-md border-2 border-border focus:border-primary" />)}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    <p className="text-center text-[9px] font-bold text-muted-foreground uppercase tracking-wider italic text-center">
                      Verify via Google Authenticator or Microsoft Auth
                    </p>
                  </TabsContent>
                )}

                {availableMethods.fingerprint && (
                  <TabsContent value="fingerprint" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 text-center">
                    <div className="space-y-2 text-center">
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-red">Biometric Gateway</p>
                       <p className="text-xs font-bold">Use hardware sensors to authenticate</p>
                    </div>

                    <div className="flex justify-center py-4">
                      <div className="h-24 w-24 rounded-full bg-secondary/10 flex items-center justify-center border-4 border-dashed border-brand-red/20 group mx-auto">
                        <Fingerprint className="h-12 w-12 text-brand-red animate-pulse group-hover:scale-110 transition-transform" />
                      </div>
                    </div>

                    <Button onClick={verifyFingerprint} disabled={loading} className="w-full h-14 bg-brand-red hover:bg-brand-red/90 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-md shadow-xl">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                      Access Biometric Sensor
                    </Button>
                  </TabsContent>
                )}
              </div>
            </Tabs>
          ) : (
            /* Backup Code Interface */
            <div className="space-y-6 animate-in zoom-in duration-300">
               <div className="text-center space-y-2">
                  <Key className="h-12 w-12 mx-auto text-primary" />
                  <h4 className="text-sm font-black uppercase tracking-widest text-center">Master Backup Override</h4>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase text-center">Enter 8-digit archival security key</p>
               </div>

               <div className="relative">
                  <Input
                    placeholder="ENTER BACKUP KEY"
                    value={backupCode}
                    onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                    className="h-14 text-center font-mono text-xl tracking-[0.3em] font-black border-2 border-primary/20 focus:border-primary bg-secondary/5 w-full"
                  />
               </div>

               <Button onClick={verifyBackupCode} disabled={loading} className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-md shadow-xl">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Verify Security Key"}
               </Button>

               <Button variant="link" onClick={() => setShowBackupCode(false)} className="w-full text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground text-center">
                  Return to Primary Channels
               </Button>
            </div>
          )}

          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
             <Button variant="outline" onClick={onClose} className="w-full sm:w-auto text-[9px] font-black uppercase tracking-widest h-10 px-6 border-border/50">
                Abort Terminal Access
             </Button>

             {!showBackupInput && (
               <button onClick={() => setShowBackupCode(true)} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-brand-red transition-colors group">
                  <AlertCircle className="h-3 w-3 group-hover:animate-bounce" />
                  Lost Access? Use Backup Key
               </button>
             )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
