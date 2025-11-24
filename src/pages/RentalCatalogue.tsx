import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LoadingScreen from "@/components/LoadingScreen";
import { Car, Clock } from "lucide-react";

interface RentalCar {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  description: string;
  price_per_hour: number;
  price_per_day: number | null;
  main_images: string[];
  color: string;
  transmission: string;
  fuel_type: string;
  available: boolean;
}

const RentalCatalogue = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rentalCars, setRentalCars] = useState<RentalCar[]>([]);

  useEffect(() => {
    fetchRentalCars();
  }, []);

  const fetchRentalCars = async () => {
    try {
      const { data, error } = await supabase
        .from("rental_cars")
        .select("*")
        .eq("available", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRentalCars((data || []) as RentalCar[]);
    } catch (error) {
      console.error("Error fetching rental cars:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Car Rentals Kenya | Self-Drive & Chauffeur Services</h1>
          <p className="text-muted-foreground">Affordable car hire in Nairobi - Choose from our premium fleet</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/catalogue")}
            className="font-semibold"
          >
            CATALOGUE
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/trade-in-submission")}
            className="font-semibold"
          >
            TRADE IN
          </Button>
        </div>
      </div>

      {rentalCars.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Car className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No rental cars available at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rentalCars.map((car) => (
            <Card key={car.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video relative overflow-hidden bg-muted">
                {car.main_images && car.main_images.length > 0 ? (
                  <img
                    src={car.main_images[0]}
                    alt={car.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Car className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              <CardContent className="pt-4">
                <h3 className="text-xl font-semibold mb-2">{car.name}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {car.description || `${car.make} ${car.model} ${car.year}`}
                </p>

                <div className="flex flex-wrap gap-2 mb-3">
                  {car.color && <Badge variant="secondary">{car.color}</Badge>}
                  {car.transmission && <Badge variant="secondary">{car.transmission}</Badge>}
                  {car.fuel_type && <Badge variant="secondary">{car.fuel_type}</Badge>}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Per Hour</span>
                    <span className="text-lg font-bold">
                      KES {car.price_per_hour.toLocaleString()}
                    </span>
                  </div>
                  {car.price_per_day && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Per Day</span>
                      <span className="text-lg font-bold">
                        KES {car.price_per_day.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => navigate(`/rental/${car.id}`)}
                >
                  View Details & Book
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RentalCatalogue;