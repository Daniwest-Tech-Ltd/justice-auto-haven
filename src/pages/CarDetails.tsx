import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Phone, Mail, MessageCircle, ArrowLeft, Download } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { useToast } from "@/hooks/use-toast";
import { ReviewsSection } from "@/components/ReviewsSection";
import { downloadImageWithWatermark } from "@/lib/watermark";
import { VehicleAnalyticsChart } from "@/components/VehicleAnalyticsChart";
import { trackVehicleView } from "@/hooks/useVehicleAnalytics";
import { useAuth } from "@/hooks/useAuth";
import { ColorDisplay } from "@/components/ColorSelector";

interface Car {
  id: string;
  stock_id: string | null;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: string | null;
  fuel_type: string | null;
  transmission: string | null;
  engine: string | null;
  drive_type: string | null;
  color: string | null;
  description: string | null;
  status: string | null;
  images: any;
  available_colors?: string[] | null;
  units_available?: number | null;
}

const CarDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [similarCars, setSimilarCars] = useState<Car[]>([]);

  useEffect(() => {
    fetchCarDetails();
  }, [id]);

  useEffect(() => {
    // Track vehicle view when page loads
    if (car?.id) {
      trackVehicleView(car.id, user?.id);
    }
  }, [car?.id, user?.id]);

  const fetchCarDetails = async () => {
    try {
      setLoading(true);
      
      // Try to fetch by stock_id first, then by UUID
      let query = supabase.from("cars").select("*");
      
      // Always try UUID first, fallback to stock_id
      const isUUID = id && id.length >= 32 && id.includes("-");
      if (isUUID) {
        query = query.eq("id", id);
      } else {
        query = query.eq("stock_id", id);
      }
      
      const { data: rows, error } = await query.limit(1);
      const data = rows && rows.length > 0 ? rows[0] : null;

      if (error) throw error;

      if (!data) {
        toast({
          title: "Car not found",
          description: "This vehicle is no longer available",
          variant: "destructive",
        });
        navigate("/catalogue");
        return;
      }

      setCar(data);

      // Fetch similar cars
      const { data: similar } = await supabase
        .from("cars")
        .select("*")
        .eq("make", data.make)
        .neq("id", data.id)
        .eq("status", "available")
        .limit(4);

      setSimilarCars(similar || []);
    } catch (error) {
      console.error("Error fetching car:", error);
      toast({
        title: "Error",
        description: "Failed to load car details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const nextImage = () => {
    const images = getImages(car);
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    const images = getImages(car);
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleDownloadImage = async () => {
    if (!car) return;
    
    const images = getImages(car);
    const currentImage = images[currentImageIndex];
    
    try {
      await downloadImageWithWatermark(
        currentImage,
        { make: car.make, model: car.model, year: car.year },
        `${car.stock_id || car.id}_image_${currentImageIndex + 1}.jpg`
      );
      
      toast({
        title: "Image Downloaded",
        description: "Image saved with Justice Ultimate Automobiles watermark",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download image. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!car) {
    return null;
  }

  const images = getImages(car);
  const currentImage = images[currentImageIndex] || "/placeholder.svg";

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-primary/10 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="hover:text-primary">Homepage</Link>
            <span>—</span>
            <Link to="/catalogue" className="hover:text-primary">Search</Link>
            <span>—</span>
            <span className="font-semibold">{car.make} {car.model}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Button
          variant="outline"
          onClick={() => navigate("/catalogue")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Catalogue
        </Button>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
              <img
                src={currentImage}
                alt={`${car.make} ${car.model}`}
                className="h-full w-full object-cover"
              />
              
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              {images.length > 0 && (
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute bottom-4 right-4"
                  onClick={handleDownloadImage}
                  title="Download image with watermark"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                  {currentImageIndex + 1} / {images.length}
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                      idx === currentImageIndex ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`View ${idx + 1}`}
                      className="h-20 w-20 object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Car Details */}
          <div className="space-y-6">
            <div>
              <h1 className="mb-2 text-4xl font-bold">{car.make} {car.model}</h1>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-semibold text-primary">
                  • • {car.year}
                </span>
                {car.status && (
                  car.status === "available" ? (
                    <Badge className="bg-green-600 hover:bg-green-600 text-white">
                      available{car.units_available && car.units_available > 0 ? ` (${car.units_available})` : ""}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">{car.status}</Badge>
                  )
                )}
              </div>
            </div>

            {car.status === "available" && car.units_available && car.units_available > 0 && (
              <div className="rounded-lg border border-green-600/40 bg-green-600/10 px-4 py-3 text-green-700 dark:text-green-400 font-semibold">
                ✓ Available ({car.units_available}) units in stock
              </div>
            )}

            <div className="text-3xl font-bold">
              Price: KES {car.price.toLocaleString()}
            </div>

            {/* Contact Buttons */}
            <div className="space-y-3">
              <a href="tel:+254722827458" className="block">
                <Button className="w-full bg-green-600 hover:bg-green-700" size="lg">
                  <Phone className="mr-2 h-5 w-5" />
                  +254 722 827 458
                </Button>
              </a>
              
              <a href="mailto:support@justiceultimateautomobiles.com" className="block">
                <Button variant="outline" className="w-full" size="lg">
                  <Mail className="mr-2 h-5 w-5" />
                  support@justiceultimateautomobiles.com
                </Button>
              </a>
              
              <a href={`https://wa.me/254722827458?text=${encodeURIComponent(`Hi, I'm interested in the ${car.year} ${car.make} ${car.model}`)}`} target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full bg-green-500 hover:bg-green-600" size="lg">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  WhatsApp
                </Button>
              </a>
              
              <a href={`sms:+254722827458?body=${encodeURIComponent(`Hi, I'm interested in the ${car.year} ${car.make} ${car.model}`)}`} className="block">
                <Button variant="outline" className="w-full" size="lg">
                  SMS
                </Button>
              </a>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
              {user && car.status === "available" && (
                <Button 
                  className="w-full col-span-2 bg-primary hover:bg-primary/90 text-lg h-12"
                  onClick={async () => {
                    try {
                      const { error } = await supabase.from("customer_orders").insert({
                        customer_id: user.id,
                        car_id: car.id,
                        car_make: car.make,
                        car_model: car.model,
                        car_year: car.year,
                        car_price: car.price,
                        car_color: car.color,
                        status: "order_placed"
                      });
                      if (error) throw error;
                      // Notify + email admins
                      supabase.functions.invoke("notify-admin-alert", {
                        body: {
                          kind: "order",
                          title: `New Order — ${car.year} ${car.make} ${car.model}`,
                          message: `A customer placed an order for the ${car.year} ${car.make} ${car.model}.`,
                          details: {
                            vehicle: `${car.year} ${car.make} ${car.model}`,
                            price: `KES ${Number(car.price).toLocaleString()}`,
                            color: car.color || "-",
                            customer_email: user.email || "-",
                            status: "order_placed",
                          },
                        },
                      }).catch(() => {});
                      // Log tracking
                      toast({ title: "✅ Order Placed!", description: "Your order has been submitted. Track it from My Orders." });
                      navigate("/my-orders");
                    } catch (err: any) {
                      toast({ title: "Error", description: err.message, variant: "destructive" });
                    }
                  }}
                >
                  🛒 Order This Car
                </Button>
              )}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate(`/compare?ids=${car.id}`)}
              >
                Compare
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/trade-in")}
              >
                Trade in
              </Button>
            </div>

            {car.stock_id && (
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">Stock ID</p>
                <p className="font-semibold">{car.stock_id}</p>
              </div>
            )}
          </div>
        </div>

        {/* Overview Section */}
        <div className="mt-12">
          <div className="rounded-lg bg-primary/10 p-8">
            <h2 className="mb-6 text-3xl font-bold">Overview</h2>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-muted-foreground">Make:</p>
                <p className="font-semibold">{car.make}</p>
              </div>
              
              <div>
                <p className="text-muted-foreground">Model:</p>
                <p className="font-semibold">{car.model}</p>
              </div>
              
              <div>
                <p className="text-muted-foreground">Year:</p>
                <p className="font-semibold">{car.year}</p>
              </div>
              
              <div>
                <p className="text-muted-foreground">Mileage:</p>
                <p className="font-semibold">{car.mileage || "—"}</p>
              </div>
              
              <div>
                <p className="text-muted-foreground">Engine:</p>
                <p className="font-semibold">{car.engine || "—"}</p>
              </div>
              
              <div>
                <p className="text-muted-foreground">Fuel Type:</p>
                <p className="font-semibold">{car.fuel_type || "—"}</p>
              </div>
              
              <div>
                <p className="text-muted-foreground">Transmission:</p>
                <p className="font-semibold">{car.transmission || "—"}</p>
              </div>
              
              <div>
                <p className="text-muted-foreground">Drive:</p>
                <p className="font-semibold">{car.drive_type || "—"}</p>
              </div>
              
              <div>
                <p className="text-muted-foreground">Color:</p>
                <p className="font-semibold">{car.color || "—"}</p>
              </div>
            </div>

            {car.description && (
              <div className="mt-6">
                <p className="text-muted-foreground">Description:</p>
                <p className="mt-2">{car.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Available Colors Section */}
        {car.available_colors && car.available_colors.length > 0 && (
          <div className="mt-8">
            <div className="rounded-lg bg-muted/50 p-6 border border-border">
              <h3 className="text-xl font-bold mb-4 text-primary">Also Available In</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This same car model is also available in the following colors:
              </p>
              <ColorDisplay colors={car.available_colors} />
            </div>
          </div>
        )}

        {/* Customer Reviews */}
        <ReviewsSection carId={car.id} carName={`${car.make} ${car.model}`} />

        {/* Vehicle Analytics */}
        <div className="mt-12">
          <VehicleAnalyticsChart carId={car.id} />
        </div>

        {/* Similar Vehicles */}
        {similarCars.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-6 text-3xl font-bold text-primary">Similar Vehicles from {car.make}</h2>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {similarCars.map((similarCar) => (
                <Link
                  key={similarCar.id}
                  to={`/car/${similarCar.id}`}
                  className="group overflow-hidden rounded-lg bg-primary/10 transition-transform hover:scale-105"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={getImages(similarCar)[0] || "/placeholder.svg"}
                      alt={`${similarCar.make} ${similarCar.model}`}
                      className="h-full w-full object-cover transition-transform group-hover:scale-110"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold">{similarCar.make} {similarCar.model}</h3>
                    <p className="text-sm text-muted-foreground">{similarCar.year}</p>
                    <p className="mt-2 font-semibold text-primary">
                      Ksh {similarCar.price.toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <Button onClick={() => navigate("/catalogue")} size="lg">
            Back to Catalogue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CarDetails;
