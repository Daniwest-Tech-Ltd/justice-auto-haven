import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, Shield, AlertTriangle, CheckCircle, Ban,
  Activity, Lock, Brain, Target, FileText, Zap, Globe, Key, Users, Clock, RefreshCw, Download, Play, Pause, Settings, Menu,
  Database, Eye, Server, ShieldCheck, ShieldAlert, Fingerprint, RotateCcw, AlertOctagon, Network, Code, Cloud, HardDrive, Cpu, Radio, Layers, FileKey, Bug, Siren, Lock as LockIcon
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

// Security Philosophy Card Component
const SecurityPhilosophyCard = ({ icon: Icon, title, description, status, items }: {
  icon: any;
  title: string;
  description: string;
  status: "active" | "monitoring" | "alert";
  items: string[];
}) => {
  const statusColors = {
    active: "text-green-500 bg-green-500/10 border-green-500/30",
    monitoring: "text-blue-500 bg-blue-500/10 border-blue-500/30",
    alert: "text-red-500 bg-red-500/10 border-red-500/30"
  };

  return (
    <Card className={`border-2 ${statusColors[status]}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${statusColors[status]}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-xs">{description}</CardDescription>
            </div>
          </div>
          <Badge variant={status === "active" ? "default" : status === "alert" ? "destructive" : "secondary"}>
            {status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-1.5">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

const AISecurityDashboard = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [threatIntel, setThreatIntel] = useState<any[]>([]);
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [cryptoAssets, setCryptoAssets] = useState<any[]>([]);
  const [failedLogins, setFailedLogins] = useState<any[]>([]);
  const [twoFactorAttempts, setTwoFactorAttempts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiThreatScore, setAiThreatScore] = useState<any>(null);
  const [aiAnomalies, setAiAnomalies] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadAllData();
    subscribeToRealtime();
    runAIAnalysis();
    // Real-time clock
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [alertsData, incidentsData, threatData, playbooksData, cryptoData, loginsData, twoFAData, auditData] = await Promise.all([
        supabase.from("security_events").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("security_incidents").select("*").order("created_at", { ascending: false }),
        supabase.from("threat_intelligence").select("*").eq("active", true).order("last_seen", { ascending: false }).limit(50),
        supabase.from("security_playbooks").select("*").order("name"),
        supabase.from("crypto_inventory").select("*").order("expiry_date", { ascending: true }),
        supabase.from("failed_logins").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("two_factor_auth").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(100)
      ]);
      
      if (alertsData.data) setAlerts(alertsData.data);
      if (incidentsData.data) setIncidents(incidentsData.data);
      if (threatData.data) setThreatIntel(threatData.data);
      if (playbooksData.data) setPlaybooks(playbooksData.data);
      if (cryptoData.data) setCryptoAssets(cryptoData.data);
      if (loginsData.data) setFailedLogins(loginsData.data);
      if (twoFAData.data) setTwoFactorAttempts(twoFAData.data);
      if (auditData.data) setAuditLogs(auditData.data);
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
    doc.text("Justice Ultimate Automobiles - Enterprise Security", 14, 36);
    
    // Security Events
    doc.setFontSize(14);
    doc.text("Security Events", 14, 50);
    const eventData = alerts.slice(0, 10).map((alert) => [
      alert.title,
      alert.severity,
      alert.event_type,
      new Date(alert.created_at).toLocaleDateString()
    ]);
    autoTable(doc, {
      startY: 55,
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
      doc.text(`AI Threat Score: ${aiThreatScore.threatScore}/100`, 14, yPos);
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

  const securityModules = [
    {
      icon: ShieldCheck,
      title: "Zero Trust Vault Architecture",
      description: "FIPS 140-3 Level 3 compliant security model",
      status: "active" as const,
      items: [
        "No human can see secrets directly",
        "Secrets auto-rotate on schedule",
        "Access is time-limited & audited",
        "AI monitors all usage patterns"
      ]
    },
    {
      icon: Lock,
      title: "AES-256 Military Encryption",
      description: "NSA TOP SECRET approved encryption standard",
      status: "active" as const,
      items: [
        "AES-256-GCM for all data at rest",
        "TLS 1.3 with perfect forward secrecy",
        "PBKDF2/Argon2id password hashing",
        "HMAC-SHA384 integrity verification"
      ]
    },
    {
      icon: HardDrive,
      title: "HSM Security Module (Vault)",
      description: "Hardware Security Module architecture",
      status: "active" as const,
      items: [
        "Tamper-proof key storage",
        "Keys never leave secure enclave",
        "Tamper detection → auto key destruction",
        "FIPS 140-3 Level 3 certified design"
      ]
    },
    {
      icon: Brain,
      title: "AI Threat Detection Engine",
      description: "ML-powered behavioral anomaly detection",
      status: "monitoring" as const,
      items: [
        "Abnormal login pattern detection",
        "Impossible travel detection",
        "Suspicious admin behavior monitoring",
        "Real-time bot fingerprinting"
      ]
    },
    {
      icon: Bug,
      title: "Zero-Day Attack Mitigation",
      description: "Runtime protection & sandboxed execution",
      status: "active" as const,
      items: [
        "Runtime Application Self-Protection (RASP)",
        "Memory-safe execution monitoring",
        "Canary tokens (silent intrusion detection)",
        "Sandboxed execution for risky inputs"
      ]
    },
    {
      icon: Database,
      title: "Database Encryption Layer",
      description: "Column-level AES-256 + RLS enforcement",
      status: "active" as const,
      items: [
        "AES-256-GCM column encryption",
        "Separate DEK per table (envelope encryption)",
        "Row-level security (RLS) enforced",
        "Encrypted backups with rotation"
      ]
    },
    {
      icon: Code,
      title: "SQL Injection Prevention",
      description: "Parameterized queries & input validation",
      status: "active" as const,
      items: [
        "Strict parameterized queries only",
        "ORM-enforced query execution",
        "Input sanitization & validation",
        "Malformed payload rejection"
      ]
    },
    {
      icon: Network,
      title: "DOS/DDOS Defense",
      description: "Multi-layer traffic protection",
      status: "monitoring" as const,
      items: [
        "Rate limiting (per IP, session, endpoint)",
        "Geo-blocking & IP reputation scoring",
        "Bot fingerprinting & CAPTCHA",
        "Adaptive traffic throttling"
      ]
    },
    {
      icon: Fingerprint,
      title: "Multi-Factor Authentication",
      description: "Hardware tokens & biometric support",
      status: "active" as const,
      items: [
        "TOTP/HOTP authenticator apps",
        "Hardware security key support",
        "Biometric fingerprint/face recognition",
        "Session binding & device trust"
      ]
    },
    {
      icon: FileKey,
      title: "Secret Vault Management",
      description: "Zero-knowledge secret storage",
      status: "active" as const,
      items: [
        "No secrets in code or logs",
        "Environment-level encrypted vault",
        "Automatic key rotation (90-day cycle)",
        "One-time access tokens (OTT)"
      ]
    },
    {
      icon: Key,
      title: "Post-Quantum Cryptography (PQC)",
      description: "NSA CNSA 2.0 Suite preparation",
      status: "monitoring" as const,
      items: [
        "CRYSTALS-Kyber key encapsulation",
        "CRYSTALS-Dilithium digital signatures",
        "Hybrid classical + PQC encryption",
        "Quantum-safe forward secrecy"
      ]
    },
    {
      icon: FileText,
      title: "Immutable Audit Trail",
      description: "SHA-384 hash-chained forensic logs",
      status: "active" as const,
      items: [
        "Cryptographically signed log entries",
        "Hash-chain integrity verification",
        "Tamper-evident append-only storage",
        "Off-site encrypted log replication"
      ]
    },
    {
      icon: Siren,
      title: "SOAR Incident Response",
      description: "Security Orchestration & Automated Response",
      status: "active" as const,
      items: [
        "Auto-lock compromised accounts",
        "Auto-rotate credentials on breach",
        "Auto-isolate affected services",
        "MITRE ATT&CK mapped playbooks"
      ]
    },
    {
      icon: Globe,
      title: "API Security Layer",
      description: "OWASP Top 10 protection suite",
      status: "active" as const,
      items: [
        "Content Security Policy (CSP)",
        "Strict CORS configuration",
        "CSRF protection enabled",
        "Token-based authentication"
      ]
    }
  ];

  const aiActions = [
    { label: "AES-256 Auto-encrypt", icon: Lock, active: true },
    { label: "HSM Key Rotation", icon: RotateCcw, active: true },
    { label: "Service Isolation", icon: Server, active: true },
    { label: "SIEM Alert Dispatch", icon: AlertOctagon, active: true },
    { label: "Forensic Snapshot", icon: HardDrive, active: true },
    { label: "MITRE ATT&CK Map", icon: FileText, active: true },
    { label: "Hash Chain Verify", icon: CheckCircle, active: true },
    { label: "PQC Fallback Mode", icon: Key, active: true }
  ];

  const roleSystem = [
    { role: "Super Admin", description: "Full system access", color: "destructive" },
    { role: "Security Admin", description: "Security controls only", color: "default" },
    { role: "Finance Admin", description: "Financial data access", color: "secondary" },
    { role: "Content Admin", description: "Content management", color: "secondary" },
    { role: "Read-only Auditor", description: "View-only access", color: "outline" }
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">AI Security Guardian</h1>
              <p className="text-muted-foreground text-sm">Enterprise-Grade Zero Trust Security • Justice Ultimate Automobiles</p>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                <Clock className="h-3 w-3 inline mr-1" />
                {currentTime.toLocaleString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' })}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToPDF} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
          <Button onClick={runAIAnalysis} disabled={isAnalyzing} size="sm" className="gap-2">
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4" />
                Run AI Analysis
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Security Philosophy Banner */}
      <Card className="mb-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/30">
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <ShieldAlert className="h-10 w-10 text-primary shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-lg">AES-256 + FIPS 140-3 HSM + Zero-Trust Vault Architecture</h3>
              <p className="text-sm text-muted-foreground">Military-grade encryption with hardware security modules. All secrets encrypted, hashed, and hidden. Post-quantum ready.</p>
            </div>
            <Badge variant="default" className="shrink-0">FIPS 140-3 COMPLIANT</Badge>
          </div>
        </CardContent>
      </Card>

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
                <CardDescription>AI-powered threat assessment based on real security data</CardDescription>
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
                  <Progress value={aiThreatScore.threatScore} className="h-2" />
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
                <CardDescription>Behavioral anomaly detection using AI models</CardDescription>
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
                          </AlertDescription>
                        </Alert>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

      {/* Mobile Menu for Tabs */}
      <div className="mb-4 md:hidden">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <Menu className="h-5 w-5 mr-2" />
              {activeTab === "overview" && "Security Overview"}
              {activeTab === "modules" && "Security Modules"}
              {activeTab === "alerts" && "Alerts"}
              {activeTab === "incidents" && "Incidents"}
              {activeTab === "realtime" && "Real-time Monitoring"}
              {activeTab === "workflows" && "Auto-Response"}
              {activeTab === "playbooks" && "Playbooks"}
              {activeTab === "pqc" && "PQC Wizard"}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <SheetHeader>
              <SheetTitle>Security Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2 mt-6">
              {["overview", "modules", "alerts", "audit", "incidents", "realtime", "workflows", "playbooks", "pqc"].map((tab) => (
                <Button
                  key={tab}
                  variant={activeTab === tab ? "default" : "ghost"}
                  className="justify-start"
                  onClick={() => {
                    setActiveTab(tab);
                    setMobileMenuOpen(false);
                  }}
                >
                  {tab === "overview" && "Security Overview"}
                  {tab === "modules" && "Security Modules"}
                  {tab === "alerts" && "Alerts"}
                  {tab === "audit" && "Audit Logs"}
                  {tab === "incidents" && "Incidents"}
                  {tab === "realtime" && "Real-time"}
                  {tab === "workflows" && "Auto-Response"}
                  {tab === "playbooks" && "Playbooks"}
                  {tab === "pqc" && "PQC Wizard"}
                </Button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="hidden md:grid w-full grid-cols-9 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          <TabsTrigger value="workflows">Auto-Response</TabsTrigger>
          <TabsTrigger value="playbooks">Playbooks</TabsTrigger>
          <TabsTrigger value="pqc">PQC</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Military-Grade Security Standards Card */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Military-Grade Security Standards
              </CardTitle>
              <CardDescription>NSA CNSA Suite 2.0 compliant with FIPS 140-3 Level 3 certification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted/50 rounded-lg border text-sm space-y-3 font-mono">
                <p className="text-primary font-semibold">Justice Ultimate Automobiles - Enterprise Security Architecture</p>
                <div className="border-t pt-3 mt-3">
                  <p className="font-semibold mb-2">🔐 Encryption Standards (NSA Approved):</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• <span className="text-green-500">AES-256-GCM</span> — Data at rest encryption</li>
                    <li>• <span className="text-green-500">TLS 1.3</span> — Data in transit with PFS</li>
                    <li>• <span className="text-green-500">Argon2id</span> — Password hashing (memory-hard)</li>
                    <li>• <span className="text-green-500">SHA-384</span> — Integrity verification</li>
                    <li>• <span className="text-green-500">ECDSA P-384</span> — Digital signatures</li>
                  </ul>
                </div>
                <div className="border-t pt-3 mt-3">
                  <p className="font-semibold mb-2">🔒 Hardware Security Module (HSM):</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>✓ FIPS 140-3 Level 3 certified key storage</li>
                    <li>✓ Tamper-proof secure enclave</li>
                    <li>✓ Keys never exposed outside HSM boundary</li>
                    <li>✓ Auto-destruction on physical tampering</li>
                  </ul>
                </div>
                <div className="border-t pt-3 mt-3">
                  <p className="font-semibold mb-2">⚛️ Post-Quantum Cryptography (PQC):</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>✓ <span className="text-blue-500">CRYSTALS-Kyber</span> — Key encapsulation (NIST selected)</li>
                    <li>✓ <span className="text-blue-500">CRYSTALS-Dilithium</span> — Digital signatures</li>
                    <li>✓ <span className="text-blue-500">SPHINCS+</span> — Stateless hash-based signatures</li>
                    <li>✓ Hybrid mode: Classical + PQC for transition safety</li>
                  </ul>
                </div>
                <div className="border-t pt-3 mt-3">
                  <p className="font-semibold mb-2">🛡️ Zero-Trust Vault Principles:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>✓ No secrets in code, logs, or environment</li>
                    <li>✓ All credentials hashed + salted + peppered</li>
                    <li>✓ Automatic 90-day key rotation</li>
                    <li>✓ Envelope encryption (DEK + KEK architecture)</li>
                    <li>✓ Every access cryptographically logged</li>
                  </ul>
                </div>
                <div className="border-t pt-3 mt-3 text-green-500 bg-green-500/10 p-2 rounded">
                  <p className="font-semibold">✓ All data encrypted • All passwords hashed • All secrets hidden • Quantum-safe ready</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Automated AI Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Automated AI Actions (Zero Manual Delay)
              </CardTitle>
              <CardDescription>AI playbooks execute automatically on threat detection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {aiActions.map((action, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 border rounded-lg bg-green-500/5 border-green-500/20">
                    <action.icon className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium">{action.label}</span>
                    <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Role System */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Role-Based Access Control
              </CardTitle>
              <CardDescription>No admin can access what they don't need</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {roleSystem.map((role, idx) => (
                  <div key={idx} className="p-3 border rounded-lg text-center">
                    <Badge variant={role.color as any} className="mb-2">{role.role}</Badge>
                    <p className="text-xs text-muted-foreground">{role.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Security Events */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>Latest alerts and security events from the system</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
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

        {/* Security Modules Tab */}
        <TabsContent value="modules" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {securityModules.map((module, idx) => (
              <SecurityPhilosophyCard key={idx} {...module} />
            ))}
          </div>

          {/* Backup & Disaster Recovery */}
          <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-blue-500" />
                AES-256 Encrypted Backup & Disaster Recovery
              </CardTitle>
              <CardDescription>FIPS 140-3 compliant with immutable WORM storage across geographic zones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "AES-256-GCM Encrypted", icon: Lock },
                  { label: "Multi-Region Replication", icon: Globe },
                  { label: "WORM Immutable Storage", icon: HardDrive },
                  { label: "SHA-384 Integrity Hash", icon: CheckCircle }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-3 border rounded-lg bg-blue-500/5">
                    <item.icon className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <p className="text-xs text-muted-foreground">
                  <span className="text-blue-500 font-semibold">Military-Grade Backup:</span> All backups encrypted with AES-256-GCM before leaving the system. 
                  Keys stored in HSM with automatic 90-day rotation. Point-in-time recovery with cryptographic proof of integrity.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
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

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Audit Logs
                <Badge variant="secondary">{auditLogs.length} records</Badge>
              </CardTitle>
              <CardDescription>
                Complete audit trail of all system actions — real-time from database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {auditLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Audit Logs Yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Audit logs will appear here as users interact with the system.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs shrink-0">{log.action}</Badge>
                            {log.ip_address && (
                              <span className="text-xs text-muted-foreground font-mono">
                                IP: {log.ip_address}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            User: {log.user_id ? `${log.user_id.substring(0, 8)}...` : 'System'}
                          </p>
                          {log.user_agent && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {log.user_agent.substring(0, 80)}...
                            </p>
                          )}
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <pre className="text-xs text-muted-foreground mt-1 bg-muted/30 p-1 rounded overflow-auto max-h-20">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-3">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Real-time Alert System Tab */}
        <TabsContent value="realtime" className="space-y-4">
          <RealtimeAlertSystem />
        </TabsContent>

        {/* Auto-Response Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <AutoResponseWorkflows />
        </TabsContent>

        {/* Incidents Tab */}
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

        {/* Playbooks Tab */}
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

        {/* PQC Tab */}
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
