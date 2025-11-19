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
import kenyaLocations from "@/data/kenya-locations.json";

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableTowns, setAvailableTowns] = useState<string[]>([]);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    county_city: "",
    exact_location: "",
  });
  const [companySettings, setCompanySettings] = useState({
    id: "",
    company_name: "",
    email: "",
    phone: "",
    location: "",
    system_version: "",
    environment: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
    fetchCompanySettings();
  }, []);

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

  const handleSaveCompanySettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("company_settings")
        .update({
          company_name: companySettings.company_name,
          email: companySettings.email,
          phone: companySettings.phone,
          location: companySettings.location,
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
      setSaving(false);
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="company">Company Info</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
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
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
