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
import { ArrowLeft, Car, ShieldCheck, Globe, Navigation, ChevronRight, Clock, Gauge, Activity, Zap, ArrowRight, ExternalLink } from "lucide-react";
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
  const [car, setCar] = useState<RentalCar | null>(null);

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

  if (loading) return <LoadingScreen />;
  if (!car) return <div>Car not found</div>;

  const allImages = [...(car.main_images || []), ...(car.additional_images || [])];

  return (
    <div className="min-h-screen bg-background selection:bg-brand-red selection:text-white font-sans antialiased overflow-x-hidden pb-20">
      {/* Background Overlays */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,hsl(var(--primary)/0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>

      {/* Professional Marquee - Institutional Branding */}
      <div className="bg-primary/80 backdrop-blur-md text-white py-2 overflow-hidden border-b border-white/5 relative z-30 shadow-2xl">
        <div className="flex whitespace-nowrap animate-marquee-professional">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center shrink-0">
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <ShieldCheck className="h-3 w-3 text-brand-red" />
                Asset Inspection
              </span>
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <Globe className="h-3 w-3 text-brand-red" />
                Logistics Audit
              </span>
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <Clock className="h-3 w-3 text-brand-red" />
                Real-time Deployment
              </span>
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <ShieldCheck className="h-3 w-3 text-brand-red" />
                Unit Verification
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marquee-professional {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-professional {
          animation: marquee-professional 40s linear infinite;
        }
        @keyframes arrow-move-horizontal {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(8px); }
        }
        .animate-arrow-move {
          animation: arrow-move-horizontal 1.5s infinite ease-in-out;
        }
      `}</style>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <Button onClick={() => navigate(-1)} variant="ghost" className="text-[10px] font-black uppercase tracking-widest hover:bg-secondary">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Logistics Hub
          </Button>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/catalogue")}
              className="text-[10px] font-black uppercase tracking-widest h-10 px-6 border-border hover:bg-secondary"
            >
              Inventory Hub
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/trade-in")}
              className="text-[10px] font-black uppercase tracking-widest h-10 px-6 border-border hover:bg-secondary"
            >
              Trade-In Portal
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
          {/* Car Images & Specs */}
          <div className="space-y-8">
            <div className="glass-strong p-4 rounded-xl border border-border shadow-2xl overflow-hidden group">
              {allImages.length > 0 ? (
                <Carousel className="w-full">
                  <CarouselContent>
                    {allImages.map((image, index) => (
                      <CarouselItem key={index}>
                        <div className="aspect-video relative overflow-hidden rounded-lg">
                          <img
                            src={image}
                            alt={`${car.name} - Asset Image ${index + 1}`}
                            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-4" />
                  <CarouselNext className="right-4" />
                </Carousel>
              ) : (
                <div className="aspect-video bg-secondary/20 rounded-lg flex items-center justify-center border border-dashed border-border">
                  <Car className="h-24 w-24 text-muted-foreground opacity-20" />
                </div>
              )}
            </div>

            {/* Asset Description */}
            <Card className="glass-strong border-border shadow-xl">
              <CardHeader className="border-b border-border/50">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em]">Asset Specifications</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div>
                  <h2 className="text-3xl font-black tracking-tighter uppercase italic text-foreground mb-4">
                    {car.name} <span className="text-brand-red ml-2">[{car.year}]</span>
                  </h2>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed font-bold uppercase tracking-widest border-l-4 border-brand-red pl-6">
                    {car.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-4">
                  {[
                    { label: "Manufacturer", val: car.make, icon: ShieldCheck },
                    { label: "Series", val: car.model, icon: Globe },
                    { label: "Odometer", val: car.mileage || "N/A", icon: Gauge },
                    { label: "Transmission", val: car.transmission || "N/A", icon: Activity },
                    { label: "Fuel System", val: car.fuel_type || "N/A", icon: Zap },
                    { label: "Exterior", val: car.color || "N/A", icon: Navigation }
                  ].map((spec, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <spec.icon className="h-3.5 w-3.5 text-brand-red" />
                        <p className="text-[8px] font-black uppercase tracking-widest">{spec.label}</p>
                      </div>
                      <p className="text-[11px] font-black uppercase tracking-tight text-foreground">{spec.val}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-8 border-t border-border/50">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Hourly Rate</p>
                      <p className="text-2xl font-black text-foreground tracking-tighter">
                        KES {car.price_per_hour.toLocaleString()}
                      </p>
                    </div>
                    {car.price_per_day && (
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest">Daily Rate</p>
                        <p className="text-2xl font-black text-primary tracking-tighter">
                          KES {car.price_per_day.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Terminal */}
          <div className="lg:sticky lg:top-24 h-fit">
            <Card className="glass-strong border-border shadow-2xl overflow-hidden relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--brand-red)/0.05),transparent_50%)]" />
              <CardHeader className="bg-primary/5 border-b border-border/50 p-8">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded bg-brand-red/10 flex items-center justify-center">
                    <ExternalLink className="h-5 w-5 text-brand-red" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-black uppercase tracking-widest">Logistics Portal</CardTitle>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Institutional Dispatch Access</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8 relative z-10">
                <div className="space-y-6">
                  <div className="p-6 rounded-lg bg-secondary/5 border border-border/50 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                       <Clock className="h-3.5 w-3.5 text-brand-red" />
                       Operational Status: Available
                    </h4>
                    <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase tracking-wider">
                       To initiate a professional reservation or inquire about technical fleet logistics, please transition to our specialized corporate logistics terminal.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button
                    className="w-full h-16 bg-brand-red hover:bg-brand-red/90 text-white font-black text-[11px] uppercase tracking-[0.3em] shadow-xl rounded-md group"
                    onClick={() => window.open("https://www.justicecorporatelogistics.co.ke", "_blank")}
                  >
                    Read More
                    <ArrowRight className="ml-3 h-5 w-5 animate-arrow-move" />
                  </Button>

                  <div className="pt-4 flex flex-col items-center gap-3">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.4em]">Official Connection</p>
                    <div className="flex gap-4">
                       <div className="h-1.5 w-1.5 bg-brand-red rounded-full animate-pulse" />
                       <div className="h-1.5 w-1.5 bg-brand-red rounded-full animate-pulse delay-75" />
                       <div className="h-1.5 w-1.5 bg-brand-red rounded-full animate-pulse delay-150" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 bg-secondary/5 border border-border p-6 rounded-lg text-center">
               <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                  Notice: All rentals are governed by the Justice Corporate Logistics standard framework and KeNHA regulatory standards.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentalCarDetails;