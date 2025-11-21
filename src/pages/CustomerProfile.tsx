import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import kenyaLocations from "@/data/kenya-locations.json";
import { AvatarUpload } from "@/components/AvatarUpload";
import { TOTPSetup } from "@/components/TOTPSetup";
import { FingerprintSetup } from "@/components/FingerprintSetup";

const CustomerProfile = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [availableTowns, setAvailableTowns] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fingerprintDevices, setFingerprintDevices] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    county_city: "",
    exact_location: "",
    gender: "",
    preferred_contact: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        county_city: profile.county_city || "",
        exact_location: profile.exact_location || "",
        gender: profile.gender || "",
        preferred_contact: profile.preferred_contact || "",
      });
      setAvatarUrl(profile.avatar_url || null);
      
      // Load towns for the existing county
      if (profile.county_city) {
        const county = kenyaLocations.counties.find((c: any) => c.name === profile.county_city);
        setAvailableTowns(county?.towns || []);
      }
    }
    if (user?.id) {
      loadFingerprintDevices();
    }
  }, [profile, user]);
  
  const loadFingerprintDevices = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("user_fingerprints")
      .select("*")
      .eq("user_id", user.id);
    setFingerprintDevices(data || []);
  };

  useEffect(() => {
    // Update available towns when county changes
    if (formData.county_city) {
      const county = kenyaLocations.counties.find((c: any) => c.name === formData.county_city);
      setAvailableTowns(county?.towns || []);
      if (formData.county_city !== profile?.county_city) {
        setFormData(prev => ({ ...prev, exact_location: "" })); // Reset town when county changes
      }
    }
  }, [formData.county_city]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update(formData)
        .eq("user_id", user?.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });

      navigate("/customer-dashboard");
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

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/customer-dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold">Edit Profile</h1>
            <p className="text-muted-foreground">Update your personal information</p>
          </div>
        </div>

        <Card className="glass-strong">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="space-y-6 pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-center pb-6 border-b">
                <AvatarUpload
                  currentAvatarUrl={avatarUrl}
                  userId={user?.id || ""}
                  userName={formData.full_name || profile?.full_name || "User"}
                  onUploadComplete={(url) => setAvatarUrl(url)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
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
                  <Label htmlFor="county_city">County</Label>
                  <Select
                    value={formData.county_city}
                    onValueChange={(value) => setFormData({ ...formData, county_city: value })}
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

                <div className="space-y-2">
                  <Label htmlFor="exact_location">Town / Location</Label>
                  <Select
                    value={formData.exact_location}
                    onValueChange={(value) => setFormData({ ...formData, exact_location: value })}
                    disabled={!formData.county_city}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.county_city ? "Select Town" : "First select a county"} />
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

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => navigate("/customer-dashboard")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
              </TabsContent>
              
              <TabsContent value="security" className="space-y-6 pt-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Add an extra layer of security to your account by enabling two-factor authentication.
                    </p>
                    
                    <TOTPSetup onComplete={loadFingerprintDevices} />
                  </div>
                  
                  <div className="border-t pt-6">
                    <FingerprintSetup 
                      devices={fingerprintDevices}
                      onUpdate={loadFingerprintDevices}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerProfile;