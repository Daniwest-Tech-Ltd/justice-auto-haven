import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X } from "lucide-react";

const AddCar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mainImages, setMainImages] = useState<(File | null)[]>(Array(8).fill(null));
  const [additionalImages, setAdditionalImages] = useState<(File | null)[]>(Array(4).fill(null));
  const [mainImagePreviews, setMainImagePreviews] = useState<(string | null)[]>(Array(8).fill(null));
  const [additionalImagePreviews, setAdditionalImagePreviews] = useState<(string | null)[]>(Array(4).fill(null));
  
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    month: "",
    price: "",
    mileage: "",
    engine: "",
    fuel_type: "",
    transmission: "",
    drive_type: "",
    color: "",
    stock_id: "",
    description: "",
    vin: "",
    vin_history: "",
  });

  const carBrands = [
    "Toyota", "BMW", "Mercedes-Benz", "Mazda", "Honda", "Nissan", "Subaru",
    "Volkswagen", "Audi", "Lexus", "Ford", "Chevrolet", "Hyundai", "Kia",
    "Mitsubishi", "Peugeot", "Renault", "Land Rover", "Porsche", "Jaguar"
  ];

  const fuelTypes = ["Petrol", "Diesel", "Hybrid", "Electric", "LPG", "CNG", "Flex Fuel"];
  const transmissions = ["Manual", "Automatic", "Semi-Automatic", "CVT", "Dual-Clutch"];
  const driveTypes = ["2WD", "FWD", "RWD", "4WD", "AWD"];
  const colors = ["White", "Black", "Silver", "Grey", "Blue", "Red", "Green", "Yellow", "Orange", "Brown", "Beige", "Gold", "Purple", "Maroon", "Wine", "Pink"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const handleMainImageSelect = (index: number, file: File | null) => {
    if (file) {
      const newImages = [...mainImages];
      newImages[index] = file;
      setMainImages(newImages);

      const reader = new FileReader();
      reader.onloadend = () => {
        const newPreviews = [...mainImagePreviews];
        newPreviews[index] = reader.result as string;
        setMainImagePreviews(newPreviews);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalImageSelect = (index: number, file: File | null) => {
    if (file) {
      const newImages = [...additionalImages];
      newImages[index] = file;
      setAdditionalImages(newImages);

      const reader = new FileReader();
      reader.onloadend = () => {
        const newPreviews = [...additionalImagePreviews];
        newPreviews[index] = reader.result as string;
        setAdditionalImagePreviews(newPreviews);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeMainImage = (index: number) => {
    const newImages = [...mainImages];
    newImages[index] = null;
    setMainImages(newImages);

    const newPreviews = [...mainImagePreviews];
    newPreviews[index] = null;
    setMainImagePreviews(newPreviews);
  };

  const removeAdditionalImage = (index: number) => {
    const newImages = [...additionalImages];
    newImages[index] = null;
    setAdditionalImages(newImages);

    const newPreviews = [...additionalImagePreviews];
    newPreviews[index] = null;
    setAdditionalImagePreviews(newPreviews);
  };

  const uploadImages = async (carId: string, imageList: (File | null)[], prefix: string) => {
    const uploadedUrls: string[] = [];

    for (let i = 0; i < imageList.length; i++) {
      const file = imageList[i];
      if (!file) continue;

      const fileExt = file.name.split(".").pop();
      const fileName = `${carId}/${prefix}-${i + 1}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("car-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("car-images")
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Generate stock ID automatically
      const { data: stockIdData, error: stockError } = await supabase
        .rpc("generate_stock_id");

      if (stockError) throw stockError;
      const autoStockId = stockIdData as string;

      // Insert car data first
      const { data: carData, error: insertError } = await supabase
        .from("cars")
        .insert([
          {
            make: formData.make,
            model: formData.model,
            year: formData.year,
            month: formData.month,
            price: parseFloat(formData.price),
            mileage: formData.mileage,
            engine: formData.engine,
            fuel_type: formData.fuel_type,
            transmission: formData.transmission,
            drive_type: formData.drive_type,
            color: formData.color,
            stock_id: autoStockId,
            description: formData.description,
            status: "available",
            main_images: [],
            additional_images: [],
            images: [],
            vin: formData.vin || null,
            vin_history: formData.vin_history || null,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // Upload main and additional images
      const mainImageUrls = await uploadImages(carData.id, mainImages, "main");
      const additionalImageUrls = await uploadImages(carData.id, additionalImages, "additional");

      // Update car with image URLs
      const { error: updateError } = await supabase
        .from("cars")
        .update({ 
          main_images: mainImageUrls,
          additional_images: additionalImageUrls,
          images: [...mainImageUrls, ...additionalImageUrls]
        })
        .eq("id", carData.id);

      if (updateError) throw updateError;

      // Log activity
      await supabase.rpc("log_activity", {
        p_user_id: user.id,
        p_action_type: "add_car",
        p_target_table: "cars",
        p_target_id: carData.id,
        p_details: {
          stock_id: autoStockId,
          make: formData.make,
          model: formData.model,
        },
      });

      toast({
        title: "Success",
        description: `Car added successfully with Stock ID: ${autoStockId}`,
      });

      navigate("/admin/cars");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add car",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" onClick={() => navigate("/admin/cars")}>
          ← Back
        </Button>
        <h1 className="text-4xl font-bold">Add New Car</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="glass-strong">
          <CardHeader>
            <CardTitle>Main Vehicle Images (Up to 8)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                <div key={index} className="relative aspect-video border-2 border-dashed border-border rounded-lg overflow-hidden">
                  {mainImagePreviews[index] ? (
                    <>
                      <img
                        src={mainImagePreviews[index]!}
                        alt={`Main ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={() => removeMainImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-accent/50 transition-colors">
                      <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Main {index + 1}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleMainImageSelect(index, e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardHeader>
            <CardTitle>Additional Images (Up to 4)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="relative aspect-video border-2 border-dashed border-border rounded-lg overflow-hidden">
                  {additionalImagePreviews[index] ? (
                    <>
                      <img
                        src={additionalImagePreviews[index]!}
                        alt={`Additional ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={() => removeAdditionalImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-accent/50 transition-colors">
                      <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Extra {index + 1}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleAdditionalImageSelect(index, e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardHeader>
            <CardTitle>Car Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="make">Make *</Label>
                <Select value={formData.make} onValueChange={(value) => setFormData({ ...formData, make: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {carBrands.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-2">
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

              <div className="space-y-2">
                <Label htmlFor="price">Price (KSh) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mileage">Mileage (km)</Label>
                <Input
                  id="mileage"
                  value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="engine">Engine</Label>
                <Input
                  id="engine"
                  placeholder="e.g., 2.0L Turbo"
                  value={formData.engine}
                  onChange={(e) => setFormData({ ...formData, engine: e.target.value })}
                />
              </div>

              <div className="space-y-2">
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

              <div className="space-y-2">
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

              <div className="space-y-2">
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

              <div className="space-y-2">
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

              <div className="space-y-2">
                <Label htmlFor="stock_id">Stock ID</Label>
                <Input
                  id="stock_id"
                  value="Auto-generated on save (e.g., JUA-KEN-021)"
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Stock ID will be automatically generated when you save
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vin">VIN (Vehicle Identification Number)</Label>
              <Input
                id="vin"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                placeholder="17-digit VIN"
                maxLength={17}
              />
              <p className="text-xs text-muted-foreground">
                Optional: Enter the 17-character Vehicle Identification Number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vin_history">Vehicle History</Label>
              <Textarea
                id="vin_history"
                value={formData.vin_history}
                onChange={(e) => setFormData({ ...formData, vin_history: e.target.value })}
                rows={6}
                placeholder="Enter vehicle history including: &#10;• Accident history&#10;• Import details&#10;• Mileage verification&#10;• Auction grade&#10;• Ownership records&#10;• Service history"
              />
              <p className="text-xs text-muted-foreground">
                Optional: This information will be displayed to customers if provided
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Adding Car..." : "Add Car"}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/admin/cars")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddCar;
