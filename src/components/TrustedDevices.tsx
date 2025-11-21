import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getTrustedDevices, removeTrustedDevice, getDeviceId } from "@/lib/deviceTracking";
import { Smartphone, Trash2, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface TrustedDevice {
  id: string;
  device_id: string;
  device_name: string;
  has_webauthn: boolean;
  last_seen: string;
  created_at: string;
}

interface TrustedDevicesProps {
  userId: string;
}

export const TrustedDevices = ({ userId }: TrustedDevicesProps) => {
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const currentDeviceId = getDeviceId();

  const loadDevices = async () => {
    setLoading(true);
    try {
      const data = await getTrustedDevices(userId);
      setDevices(data);
    } catch (error) {
      console.error("Error loading devices:", error);
      toast({
        title: "Error",
        description: "Failed to load trusted devices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, [userId]);

  const handleRemoveDevice = async (deviceId: string) => {
    try {
      await removeTrustedDevice(deviceId);
      toast({
        title: "Success",
        description: "Device removed from trusted list",
      });
      loadDevices();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove device",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading devices...</div>;
  }

  if (devices.length === 0) {
    return null;
  }

  return (
    <Card className="glass-strong">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Trusted Devices
        </CardTitle>
        <CardDescription>
          Devices you've used to sign in with biometric authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {devices.map((device) => {
          const isCurrentDevice = device.device_id === currentDeviceId;
          
          return (
            <div
              key={device.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{device.device_name}</p>
                    {isCurrentDevice && (
                      <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <CheckCircle className="h-3 w-3" />
                        Current Device
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                    <span>Last seen: {format(new Date(device.last_seen), "MMM d, yyyy HH:mm")}</span>
                    {device.has_webauthn && (
                      <span className="text-primary">• Fingerprint enabled</span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveDevice(device.id)}
                disabled={isCurrentDevice}
                title={isCurrentDevice ? "Cannot remove current device" : "Remove device"}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};