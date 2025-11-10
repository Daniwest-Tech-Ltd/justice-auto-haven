import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const CustomerProfile = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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
    }
  }, [profile]);

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
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerProfile;