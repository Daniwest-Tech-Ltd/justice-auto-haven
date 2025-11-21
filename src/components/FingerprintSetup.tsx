import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Fingerprint, Shield, Smartphone, Trash2 } from "lucide-react";
import { registerTrustedDevice } from "@/lib/deviceTracking";
import {
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser';

interface FingerprintDevice {
  id: string;
  device_name: string;
  created_at: string;
  last_used: string | null;
}

interface FingerprintSetupProps {
  devices?: FingerprintDevice[];
  onUpdate?: () => void;
}

export const FingerprintSetup = ({ devices = [], onUpdate }: FingerprintSetupProps) => {
  const [deviceName, setDeviceName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const registerFingerprint = async () => {
    if (!deviceName.trim()) {
      toast({
        title: "Device Name Required",
        description: "Please enter a name for this device",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        throw new Error("WebAuthn is not supported on this device");
      }

      // Get user profile for registration options
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("user_id", session.user.id)
        .single();

      // Generate registration options
      const registrationOptions = {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: {
          name: "Justice Ultimate Automobiles",
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(session.user.id),
          name: profile?.email || session.user.email,
          displayName: profile?.full_name || "User",
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },  // ES256
          { type: "public-key", alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60000,
        attestation: "none",
      };

      // Start WebAuthn registration
      const credential = await startRegistration(registrationOptions as any);

      // Store credential in database
      const { error: insertError } = await supabase
        .from("user_fingerprints")
        .insert({
          user_id: session.user.id,
          credential_id: credential.id,
          public_key: JSON.stringify(credential),
          device_name: deviceName,
          counter: 0,
        });

      if (insertError) throw insertError;

      // Update profile to enable fingerprint 2FA
      await supabase
        .from("profiles")
        .update({
          two_fa_enabled: true,
          preferred_2fa: 'fingerprint',
          fingerprint_enabled: true,
        })
        .eq("user_id", session.user.id);

      // Register this device as trusted with WebAuthn
      await registerTrustedDevice(session.user.id, true, deviceName);

      // Log to audit trail
      await supabase.from("audit_logs").insert({
        user_id: session.user.id,
        action: "fingerprint_registered",
        user_agent: navigator.userAgent,
        metadata: { device_name: deviceName },
      });

      toast({
        title: "Success!",
        description: "Fingerprint authentication has been enabled",
      });

      setDeviceName("");
      onUpdate?.();
    } catch (error: any) {
      console.error("Fingerprint registration error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to register fingerprint",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFingerprint = async (deviceId: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Check if this is the last fingerprint device
      const { data: allDevices } = await supabase
        .from("user_fingerprints")
        .select("id")
        .eq("user_id", session.user.id);

      const isLastDevice = allDevices && allDevices.length === 1;

      // Delete the device
      const { error } = await supabase
        .from("user_fingerprints")
        .delete()
        .eq("id", deviceId);

      if (error) throw error;

      // If this was the last device, check if user has other 2FA methods
      if (isLastDevice) {
        const { data: totpData } = await supabase
          .from("user_totp")
          .select("enabled")
          .eq("user_id", session.user.id)
          .single();

        // If no TOTP enabled, disable 2FA completely
        if (!totpData?.enabled) {
          await supabase
            .from("profiles")
            .update({
              two_fa_enabled: false,
              preferred_2fa: 'email_otp',
              fingerprint_enabled: false,
            })
            .eq("user_id", session.user.id);
        } else {
          // Switch preferred method to TOTP
          await supabase
            .from("profiles")
            .update({
              preferred_2fa: 'totp',
              fingerprint_enabled: false,
            })
            .eq("user_id", session.user.id);
        }
      }

      // Log to audit trail
      await supabase.from("audit_logs").insert({
        user_id: session.user.id,
        action: "fingerprint_removed",
        user_agent: navigator.userAgent,
        metadata: { device_id: deviceId },
      });

      toast({
        title: "Success",
        description: "Fingerprint device removed",
      });

      onUpdate?.();
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

  return (
    <div className="space-y-4">
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Fingerprint Login
          </CardTitle>
          <CardDescription>
            Use your device's fingerprint sensor or Face ID for secure login
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-primary mt-1" />
              <div>
                <h4 className="font-semibold">Highly Secure</h4>
                <p className="text-sm text-muted-foreground">
                  Uses cryptographic keys stored in your device's secure hardware
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Smartphone className="h-5 w-5 text-primary mt-1" />
              <div>
                <h4 className="font-semibold">Quick & Convenient</h4>
                <p className="text-sm text-muted-foreground">
                  Login instantly with just your fingerprint or face
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Requirements:</strong> Your device must support fingerprint/Face ID and you must be using HTTPS
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="device-name">Device Name</Label>
            <Input
              id="device-name"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="e.g., My iPhone, My Laptop"
            />
          </div>

          <Button 
            onClick={registerFingerprint} 
            disabled={loading || !deviceName.trim()}
            className="w-full"
          >
            <Fingerprint className="mr-2 h-4 w-4" />
            {loading ? "Registering..." : "Register Fingerprint"}
          </Button>
        </CardContent>
      </Card>

      {devices.length > 0 && (
        <Card className="glass-strong">
          <CardHeader>
            <CardTitle className="text-lg">Registered Devices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Fingerprint className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{device.device_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Added: {new Date(device.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFingerprint(device.id)}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
