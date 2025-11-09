import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Trash2, Upload } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";

interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
}

const BrandManagement = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandLogo, setNewBrandLogo] = useState<File | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from("brands")
        .select("*")
        .order("name");

      if (error) throw error;
      setBrands(data || []);
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

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName) return;

    setUploading(true);
    try {
      let logoUrl = null;

      if (newBrandLogo) {
        const fileExt = newBrandLogo.name.split(".").pop();
        const fileName = `${newBrandName.toLowerCase().replace(/\s+/g, "-")}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("brand-logos")
          .upload(fileName, newBrandLogo, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("brand-logos")
          .getPublicUrl(uploadData.path);

        logoUrl = publicUrl;
      }

      const { error } = await supabase
        .from("brands")
        .insert({ name: newBrandName, logo_url: logoUrl });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Brand added successfully",
      });

      setNewBrandName("");
      setNewBrandLogo(null);
      fetchBrands();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const deleteBrand = async (id: string) => {
    try {
      const { error } = await supabase
        .from("brands")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Brand deleted successfully",
      });
      fetchBrands();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate("/admin-dashboard")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="grid gap-6">
        <Card className="glass-strong">
          <CardHeader>
            <CardTitle>Add New Brand</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddBrand} className="space-y-4">
              <div>
                <Label htmlFor="brandName">Brand Name</Label>
                <Input
                  id="brandName"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="e.g., Toyota, BMW, Mercedes"
                  required
                />
              </div>

              <div>
                <Label htmlFor="brandLogo">Brand Logo</Label>
                <Input
                  id="brandLogo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewBrandLogo(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
              </div>

              <Button type="submit" disabled={uploading} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                {uploading ? "Adding..." : "Add Brand"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardHeader>
            <CardTitle>Existing Brands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {brands.map((brand) => (
                <div key={brand.id} className="glass p-4 rounded-lg flex flex-col items-center gap-2">
                  {brand.logo_url ? (
                    <img
                      src={brand.logo_url}
                      alt={brand.name}
                      className="h-16 w-16 object-contain"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-secondary rounded flex items-center justify-center text-xs text-center">
                      No Logo
                    </div>
                  )}
                  <p className="font-medium text-center">{brand.name}</p>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteBrand(brand.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BrandManagement;