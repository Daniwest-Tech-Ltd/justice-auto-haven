import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LoadingScreen from "@/components/LoadingScreen";

const Compare = () => {
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchCars();
  }, [searchParams]);

  const fetchCars = async () => {
    try {
      const carIds = searchParams.get("ids")?.split(",") || [];
      
      if (carIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .in("id", carIds);

      if (error) throw error;
      setCars(data || []);
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

  const removeCar = (carId: string) => {
    const currentIds = searchParams.get("ids")?.split(",") || [];
    const newIds = currentIds.filter(id => id !== carId);
    
    if (newIds.length === 0) {
      navigate("/catalogue");
    } else {
      navigate(`/compare?ids=${newIds.join(",")}`);
    }
  };

  const getImages = (images: any): string[] => {
    if (!images) return [];
    if (Array.isArray(images)) return images;
    if (typeof images === "string") {
      try {
        return JSON.parse(images);
      } catch {
        return [images];
      }
    }
    return [];
  };

  if (loading) return <LoadingScreen />;

  if (cars.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/catalogue")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Catalogue
        </Button>
        <Card className="glass-strong">
          <CardContent className="p-12 text-center">
            <h3 className="text-xl font-semibold mb-2">No cars to compare</h3>
            <p className="text-muted-foreground mb-6">
              Select cars from the catalogue to compare them
            </p>
            <Button onClick={() => navigate("/catalogue")}>
              Browse Catalogue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const specs = [
    { key: "make", label: "Make" },
    { key: "model", label: "Model" },
    { key: "year", label: "Year" },
    { key: "price", label: "Price", format: (v: number) => `KSH ${v.toLocaleString()}` },
    { key: "mileage", label: "Mileage" },
    { key: "fuel_type", label: "Fuel Type" },
    { key: "transmission", label: "Transmission" },
    { key: "engine", label: "Engine" },
    { key: "drive_type", label: "Drive Type" },
    { key: "color", label: "Color" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate("/catalogue")} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Catalogue
      </Button>

      <h1 className="text-4xl font-bold mb-8">Compare Vehicles</h1>

      <div className="overflow-x-auto">
        <div className="min-w-max">
          <div className="grid gap-6" style={{ gridTemplateColumns: `200px repeat(${cars.length}, 300px)` }}>
            {/* Header Row - Images */}
            <div></div>
            {cars.map((car) => {
              const images = getImages(car.images);
              return (
                <Card key={car.id} className="glass-strong relative">
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 z-10"
                    onClick={() => removeCar(car.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="aspect-[4/3] overflow-hidden rounded-t-lg">
                    <img
                      src={images[0] || "/placeholder.svg"}
                      alt={`${car.make} ${car.model}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Card>
              );
            })}

            {/* Specification Rows */}
            {specs.map((spec) => (
              <>
                <Card key={`label-${spec.key}`} className="glass-strong flex items-center justify-end p-4">
                  <p className="font-semibold text-sm">{spec.label}</p>
                </Card>
                {cars.map((car) => (
                  <Card key={`${car.id}-${spec.key}`} className="glass flex items-center p-4">
                    <p className="text-sm">
                      {spec.format 
                        ? spec.format(car[spec.key]) 
                        : car[spec.key] || "—"}
                    </p>
                  </Card>
                ))}
              </>
            ))}

            {/* Action Row */}
            <div></div>
            {cars.map((car) => (
              <Card key={`action-${car.id}`} className="glass-strong p-4">
                <Button
                  className="w-full"
                  onClick={() => navigate(`/car/${car.stock_id || car.id}`)}
                >
                  View Details
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compare;
