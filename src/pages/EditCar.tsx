import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Upload, X } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";

const EditCar = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    month: "",
    price: 0,
    mileage: "",
    color: "",
    fuel_type: "",
    transmission: "",
    drive_type: "",
    engine: "",
    description: "",
    status: "available",
    is_featured: false,
    is_rental: false,
  });
  const [existingMainImages, setExistingMainImages] = useState<string[]>([]);
  const [existingAdditionalImages, setExistingAdditionalImages] = useState<string[]>([]);
  const [newMainImages, setNewMainImages] = useState<File[]>([]);
  const [newAdditionalImages, setNewAdditionalImages] = useState<File[]>([]);

  const fuelTypes = ["Petrol", "Diesel", "Hybrid", "Electric", "LPG", "CNG", "Flex Fuel"];
  const transmissions = ["Manual", "Automatic", "Semi-Automatic", "CVT", "Dual-Clutch"];
  const driveTypes = ["2WD", "FWD", "RWD", "4WD", "AWD"];
  const colors = ["White", "Black", "Silver", "Grey", "Blue", "Red", "Green", "Yellow", "Orange", "Brown", "Beige", "Gold", "Purple", "Maroon", "Wine", "Pink"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  useEffect(() => {
    if (id) {
      fetchCarData();
    }
  }, [id]);

  const fetchCarData = async () => {
    try {
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          make: data.make || "",
          model: data.model || "",
          year: data.year || new Date().getFullYear(),
          month: data.month || "",
          price: data.price || 0,
          mileage: data.mileage || "",
          color: data.color || "",
          fuel_type: data.fuel_type || "",
          transmission: data.transmission || "",
          drive_type: data.drive_type || "",
          engine: data.engine || "",
          description: data.description || "",
          status: data.status || "available",
          is_featured: data.is_featured || false,
          is_rental: data.is_rental || false,
        });
        
        // Load images from new structure, fallback to old
        const mainImgs = data.main_images as string[] | null;
        const additionalImgs = data.additional_images as string[] | null;
        const oldImgs = data.images as string[] | null;
        
        setExistingMainImages(Array.isArray(mainImgs) && mainImgs.length > 0 ? mainImgs : (Array.isArray(oldImgs) ? oldImgs : []));
        setExistingAdditionalImages(Array.isArray(additionalImgs) ? additionalImgs : []);
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

  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingMainImages.length + newMainImages.length + files.length;

    if (totalImages > 8) {
      toast({
        title: "Error",
        description: "Maximum 8 main images allowed",
        variant: "destructive",
      });
      return;
    }

    setNewMainImages([...newMainImages, ...files]);
  };

  const handleAdditionalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingAdditionalImages.length + newAdditionalImages.length + files.length;

    if (totalImages > 4) {
      toast({
        title: "Error",
        description: "Maximum 4 additional images allowed",
        variant: "destructive",
      });
      return;
    }

    setNewAdditionalImages([...newAdditionalImages, ...files]);
  };

  const removeExistingMainImage = (index: number) => {
    setExistingMainImages(existingMainImages.filter((_, i) => i !== index));
  };

  const removeExistingAdditionalImage = (index: number) => {
    setExistingAdditionalImages(existingAdditionalImages.filter((_, i) => i !== index));
  };

  const removeNewMainImage = (index: number) => {
    setNewMainImages(newMainImages.filter((_, i) => i !== index));
  };

  const removeNewAdditionalImage = (index: number) => {
    setNewAdditionalImages(newAdditionalImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let allMainImageUrls = [...existingMainImages];
      let allAdditionalImageUrls = [...existingAdditionalImages];

      // Upload new main images
      for (const file of newMainImages) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${id}_main_${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("car-images")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("car-images")
          .getPublicUrl(uploadData.path);

        allMainImageUrls.push(publicUrl);
      }

      // Upload new additional images
      for (const file of newAdditionalImages) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${id}_additional_${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("car-images")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("car-images")
          .getPublicUrl(uploadData.path);

        allAdditionalImageUrls.push(publicUrl);
      }

      const { error: updateError } = await supabase
        .from("cars")
        .update({
          ...formData,
          main_images: allMainImageUrls,
          additional_images: allAdditionalImageUrls,
          images: [...allMainImageUrls, ...allAdditionalImageUrls],
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Car updated successfully",
      });
      navigate("/admin/cars");
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

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate("/admin/cars")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Car Management
      </Button>

      <Card className="glass-strong">
        <CardHeader>
          <CardTitle>Edit Vehicle</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="make">Make *</Label>
                <Input
                  id="make"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="month">Month</Label>
                <Select value={formData.month} onValueChange={(value) => setFormData({ ...formData, month: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="price">Price (KSh) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="mileage">Mileage</Label>
                <Input
                  id="mileage"
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                  placeholder="e.g., 50,000 km"
                />
              </div>

              <div>
                <Label htmlFor="color">Color</Label>
                <Combobox
                  options={colors}
                  value={formData.color}
                  onValueChange={(value) => setFormData({ ...formData, color: value })}
                  placeholder="Select or type color"
                  searchPlaceholder="Search color..."
                  emptyMessage="No color found."
                />
              </div>

              <div>
                <Label htmlFor="fuel_type">Fuel Type</Label>
                <Combobox
                  options={fuelTypes}
                  value={formData.fuel_type}
                  onValueChange={(value) => setFormData({ ...formData, fuel_type: value })}
                  placeholder="Select or type fuel type"
                  searchPlaceholder="Search fuel type..."
                  emptyMessage="No fuel type found."
                />
              </div>

              <div>
                <Label htmlFor="transmission">Transmission</Label>
                <Combobox
                  options={transmissions}
                  value={formData.transmission}
                  onValueChange={(value) => setFormData({ ...formData, transmission: value })}
                  placeholder="Select or type transmission"
                  searchPlaceholder="Search transmission..."
                  emptyMessage="No transmission found."
                />
              </div>

              <div>
                <Label htmlFor="drive_type">Drive Type</Label>
                <Combobox
                  options={driveTypes}
                  value={formData.drive_type}
                  onValueChange={(value) => setFormData({ ...formData, drive_type: value })}
                  placeholder="Select or type drive type"
                  searchPlaceholder="Search drive type..."
                  emptyMessage="No drive type found."
                />
              </div>

              <div>
                <Label htmlFor="engine">Engine</Label>
                <Input
                  id="engine"
                  value={formData.engine}
                  onChange={(e) => setFormData({ ...formData, engine: e.target.value })}
                  placeholder="e.g., 3.5L V6"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div>
              <Label>Main Images (Up to 8)</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                {existingMainImages.map((url, index) => (
                  <div key={index} className="relative">
                    <img src={url} alt={`Main ${index + 1}`} className="w-full h-32 object-cover rounded" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => removeExistingMainImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {newMainImages.length > 0 && (
              <div>
                <Label>New Main Images to Upload</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  {newMainImages.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`New Main ${index + 1}`}
                        className="w-full h-32 object-cover rounded"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => removeNewMainImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {existingMainImages.length + newMainImages.length < 8 && (
              <div>
                <Label htmlFor="main-images">Add More Main Images (Max 8 total)</Label>
                <div className="mt-2">
                  <Input
                    id="main-images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleMainImageUpload}
                    className="cursor-pointer"
                  />
                </div>
              </div>
            )}

            <div>
              <Label>Additional Images (Up to 4)</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                {existingAdditionalImages.map((url, index) => (
                  <div key={index} className="relative">
                    <img src={url} alt={`Additional ${index + 1}`} className="w-full h-32 object-cover rounded" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => removeExistingAdditionalImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {newAdditionalImages.length > 0 && (
              <div>
                <Label>New Additional Images to Upload</Label>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  {newAdditionalImages.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`New Additional ${index + 1}`}
                        className="w-full h-32 object-cover rounded"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => removeNewAdditionalImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {existingAdditionalImages.length + newAdditionalImages.length < 4 && (
              <div>
                <Label htmlFor="additional-images">Add More Additional Images (Max 4 total)</Label>
                <div className="mt-2">
                  <Input
                    id="additional-images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleAdditionalImageUpload}
                    className="cursor-pointer"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={uploading} className="flex-1">
                {uploading ? "Updating..." : "Update Vehicle"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/cars")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditCar;