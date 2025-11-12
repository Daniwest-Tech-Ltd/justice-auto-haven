import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Trash2, Gauge, Settings as SettingsIcon, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LoadingScreen from "@/components/LoadingScreen";
import { OrderSubmissionModal } from "@/components/OrderSubmissionModal";

const Wishlist = () => {
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from("wishlist")
        .select(`
          id,
          created_at,
          cars (*)
        `)
        .order("created_at", { ascending: false });

      if (user) {
        query = query.eq("user_id", user.id);
      } else {
        // For non-logged in users, get wishlist from localStorage
        const localWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
        if (localWishlist.length > 0) {
          const { data: cars } = await supabase
            .from("cars")
            .select("*")
            .in("id", localWishlist);
          
          setWishlist(cars?.map(car => ({ id: car.id, cars: car })) || []);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setWishlist(data || []);
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

  const removeFromWishlist = async (carId: string, wishlistId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && wishlistId) {
        const { error } = await supabase
          .from("wishlist")
          .delete()
          .eq("id", wishlistId);

        if (error) throw error;
      } else {
        // Remove from localStorage for non-logged in users
        const localWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
        const updated = localWishlist.filter((id: string) => id !== carId);
        localStorage.setItem("wishlist", JSON.stringify(updated));
      }

      toast({
        title: "Success",
        description: "Removed from wishlist",
      });
      fetchWishlist();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getImages = (car: any): string[] => {
    // Try new image structure first
    if (car?.main_images) {
      if (Array.isArray(car.main_images) && car.main_images.length > 0) {
        return car.main_images;
      }
      if (typeof car.main_images === 'string') {
        try {
          const parsed = JSON.parse(car.main_images);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
    }

    // Fallback to old images field
    if (car?.images) {
      if (Array.isArray(car.images)) return car.images;
      if (typeof car.images === "string") {
        try {
          return JSON.parse(car.images);
        } catch {
          return [car.images];
        }
      }
    }
    return [];
  };

  const handlePlaceOrder = (car: any) => {
    setSelectedCar({
      id: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      price: car.price,
    });
    setOrderModalOpen(true);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
          <Heart className="h-8 w-8 text-primary" />
          My Wishlist
        </h1>
        <p className="text-muted-foreground">
          {wishlist.length} {wishlist.length === 1 ? "vehicle" : "vehicles"} saved
        </p>
      </div>

      {wishlist.length === 0 ? (
        <Card className="glass-strong">
          <CardContent className="p-12 text-center">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
            <p className="text-muted-foreground mb-6">
              Start adding vehicles you love to your wishlist
            </p>
            <Button onClick={() => navigate("/catalogue")}>
              Browse Catalogue
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item) => {
            const car = item.cars;
            if (!car) return null;
            
            const images = getImages(car);
            return (
              <Card key={item.id} className="glass-strong overflow-hidden group">
                <div className="relative aspect-[4/3]">
                  <img
                    src={images[0] || "/placeholder.svg"}
                    alt={`${car.make} ${car.model}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <Badge className="absolute top-2 left-2 bg-primary">
                    {car.year}
                  </Badge>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={() => removeFromWishlist(car.id, item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg mb-2">
                    {car.make} {car.model}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Gauge className="h-4 w-4" />
                      {car.mileage || "N/A"}
                    </span>
                    <span>•</span>
                    <span className="uppercase">{car.fuel_type || "N/A"}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <SettingsIcon className="h-4 w-4" />
                      {car.transmission || "N/A"}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-primary mb-3">
                    KSH {car.price.toLocaleString()}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handlePlaceOrder(car)}
                      className="flex-1"
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Place Order
                    </Button>
                    <Link to={`/car/${car.stock_id || car.id}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedCar && (
        <OrderSubmissionModal
          open={orderModalOpen}
          onOpenChange={setOrderModalOpen}
          car={selectedCar}
        />
      )}
    </div>
  );
};

export default Wishlist;
