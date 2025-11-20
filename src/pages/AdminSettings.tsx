import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Save, User, Building, Mail, Phone } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { Textarea } from "@/components/ui/textarea";
import kenyaLocations from "@/data/kenya-locations.json";
import { setTheme } from "@/lib/theme";
import type { Theme } from "@/lib/theme";

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [availableTowns, setAvailableTowns] = useState<string[]>([]);
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
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
    fetchCompanySettings();
    fetchMaintenanceStatus();
  }, []);

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
      const { data: { user } } = await supabase.auth.getUser();
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
          .single();

        if (error) throw error;
        
        setMaintenanceId(data.id);
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

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

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
          <CardTitle className="text-3xl font-bold">
            <span className="bg-gradient-accent bg-clip-text text-transparent">
              Admin Settings
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="company">Company Info</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6 pt-6">
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
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
