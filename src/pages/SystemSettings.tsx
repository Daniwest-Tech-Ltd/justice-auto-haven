import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, Settings, Shield, Globe, Database, Bell, CreditCard, Lock, Palette, Menu } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";

const SystemSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [systemSettings, setSystemSettings] = useState({
    system_name: "",
    system_description: "",
    support_email: "",
    support_phone: "",
    whatsapp_support: "",
    default_country: "Kenya",
    default_currency: "KES",
    timezone: "Africa/Nairobi",
    date_format: "DD/MM/YYYY",
  });

  const [authSettings, setAuthSettings] = useState({
    signup_enabled: true,
    phone_verification_enabled: true,
    email_verification_enabled: true,
    two_fa_enabled: true,
    google_oauth_enabled: false,
    facebook_oauth_enabled: false,
    apple_oauth_enabled: false,
    password_min_length: 8,
    password_require_symbols: true,
    session_timeout_minutes: 60,
  });

  const [securityConfig, setSecurityConfig] = useState({
    rate_limiting_enabled: true,
    rate_limit_requests: 100,
    rate_limit_window_minutes: 15,
    brute_force_protection: true,
    max_login_attempts: 5,
    lockout_duration_minutes: 30,
    bot_protection_enabled: true,
    csrf_protection_enabled: true,
    jwt_expiry_hours: 24,
    encryption_level: "AES-256",
  });

  const [aiSecuritySettings, setAiSecuritySettings] = useState({
    behaviour_monitoring_enabled: true,
    threat_detection_enabled: true,
    fraud_detection_enabled: true,
    facial_recognition_enabled: false,
    auto_block_suspicious: false,
    confidence_threshold: 0.85,
  });

  const [localizationSettings, setLocalizationSettings] = useState({
    default_language: "en",
    auto_language_detection: true,
    rtl_support: false,
  });

  const [storageSettings, setStorageSettings] = useState({
    provider: "supabase",
    max_upload_size_mb: 10,
    backup_enabled: true,
    backup_schedule: "daily",
  });

  const [notificationConfig, setNotificationConfig] = useState({
    email_enabled: true,
    sms_enabled: false,
    whatsapp_enabled: false,
    push_enabled: true,
  });

  const [paymentConfig, setPaymentConfig] = useState({
    mpesa_enabled: false,
    paypal_enabled: false,
    stripe_enabled: false,
    bank_transfer_enabled: true,
    auto_currency_conversion: false,
  });

  const [privacySettings, setPrivacySettings] = useState({
    cookie_consent_enabled: true,
    cookie_auto_consent: false,
    data_retention_days: 365,
    allow_data_export: true,
    allow_data_deletion: true,
  });

  const [maintenanceMode, setMaintenanceMode] = useState({
    is_active: false,
    message: "We are currently undergoing scheduled maintenance. We'll be back soon!",
    start_time: "",
    end_time: "",
    countdown_hours: 0,
    countdown_days: 0,
    countdown_weeks: 0,
    auto_reactivate: false,
  });

  useEffect(() => {
    fetchAllSettings();
  }, []);

  const fetchAllSettings = async () => {
    try {
      const supabaseClient = supabase as any;
      const [
        systemRes,
        authRes,
        securityRes,
        aiSecurityRes,
        localizationRes,
        storageRes,
        notificationRes,
        paymentRes,
        privacyRes,
        maintenanceRes,
      ] = await Promise.all([
        supabaseClient.from("system_settings").select("*").single(),
        supabaseClient.from("auth_settings").select("*").single(),
        supabaseClient.from("security_config").select("*").single(),
        supabaseClient.from("ai_security_settings").select("*").single(),
        supabaseClient.from("localization_settings").select("*").single(),
        supabaseClient.from("storage_settings").select("*").single(),
        supabaseClient.from("notification_config").select("*").single(),
        supabaseClient.from("payment_config").select("*").single(),
        supabaseClient.from("privacy_settings").select("*").single(),
        supabaseClient.from("system_maintenance").select("*").order("created_at", { ascending: false }).limit(1).single(),
      ]);

      if (systemRes.data) setSystemSettings(systemRes.data);
      if (authRes.data) setAuthSettings(authRes.data);
      if (securityRes.data) setSecurityConfig(securityRes.data);
      if (aiSecurityRes.data) setAiSecuritySettings(aiSecurityRes.data);
      if (localizationRes.data) setLocalizationSettings(localizationRes.data);
      if (storageRes.data) setStorageSettings(storageRes.data);
      if (notificationRes.data) setNotificationConfig(notificationRes.data);
      if (paymentRes.data) setPaymentConfig(paymentRes.data);
      if (privacyRes.data) setPrivacySettings(privacyRes.data);
      if (maintenanceRes.data) setMaintenanceMode(maintenanceRes.data);
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

  const handleSaveSettings = async (table: string, data: any) => {
    setSaving(true);
    try {
      const { error } = await (supabase as any).from(table).upsert(data);
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

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate("/admin-dashboard")} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card className="glass-strong">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl md:text-3xl font-bold">
                <span className="bg-gradient-accent bg-clip-text text-transparent">
                  System Settings
                </span>
              </CardTitle>
              <CardDescription>Configure all system settings and preferences</CardDescription>
            </div>
            
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
                    variant={activeTab === "general" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => {
                      setActiveTab("general");
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    General
                  </Button>
                  <Button
                    variant={activeTab === "authentication" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => {
                      setActiveTab("authentication");
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Authentication
                  </Button>
                  <Button
                    variant={activeTab === "maintenance" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => {
                      setActiveTab("maintenance");
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Maintenance
                  </Button>
                  <Button
                    variant={activeTab === "security" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => {
                      setActiveTab("security");
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Security
                  </Button>
                  <Button
                    variant={activeTab === "storage" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => {
                      setActiveTab("storage");
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Storage
                  </Button>
                  <Button
                    variant={activeTab === "advanced" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => {
                      setActiveTab("advanced");
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Advanced
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Desktop Tabs - Hidden on Mobile */}
            <TabsList className="hidden md:grid w-full grid-cols-6">
              <TabsTrigger value="general"><Settings className="h-4 w-4 mr-2" />General</TabsTrigger>
              <TabsTrigger value="authentication"><Lock className="h-4 w-4 mr-2" />Auth</TabsTrigger>
              <TabsTrigger value="maintenance"><Settings className="h-4 w-4 mr-2" />Maintenance</TabsTrigger>
              <TabsTrigger value="security"><Shield className="h-4 w-4 mr-2" />Security</TabsTrigger>
              <TabsTrigger value="storage"><Database className="h-4 w-4 mr-2" />Storage</TabsTrigger>
              <TabsTrigger value="advanced"><Globe className="h-4 w-4 mr-2" />Advanced</TabsTrigger>
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general" className="space-y-6 pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="system_name">System Name</Label>
                  <Input
                    id="system_name"
                    value={systemSettings.system_name}
                    onChange={(e) => setSystemSettings({ ...systemSettings, system_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="system_description">System Description</Label>
                  <Textarea
                    id="system_description"
                    value={systemSettings.system_description || ""}
                    onChange={(e) => setSystemSettings({ ...systemSettings, system_description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="support_email">Support Email</Label>
                    <Input
                      id="support_email"
                      type="email"
                      value={systemSettings.support_email}
                      onChange={(e) => setSystemSettings({ ...systemSettings, support_email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="support_phone">Support Phone</Label>
                    <Input
                      id="support_phone"
                      value={systemSettings.support_phone}
                      onChange={(e) => setSystemSettings({ ...systemSettings, support_phone: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="whatsapp_support">WhatsApp Support Link</Label>
                  <Input
                    id="whatsapp_support"
                    value={systemSettings.whatsapp_support || ""}
                    onChange={(e) => setSystemSettings({ ...systemSettings, whatsapp_support: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="default_currency">Default Currency</Label>
                    <Select value={systemSettings.default_currency} onValueChange={(value) => setSystemSettings({ ...systemSettings, default_currency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={systemSettings.timezone} onValueChange={(value) => setSystemSettings({ ...systemSettings, timezone: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">America/New York (EST)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={() => handleSaveSettings("system_settings", systemSettings)} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save General Settings"}
                </Button>
              </div>
            </TabsContent>

            {/* Maintenance Mode */}
            <TabsContent value="maintenance" className="space-y-6 pt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Maintenance Mode</CardTitle>
                  <CardDescription>Put your system in maintenance mode to perform updates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-lg font-semibold">Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        {maintenanceMode.is_active ? "System is currently in maintenance mode" : "System is active"}
                      </p>
                    </div>
                    <Switch
                      checked={maintenanceMode.is_active}
                      onCheckedChange={(checked) => setMaintenanceMode({ ...maintenanceMode, is_active: checked })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="maintenance_message">Maintenance Message</Label>
                    <Textarea
                      id="maintenance_message"
                      value={maintenanceMode.message}
                      onChange={(e) => setMaintenanceMode({ ...maintenanceMode, message: e.target.value })}
                      placeholder="Enter the message users will see during maintenance"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_time">Start Time</Label>
                      <Input
                        id="start_time"
                        type="datetime-local"
                        value={maintenanceMode.start_time}
                        onChange={(e) => setMaintenanceMode({ ...maintenanceMode, start_time: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_time">End Time</Label>
                      <Input
                        id="end_time"
                        type="datetime-local"
                        value={maintenanceMode.end_time}
                        onChange={(e) => setMaintenanceMode({ ...maintenanceMode, end_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-3 block">Countdown Settings</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="countdown_weeks">Weeks</Label>
                        <Input
                          id="countdown_weeks"
                          type="number"
                          min="0"
                          value={maintenanceMode.countdown_weeks}
                          onChange={(e) => setMaintenanceMode({ ...maintenanceMode, countdown_weeks: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="countdown_days">Days</Label>
                        <Input
                          id="countdown_days"
                          type="number"
                          min="0"
                          max="6"
                          value={maintenanceMode.countdown_days}
                          onChange={(e) => setMaintenanceMode({ ...maintenanceMode, countdown_days: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="countdown_hours">Hours</Label>
                        <Input
                          id="countdown_hours"
                          type="number"
                          min="0"
                          max="23"
                          value={maintenanceMode.countdown_hours}
                          onChange={(e) => setMaintenanceMode({ ...maintenanceMode, countdown_hours: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>Auto-reactivate System</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically disable maintenance mode when end time is reached
                      </p>
                    </div>
                    <Switch
                      checked={maintenanceMode.auto_reactivate}
                      onCheckedChange={(checked) => setMaintenanceMode({ ...maintenanceMode, auto_reactivate: checked })}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => handleSaveSettings("system_maintenance", maintenanceMode)} disabled={saving}>
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? "Saving..." : "Save Maintenance Settings"}
                    </Button>
                    <Button variant="outline" onClick={() => navigate("/")}>
                      Preview Maintenance Page
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Authentication Settings */}
            <TabsContent value="authentication" className="space-y-6 pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="signup_enabled">Enable User Signup</Label>
                  <Switch
                    id="signup_enabled"
                    checked={authSettings.signup_enabled}
                    onCheckedChange={(checked) => setAuthSettings({ ...authSettings, signup_enabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email_verification_enabled">Email Verification</Label>
                  <Switch
                    id="email_verification_enabled"
                    checked={authSettings.email_verification_enabled}
                    onCheckedChange={(checked) => setAuthSettings({ ...authSettings, email_verification_enabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="phone_verification_enabled">Phone Verification</Label>
                  <Switch
                    id="phone_verification_enabled"
                    checked={authSettings.phone_verification_enabled}
                    onCheckedChange={(checked) => setAuthSettings({ ...authSettings, phone_verification_enabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="two_fa_enabled">Two-Factor Authentication</Label>
                  <Switch
                    id="two_fa_enabled"
                    checked={authSettings.two_fa_enabled}
                    onCheckedChange={(checked) => setAuthSettings({ ...authSettings, two_fa_enabled: checked })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password_min_length">Min Password Length</Label>
                    <Input
                      id="password_min_length"
                      type="number"
                      value={authSettings.password_min_length}
                      onChange={(e) => setAuthSettings({ ...authSettings, password_min_length: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="session_timeout_minutes">Session Timeout (minutes)</Label>
                    <Input
                      id="session_timeout_minutes"
                      type="number"
                      value={authSettings.session_timeout_minutes}
                      onChange={(e) => setAuthSettings({ ...authSettings, session_timeout_minutes: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <Button onClick={() => handleSaveSettings("auth_settings", authSettings)} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Authentication Settings"}
                </Button>
              </div>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-6 pt-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Rate Limiting</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Enable Rate Limiting</Label>
                      <Switch
                        checked={securityConfig.rate_limiting_enabled}
                        onCheckedChange={(checked) => setSecurityConfig({ ...securityConfig, rate_limiting_enabled: checked })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Max Requests</Label>
                        <Input
                          type="number"
                          value={securityConfig.rate_limit_requests}
                          onChange={(e) => setSecurityConfig({ ...securityConfig, rate_limit_requests: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Window (minutes)</Label>
                        <Input
                          type="number"
                          value={securityConfig.rate_limit_window_minutes}
                          onChange={(e) => setSecurityConfig({ ...securityConfig, rate_limit_window_minutes: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Brute Force Protection</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Enable Protection</Label>
                      <Switch
                        checked={securityConfig.brute_force_protection}
                        onCheckedChange={(checked) => setSecurityConfig({ ...securityConfig, brute_force_protection: checked })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Max Login Attempts</Label>
                        <Input
                          type="number"
                          value={securityConfig.max_login_attempts}
                          onChange={(e) => setSecurityConfig({ ...securityConfig, max_login_attempts: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Lockout Duration (minutes)</Label>
                        <Input
                          type="number"
                          value={securityConfig.lockout_duration_minutes}
                          onChange={(e) => setSecurityConfig({ ...securityConfig, lockout_duration_minutes: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>AI Security</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Behaviour Monitoring</Label>
                      <Switch
                        checked={aiSecuritySettings.behaviour_monitoring_enabled}
                        onCheckedChange={(checked) => setAiSecuritySettings({ ...aiSecuritySettings, behaviour_monitoring_enabled: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Threat Detection</Label>
                      <Switch
                        checked={aiSecuritySettings.threat_detection_enabled}
                        onCheckedChange={(checked) => setAiSecuritySettings({ ...aiSecuritySettings, threat_detection_enabled: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Fraud Detection</Label>
                      <Switch
                        checked={aiSecuritySettings.fraud_detection_enabled}
                        onCheckedChange={(checked) => setAiSecuritySettings({ ...aiSecuritySettings, fraud_detection_enabled: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Auto-Block Suspicious Accounts</Label>
                      <Switch
                        checked={aiSecuritySettings.auto_block_suspicious}
                        onCheckedChange={(checked) => setAiSecuritySettings({ ...aiSecuritySettings, auto_block_suspicious: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Button onClick={() => {
                  handleSaveSettings("security_config", securityConfig);
                  handleSaveSettings("ai_security_settings", aiSecuritySettings);
                }} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Security Settings"}
                </Button>
              </div>
            </TabsContent>

            {/* Storage Settings */}
            <TabsContent value="storage" className="space-y-6 pt-6">
              <div className="space-y-4">
                <div>
                  <Label>Storage Provider</Label>
                  <Select value={storageSettings.provider} onValueChange={(value) => setStorageSettings({ ...storageSettings, provider: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supabase">Supabase Storage</SelectItem>
                      <SelectItem value="s3">Amazon S3</SelectItem>
                      <SelectItem value="gcp">Google Cloud Storage</SelectItem>
                      <SelectItem value="local">Local Storage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Max Upload Size (MB)</Label>
                  <Input
                    type="number"
                    value={storageSettings.max_upload_size_mb}
                    onChange={(e) => setStorageSettings({ ...storageSettings, max_upload_size_mb: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Enable Automatic Backups</Label>
                  <Switch
                    checked={storageSettings.backup_enabled}
                    onCheckedChange={(checked) => setStorageSettings({ ...storageSettings, backup_enabled: checked })}
                  />
                </div>
                <div>
                  <Label>Backup Schedule</Label>
                  <Select value={storageSettings.backup_schedule} onValueChange={(value) => setStorageSettings({ ...storageSettings, backup_schedule: value })}>
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
                <Button onClick={() => handleSaveSettings("storage_settings", storageSettings)} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Storage Settings"}
                </Button>
              </div>
            </TabsContent>

            {/* Advanced Settings */}
            <TabsContent value="advanced" className="space-y-6 pt-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle><Bell className="inline h-5 w-5 mr-2" />Notifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Email Notifications</Label>
                      <Switch
                        checked={notificationConfig.email_enabled}
                        onCheckedChange={(checked) => setNotificationConfig({ ...notificationConfig, email_enabled: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>SMS Notifications</Label>
                      <Switch
                        checked={notificationConfig.sms_enabled}
                        onCheckedChange={(checked) => setNotificationConfig({ ...notificationConfig, sms_enabled: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>WhatsApp Notifications</Label>
                      <Switch
                        checked={notificationConfig.whatsapp_enabled}
                        onCheckedChange={(checked) => setNotificationConfig({ ...notificationConfig, whatsapp_enabled: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Push Notifications</Label>
                      <Switch
                        checked={notificationConfig.push_enabled}
                        onCheckedChange={(checked) => setNotificationConfig({ ...notificationConfig, push_enabled: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle><CreditCard className="inline h-5 w-5 mr-2" />Payment Methods</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>M-Pesa</Label>
                      <Switch
                        checked={paymentConfig.mpesa_enabled}
                        onCheckedChange={(checked) => setPaymentConfig({ ...paymentConfig, mpesa_enabled: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>PayPal</Label>
                      <Switch
                        checked={paymentConfig.paypal_enabled}
                        onCheckedChange={(checked) => setPaymentConfig({ ...paymentConfig, paypal_enabled: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Stripe</Label>
                      <Switch
                        checked={paymentConfig.stripe_enabled}
                        onCheckedChange={(checked) => setPaymentConfig({ ...paymentConfig, stripe_enabled: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Bank Transfer</Label>
                      <Switch
                        checked={paymentConfig.bank_transfer_enabled}
                        onCheckedChange={(checked) => setPaymentConfig({ ...paymentConfig, bank_transfer_enabled: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle><Shield className="inline h-5 w-5 mr-2" />Privacy & GDPR</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Cookie Consent Banner</Label>
                      <Switch
                        checked={privacySettings.cookie_consent_enabled}
                        onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, cookie_consent_enabled: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Allow Data Export</Label>
                      <Switch
                        checked={privacySettings.allow_data_export}
                        onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, allow_data_export: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Allow Data Deletion</Label>
                      <Switch
                        checked={privacySettings.allow_data_deletion}
                        onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, allow_data_deletion: checked })}
                      />
                    </div>
                    <div>
                      <Label>Data Retention (days)</Label>
                      <Input
                        type="number"
                        value={privacySettings.data_retention_days}
                        onChange={(e) => setPrivacySettings({ ...privacySettings, data_retention_days: parseInt(e.target.value) })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Button onClick={() => {
                  handleSaveSettings("notification_config", notificationConfig);
                  handleSaveSettings("payment_config", paymentConfig);
                  handleSaveSettings("privacy_settings", privacySettings);
                  handleSaveSettings("localization_settings", localizationSettings);
                }} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Advanced Settings"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;
