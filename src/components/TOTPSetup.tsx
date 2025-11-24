import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Smartphone, Key, Shield, Copy, Check } from "lucide-react";
import QRCode from "qrcode";

interface TOTPSetupProps {
  onComplete?: () => void;
}

export const TOTPSetup = ({ onComplete }: TOTPSetupProps) => {
  const [step, setStep] = useState<'intro' | 'scan' | 'verify'>('intro');
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const { toast } = useToast();

  // Check if TOTP is already enabled
  useEffect(() => {
    checkTOTPStatus();
  }, []);

  const checkTOTPStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from("user_totp")
        .select("enabled")
        .eq("user_id", session.user.id)
        .maybeSingle();

      setIsEnabled(data?.enabled || false);
    } catch (error) {
      console.error("Error checking TOTP status:", error);
    }
  };

  const generateQRCode = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke('setup-totp', {
        body: { action: 'generate' }
      });

      if (response.error) throw response.error;

      const { otpauthUrl, secret: secretKey, backupCodes: codes } = response.data;
      
      // Generate QR code from otpauth URL
      const qrUrl = await QRCode.toDataURL(otpauthUrl);
      setQrCodeUrl(qrUrl);
      setSecret(secretKey);
      setBackupCodes(codes);
      setStep('scan');
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

  const verifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke('setup-totp', {
        body: { 
          action: 'verify',
          code: verificationCode
        }
      });

      if (response.error) throw response.error;

      if (response.data.success) {
        // Log to audit trail
        await supabase.from("audit_logs").insert({
          user_id: session.user.id,
          action: "totp_enabled",
          user_agent: navigator.userAgent,
        });

        toast({
          title: "Success!",
          description: "Authenticator app has been enabled",
        });
        setIsEnabled(true);
        setStep('intro');
        onComplete?.();
      } else {
        toast({
          title: "Invalid Code",
          description: "The code you entered is incorrect",
          variant: "destructive",
        });
      }
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

  const disableTOTP = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke('setup-totp', {
        body: { action: 'disable' }
      });

      if (response.error) throw response.error;

      // Log to audit trail
      await supabase.from("audit_logs").insert({
        user_id: session.user.id,
        action: "totp_disabled",
        user_agent: navigator.userAgent,
      });

      toast({
        title: "Success",
        description: "Authenticator app has been disabled",
      });
      setIsEnabled(false);
      onComplete?.();
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

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Secret key copied to clipboard",
    });
  };

  const downloadBackupCodes = () => {
    const content = `Justice Ultimate Automobiles - Backup Codes\n\n${backupCodes.join('\n')}\n\nKeep these codes safe. Each can be used once if you lose access to your authenticator app.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (step === 'intro') {
    return (
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Authenticator App (TOTP)
          </CardTitle>
          <CardDescription>
            {isEnabled ? "Authenticator app is currently enabled" : "Add an extra layer of security to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEnabled ? (
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
                <p className="text-sm">
                  ✓ Authenticator app is active and protecting your account
                </p>
              </div>
              <Button onClick={disableTOTP} disabled={loading} variant="destructive" className="w-full">
                {loading ? "Disabling..." : "Disable Authenticator App"}
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold">More Secure</h4>
                    <p className="text-sm text-muted-foreground">
                      Time-based codes that change every 30 seconds
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Key className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold">Works Offline</h4>
                    <p className="text-sm text-muted-foreground">
                      No internet connection required for code generation
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">Compatible Apps:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Google Authenticator</li>
                  <li>• Microsoft Authenticator</li>
                  <li>• Authy</li>
                  <li>• LastPass Authenticator</li>
                </ul>
              </div>

              <Button onClick={generateQRCode} disabled={loading} className="w-full">
                {loading ? "Generating..." : "Setup Authenticator App"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  if (step === 'scan') {
    return (
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle>Scan QR Code</CardTitle>
          <CardDescription>
            Use your authenticator app to scan this QR code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {qrCodeUrl && (
            <div className="flex justify-center">
              <img src={qrCodeUrl} alt="QR Code" className="border-4 border-border rounded-lg" />
            </div>
          )}

          <div className="space-y-2">
            <Label>Or enter this key manually:</Label>
            <div className="flex gap-2">
              <Input value={secret} readOnly className="font-mono text-sm" />
              <Button
                variant="outline"
                size="icon"
                onClick={copySecret}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="verification-code">Enter 6-digit code</Label>
            <Input
              id="verification-code"
              type="text"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="text-center text-2xl font-mono tracking-widest"
            />
          </div>

          <Button 
            onClick={verifyCode} 
            disabled={loading || verificationCode.length !== 6}
            className="w-full"
          >
            {loading ? "Verifying..." : "Verify & Enable"}
          </Button>

          {backupCodes.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Key className="h-4 w-4" />
                Backup Codes
              </h4>
              <p className="text-xs text-muted-foreground">
                Save these codes in a safe place. Each can be used once if you lose access to your authenticator.
              </p>
              <Button variant="outline" size="sm" onClick={downloadBackupCodes} className="w-full">
                Download Backup Codes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
};