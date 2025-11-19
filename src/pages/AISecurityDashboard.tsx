import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, Shield, AlertTriangle, CheckCircle, Ban, Download, 
  TrendingUp, Clock, Activity, Database, Lock, Brain, Target,
  FileText, Zap, Globe, Key, Play, AlertCircleIcon, Users
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SecurityAlert {
  id: string;
  event_type: string;
  severity: string;
  source_ip: string | null;
  title: string;
  description: string | null;
  metadata: any;
  acknowledged: boolean;
  created_at: string;
  user_id: string | null;
}

interface SecurityIncident {
  id: string;
  incident_number: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  mitre_tactics: any[];
  mitre_techniques: any[];
  affected_assets: any[];
  iocs: any[];
  created_at: string;
}

interface ThreatIntel {
  id: string;
  ioc_type: string;
  ioc_value: string;
  threat_level: string;
  source: string;
  confidence_score: number | null;
  active: boolean;
  last_seen: string;
}

interface SecurityPlaybook {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  execution_count: number;
  success_count: number;
}

interface CryptoAsset {
  id: string;
  asset_name: string;
  asset_type: string;
  algorithm: string;
  key_size: number | null;
  expiry_date: string | null;
  pqc_ready: boolean;
  pqc_migration_status: string;
  risk_level: string | null;
}

const AISecurityDashboard = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [blockedIps, setBlockedIps] = useState<BlockedIP[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [autoBlock, setAutoBlock] = useState(true);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAlerts: 0,
    criticalAlerts: 0,
    blockedIps: 0,
    acknowledgedAlerts: 0,
    alertsTrend: 0,
    avgResponseTime: 0
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchAlerts();
    fetchBlockedIps();
    calculateStats();
    
    // Subscribe to real-time security events
    const channel = supabase
      .channel("security-events")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "security_events" },
        (payload) => {
          setAlerts((prev) => [payload.new as SecurityAlert, ...prev]);
          calculateStats();
          
          // Show toast for high/critical alerts
          if (payload.new.severity === "high" || payload.new.severity === "critical") {
            toast({
              title: `Security Alert: ${payload.new.title}`,
              description: payload.new.description || "New security event detected",
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const calculateStats = async () => {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Get alerts from last 24 hours for trend
      const { data: recentAlerts } = await supabase
        .from("security_events")
        .select("created_at")
        .gte("created_at", oneDayAgo.toISOString());

      const alertsTrend = recentAlerts?.length || 0;

      // Calculate average response time (time to acknowledge)
      const { data: acknowledgedAlerts } = await supabase
        .from("security_events")
        .select("created_at, acknowledged_at")
        .not("acknowledged_at", "is", null)
        .gte("created_at", oneDayAgo.toISOString());

      let totalResponseTime = 0;
      acknowledgedAlerts?.forEach(alert => {
        if (alert.acknowledged_at) {
          const responseTime = new Date(alert.acknowledged_at).getTime() - new Date(alert.created_at).getTime();
          totalResponseTime += responseTime;
        }
      });
      const avgResponseTime = acknowledgedAlerts?.length 
        ? Math.round(totalResponseTime / acknowledgedAlerts.length / 1000 / 60) // minutes
        : 0;

      setStats({
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter((a) => a.severity === "critical").length,
        blockedIps: blockedIps.length,
        acknowledgedAlerts: alerts.filter((a) => a.acknowledged).length,
        alertsTrend,
        avgResponseTime
      });
    } catch (error) {
      console.error("Error calculating stats:", error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from("security_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setAlerts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch security alerts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockedIps = async () => {
    try {
      const { data, error } = await supabase
        .from("blocked_ips")
        .select("*")
        .eq("active", true)
        .order("blocked_at", { ascending: false });

      if (error) throw error;
      setBlockedIps(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch blocked IPs",
        variant: "destructive",
      });
    }
  };

  const acknowledgeAlert = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("security_events")
        .update({
          acknowledged: true,
          acknowledged_by: user?.id,
          acknowledged_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === id ? { ...alert, acknowledged: true } : alert
        )
      );

      toast({
        title: "Alert Acknowledged",
        description: "Security alert has been marked as reviewed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const blockIp = async (ip: string, reason: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("blocked_ips").insert({
        ip,
        reason,
        blocked_by: user?.id,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      });

      if (error) throw error;

      toast({
        title: "IP Blocked",
        description: `IP address ${ip} has been blocked`,
      });

      fetchBlockedIps();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const unblockIp = async (id: string) => {
    try {
      const { error } = await supabase
        .from("blocked_ips")
        .update({ active: false })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "IP Unblocked",
        description: "IP address has been unblocked",
      });

      fetchBlockedIps();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const exportSecurityReport = async (format: 'json' | 'csv') => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Last 30 days
      
      const { data, error } = await supabase.functions.invoke('export-security-report', {
        body: {
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
          format
        }
      });

      if (error) throw error;

      // Create download link
      const blob = new Blob([format === 'json' ? JSON.stringify(data, null, 2) : data], {
        type: format === 'json' ? 'application/json' : 'text/csv'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `security-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Report Exported",
        description: `Security report downloaded as ${format.toUpperCase()}`,
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-600";
      case "high": return "bg-orange-600";
      case "medium": return "bg-yellow-600";
      case "low": return "bg-blue-600";
      default: return "bg-gray-600";
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate("/admin-dashboard")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Shield className="h-10 w-10 text-primary" />
            AI Security Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Real-time security monitoring and threat detection
          </p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoBlock}
              onChange={(e) => setAutoBlock(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Auto-block suspicious IPs</span>
          </label>
          <div className="flex gap-2">
            <Button onClick={() => exportSecurityReport('json')} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              JSON
            </Button>
            <Button onClick={() => exportSecurityReport('csv')} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
        <Card className="glass-strong">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Alerts</p>
                <h3 className="text-3xl font-bold">{stats.totalAlerts}</h3>
              </div>
              <AlertTriangle className="h-10 w-10 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <h3 className="text-3xl font-bold text-red-600">
                  {stats.criticalAlerts}
                </h3>
              </div>
              <Shield className="h-10 w-10 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Blocked IPs</p>
                <h3 className="text-3xl font-bold">{stats.blockedIps}</h3>
              </div>
              <Ban className="h-10 w-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Acknowledged</p>
                <h3 className="text-3xl font-bold text-green-600">
                  {stats.acknowledgedAlerts}
                </h3>
              </div>
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">24h Trend</p>
                <h3 className="text-3xl font-bold text-blue-600">
                  {stats.alertsTrend}
                </h3>
              </div>
              <TrendingUp className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <h3 className="text-3xl font-bold text-purple-600">
                  {stats.avgResponseTime}m
                </h3>
              </div>
              <Clock className="h-10 w-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts List */}
        <Card className="glass-strong lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Security Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-auto">
              {alerts.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No security alerts
                </div>
              )}
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className={`p-4 rounded-lg border cursor-pointer hover:bg-accent transition-colors ${
                    selectedAlert?.id === alert.id ? "ring-2 ring-primary" : ""
                  } ${alert.acknowledged ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <span className="font-semibold">{alert.title}</span>
                        {alert.acknowledged && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {alert.description}
                      </p>
                      <div className="text-xs text-muted-foreground mt-2">
                        {alert.source_ip && `IP: ${alert.source_ip} • `}
                        {new Date(alert.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {!alert.acknowledged && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            acknowledgeAlert(alert.id);
                          }}
                        >
                          Acknowledge
                        </Button>
                      )}
                      {alert.source_ip && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            blockIp(alert.source_ip!, alert.title);
                          }}
                        >
                          Block IP
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Selected Alert Details */}
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle>Alert Details</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedAlert ? (
                <div className="text-sm text-muted-foreground">
                  Click an alert to view details
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold">Type</label>
                    <p className="text-sm">{selectedAlert.event_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Source IP</label>
                    <p className="text-sm font-mono">
                      {selectedAlert.source_ip || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Metadata</label>
                    <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-40">
                      {JSON.stringify(selectedAlert.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Blocked IPs */}
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle>Blocked IPs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-auto">
                {blockedIps.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    No blocked IPs
                  </div>
                )}
                {blockedIps.map((blocked) => (
                  <div
                    key={blocked.id}
                    className="flex items-center justify-between bg-muted p-2 rounded"
                  >
                    <div className="flex-1">
                      <div className="font-mono text-sm">{blocked.ip}</div>
                      <div className="text-xs text-muted-foreground">
                        {blocked.reason}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => unblockIp(blocked.id)}
                    >
                      Unblock
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AISecurityDashboard;