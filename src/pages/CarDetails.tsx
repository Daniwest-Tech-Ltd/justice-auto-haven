import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Phone, Mail, MessageCircle, ArrowLeft } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { useToast } from "@/hooks/use-toast";

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
}

const CarDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [similarCars, setSimilarCars] = useState<Car[]>([]);

  useEffect(() => {
    fetchCarDetails();
  }, [id]);

  const fetchCarDetails = async () => {
    try {
      setLoading(true);
      
      // Try to fetch by stock_id first, then by UUID
      let query = supabase.from("cars").select("*");
      
      // Check if id looks like a UUID or stock_id
      if (id?.includes("-") && id.length > 20) {
        query = query.eq("id", id);
      } else {
        query = query.eq("stock_id", id);
      }
      
      const { data, error } = await query.maybeSingle();

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

  const nextImage = () => {
    const images = getImages(car?.images);
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    const images = getImages(car?.images);
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!car) {
    return null;
  }

  const images = getImages(car.images);
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
                  <Badge variant={car.status === "available" ? "default" : "secondary"}>
                    {car.status}
                  </Badge>
                )}
              </div>
            </div>

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
              
              <a href="mailto:justicevincentt@gmail.com" className="block">
                <Button variant="outline" className="w-full" size="lg">
                  <Mail className="mr-2 h-5 w-5" />
                  justicevincentt@gmail.com
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

        {/* Similar Vehicles */}
        {similarCars.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-6 text-3xl font-bold text-primary">Similar Vehicles from {car.make}</h2>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {similarCars.map((similarCar) => (
                <Link
                  key={similarCar.id}
                  to={`/car/${similarCar.stock_id || similarCar.id}`}
                  className="group overflow-hidden rounded-lg bg-primary/10 transition-transform hover:scale-105"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={getImages(similarCar.images)[0] || "/placeholder.svg"}
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
