import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, User, Shield, Bell, Palette, Menu, Lock, Send, LogOut, Loader2, KeyRound } from "lucide-react";
import { PasswordChangeDialog } from "@/components/PasswordChangeDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LoadingScreen from "@/components/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";
import { TOTPSetup } from "@/components/TOTPSetup";
import { FingerprintSetup } from "@/components/FingerprintSetup";
import { TrustedDevices } from "@/components/TrustedDevices";
import { AvatarUpload } from "@/components/AvatarUpload";
import { applyTheme } from "@/lib/theme";
import type { Theme } from "@/lib/theme";
import { useUserPreferences } from "@/hooks/useUserPreferences";

const CustomerSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sendingTest, setSendingTest] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();

  // User preferences hook
  const { 
    preferences, 
    saving: savingPrefs, 
    updatePreferences, 
    logoutAllDevices,
    sendTestNotification 
  } = useUserPreferences(user?.id);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    gender: "",
    county_city: "",
    exact_location: "",
    preferred_contact: "",
    avatar_url: "",
  });

  const [selectedTheme, setSelectedTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme") as Theme;
    return saved || "system";
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        gender: profile.gender || "",
        county_city: profile.county_city || "",
        exact_location: profile.exact_location || "",
        preferred_contact: profile.preferred_contact || "",
        avatar_url: profile.avatar_url || "",
      });
      setLoading(false);
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("profiles")
        .update(formData)
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
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

  const handleThemeChange = async (theme: Theme) => {
    try {
      setSelectedTheme(theme);
      applyTheme(theme);
      localStorage.setItem("theme", theme);

      toast({
        title: "Theme Updated",
        description: "Your theme preference has been saved",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) return <LoadingScreen />;

  const tabs = [
    { value: "profile", label: "Profile", icon: User },
    { value: "security", label: "Security", icon: Shield },
    { value: "notifications", label: "Notifications", icon: Bell },
    { value: "privacy", label: "Privacy", icon: Lock },
    { value: "appearance", label: "Appearance", icon: Palette },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate("/customer-dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-4xl font-bold">Settings</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full gap-2">
                <Menu className="h-4 w-4" />
                {tabs.find(t => t.value === activeTab)?.label || "Menu"}
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Settings Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 mt-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <Button
                      key={tab.value}
                      variant={activeTab === tab.value ? "default" : "ghost"}
                      className="justify-start gap-2"
                      onClick={() => {
                        setActiveTab(tab.value);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </Button>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Tabs */}
        <TabsList className="hidden md:grid md:grid-cols-5 w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                <Icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="profile">
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <AvatarUpload
                currentAvatarUrl={formData.avatar_url}
                userId={user?.id || ""}
                userName={formData.full_name}
                onUploadComplete={(url) => setFormData({ ...formData, avatar_url: url })}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="county_city">County/City</Label>
                  <Input
                    id="county_city"
                    value={formData.county_city}
                    onChange={(e) => setFormData({ ...formData, county_city: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exact_location">Exact Location</Label>
                  <Input
                    id="exact_location"
                    value={formData.exact_location}
                    onChange={(e) => setFormData({ ...formData, exact_location: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferred_contact">Preferred Contact Method</Label>
                  <Select value={formData.preferred_contact} onValueChange={(value) => setFormData({ ...formData, preferred_contact: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-6">
            {/* Password Change */}
            <Card className="glass-strong">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Update your password to keep your account secure. You will be logged out after changing your password.
                </p>
                <PasswordChangeDialog 
                  userEmail={formData.email}
                  userName={formData.full_name}
                />
              </CardContent>
            </Card>
            
            <TOTPSetup />
            <FingerprintSetup />
            <TrustedDevices userId={user?.id || ""} />
            
            {/* Logout All Devices */}
            <Card className="glass-strong border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Log out from all devices. You will need to login again.
                </p>
                <Button 
                  variant="outline" 
                  className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  disabled={savingPrefs}
                  onClick={async () => {
                    const success = await logoutAllDevices();
                    if (success) {
                      navigate('/auth');
                    }
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {savingPrefs ? "Logging out..." : "Logout All Devices"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Theme</Label>
                <div className="flex gap-4">
                  <Button
                    variant={selectedTheme === "light" ? "default" : "outline"}
                    onClick={() => handleThemeChange("light")}
                  >
                    Light
                  </Button>
                  <Button
                    variant={selectedTheme === "dark" ? "default" : "outline"}
                    onClick={() => handleThemeChange("dark")}
                  >
                    Dark
                  </Button>
                  <Button
                    variant={selectedTheme === "system" ? "default" : "outline"}
                    onClick={() => handleThemeChange("system")}
                  >
                    System
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerSettings;
