import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bell, AlertCircle, Shield, Lock, Activity, CheckCircle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  severity: string;
  event_type: string;
  created_at: string;
  acknowledged: boolean;
  metadata: any;
}

export const RealtimeAlertSystem = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [stats, setStats] = useState({ total: 0, critical: 0, high: 0, unacknowledged: 0 });
  const { toast } = useToast();

  useEffect(() => {
    loadAlerts();
    if (isMonitoring) {
      subscribeToAlerts();
    }
  }, [isMonitoring]);

  const loadAlerts = async () => {
    const { data, error } = await supabase
      .from("security_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setAlerts(data);
      calculateStats(data);
    }
    if (error) console.error("Error loading alerts:", error);
  };

  const calculateStats = (alertsData: SecurityAlert[]) => {
    setStats({
      total: alertsData.length,
      critical: alertsData.filter(a => a.severity === "critical").length,
      high: alertsData.filter(a => a.severity === "high").length,
      unacknowledged: alertsData.filter(a => !a.acknowledged).length
    });
  };

  const subscribeToAlerts = () => {
    const channel = supabase
      .channel("realtime-alerts")
      .on("postgres_changes", { 
        event: "INSERT", 
        schema: "public", 
        table: "security_events" 
      }, (payload) => {
        const newAlert = payload.new as SecurityAlert;
        setAlerts(prev => [newAlert, ...prev]);
        calculateStats([newAlert, ...alerts]);
        
        // Show toast notification
        toast({
          title: `🚨 ${newAlert.severity.toUpperCase()} Alert`,
          description: newAlert.title,
          variant: newAlert.severity === "critical" ? "destructive" : "default"
        });

        // Play sound for critical alerts
        if (newAlert.severity === "critical") {
          playAlertSound();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const playAlertSound = () => {
    const audio = new Audio("/alert-sound.mp3");
    audio.play().catch(() => console.log("Audio playback failed"));
  };

  const acknowledgeAlert = async (alertId: string) => {
    const { error } = await supabase
      .from("security_events")
      .update({ 
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq("id", alertId);

    if (!error) {
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
      toast({ title: "Alert acknowledged" });
    }
  };

  const dismissAlert = async (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return <AlertCircle className="h-4 w-4" />;
      case "high": return <Shield className="h-4 w-4" />;
      case "medium": return <Lock className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "default";
      default: return "secondary";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Real-time Alert System
            </CardTitle>
            <CardDescription>Live security event monitoring and notifications</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Monitoring</span>
            <Switch checked={isMonitoring} onCheckedChange={setIsMonitoring} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Alerts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-500">{stats.critical}</div>
              <div className="text-sm text-muted-foreground">Critical</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-500">{stats.high}</div>
              <div className="text-sm text-muted-foreground">High</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-500">{stats.unacknowledged}</div>
              <div className="text-sm text-muted-foreground">Unacknowledged</div>
            </CardContent>
          </Card>
        </div>

        {/* Alert Status */}
        {isMonitoring && (
          <Alert>
            <Activity className="h-4 w-4 animate-pulse" />
            <AlertDescription>
              Real-time monitoring active. You'll be notified of new security events instantly.
            </AlertDescription>
          </Alert>
        )}

        {/* Alerts List */}
        <div className="space-y-2">
          <h3 className="font-semibold">Recent Alerts</h3>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Card key={alert.id} className={alert.acknowledged ? "opacity-60" : ""}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityColor(alert.severity) as any}>
                            {getSeverityIcon(alert.severity)}
                            <span className="ml-1">{alert.severity}</span>
                          </Badge>
                          <Badge variant="outline">{alert.event_type}</Badge>
                          {alert.acknowledged && (
                            <Badge variant="secondary">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Acknowledged
                            </Badge>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold">{alert.title}</div>
                          <div className="text-sm text-muted-foreground">{alert.description}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(alert.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!alert.acknowledged && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => dismissAlert(alert.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};
