import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Smartphone, Mail, Fingerprint } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { startAuthentication } from '@simplewebauthn/browser';

interface TwoFactorDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  email: string;
  availableMethods: {
    email: boolean;
    totp: boolean;
    fingerprint: boolean;
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
  const [selectedMethod, setSelectedMethod] = useState(preferredMethod);
  const { toast } = useToast();

  const handleEmailOTP = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-2fa-code', {
        body: { email, userId }
      });

      if (error) throw error;

      toast({
        title: "Code Sent",
        description: "Check your email for the verification code",
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
      const { data, error } = await supabase
        .from("two_factor_auth")
        .select("*")
        .eq("user_id", userId)
        .eq("code", code)
        .gte("expires_at", new Date().toISOString())
        .single();

      if (error || !data) {
        throw new Error("Invalid or expired code");
      }

      // Delete used code
      await supabase
        .from("two_factor_auth")
        .delete()
        .eq("id", data.id);

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

  const verifyFingerprint = async () => {
    setLoading(true);
    try {
      // Get stored credentials
      const { data: credentials, error: credError } = await supabase
        .from("user_fingerprints")
        .select("*")
        .eq("user_id", userId);

      if (credError || !credentials || credentials.length === 0) {
        throw new Error("No fingerprint registered");
      }

      // Create authentication options
      const authOptions = {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: credentials.map(cred => ({
          id: cred.credential_id,
          type: "public-key" as const,
        })),
        userVerification: "required" as const,
        timeout: 60000,
      };

      // Start authentication
      const authResult = await startAuthentication(authOptions as any);

      // Verify with backend (in production, you'd verify the signature)
      // For now, we'll just check if credential exists
      const credentialExists = credentials.some(c => c.credential_id === authResult.id);

      if (credentialExists) {
        // Update last used
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
        title: "Error",
        description: error.message || "Fingerprint authentication failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass-strong">
        <DialogHeader>
          <DialogTitle>Two-Factor Authentication</DialogTitle>
          <DialogDescription>
            Choose your preferred verification method
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedMethod} onValueChange={setSelectedMethod} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {availableMethods.email && (
              <TabsTrigger value="email_otp">
                <Mail className="h-4 w-4" />
              </TabsTrigger>
            )}
            {availableMethods.totp && (
              <TabsTrigger value="totp">
                <Smartphone className="h-4 w-4" />
              </TabsTrigger>
            )}
            {availableMethods.fingerprint && (
              <TabsTrigger value="fingerprint">
                <Fingerprint className="h-4 w-4" />
              </TabsTrigger>
            )}
          </TabsList>

          {availableMethods.email && (
            <TabsContent value="email_otp" className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                We'll send a verification code to {email}
              </div>
              
              <Button onClick={handleEmailOTP} disabled={loading} className="w-full">
                {loading ? "Sending..." : "Send Code"}
              </Button>

              <div className="space-y-2">
                <Label>Enter 6-digit code</Label>
                <Input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="text-center text-2xl font-mono tracking-widest"
                />
              </div>

              <Button 
                onClick={verifyEmailOTP} 
                disabled={loading || code.length !== 6}
                className="w-full"
              >
                {loading ? "Verifying..." : "Verify"}
              </Button>
            </TabsContent>
          )}

          {availableMethods.totp && (
            <TabsContent value="totp" className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                Enter the 6-digit code from your authenticator app
              </div>

              <div className="space-y-2">
                <Label>Authenticator Code</Label>
                <Input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="text-center text-2xl font-mono tracking-widest"
                />
              </div>

              <Button 
                onClick={verifyTOTP} 
                disabled={loading || code.length !== 6}
                className="w-full"
              >
                {loading ? "Verifying..." : "Verify"}
              </Button>

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
