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
  Activity, Lock, Brain, Target, FileText, Zap, Globe, Key, Users, Clock, RefreshCw, Download, Play, Pause, Settings
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PQCMigrationWizard } from "@/components/PQCMigrationWizard";
import { RealtimeAlertSystem } from "@/components/RealtimeAlertSystem";
import { AutoResponseWorkflows } from "@/components/AutoResponseWorkflows";
import { IncidentTimeline } from "@/components/IncidentTimeline";

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
  const [aiThreatScore, setAiThreatScore] = useState<any>(null);
  const [aiAnomalies, setAiAnomalies] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadAllData();
    subscribeToRealtime();
    runAIAnalysis();
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

    return () => {
      channel.unsubscribe();
    };
  };

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const [threatResult, anomalyResult] = await Promise.all([
        supabase.functions.invoke('ai-threat-scoring'),
        supabase.functions.invoke('ai-anomaly-detection')
      ]);

      if (threatResult.data) {
        setAiThreatScore(threatResult.data);
      }
      if (anomalyResult.data) {
        setAiAnomalies(anomalyResult.data);
      }
      
      toast({ title: "AI Analysis Complete", description: "Security analysis updated" });
    } catch (error) {
      console.error('AI Analysis error:', error);
      toast({ title: "Analysis Error", description: "Failed to complete AI analysis", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("AI Security Dashboard Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    
    // Security Events
    doc.setFontSize(14);
    doc.text("Security Events", 14, 45);
    const eventData = alerts.slice(0, 10).map((alert) => [
      alert.title,
      alert.severity,
      alert.event_type,
      new Date(alert.created_at).toLocaleDateString()
    ]);
    autoTable(doc, {
      startY: 50,
      head: [['Title', 'Severity', 'Type', 'Date']],
      body: eventData
    });

    // Incidents
    let yPos = (doc as any).lastAutoTable.finalY + 15;
    doc.text("Security Incidents", 14, yPos);
    const incidentData = incidents.slice(0, 5).map((incident) => [
      incident.incident_number,
      incident.title,
      incident.severity,
      incident.status
    ]);
    autoTable(doc, {
      startY: yPos + 5,
      head: [['Number', 'Title', 'Severity', 'Status']],
      body: incidentData
    });

    // AI Threat Score
    if (aiThreatScore) {
      yPos = (doc as any).lastAutoTable.finalY + 15;
      doc.text(`AI Threat Score: ${aiThreatScore.overallThreatScore}/100`, 14, yPos);
      doc.text(`Risk Level: ${aiThreatScore.riskLevel}`, 14, yPos + 7);
    }

    doc.save(`security-report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast({ title: "PDF Exported", description: "Security report has been downloaded" });
  };

  const togglePlaybook = async (playbookId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from("security_playbooks")
        .update({ enabled: !enabled })
        .eq("id", playbookId);

      if (error) throw error;

      setPlaybooks(playbooks.map(p => p.id === playbookId ? { ...p, enabled: !enabled } : p));
      toast({ 
        title: enabled ? "Playbook Disabled" : "Playbook Enabled", 
        description: `Security playbook has been ${enabled ? 'disabled' : 'enabled'}` 
      });
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to toggle playbook", variant: "destructive" });
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-2">AI Security Dashboard</h1>
          <p className="text-muted-foreground">Real-time security monitoring and AI-powered threat detection</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={exportToPDF}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <Download className="h-5 w-5" />
            Export PDF
          </Button>
          <Button
            onClick={runAIAnalysis}
            disabled={isAnalyzing}
            size="lg"
            className="gap-2"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="h-5 w-5" />
                Run AI Analysis
              </>
            )}
          </Button>
        </div>
      </div>

      {/* AI Analysis Results */}
      {(aiThreatScore || aiAnomalies) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {aiThreatScore && (
            <Card className="border-orange-500/50 bg-gradient-to-br from-orange-500/10 to-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-orange-500" />
                  AI Threat Score
                  <Badge variant={
                    aiThreatScore.threatScore > 70 ? 'destructive' :
                    aiThreatScore.threatScore > 40 ? 'default' :
                    'secondary'
                  }>
                    {aiThreatScore.riskLevel?.toUpperCase()}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  AI-powered threat assessment based on real security data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Overall Risk Score</span>
                    <span className={`text-3xl font-bold ${
                      aiThreatScore.threatScore > 70 ? 'text-red-500' :
                      aiThreatScore.threatScore > 40 ? 'text-orange-500' :
                      'text-green-500'
                    }`}>
                      {aiThreatScore.threatScore}/100
                    </span>
                  </div>
                  <Progress 
                    value={aiThreatScore.threatScore} 
                    className="h-2"
                  />
                  {aiThreatScore.threats && aiThreatScore.threats.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Top Threats Identified:</p>
                      {aiThreatScore.threats.slice(0, 3).map((threat: any, idx: number) => (
                        <Alert key={idx} variant={threat.severity === 'high' ? 'destructive' : 'default'}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <p className="font-medium">{threat.title}</p>
                            <p className="text-xs mt-1">{threat.description}</p>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}
                  {aiThreatScore.recommendations && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Recommendations:</p>
                      {aiThreatScore.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                        <p key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 mt-0.5 shrink-0" />
                          {rec}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {aiAnomalies && (
            <Card className="border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-500" />
                  AI Anomaly Detection
                  <Badge variant={
                    aiAnomalies.severityLevel === 'critical' || aiAnomalies.severityLevel === 'high' ? 'destructive' : 'default'
                  }>
                    {aiAnomalies.anomaliesDetected || 0} Detected
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Behavioral anomaly detection using AI models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Severity Level</span>
                    <Badge variant={
                      aiAnomalies.severityLevel === 'critical' ? 'destructive' :
                      aiAnomalies.severityLevel === 'high' ? 'destructive' :
                      aiAnomalies.severityLevel === 'medium' ? 'default' :
                      'secondary'
                    }>
                      {aiAnomalies.severityLevel?.toUpperCase()}
                    </Badge>
                  </div>
                  {aiAnomalies.anomalies && aiAnomalies.anomalies.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Detected Anomalies:</p>
                      {aiAnomalies.anomalies.slice(0, 3).map((anomaly: any, idx: number) => (
                        <Alert key={idx} variant={anomaly.severity === 'high' ? 'destructive' : 'default'}>
                          <Target className="h-4 w-4" />
                          <AlertDescription>
                            <p className="font-medium">{anomaly.type}</p>
                            <p className="text-xs mt-1">{anomaly.description}</p>
                            {anomaly.indicators && anomaly.indicators.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Indicators: {anomaly.indicators.join(', ')}
                              </p>
                            )}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}
                  {aiAnomalies.patterns && aiAnomalies.patterns.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Detected Patterns:</p>
                      {aiAnomalies.patterns.slice(0, 3).map((pattern: any, idx: number) => (
                        <p key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                          <Zap className="h-3 w-3 mt-0.5 shrink-0" />
                          {pattern.pattern} - {pattern.risk} risk
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">
              {alerts.filter((e: any) => e.severity === 'critical').length} critical
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incidents.filter((i: any) => i.status !== 'resolved').length}</div>
            <p className="text-xs text-muted-foreground">{incidents.length} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedLogins.length}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">2FA Attempts</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{twoFactorAttempts.length}</div>
            <p className="text-xs text-muted-foreground">
              {twoFactorAttempts.filter((t: any) => !t.verified).length} failed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          <TabsTrigger value="workflows">Auto-Response</TabsTrigger>
          <TabsTrigger value="playbooks">Playbooks</TabsTrigger>
          <TabsTrigger value="pqc">PQC Wizard</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>Latest alerts and security events from the system</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {alerts.slice(0, 10).map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <Badge variant={
                          alert.severity === 'critical' ? 'destructive' :
                          alert.severity === 'high' ? 'destructive' :
                          alert.severity === 'medium' ? 'default' :
                          'secondary'
                        }>
                          {alert.severity}
                        </Badge>
                        <div>
                          <p className="font-medium">{alert.title}</p>
                          <p className="text-sm text-muted-foreground">{alert.description}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search alerts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <Card key={alert.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{alert.title}</CardTitle>
                      <Badge variant={
                        alert.severity === 'critical' ? 'destructive' :
                        alert.severity === 'high' ? 'destructive' :
                        'default'
                      }>
                        {alert.severity}
                      </Badge>
                    </div>
                    <CardDescription>{alert.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Event Type: {alert.event_type}</p>
                      <p>Source IP: {alert.source_ip || 'N/A'}</p>
                      <p>Time: {new Date(alert.created_at).toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Real-time Alert System Tab */}
        <TabsContent value="realtime" className="space-y-4">
          <RealtimeAlertSystem />
        </TabsContent>

        {/* Auto-Response Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <AutoResponseWorkflows />
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Incidents</CardTitle>
              <CardDescription>Active and resolved security incidents</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {incidents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[400px] text-center">
                    <Shield className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Security Incidents</h3>
                    <p className="text-sm text-muted-foreground">
                      No security incidents have been recorded yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {incidents.map((incident) => (
                      <Card key={incident.id} className="border-2">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{incident.title}</CardTitle>
                            <div className="flex gap-2">
                              <Badge variant={
                                incident.severity === 'critical' ? 'destructive' :
                                incident.severity === 'high' ? 'destructive' :
                                'default'
                              }>
                                {incident.severity}
                              </Badge>
                              <Badge variant={incident.status === 'resolved' ? 'secondary' : 'default'}>
                                {incident.status}
                              </Badge>
                            </div>
                          </div>
                          <CardDescription>Incident #{incident.incident_number}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm mb-3">{incident.description}</p>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>Created: {new Date(incident.created_at).toLocaleString()}</p>
                            {incident.resolved_at && <p>Resolved: {new Date(incident.resolved_at).toLocaleString()}</p>}
                            {incident.assigned_to && <p>Assigned To: {incident.assigned_to}</p>}
                            {incident.impact_assessment && <p>Impact: {incident.impact_assessment}</p>}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          <ScrollArea className="h-[600px]">
            <div className="grid gap-4">
              {threatIntel.map((threat) => (
                <Card key={threat.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{threat.ioc_type}: {threat.ioc_value}</CardTitle>
                      <Badge variant={
                        threat.threat_level === 'critical' ? 'destructive' :
                        threat.threat_level === 'high' ? 'destructive' :
                        'default'
                      }>
                        {threat.threat_level}
                      </Badge>
                    </div>
                    <CardDescription>Source: {threat.source}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">{threat.description}</p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Category: {threat.threat_category}</p>
                      <p>First Seen: {new Date(threat.first_seen).toLocaleString()}</p>
                      <p>Last Seen: {new Date(threat.last_seen).toLocaleString()}</p>
                      <p>Confidence: {threat.confidence_score}%</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="playbooks" className="space-y-4">
          <ScrollArea className="h-[600px]">
            <div className="grid gap-4">
              {playbooks.map((playbook) => (
                <Card key={playbook.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{playbook.name}</CardTitle>
                      <Badge variant={playbook.enabled ? 'default' : 'secondary'}>
                        {playbook.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <CardDescription>{playbook.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Executions: {playbook.execution_count || 0}</p>
                      <p>Success Rate: {playbook.success_count || 0}/{playbook.execution_count || 0}</p>
                      {playbook.last_executed && (
                        <p>Last Run: {new Date(playbook.last_executed).toLocaleString()}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="pqc" className="space-y-4">
          <PQCMigrationWizard />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Post-Quantum Cryptography Inventory
              </CardTitle>
              <CardDescription>
                Monitor cryptographic assets and track PQC migration status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded">
                    <p className="text-2xl font-bold">{cryptoAssets.length}</p>
                    <p className="text-xs text-muted-foreground">Total Assets</p>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <p className="text-2xl font-bold text-green-500">
                      {cryptoAssets.filter((a: any) => a.pqc_ready).length}
                    </p>
                    <p className="text-xs text-muted-foreground">PQC Ready</p>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <p className="text-2xl font-bold text-orange-500">
                      {cryptoAssets.filter((a: any) => !a.pqc_ready).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Requires Migration</p>
                  </div>
                </div>

                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {cryptoAssets.map((asset) => (
                      <div key={asset.id} className="p-3 border rounded space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{asset.asset_name}</p>
                          <Badge variant={asset.pqc_ready ? 'secondary' : 'destructive'}>
                            {asset.pqc_ready ? 'PQC Ready' : 'Not Ready'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2">
                          <p>Algorithm: {asset.algorithm}</p>
                          <p>Type: {asset.asset_type}</p>
                          <p>Key Size: {asset.key_size} bits</p>
                          <p>Risk: {asset.risk_level}</p>
                          {asset.expiry_date && (
                            <p>Expires: {new Date(asset.expiry_date).toLocaleDateString()}</p>
                          )}
                          <p>Status: {asset.pqc_migration_status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AISecurityDashboard;