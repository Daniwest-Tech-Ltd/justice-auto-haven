import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import LoadingScreen from "@/components/LoadingScreen";
import { ArrowLeft, Car } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
  additional_images: string[];
  color: string;
  transmission: string;
  fuel_type: string;
  mileage: string;
}

const RentalCarDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [car, setCar] = useState<RentalCar | null>(null);
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    startDate: "",
    endDate: "",
    notes: "",
  });

  useEffect(() => {
    fetchCarDetails();
  }, [id]);

  const fetchCarDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("rental_cars")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setCar(data as RentalCar);
    } catch (error) {
      console.error("Error fetching car details:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load car details",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = () => {
    if (!car || !formData.startDate || !formData.endDate) return 0;

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

    if (diffDays >= 1 && car.price_per_day) {
      return diffDays * car.price_per_day;
    }
    return diffHours * car.price_per_hour;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication Required",
          description: "Please log in to book a rental",
        });
        navigate("/auth");
        return;
      }

      if (!car) throw new Error("Car data not loaded");

      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

      const { error: bookingError } = await supabase.from("rental_bookings").insert({
        rental_car_id: car.id,
        user_id: user.id,
        customer_name: formData.customerName,
        customer_email: formData.customerEmail,
        customer_phone: formData.customerPhone,
        start_date: formData.startDate,
        end_date: formData.endDate,
        hours: diffHours,
        days: diffDays,
        total_price: calculatePrice(),
        status: "pending",
        notes: formData.notes,
      });

      if (bookingError) throw bookingError;

      // Send notification email
      await supabase.functions.invoke("send-notifications", {
        body: {
          type: "rental",
          to: formData.customerEmail,
          data: {
            customerName: formData.customerName,
            carName: car.name,
            carMake: car.make,
            carModel: car.model,
            startDate: formData.startDate,
            endDate: formData.endDate,
            totalPrice: calculatePrice(),
          },
        },
      });

      toast({
        title: "Booking Submitted!",
        description: "Your rental booking has been submitted. We'll confirm shortly.",
      });

      navigate("/customer/bookings");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!car) return <div>Car not found</div>;

  const allImages = [...(car.main_images || []), ...(car.additional_images || [])];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <Button onClick={() => navigate(-1)} variant="ghost">
          <ArrowLeft className="mr-2" /> Back to Rentals
        </Button>
        
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Car Images */}
        <div>
          {allImages.length > 0 ? (
            <Carousel className="w-full">
              <CarouselContent>
                {allImages.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-video relative overflow-hidden rounded-lg">
                      <img
                        src={image}
                        alt={`${car.name} - Image ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          ) : (
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <Car className="h-24 w-24 text-muted-foreground" />
            </div>
          )}

          {/* Car Details */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Vehicle Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">{car.name}</h2>
                <p className="text-muted-foreground">{car.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Make</p>
                  <p className="font-semibold">{car.make}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Model</p>
                  <p className="font-semibold">{car.model}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Year</p>
                  <p className="font-semibold">{car.year}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Color</p>
                  <p className="font-semibold">{car.color || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transmission</p>
                  <p className="font-semibold">{car.transmission || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fuel Type</p>
                  <p className="font-semibold">{car.fuel_type || "N/A"}</p>
                </div>
                {car.mileage && (
                  <div>
                    <p className="text-sm text-muted-foreground">Mileage</p>
                    <p className="font-semibold">{car.mileage}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Per Hour</span>
                    <span className="text-2xl font-bold">
                      KES {car.price_per_hour.toLocaleString()}
                    </span>
                  </div>
                  {car.price_per_day && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Per Day</span>
                      <span className="text-2xl font-bold">
                        KES {car.price_per_day.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Book This Vehicle</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="customerName">Full Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) =>
                      setFormData({ ...formData, customerName: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="customerEmail">Email *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, customerEmail: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="customerPhone">Phone *</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, customerPhone: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="startDate">Start Date & Time *</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">End Date & Time *</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                {formData.startDate && formData.endDate && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Estimated Total</p>
                    <p className="text-2xl font-bold">
                      KES {calculatePrice().toLocaleString()}
                    </p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Booking Request"}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Your booking will be reviewed and confirmed by our team
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RentalCarDetails;