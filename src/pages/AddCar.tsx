import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Note: Select is still used for month field
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X } from "lucide-react";
import { AvailableColorsMultiSelect } from "@/components/AvailableColorsMultiSelect";
import StockUploadAnimation from "@/components/StockUploadAnimation";

const AddCar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
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
    yard_location: "Westlands, Nairobi",
    units_available: "",
  });
  const [availableColors, setAvailableColors] = useState<string[]>([]);

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
  const yardLocations = ["Westlands, Nairobi", "Nyeri", "Kiambu", "Mombasa", "Eldoret", "Kisumu"];

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

  const saveAsDraft = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      const { data: carData, error } = await supabase
        .from("cars")
        .insert([{
          make: formData.make || '', model: formData.model || '',
          year: formData.year || new Date().getFullYear(),
          month: formData.month || null,
          price: formData.price ? parseFloat(formData.price) : 0,
          mileage: formData.mileage, engine: formData.engine,
          fuel_type: formData.fuel_type, transmission: formData.transmission,
          drive_type: formData.drive_type, color: formData.color,
          stock_id: formData.stock_id || null, description: formData.description,
          status: "draft", is_draft: true, is_published: false,
          main_images: [], additional_images: [], images: [],
          vin: formData.vin || null, vin_history: formData.vin_history || null,
          available_colors: availableColors.length > 0 ? availableColors : null,
          yard_location: formData.yard_location || 'Westlands, Nairobi',
          units_available: formData.units_available ? parseInt(formData.units_available) : null,
        }] as any)
        .select("id, stock_id")
        .single();

      if (error) throw error;

      // Upload images if any
      const mainImageUrls = await uploadImages(carData.id, mainImages, "main");
      const additionalImageUrls = await uploadImages(carData.id, additionalImages, "additional");
      if (mainImageUrls.length > 0 || additionalImageUrls.length > 0) {
        await supabase.from("cars").update({
          main_images: mainImageUrls, additional_images: additionalImageUrls,
          images: [...mainImageUrls, ...additionalImageUrls],
        }).eq("id", carData.id);
      }

      toast({ title: "Saved as Draft", description: `Draft saved with Stock ID: ${carData.stock_id || "Auto"}` });
      setTimeout(() => navigate("/admin/cars/drafts"), 1000);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
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

      const { data: carData, error: insertError } = await supabase
        .from("cars")
        .insert([
          {
            make: formData.make || '',
            model: formData.model || '',
            year: formData.year || new Date().getFullYear(),
            month: formData.month || null,
            price: formData.price ? parseFloat(formData.price) : 0,
            mileage: formData.mileage,
            engine: formData.engine,
            fuel_type: formData.fuel_type,
            transmission: formData.transmission,
            drive_type: formData.drive_type,
            color: formData.color,
            stock_id: formData.stock_id || null,
            description: formData.description,
            status: "available",
            is_draft: false,
            main_images: [],
            additional_images: [],
            images: [],
            vin: formData.vin || null,
            vin_history: formData.vin_history || null,
            available_colors: availableColors.length > 0 ? availableColors : null,
            yard_location: formData.yard_location || 'Westlands, Nairobi',
            units_available: formData.units_available ? parseInt(formData.units_available) : null,
          } as any,
        ])
        .select("id, stock_id")
        .single();

      if (insertError) throw insertError;

      const autoStockId = carData.stock_id || "N/A";

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

      // Send notifications (email, WhatsApp, in-app) in background - non-blocking
      supabase.functions.invoke("send-new-car-notification", {
        body: {
          carId: carData.id,
          make: formData.make,
          model: formData.model,
          year: formData.year,
          price: parseFloat(formData.price),
          stockId: autoStockId,
          imageUrl: mainImageUrls[0] || null,
          color: formData.color,
          fuelType: formData.fuel_type,
          transmission: formData.transmission,
          mileage: formData.mileage,
          isUpdate: false,
        },
      }).then(() => {
        console.log("All notifications sent (email, WhatsApp, in-app)");
      }).catch(() => {
        // Silent fail - don't affect user experience
      });

      setUploadComplete(true);
      toast({
        title: "Success",
        description: `Car added successfully with Stock ID: ${autoStockId}`,
      });

      setTimeout(() => navigate("/admin/cars"), 1500);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add car",
        variant: "destructive",
      });
    } finally {
      if (!uploadComplete) setLoading(false);
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
                <Label htmlFor="make">Make</Label>
                <Combobox
                  options={carBrands}
                  value={formData.make}
                  onValueChange={(value) => setFormData({ ...formData, make: value })}
                  placeholder="Select or type car brand"
                  searchPlaceholder="Search brand..."
                  emptyMessage="No brand found."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
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
                <Label htmlFor="price">Price (KSh)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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
                <Label htmlFor="stock_id">Stock ID (Optional)</Label>
                <Input
                  id="stock_id"
                  value={formData.stock_id}
                  onChange={(e) => setFormData({ ...formData, stock_id: e.target.value })}
                  placeholder="Auto-generated if left empty (e.g., JUA-KEN-114)"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for auto-generated ID, or enter your own
                </p>
              </div>
            </div>

            <div className="space-y-2 mt-6">
              <Label htmlFor="yard_location">Yard Location (Optional)</Label>
              <Combobox
                options={yardLocations}
                value={formData.yard_location}
                onValueChange={(value) => setFormData({ ...formData, yard_location: value })}
                placeholder="Select or type yard location"
                searchPlaceholder="Search location..."
                emptyMessage="No location found."
              />
              <p className="text-xs text-muted-foreground">
                Defaults to Westlands, Nairobi if not selected. Editable later.
              </p>
            </div>

            <div className="space-y-2 mt-6">
              <Label htmlFor="units_available">Units Available (Optional)</Label>
              <Input
                id="units_available"
                type="number"
                min="0"
                value={formData.units_available}
                onChange={(e) => setFormData({ ...formData, units_available: e.target.value })}
                placeholder="e.g., 5"
              />
              <p className="text-xs text-muted-foreground">
                If set, customers will see "Available (5)" in stock on the frontend.
              </p>
            </div>

            {/* Other available colors (multi-select dropdown, optional) */}
            <div className="mt-6 p-4 border border-border rounded-lg bg-muted/30">
              <AvailableColorsMultiSelect
                options={colors}
                selected={availableColors}
                onChange={setAvailableColors}
              />
            </div>

            <div className="space-y-2 mt-6">
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

        <StockUploadAnimation isUploading={loading} isComplete={uploadComplete} />

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={loading || uploadComplete}
            className="flex-1 transition-all duration-700"
            style={{
              backgroundColor: uploadComplete
                ? "hsl(142, 71%, 45%)"
                : loading
                  ? "hsl(200, 75%, 50%)"
                  : undefined,
              animation: loading ? "heartbeat 1s ease-in-out infinite" : undefined,
            }}
          >
            {uploadComplete ? "✓ Car Added!" : loading ? "Adding Car..." : "Add Car"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={loading || uploadComplete}
            onClick={saveAsDraft}
          >
            💾 Save as Draft
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate("/admin/cars")} disabled={loading}>
            Cancel
          </Button>
        </div>
        {(loading || uploadComplete) && (
          <style>{`@keyframes heartbeat { 0%,100%{transform:scale(1)} 25%{transform:scale(1.04)} 50%{transform:scale(1)} 75%{transform:scale(1.02)} }`}</style>
        )}
      </form>
    </div>
  );
};

export default AddCar;
