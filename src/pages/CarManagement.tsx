import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Pencil, Trash2, Plus, ArrowLeft, Star } from "lucide-react";

interface Car {
  id: string;
  stock_id: string | null;
  make: string;
  model: string;
  year: number;
  price: number;
  status: string | null;
  images: any;
  fuel_type: string | null;
  transmission: string | null;
  mileage: string | null;
  color: string | null;
  is_featured: boolean | null;
}

const CarManagement = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && role?.role === "admin") {
      fetchCars();
    }
  }, [user, role]);

  const fetchCars = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cars")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch cars",
        variant: "destructive",
      });
    } else {
      setCars(data || []);
    }
    setLoading(false);
  };

  const toggleStatus = async (carId: string, currentStatus: string | null) => {
    const newStatus = currentStatus === "available" ? "sold" : "available";
    
    const { error } = await supabase
      .from("cars")
      .update({ status: newStatus })
      .eq("id", carId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update car status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Car marked as ${newStatus === "available" ? "In Stock" : "Sold Out"}`,
      });
      fetchCars();
    }
  };

  const deleteCar = async (carId: string) => {
    if (!confirm("Are you sure you want to delete this car?")) return;

    const { error } = await supabase
      .from("cars")
      .delete()
      .eq("id", carId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete car",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Car deleted successfully",
      });
      fetchCars();
    }
  };

  const toggleFeatured = async (carId: string, currentStatus: boolean | null) => {
    const { error } = await supabase
      .from("cars")
      .update({ is_featured: !currentStatus })
      .eq("id", carId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update featured status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Car ${!currentStatus ? "marked as" : "removed from"} featured`,
      });
      fetchCars();
    }
  };

  const getImageUrl = (images: any) => {
    if (!images) return null;
    const imageArray = Array.isArray(images) ? images : [];
    return imageArray[0] || null;
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/admin-dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <h1 className="text-3xl font-bold">Car Management</h1>
          </div>
          <Button onClick={() => navigate("/admin/cars/add")} className="gap-2">
            <Plus className="h-5 w-5" />
            Add New Car
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/rentals")}>
            Manage Rentals
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/trade-ins")}>
            Manage Trade-Ins
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cars.map((car) => (
          <Card key={car.id} className="glass-strong overflow-hidden">
            <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 relative">
              {getImageUrl(car.images) && (
                <img
                  src={getImageUrl(car.images)}
                  alt={`${car.make} ${car.model}`}
                  className="w-full h-full object-cover"
                />
              )}
              <Badge
                className={`absolute top-4 right-4 ${
                  car.status === "available"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {car.status === "available" ? "In Stock" : "Sold Out"}
              </Badge>
            </div>

            <CardHeader>
              <CardTitle className="text-xl">
                {car.make} {car.model}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Stock ID: {car.stock_id || "N/A"}
              </p>
            </CardHeader>

            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Year:</span>
                  <span className="font-medium">{car.year}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-medium">KSh {car.price?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mileage:</span>
                  <span className="font-medium">{car.mileage || "N/A"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => toggleStatus(car.id, car.status)}
                  >
                    Toggle Status
                  </Button>
                  <Button
                    size="sm"
                    variant={car.is_featured ? "default" : "outline"}
                    onClick={() => toggleFeatured(car.id, car.is_featured)}
                    title="Mark as Featured"
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate(`/admin/cars/edit/${car.id}`)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteCar(car.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CarManagement;
