import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Car, Calendar, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LoadingScreen from "@/components/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";

interface Vehicle {
  id: string;
  sale_date: string;
  sale_price: number;
  payment_type: string;
  notes: string | null;
  cars: {
    id: string;
    make: string;
    model: string;
    year: number;
    color: string;
    mileage: string;
    main_images: any;
    stock_id: string;
  };
}

const CustomerVehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchVehicles();
    }
  }, [user]);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          id,
          sale_date,
          sale_price,
          payment_type,
          notes,
          cars (*)
        `)
        .eq("customer_id", user?.id)
        .order("sale_date", { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
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

  const getImages = (car: any): string[] => {
    if (car?.main_images) {
      if (Array.isArray(car.main_images)) return car.main_images;
      if (typeof car.main_images === 'string') {
        try {
          const parsed = JSON.parse(car.main_images);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
    }
    return [];
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate("/customer-dashboard")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
          <Car className="h-8 w-8 text-primary" />
          My Vehicles
        </h1>
        <p className="text-muted-foreground">
          {vehicles.length} {vehicles.length === 1 ? "vehicle" : "vehicles"} purchased
        </p>
      </div>

      {vehicles.length === 0 ? (
        <Card className="glass-strong">
          <CardContent className="p-12 text-center">
            <Car className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No vehicles yet</h3>
            <p className="text-muted-foreground mb-6">
              You haven't purchased any vehicles from us
            </p>
            <Button onClick={() => navigate("/catalogue")}>
              Browse Catalogue
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => {
            const car = vehicle.cars;
            const images = getImages(car);
            
            return (
              <Card key={vehicle.id} className="glass-strong overflow-hidden group">
                <div className="relative aspect-[4/3]">
                  <img
                    src={images[0] || "/placeholder.svg"}
                    alt={`${car.make} ${car.model}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <Badge className="absolute top-2 left-2 bg-primary">
                    {car.year}
                  </Badge>
                </div>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-bold text-lg">
                    {car.make} {car.model}
                  </h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Purchase Price
                      </span>
                      <span className="font-semibold">
                        KSH {vehicle.sale_price.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Purchase Date
                      </span>
                      <span>
                        {new Date(vehicle.sale_date).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Payment Type</span>
                      <Badge variant="outline" className="capitalize">
                        {vehicle.payment_type}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Stock ID</span>
                      <span className="font-mono text-xs">{car.stock_id}</span>
                    </div>
                  </div>

                  {vehicle.notes && (
                    <div className="pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        <strong>Notes:</strong> {vehicle.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomerVehicles;
