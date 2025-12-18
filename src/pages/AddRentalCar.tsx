import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, X } from "lucide-react";

const AddRentalCar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mainImages, setMainImages] = useState<File[]>([]);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    make: "",
    model: "",
    year: new Date().getFullYear(),
    description: "",
    pricePerHour: "",
    pricePerDay: "",
    color: "",
    transmission: "",
    fuelType: "",
    mileage: "",
    stockId: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 6);
      setMainImages(files);
    }
  };

  const handleAdditionalImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 2);
      setAdditionalImages(files);
    }
  };

  const uploadImages = async (files: File[], userId: string) => {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('rental-car-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('rental-car-images')
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
      if (!user) throw new Error("Please log in first");

      // Upload images
      const mainImageUrls = mainImages.length > 0 
        ? await uploadImages(mainImages, user.id) 
        : [];
      const additionalImageUrls = additionalImages.length > 0 
        ? await uploadImages(additionalImages, user.id) 
        : [];

      // Insert rental car
      const { error } = await supabase.from("rental_cars").insert({
        name: formData.name,
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year.toString()),
        description: formData.description,
        price_per_hour: parseFloat(formData.pricePerHour),
        price_per_day: formData.pricePerDay ? parseFloat(formData.pricePerDay) : null,
        color: formData.color,
        transmission: formData.transmission,
        fuel_type: formData.fuelType,
        mileage: formData.mileage,
        stock_id: formData.stockId,
        main_images: mainImageUrls,
        additional_images: additionalImageUrls,
        available: true,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Rental car added successfully",
      });

      navigate("/admin/rentals");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Button onClick={() => navigate(-1)} variant="ghost" className="mb-4">
        <ArrowLeft className="mr-2" /> Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Add Rental Car</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Car Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="make">Make</Label>
                <Input
                  id="make"
                  name="make"
                  value={formData.make}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  value={formData.year}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="pricePerHour">Price Per Hour (KES)</Label>
                <Input
                  id="pricePerHour"
                  name="pricePerHour"
                  type="number"
                  step="0.01"
                  value={formData.pricePerHour}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="pricePerDay">Price Per Day (KES)</Label>
                <Input
                  id="pricePerDay"
                  name="pricePerDay"
                  type="number"
                  step="0.01"
                  value={formData.pricePerDay}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label htmlFor="transmission">Transmission</Label>
                <Input
                  id="transmission"
                  name="transmission"
                  value={formData.transmission}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label htmlFor="fuelType">Fuel Type</Label>
                <Input
                  id="fuelType"
                  name="fuelType"
                  value={formData.fuelType}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label htmlFor="mileage">Mileage</Label>
                <Input
                  id="mileage"
                  name="mileage"
                  value={formData.mileage}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label htmlFor="stockId">Stock ID</Label>
                <Input
                  id="stockId"
                  name="stockId"
                  value={formData.stockId}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="mainImages">Main Images (up to 6)</Label>
              <Input
                id="mainImages"
                type="file"
                accept="image/*"
                multiple
                onChange={handleMainImageChange}
                className="cursor-pointer"
              />
              {mainImages.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {mainImages.length} image(s) selected
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="additionalImages">Additional Images (up to 2)</Label>
              <Input
                id="additionalImages"
                type="file"
                accept="image/*"
                multiple
                onChange={handleAdditionalImageChange}
                className="cursor-pointer"
              />
              {additionalImages.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {additionalImages.length} image(s) selected
                </p>
              )}
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Rental Car"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddRentalCar;