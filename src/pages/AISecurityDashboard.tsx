import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, Shield, AlertTriangle, CheckCircle, Ban,
  Activity, Lock, Brain, Target, FileText, Zap, Globe, Key, Users, Clock
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

const AISecurityDashboard = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [threatIntel, setThreatIntel] = useState<any[]>([]);
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [cryptoAssets, setCryptoAssets] = useState<any[]>([]);
  const [failedLogins, setFailedLogins] = useState<any[]>([]);
  const [twoFactorAttempts, setTwoFactorAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadAllData();
    subscribeToRealtime();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [alertsData, incidentsData, threatData, playbooksData, cryptoData, loginsData, twoFAData] = await Promise.all([
        supabase.from("security_events").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("security_incidents").select("*").order("created_at", { ascending: false }),
        supabase.from("threat_intelligence").select("*").eq("active", true).order("last_seen", { ascending: false }).limit(50),
        supabase.from("security_playbooks").select("*").order("name"),
        supabase.from("crypto_inventory").select("*").order("expiry_date", { ascending: true }),
        supabase.from("failed_logins").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("two_factor_auth").select("*").order("created_at", { ascending: false }).limit(50)
      ]);
      
      if (alertsData.data) setAlerts(alertsData.data);
      if (incidentsData.data) setIncidents(incidentsData.data);
      if (threatData.data) setThreatIntel(threatData.data);
      if (playbooksData.data) setPlaybooks(playbooksData.data);
      if (cryptoData.data) setCryptoAssets(cryptoData.data);
      if (loginsData.data) setFailedLogins(loginsData.data);
      if (twoFAData.data) setTwoFactorAttempts(twoFAData.data);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({ title: "Error", description: "Failed to load security data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToRealtime = () => {
    const channel = supabase.channel("security-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "security_events" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setAlerts((prev) => [payload.new as any, ...prev]);
          if (["high", "critical"].includes((payload.new as any).severity)) {
            toast({ title: `🚨 ${(payload.new as any).title}`, description: (payload.new as any).description || "Security event detected", variant: "destructive" });
          }
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "failed_logins" }, (payload) => {
        setFailedLogins((prev) => [payload.new as any, ...prev.slice(0, 49)]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  };

  const calculateStats = () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentAlerts = alerts.filter(a => new Date(a.created_at) >= oneDayAgo);
    const criticalAlerts = alerts.filter(a => a.severity === "critical");
    const openIncidents = incidents.filter(i => !["resolved", "closed"].includes(i.status));
    const recentFailedLogins = failedLogins.filter(f => new Date(f.created_at) >= oneDayAgo);
    const invalid2FA = twoFactorAttempts.filter(t => !t.verified && new Date(t.created_at) >= oneDayAgo);
    const pqcReady = cryptoAssets.filter(c => c.pqc_ready);
    const pqcProgress = cryptoAssets.length > 0 ? Math.round((pqcReady.length / cryptoAssets.length) * 100) : 0;

    return {
      totalAlerts: alerts.length,
      recentAlerts: recentAlerts.length,
      criticalAlerts: criticalAlerts.length,
      openIncidents: openIncidents.length,
      recentFailedLogins: recentFailedLogins.length,
      invalid2FA: invalid2FA.length,
      activeThreatIOCs: threatIntel.length,
      enabledPlaybooks: playbooks.filter(p => p.enabled).length,
      pqcReadyAssets: pqcReady.length,
      totalCryptoAssets: cryptoAssets.length,
      pqcMigrationProgress: pqcProgress
    };
  };

  const acknowledgeAlert = async (alertId: string) => {
    await supabase.from("security_events").update({ acknowledged: true }).eq("id", alertId);
    setAlerts(alerts.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
    toast({ title: "Alert acknowledged" });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "outline";
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = !searchTerm || alert.title.toLowerCase().includes(searchTerm.toLowerCase()) || alert.source_ip?.includes(searchTerm);
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const stats = calculateStats();

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin-dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                AI Security Dashboard
              </h1>
              <p className="text-muted-foreground">Real-time threat detection with MITRE ATT&CK mapping</p>
            </div>
          </div>
          <Button variant="outline" onClick={loadAllData}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>

        {/* Critical Alerts Banner */}
        {stats.criticalAlerts > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription className="flex items-center justify-between">
              <span className="font-semibold">{stats.criticalAlerts} Critical Security Alerts Require Immediate Attention</span>
              <Button variant="outline" size="sm" onClick={() => setActiveTab("alerts")}>View Alerts</Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-destructive">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Critical Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.criticalAlerts}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats.recentAlerts} in last 24h</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Open Incidents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.openIncidents}</div>
              <p className="text-xs text-muted-foreground mt-1">MITRE ATT&CK mapped</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Ban className="h-4 w-4" />
                Failed Auth (24h)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.recentFailedLogins}</div>
              <p className="text-xs text-muted-foreground mt-1">{stats.invalid2FA} invalid 2FA codes</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Key className="h-4 w-4" />
                PQC Migration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.pqcMigrationProgress}%</div>
              <Progress value={stats.pqcMigrationProgress} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">{stats.pqcReadyAssets}/{stats.totalCryptoAssets} quantum-ready</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="overview"><Activity className="h-4 w-4 mr-2" />Overview</TabsTrigger>
            <TabsTrigger value="alerts"><AlertTriangle className="h-4 w-4 mr-2" />Alerts</TabsTrigger>
            <TabsTrigger value="incidents"><FileText className="h-4 w-4 mr-2" />Incidents</TabsTrigger>
            <TabsTrigger value="threats"><Target className="h-4 w-4 mr-2" />Threats</TabsTrigger>
            <TabsTrigger value="playbooks"><Zap className="h-4 w-4 mr-2" />Playbooks</TabsTrigger>
            <TabsTrigger value="crypto"><Key className="h-4 w-4 mr-2" />PQC</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Critical Events (Real-Time)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    {alerts.filter(a => a.severity === "critical").slice(0, 10).map((alert) => (
                      <div key={alert.id} className="mb-3 p-3 border rounded-lg">
                        <div className="flex justify-between mb-1">
                          <h4 className="font-semibold text-sm">{alert.title}</h4>
                          <Badge variant="destructive">{alert.severity}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{alert.description}</p>
                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                          <span>{new Date(alert.created_at).toLocaleString()}</span>
                          {alert.source_ip && <span>IP: {alert.source_ip}</span>}
                        </div>
                      </div>
                    ))}
                    {alerts.filter(a => a.severity === "critical").length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                        <p>No critical events detected</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Security Playbooks</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    {playbooks.filter(p => p.enabled).map((pb) => (
                      <div key={pb.id} className="mb-3 p-3 border rounded-lg">
                        <div className="flex justify-between mb-1">
                          <h4 className="font-semibold text-sm">{pb.name}</h4>
                          <Badge variant="outline" className="text-green-600">Active</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{pb.description}</p>
                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                          <span>Executions: {pb.execution_count}</span>
                          <span>Success: {pb.success_count}</span>
                        </div>
                      </div>
                    ))}
                    {playbooks.filter(p => p.enabled).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No active playbooks</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Security Posture Summary</CardTitle>
                <CardDescription>Real-time metrics from Supabase security tables</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Shield className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold">{stats.totalAlerts}</div>
                    <p className="text-xs text-muted-foreground">Total Events</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Target className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                    <div className="text-2xl font-bold">{stats.activeThreatIOCs}</div>
                    <p className="text-xs text-muted-foreground">Active IOCs</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <div className="text-2xl font-bold">{stats.recentFailedLogins}</div>
                    <p className="text-xs text-muted-foreground">Failed Logins (24h)</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Lock className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <div className="text-2xl font-bold">{stats.invalid2FA}</div>
                    <p className="text-xs text-muted-foreground">Invalid 2FA (24h)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Recommendations */}
            {(stats.invalid2FA > 3 || stats.recentFailedLogins > 10) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-orange-500" />
                    AI Security Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats.invalid2FA > 3 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>High Invalid 2FA Activity:</strong> {stats.invalid2FA} invalid 2FA attempts in 24h. Consider implementing account lockout after 3 failed attempts and forcing password reset.
                      </AlertDescription>
                    </Alert>
                  )}
                  {stats.recentFailedLogins > 10 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Potential Credential Stuffing Attack:</strong> {stats.recentFailedLogins} failed logins detected. Automated attack likely in progress. Review and block suspicious IPs immediately.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between">
                  <CardTitle>Security Alerts (Live Supabase Data)</CardTitle>
                  <div className="flex gap-2">
                    <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-48" />
                    <Select value={severityFilter} onValueChange={setSeverityFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  {filteredAlerts.map((alert) => (
                    <div key={alert.id} className={`p-4 border rounded-lg mb-3 ${alert.acknowledged ? 'opacity-60' : ''}`}>
                      <div className="flex justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{alert.title}</h3>
                            <Badge variant={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                            {alert.acknowledged && <Badge variant="outline">Acknowledged</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span><Clock className="h-3 w-3 inline mr-1" />{new Date(alert.created_at).toLocaleString()}</span>
                            {alert.source_ip && <span><Globe className="h-3 w-3 inline mr-1" />{alert.source_ip}</span>}
                            <Badge variant="outline" className="text-xs">{alert.event_type}</Badge>
                          </div>
                        </div>
                        {!alert.acknowledged && (
                          <Button size="sm" onClick={() => acknowledgeAlert(alert.id)}>
                            <CheckCircle className="h-4 w-4 mr-1" />Acknowledge
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredAlerts.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Shield className="h-16 w-16 mx-auto mb-4 opacity-20" />
                      <p>No alerts match your filters</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Incidents Tab */}
          <TabsContent value="incidents" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Incidents with MITRE ATT&CK Mapping</CardTitle>
                <CardDescription>Incident data from security_incidents table</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  {incidents.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500 opacity-20" />
                      <p>No security incidents recorded</p>
                      <p className="text-xs mt-1">All security systems operational</p>
                    </div>
                  ) : (
                    incidents.map((inc) => (
                      <div key={inc.id} className="p-4 border rounded-lg mb-4">
                        <div className="flex justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">{inc.title}</h3>
                            <div className="flex gap-2 mb-2">
                              <Badge variant={getSeverityColor(inc.severity)}>{inc.severity}</Badge>
                              <Badge variant="outline">{inc.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{inc.description}</p>
                            
                            {/* MITRE Techniques */}
                            {inc.mitre_techniques && inc.mitre_techniques.length > 0 && (
                              <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                                <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  MITRE ATT&CK Techniques
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                  {inc.mitre_techniques.map((tech: any, idx: number) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {tech.id}: {tech.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* IOCs */}
                            {inc.iocs && inc.iocs.length > 0 && (
                              <div className="mt-2">
                                <h4 className="text-xs font-semibold mb-1">IOCs:</h4>
                                <div className="flex flex-wrap gap-1">
                                  {inc.iocs.map((ioc: string, idx: number) => (
                                    <span key={idx} className="text-xs px-2 py-1 bg-destructive/10 rounded">{ioc}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground pt-3 border-t">
                          <span>ID: {inc.incident_number}</span>
                          <span>Created: {new Date(inc.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Threats Tab */}
          <TabsContent value="threats" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Threat Intelligence Feed (Live IOCs)</CardTitle>
                <CardDescription>Active indicators from threat_intelligence table</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  {threatIntel.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Target className="h-16 w-16 mx-auto mb-4 opacity-20" />
                      <p>No threat intelligence data</p>
                    </div>
                  ) : (
                    threatIntel.map((threat) => (
                      <div key={threat.id} className="p-3 border rounded-lg mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">{threat.ioc_type}</Badge>
                          <code className="text-sm font-mono px-2 py-0.5 bg-muted rounded">{threat.ioc_value}</code>
                          <Badge variant={getSeverityColor(threat.threat_level)}>{threat.threat_level}</Badge>
                          <span className="text-xs text-muted-foreground ml-auto">Source: {threat.source}</span>
                        </div>
                        {threat.description && <p className="text-xs text-muted-foreground mt-2">{threat.description}</p>}
                        {threat.confidence_score && (
                          <div className="mt-2">
                            <Progress value={threat.confidence_score} className="h-1" />
                            <p className="text-xs text-muted-foreground mt-1">Confidence: {threat.confidence_score}%</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Playbooks Tab */}
          <TabsContent value="playbooks" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Automated Security Playbooks</CardTitle>
                <CardDescription>Pre-configured response workflows from security_playbooks table</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  {playbooks.map((pb) => (
                    <div key={pb.id} className="p-4 border rounded-lg mb-3">
                      <div className="flex justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{pb.name}</h3>
                            <Badge variant={pb.enabled ? "default" : "secondary"}>{pb.enabled ? "Enabled" : "Disabled"}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{pb.description}</p>
                          
                          {/* Actions */}
                          {pb.actions && pb.actions.length > 0 && (
                            <div className="mt-2">
                              <h4 className="text-xs font-semibold mb-1">Actions:</h4>
                              <div className="flex flex-wrap gap-1">
                                {pb.actions.map((action: any, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {action.action}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex gap-4 text-xs text-muted-foreground mt-3">
                            <span>Executions: {pb.execution_count}</span>
                            <span>Success: {pb.success_count}</span>
                            <span>Success Rate: {pb.execution_count > 0 ? Math.round((pb.success_count / pb.execution_count) * 100) : 0}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {playbooks.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Zap className="h-16 w-16 mx-auto mb-4 opacity-20" />
                      <p>No security playbooks configured</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Crypto/PQC Tab */}
          <TabsContent value="crypto" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Post-Quantum Cryptography Migration</CardTitle>
                <CardDescription>Asset tracking from crypto_inventory table</CardDescription>
              </CardHeader>
              <CardContent>
                {/* PQC Progress */}
                <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <h3 className="font-semibold">Quantum-Resistant Migration Progress</h3>
                    <span className="text-2xl font-bold">{stats.pqcMigrationProgress}%</span>
                  </div>
                  <Progress value={stats.pqcMigrationProgress} className="mb-2" />
                  <p className="text-sm text-muted-foreground">{stats.pqcReadyAssets} of {stats.totalCryptoAssets} assets are quantum-ready</p>
                </div>
                
                {/* Assets List */}
                <ScrollArea className="h-[400px]">
                  {cryptoAssets.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Key className="h-16 w-16 mx-auto mb-4 opacity-20" />
                      <p>No crypto assets tracked</p>
                      <p className="text-xs mt-1">Add certificates and keys to monitor PQC migration</p>
                    </div>
                  ) : (
                    cryptoAssets.map((asset) => (
                      <div key={asset.id} className="p-3 border rounded-lg mb-2">
                        <div className="flex justify-between mb-1">
                          <h4 className="font-semibold text-sm">{asset.asset_name}</h4>
                          {asset.pqc_ready ? (
                            <Badge className="bg-green-500">PQC Ready</Badge>
                          ) : (
                            <Badge variant="destructive">Not PQC Ready</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Type: {asset.asset_type} | Algorithm: {asset.algorithm}</div>
                          {asset.key_size && <div>Key Size: {asset.key_size} bits</div>}
                          {asset.expiry_date && <div>Expires: {new Date(asset.expiry_date).toLocaleDateString()}</div>}
                          {asset.owner && <div>Owner: {asset.owner}</div>}
                        </div>
                        <div className="mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {asset.pqc_migration_status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {asset.risk_level && (
                            <Badge variant={getSeverityColor(asset.risk_level)} className="text-xs ml-1">
                              {asset.risk_level} Risk
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </ScrollArea>

                {/* NIST PQC Standards */}
                <div className="mt-6 space-y-3">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      <strong>NIST Standards:</strong> CRYSTALS-Kyber (FIPS 203) for key encapsulation. CRYSTALS-Dilithium (FIPS 204) for digital signatures. Use hybrid mode (classical + PQC) for compatibility.
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <Brain className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Migration Priority:</strong> Start with VPNs, root CAs, code signing. Then move to databases, backups, and API keys. Test thoroughly in staging before production deployment.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AISecurityDashboard;