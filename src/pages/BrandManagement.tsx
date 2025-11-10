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

const PREDEFINED_BRANDS = [
  "Toyota", "BMW", "Mercedes-Benz", "Mazda", "Nissan", "Volkswagen", "Volvo",
  "Ford", "Kia", "Hyundai", "Audi", "Honda", "Subaru", "Peugeot", "Renault",
  "Fiat", "Alfa Romeo", "Citroën", "Skoda", "Opel", "Mitsubishi", "Land Rover",
  "Lexus", "Jaguar", "Porsche", "Tesla", "Suzuki", "Chevrolet", "Jeep", "Bentley"
];

const BrandManagement = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState("");
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
    if (!selectedBrand || !newBrandLogo) {
      toast({
        title: "Error",
        description: "Please select a brand and upload a logo",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // Check if brand already exists
      const existingBrand = brands.find(b => b.name.toLowerCase() === selectedBrand.toLowerCase());

      const fileExt = newBrandLogo.name.split(".").pop();
      const fileName = `${selectedBrand.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.${fileExt}`;
      
      // First, remove old file if updating
      if (existingBrand?.logo_url) {
        const oldFileName = existingBrand.logo_url.split('/').pop();
        if (oldFileName) {
          await supabase.storage.from("brand-logos").remove([oldFileName]);
        }
      }

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("brand-logos")
        .upload(fileName, newBrandLogo, { 
          cacheControl: '3600',
          upsert: false 
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("brand-logos")
        .getPublicUrl(uploadData.path);

      if (existingBrand) {
        // Update existing brand
        const { error } = await supabase
          .from("brands")
          .update({ logo_url: publicUrl })
          .eq("id", existingBrand.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Brand logo updated successfully",
        });
      } else {
        // Insert new brand
        const { error } = await supabase
          .from("brands")
          .insert({ name: selectedBrand, logo_url: publicUrl });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Brand added successfully",
        });
      }

      setSelectedBrand("");
      setNewBrandLogo(null);
      const fileInput = document.getElementById("brandLogo") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
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

  const availableBrands = PREDEFINED_BRANDS.filter(
    brand => !brands.some(b => b.name.toLowerCase() === brand.toLowerCase())
  );

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
            <CardTitle>Add/Update Brand Logo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddBrand} className="space-y-4">
              <div>
                <Label htmlFor="brandSelect">Select Brand</Label>
                <select
                  id="brandSelect"
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full p-2 rounded-md border bg-background"
                  required
                >
                  <option value="">-- Select Brand --</option>
                  {PREDEFINED_BRANDS.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                      {brands.some(b => b.name.toLowerCase() === brand.toLowerCase()) ? " (Has Logo)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="brandLogo">Brand Logo Image</Label>
                <Input
                  id="brandLogo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewBrandLogo(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                  required
                />
                {newBrandLogo && (
                  <p className="text-sm text-muted-foreground mt-1">{newBrandLogo.name}</p>
                )}
              </div>

              <Button type="submit" disabled={uploading || !selectedBrand || !newBrandLogo} className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? "Uploading..." : brands.some(b => b.name.toLowerCase() === selectedBrand.toLowerCase()) ? "Update Brand Logo" : "Add Brand Logo"}
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
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedBrand(brand.name);
                        document.getElementById("brandLogo")?.focus();
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteBrand(brand.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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