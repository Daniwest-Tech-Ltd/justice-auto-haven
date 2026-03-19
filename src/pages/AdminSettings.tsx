import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, User, Building, Mail, Phone, Menu, Send, LogOut, Loader2, KeyRound, Database, Users, HardDrive, Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw, Play, Shield, Calendar, Settings } from "lucide-react";
import { PasswordChangeDialog } from "@/components/PasswordChangeDialog";
import LoadingScreen from "@/components/LoadingScreen";
import { Textarea } from "@/components/ui/textarea";
import kenyaLocations from "@/data/kenya-locations.json";
import { setTheme } from "@/lib/theme";
import type { Theme } from "@/lib/theme";
import { AvatarUpload } from "@/components/AvatarUpload";
import { TOTPSetup } from "@/components/TOTPSetup";
import { FingerprintSetup } from "@/components/FingerprintSetup";
import { TrustedDevices } from "@/components/TrustedDevices";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { toast as sonnerToast } from "sonner";

interface BackupSettings {
  id: string;
  auto_backup_enabled: boolean;
  backup_frequency: string;
  backup_time: string;
  retention_days: number;
  backup_database: boolean;
  backup_auth_users: boolean;
  backup_storage: boolean;
  last_backup_at: string | null;
}

interface BackupStats {
  total_tables: number;
  total_rows: number;
  total_users: number;
  total_files: number;
  database_size_mb: number;
  storage_size_mb: number;
  last_successful_backup: string | null;
  backup_health: string;
}

interface BackupHistory {
  id: string;
  backup_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  tables_backed_up: number;
  rows_backed_up: number;
  users_backed_up: number;
  error_message: string | null;
}

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [availableTowns, setAvailableTowns] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [fingerprintDevices, setFingerprintDevices] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("profile");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    county_city: "",
    exact_location: "",
    theme: "system" as Theme,
  });
  const [companySettings, setCompanySettings] = useState({
    id: "",
    company_name: "",
    email: "",
    phone: "",
    location: "",
    system_version: "",
    environment: "",
    database_status: "",
    storage_status: "",
  });
  const [maintenanceMode, setMaintenanceMode] = useState({
    is_active: false,
    hours: 1,
    message: "System under maintenance. Please check back later."
  });
  const [maintenanceId, setMaintenanceId] = useState<string | null>(null);
  // Backup states
  const [backupInProgress, setBackupInProgress] = useState(false);
  const [backupSettings, setBackupSettings] = useState<BackupSettings | null>(null);
  const [backupStats, setBackupStats] = useState<BackupStats | null>(null);
  const [backupHistory, setBackupHistory] = useState<BackupHistory[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // User preferences hook
  const { 
    preferences, 
    saving: savingPrefs, 
    updatePreferences, 
    logoutAllDevices,
    sendTestNotification 
  } = useUserPreferences(userId);
  
  const [sendingTest, setSendingTest] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
    fetchCompanySettings();
    fetchMaintenanceStatus();
    fetchBackupData();
  }, []);
  
  const loadFingerprintDevices = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("user_fingerprints")
      .select("*")
      .eq("user_id", userId);
    setFingerprintDevices(data || []);
  };

  const fetchMaintenanceStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("system_maintenance")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setMaintenanceId(data.id);
        const endTime = new Date(data.end_time);
        const now = new Date();
        setMaintenanceMode({
          is_active: data.is_active && endTime > now,
          hours: Math.round((endTime.getTime() - now.getTime()) / (1000 * 60 * 60)),
          message: data.message || "System under maintenance. Please check back later."
        });
      }
    } catch (error) {
      console.error("Error fetching maintenance:", error);
    }
  };

  const toggleMaintenance = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      if (maintenanceMode.is_active) {
        // Deactivate maintenance
        if (maintenanceId) {
          await supabase
            .from("system_maintenance")
            .update({ is_active: false })
            .eq("id", maintenanceId);
        }
        setMaintenanceMode({ ...maintenanceMode, is_active: false });
        toast({
          title: "Success",
          description: "System maintenance mode disabled",
        });
      } else {
        // Activate maintenance
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + maintenanceMode.hours * 60 * 60 * 1000);

        const { data, error } = await supabase
          .from("system_maintenance")
          .insert({
            is_active: true,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            message: maintenanceMode.message,
            created_by: user.id
          })
          .select()
          .maybeSingle();

        if (error) throw error;
        
        if (data?.id) {
          setMaintenanceId(data.id);
        }
        setMaintenanceMode({ ...maintenanceMode, is_active: true });
        toast({
          title: "Success",
          description: "System maintenance mode enabled",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Update available towns when county changes
    if (profile.county_city) {
      const county = kenyaLocations.counties.find((c: any) => c.name === profile.county_city);
      setAvailableTowns(county?.towns || []);
    }
  }, [profile.county_city]);

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);
      
      // Load fingerprint devices
      const { data: fingerprints } = await supabase
        .from("user_fingerprints")
        .select("*")
        .eq("user_id", session.user.id);
      setFingerprintDevices(fingerprints || []);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProfile({
          full_name: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
          county_city: data.county_city || "",
          exact_location: data.exact_location || "",
          theme: (data.theme || "system") as Theme,
        });
        setAvatarUrl(data.avatar_url || null);
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

  const fetchCompanySettings = async () => {
    try {
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .single();

      if (error) throw error;
      if (data) {
        setCompanySettings({
          id: data.id,
          company_name: data.company_name || "",
          email: data.email || "",
          phone: data.phone || "",
          location: data.location || "",
          system_version: data.system_version || "",
          environment: data.environment || "",
          database_status: data.database_status || "Connected",
          storage_status: data.storage_status || "Active",
        });
      }
    } catch (error: any) {
      console.error("Error fetching company settings:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("profiles")
        .update(profile)
        .eq("user_id", session.user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = async (newTheme: Theme) => {
    const session = await supabase.auth.getSession();
    if (!session.data.session) return;

    try {
      await setTheme(newTheme, session.data.session.user.id);
      setProfile({ ...profile, theme: newTheme });
      toast({
        title: "Theme Updated",
        description: "Your theme preference has been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSaveCompanySettings = async () => {
    setSavingCompany(true);
    try {
      const { error } = await supabase
        .from("company_settings")
        .update({
          company_name: companySettings.company_name,
          email: companySettings.email,
          phone: companySettings.phone,
          location: companySettings.location,
          system_version: companySettings.system_version,
          environment: companySettings.environment,
          database_status: companySettings.database_status,
          storage_status: companySettings.storage_status,
        })
        .eq("id", companySettings.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Company settings saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingCompany(false);
    }
  };

  // Backup functions
  const fetchBackupData = async () => {
    try {
      const { data: settingsData } = await supabase
        .from('backup_settings')
        .select('*')
        .single();

      const { data: statsData } = await supabase
        .from('backup_stats')
        .select('*')
        .single();

      const { data: historyData } = await supabase
        .from('backup_history')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (settingsData) setBackupSettings(settingsData);
      if (statsData) setBackupStats(statsData);
      if (historyData) setBackupHistory(historyData);
    } catch (error) {
      console.error('Error fetching backup data:', error);
    }
  };

  const updateBackupSettings = async (updates: Partial<BackupSettings>) => {
    if (!backupSettings) return;
    try {
      const { error } = await supabase
        .from('backup_settings')
        .update(updates)
        .eq('id', backupSettings.id);

      if (error) throw error;
      setBackupSettings({ ...backupSettings, ...updates });
      sonnerToast.success('Backup settings updated');
    } catch (error) {
      console.error('Error updating backup settings:', error);
      sonnerToast.error('Failed to update settings');
    }
  };

  const runBackup = async () => {
    setBackupInProgress(true);
    sonnerToast.info('Starting backup... This may take a few minutes.');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke('run-backup', {
        body: { backup_type: 'manual', triggered_by: user?.id }
      });

      if (error) throw error;

      if (data?.success) {
        sonnerToast.success(`Backup completed! ${data.stats.tables_backed_up} tables, ${data.stats.rows_backed_up} rows backed up.`);
        fetchBackupData();
      } else {
        throw new Error(data?.error || 'Backup failed');
      }
    } catch (error) {
      console.error('Backup failed:', error);
      sonnerToast.error('Backup failed. Check the logs for details.');
    } finally {
      setBackupInProgress(false);
    }
  };

  const getBackupStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getBackupHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
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

      <Card className="glass-strong max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl md:text-3xl font-bold">
              <span className="bg-gradient-accent bg-clip-text text-transparent">
                Admin Settings
              </span>
            </CardTitle>
            
            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <SheetHeader>
                  <SheetTitle>Settings Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2 mt-6">
                  <Button
                    variant={activeTab === "profile" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => {
                      setActiveTab("profile");
                      setMobileMenuOpen(false);
                    }}
                  >
                    Profile
                  </Button>
                  <Button
                    variant={activeTab === "security" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => {
                      setActiveTab("security");
                      setMobileMenuOpen(false);
                    }}
                  >
                    Security
                  </Button>
                  <Button
                    variant={activeTab === "preferences" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => {
                      setActiveTab("preferences");
                      setMobileMenuOpen(false);
                    }}
                  >
                    Preferences
                  </Button>
                  <Button
                    variant={activeTab === "notifications" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => {
                      setActiveTab("notifications");
                      setMobileMenuOpen(false);
                    }}
                  >
                    Notifications
                  </Button>
                  <Button
                    variant={activeTab === "privacy" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => {
                      setActiveTab("privacy");
                      setMobileMenuOpen(false);
                    }}
                  >
                    Privacy
                  </Button>
                  <Button
                    variant={activeTab === "company" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => {
                      setActiveTab("company");
                      setMobileMenuOpen(false);
                    }}
                  >
                    Company
                  </Button>
                  <Button
                    variant={activeTab === "maintenance" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => {
                      setActiveTab("maintenance");
                      setMobileMenuOpen(false);
                    }}
                  >
                    Maintenance
                  </Button>
                  <Button
                    variant={activeTab === "backup" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => {
                      setActiveTab("backup");
                      setMobileMenuOpen(false);
                    }}
                  >
                    Backup
                  </Button>
                  <Button
                    variant={activeTab === "danger" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => {
                      setActiveTab("danger");
                      setMobileMenuOpen(false);
                    }}
                  >
                    Danger Zone
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Desktop Tabs - Hidden on Mobile */}
            <TabsList className="hidden md:grid w-full grid-cols-9 overflow-x-auto">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="company">Company</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="backup">Backup</TabsTrigger>
              <TabsTrigger value="danger">Danger Zone</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6 pt-6">
              <div className="flex justify-center pb-6 border-b">
                <AvatarUpload
                  currentAvatarUrl={avatarUrl}
                  userId={userId}
                  userName={profile.full_name || "Admin"}
                  onUploadComplete={(url) => setAvatarUrl(url)}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="full_name">
                    <User className="inline h-4 w-4 mr-2" />
                    Full Name
                  </Label>
                  <Input
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="email">
                    <Mail className="inline h-4 w-4 mr-2" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="phone">
                    <Phone className="inline h-4 w-4 mr-2" />
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="county_city">County</Label>
                  <Select
                    value={profile.county_city}
                    onValueChange={(value) => setProfile({ ...profile, county_city: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select County" />
                    </SelectTrigger>
                    <SelectContent>
                      {kenyaLocations.counties.map((county: any) => (
                        <SelectItem key={county.name} value={county.name}>
                          {county.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="exact_location">Town / Location</Label>
                  <Select
                    value={profile.exact_location}
                    onValueChange={(value) => setProfile({ ...profile, exact_location: value })}
                    disabled={!profile.county_city}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={profile.county_city ? "Select Town" : "First select a county"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTowns.map((town: string) => (
                        <SelectItem key={town} value={town}>
                          {town}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSave} disabled={saving} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="security" className="space-y-6 pt-6">
              <div className="space-y-6">
                {/* Password Change */}
                <div className="p-6 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-2 mb-4">
                    <KeyRound className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Change Password</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Update your password to keep your account secure. You will be logged out after changing your password.
                  </p>
                  <PasswordChangeDialog 
                    userEmail={profile.email}
                    userName={profile.full_name}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Two-Factor Authentication</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Add an extra layer of security to your admin account by enabling two-factor authentication.
                  </p>
                  
                  <TOTPSetup onComplete={loadFingerprintDevices} />
                </div>
                
                <div className="border-t pt-6">
                  <FingerprintSetup 
                    devices={fingerprintDevices}
                    onUpdate={loadFingerprintDevices}
                  />
                </div>

                {userId && (
                  <div className="border-t pt-6">
                    <TrustedDevices userId={userId} />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-6 pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Theme Settings</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <Button
                      variant={profile.theme === "light" ? "default" : "outline"}
                      onClick={() => handleThemeChange("light")}
                      className="w-full"
                    >
                      Light Mode
                    </Button>
                    <Button
                      variant={profile.theme === "dark" ? "default" : "outline"}
                      onClick={() => handleThemeChange("dark")}
                      className="w-full"
                    >
                      Dark Mode
                    </Button>
                    <Button
                      variant={profile.theme === "system" ? "default" : "outline"}
                      onClick={() => handleThemeChange("system")}
                      className="w-full"
                    >
                      System Default
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6 pt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Notification Preferences</h3>
                <p className="text-sm text-muted-foreground">
                  Configure how you want to receive notifications and updates.
                </p>
                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label htmlFor="email_notifications" className="text-base font-medium">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={sendingTest === 'email' || !preferences?.email_notifications}
                        onClick={async () => {
                          setSendingTest('email');
                          await sendTestNotification('email');
                          setSendingTest(null);
                        }}
                      >
                        {sendingTest === 'email' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                      <Switch 
                        id="email_notifications" 
                        checked={preferences?.email_notifications || false}
                        onCheckedChange={(checked) => updatePreferences({ email_notifications: checked })}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label htmlFor="sms_notifications" className="text-base font-medium">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={sendingTest === 'sms' || !preferences?.sms_notifications}
                        onClick={async () => {
                          setSendingTest('sms');
                          await sendTestNotification('sms');
                          setSendingTest(null);
                        }}
                      >
                        {sendingTest === 'sms' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                      <Switch 
                        id="sms_notifications" 
                        checked={preferences?.sms_notifications || false}
                        onCheckedChange={(checked) => updatePreferences({ sms_notifications: checked })}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label htmlFor="whatsapp_notifications" className="text-base font-medium">WhatsApp Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via WhatsApp</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={sendingTest === 'whatsapp' || !preferences?.whatsapp_notifications}
                        onClick={async () => {
                          setSendingTest('whatsapp');
                          await sendTestNotification('whatsapp');
                          setSendingTest(null);
                        }}
                      >
                        {sendingTest === 'whatsapp' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                      <Switch 
                        id="whatsapp_notifications" 
                        checked={preferences?.whatsapp_notifications || false}
                        onCheckedChange={(checked) => updatePreferences({ whatsapp_notifications: checked })}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label htmlFor="push_notifications" className="text-base font-medium">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive in-app push notifications</p>
                    </div>
                    <Switch 
                      id="push_notifications" 
                      checked={preferences?.push_notifications || false}
                      onCheckedChange={(checked) => updatePreferences({ push_notifications: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label htmlFor="security_alerts" className="text-base font-medium">Security Alerts</Label>
                      <p className="text-sm text-muted-foreground">Receive alerts for suspicious activities</p>
                    </div>
                    <Switch 
                      id="security_alerts" 
                      checked={preferences?.security_alerts ?? true}
                      onCheckedChange={(checked) => updatePreferences({ security_alerts: checked })}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6 pt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Privacy Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Control what information is visible to others.
                </p>
                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label htmlFor="hide_profile" className="text-base font-medium">Hide Profile</Label>
                      <p className="text-sm text-muted-foreground">Hide your profile from other users</p>
                    </div>
                    <Switch 
                      id="hide_profile" 
                      checked={preferences?.hide_profile || false}
                      onCheckedChange={(checked) => updatePreferences({ hide_profile: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label htmlFor="hide_email" className="text-base font-medium">Hide Email</Label>
                      <p className="text-sm text-muted-foreground">Hide your email address from others</p>
                    </div>
                    <Switch 
                      id="hide_email" 
                      checked={preferences?.hide_email || false}
                      onCheckedChange={(checked) => updatePreferences({ hide_email: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label htmlFor="hide_phone" className="text-base font-medium">Hide Phone Number</Label>
                      <p className="text-sm text-muted-foreground">Hide your phone number from others</p>
                    </div>
                    <Switch 
                      id="hide_phone" 
                      checked={preferences?.hide_phone || false}
                      onCheckedChange={(checked) => updatePreferences({ hide_phone: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label htmlFor="allow_tracking" className="text-base font-medium">Allow Session Tracking</Label>
                      <p className="text-sm text-muted-foreground">Allow the system to track your sessions for security</p>
                    </div>
                    <Switch 
                      id="allow_tracking" 
                      checked={preferences?.allow_session_tracking ?? true}
                      onCheckedChange={(checked) => updatePreferences({ allow_session_tracking: checked })}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="company" className="space-y-6 pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="company_name">
                    <Building className="inline h-4 w-4 mr-2" />
                    Company Name
                  </Label>
                  <Input
                    id="company_name"
                    value={companySettings.company_name}
                    onChange={(e) => setCompanySettings({ ...companySettings, company_name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="company_email">
                    <Mail className="inline h-4 w-4 mr-2" />
                    Email
                  </Label>
                  <Input
                    id="company_email"
                    type="email"
                    value={companySettings.email}
                    onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="company_phone">
                    <Phone className="inline h-4 w-4 mr-2" />
                    Phone
                  </Label>
                  <Input
                    id="company_phone"
                    value={companySettings.phone}
                    onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="company_location">Location</Label>
                  <Input
                    id="company_location"
                    value={companySettings.location}
                    onChange={(e) => setCompanySettings({ ...companySettings, location: e.target.value })}
                  />
                </div>

                <Button onClick={handleSaveCompanySettings} disabled={saving} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Company Settings"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="system" className="space-y-6 pt-6">
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-4">System Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Version:</strong> {companySettings.system_version}</p>
                    <p><strong>Environment:</strong> {companySettings.environment}</p>
                    <p><strong>Database:</strong> Connected</p>
                    <p><strong>Storage:</strong> Active</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="danger" className="space-y-6 pt-6">
              <div className="space-y-4">
                <div className="border border-destructive/50 rounded-lg p-6 bg-destructive/5">
                  <h3 className="text-lg font-semibold text-destructive mb-2">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Irreversible and destructive actions
                  </p>
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      disabled={savingPrefs}
                      onClick={async () => {
                        const success = await logoutAllDevices();
                        if (success) {
                          navigate('/auth');
                        }
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {savingPrefs ? "Logging out..." : "Logout All Sessions"}
                    </Button>
                    <Button variant="outline" className="w-full border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground">
                      Reset Account Settings
                    </Button>
                    <Button variant="destructive" className="w-full">
                      Deactivate Account
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-6 pt-6">
              <div className="space-y-6">
                {/* Current Status */}
                <div className={`rounded-lg p-6 border-2 ${
                  maintenanceMode.is_active 
                    ? 'bg-destructive/10 border-destructive' 
                    : 'bg-green-500/10 border-green-500'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Current Status</h3>
                    <div className={`px-4 py-2 rounded-full font-bold ${
                      maintenanceMode.is_active 
                        ? 'bg-destructive text-destructive-foreground' 
                        : 'bg-green-500 text-white'
                    }`}>
                      {maintenanceMode.is_active ? 'MAINTENANCE MODE ACTIVE' : 'SYSTEM OPERATIONAL'}
                    </div>
                  </div>
                  
                  {maintenanceMode.is_active && (
                    <div className="text-sm text-muted-foreground">
                      <p className="mb-2">Users will see a maintenance screen when attempting to access the authentication page.</p>
                      <p className="font-medium">Message: "{maintenanceMode.message}"</p>
                    </div>
                  )}
                </div>

                {/* Maintenance Controls */}
                <div className="bg-muted/50 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-4">Maintenance Mode Controls</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="maintenance-duration">Duration</Label>
                      <Select
                        value={maintenanceMode.hours.toString()}
                        onValueChange={(value) => setMaintenanceMode({ ...maintenanceMode, hours: parseInt(value) })}
                      >
                        <SelectTrigger id="maintenance-duration">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Hour</SelectItem>
                          <SelectItem value="6">6 Hours</SelectItem>
                          <SelectItem value="24">1 Day</SelectItem>
                          <SelectItem value="72">3 Days</SelectItem>
                          <SelectItem value="168">1 Week</SelectItem>
                          <SelectItem value="336">2 Weeks</SelectItem>
                          <SelectItem value="720">1 Month</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Select how long the system will remain under maintenance
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="maintenance-message">Custom Message</Label>
                      <Textarea
                        id="maintenance-message"
                        value={maintenanceMode.message}
                        onChange={(e) => setMaintenanceMode({ ...maintenanceMode, message: e.target.value })}
                        placeholder="Enter a message to display to users during maintenance..."
                        rows={3}
                        className="resize-none"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        This message will be shown to users on the maintenance screen
                      </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                      {!maintenanceMode.is_active ? (
                        <Button
                          onClick={toggleMaintenance}
                          variant="destructive"
                          className="flex-1"
                        >
                          Enable Maintenance Mode
                        </Button>
                      ) : (
                        <Button
                          onClick={toggleMaintenance}
                          variant="default"
                          className="flex-1"
                        >
                          Disable Maintenance Mode
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Warning Notice */}
                <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
                  <h4 className="font-bold text-yellow-600 dark:text-yellow-400 mb-2">⚠️ Important Notice</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Users will not be able to login or signup during maintenance</li>
                    <li>A countdown timer will be displayed showing time remaining</li>
                    <li>Logged-in users can continue using the system</li>
                    <li>You can disable maintenance mode at any time</li>
                    <li>Maintenance mode will automatically end after the selected duration</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            {/* Backup Tab */}
            <TabsContent value="backup" className="space-y-6 pt-6">
              <div className="space-y-6">
                {/* Backup Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Backup & Recovery
                    </h3>
                    <p className="text-sm text-muted-foreground">Enterprise-grade backup management</p>
                  </div>
                  <Button 
                    onClick={runBackup} 
                    disabled={backupInProgress}
                    className="gap-2"
                  >
                    {backupInProgress ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {backupInProgress ? 'Backing Up...' : 'Run Backup Now'}
                  </Button>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Backup Status</CardTitle>
                      <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${getBackupHealthColor(backupStats?.backup_health || 'unknown')}`} />
                        <span className="text-xl font-bold capitalize">{backupStats?.backup_health || 'Unknown'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {backupSettings?.auto_backup_enabled ? 'Auto-backup enabled' : 'Auto-backup disabled'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold">
                        {backupStats?.last_successful_backup 
                          ? format(new Date(backupStats.last_successful_backup), 'MMM d, HH:mm')
                          : 'Never'}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {backupStats?.last_successful_backup 
                          ? format(new Date(backupStats.last_successful_backup), 'yyyy')
                          : 'No backups yet'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Database</CardTitle>
                      <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold">{backupStats?.total_rows?.toLocaleString() || 0}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {backupStats?.total_tables || 0} tables backed up
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Auth Users</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold">{backupStats?.total_users?.toLocaleString() || 0}</div>
                      <p className="text-xs text-muted-foreground mt-1">Users backed up</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Backup Settings */}
                  <Card className="lg:col-span-1">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Settings className="h-4 w-4" />
                        Backup Settings
                      </CardTitle>
                      <CardDescription>Configure automatic backups</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">Automatic Backup</p>
                          <p className="text-xs text-muted-foreground">Enable scheduled backups</p>
                        </div>
                        <Switch
                          checked={backupSettings?.auto_backup_enabled || false}
                          onCheckedChange={(checked) => updateBackupSettings({ auto_backup_enabled: checked })}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Backup Frequency</label>
                        <Select
                          value={backupSettings?.backup_frequency || 'daily'}
                          onValueChange={(value) => updateBackupSettings({ backup_frequency: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Retention Period</label>
                        <Select
                          value={String(backupSettings?.retention_days || 30)}
                          onValueChange={(value) => updateBackupSettings({ retention_days: parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">7 days</SelectItem>
                            <SelectItem value="14">14 days</SelectItem>
                            <SelectItem value="30">30 days</SelectItem>
                            <SelectItem value="60">60 days</SelectItem>
                            <SelectItem value="90">90 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3 pt-4 border-t">
                        <p className="text-sm font-medium">What to Backup</p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Database Tables</span>
                          <Switch
                            checked={backupSettings?.backup_database ?? true}
                            onCheckedChange={(checked) => updateBackupSettings({ backup_database: checked })}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm">Auth Users</span>
                          <Switch
                            checked={backupSettings?.backup_auth_users ?? true}
                            onCheckedChange={(checked) => updateBackupSettings({ backup_auth_users: checked })}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm">Storage Files</span>
                          <Switch
                            checked={backupSettings?.backup_storage || false}
                            onCheckedChange={(checked) => updateBackupSettings({ backup_storage: checked })}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Backup History */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Calendar className="h-4 w-4" />
                        Backup History
                      </CardTitle>
                      <CardDescription>Recent backup operations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Records</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {backupHistory.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                No backup history yet. Run your first backup!
                              </TableCell>
                            </TableRow>
                          ) : (
                            backupHistory.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="text-sm">
                                  {format(new Date(item.started_at), 'MMM d, HH:mm')}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="capitalize text-xs">
                                    {item.backup_type}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getBackupStatusIcon(item.status)}
                                    <span className="capitalize text-sm">{item.status}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {item.rows_backed_up?.toLocaleString() || 0} rows
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>

                {/* Progress Indicator when backup is running */}
                {backupInProgress && (
                  <Card className="border-primary">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Backup in progress...</span>
                          <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                        </div>
                        <Progress value={undefined} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          Please wait while we back up your data.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
