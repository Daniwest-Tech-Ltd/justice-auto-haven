import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LoadingScreen from "@/components/LoadingScreen";
import { Car, Clock, ShieldCheck, Globe, Navigation, ChevronRight, Zap, Activity, Gauge } from "lucide-react";
import { getCurrentSale } from "@/lib/currentSale";

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
  const sale = getCurrentSale();
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
    <div className="min-h-screen bg-background selection:bg-brand-red selection:text-white font-sans antialiased overflow-x-hidden pb-20">
      {/* Background Overlays */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,hsl(var(--primary)/0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>

      {/* Official Trust Bar */}
      <div className="bg-primary py-2 relative z-30 border-b border-white/5 shadow-2xl">
        <div className="container mx-auto px-4 flex justify-center items-center gap-10 whitespace-nowrap overflow-hidden">
          <span className="flex items-center gap-2 text-white/80 text-[10px] font-bold uppercase tracking-widest">
            <ShieldCheck className="h-3 w-3 text-brand-red" />
            Certified Logistics Fleet
          </span>
          <span className="flex items-center gap-2 text-white/80 text-[10px] font-bold uppercase tracking-widest">
            <Globe className="h-3 w-3 text-brand-red" />
            Nationwide Dispatch Availability
          </span>
        </div>
      </div>

      {/* Hero - Professional & Formal */}
      <section className="relative flex items-center justify-center border-b border-border bg-secondary/5 py-12">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-700">
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand-red">Operational Logistics Hub: {sale.year}</p>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground uppercase">
              Logistics & <span className="text-brand-red">Rental Hub.</span>
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
              Institutional-grade car hire solutions in Nairobi. Access our premium fleet for self-drive or professional chauffeur requirements. <br className="hidden md:block" /> Guaranteed unit reliability and 24/7 technical backup.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button size="sm" variant="outline" className="px-6 h-9 rounded-md border-border hover:bg-secondary text-[10px] font-bold uppercase tracking-wider" onClick={() => navigate("/catalogue")}>
                Catalogue Hub
              </Button>
              <Button size="sm" variant="outline" className="px-6 h-9 rounded-md border-border hover:bg-secondary text-[10px] font-bold uppercase tracking-wider" onClick={() => navigate("/trade-in")}>
                Trade-In Portal
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16 relative z-10">
        {rentalCars.length === 0 ? (
          <div className="bg-secondary/5 border border-dashed border-border rounded-xl p-20 text-center max-w-4xl mx-auto">
            <Car className="h-10 w-10 mx-auto mb-6 text-brand-red opacity-30" />
            <h3 className="text-xl font-bold tracking-tight uppercase mb-4 text-foreground">Fleet Currently Deployed</h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed mb-8 max-w-md mx-auto">
              Our active rental units are currently undergoing client logistics deployment. <br /> Inquire directly for incoming unit availability and reservation schedules.
            </p>
            <Button onClick={() => navigate("/contact")} className="bg-primary font-bold text-[10px] uppercase tracking-widest px-8 h-10 rounded-md">
              Establish Contact
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {rentalCars.map((car) => (
              <div key={car.id} className="group relative bg-background border border-border hover:border-brand-red/40 transition-all duration-300 cursor-pointer flex flex-col h-full hover:shadow-xl rounded-lg overflow-hidden">
                <div className="aspect-[16/10] overflow-hidden relative border-b border-border" onClick={() => navigate(`/rental/${car.id}`)}>
                  <img
                    src={car.main_images?.[0] || "/placeholder.svg"}
                    alt={car.name}
                    className="w-full h-full object-cover transition-transform duration-[1s] group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-brand-red text-white text-[7px] font-black uppercase rounded-sm py-1 px-2 tracking-widest border-none">
                      AVAILABLE
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-5 space-y-4 flex-1 flex flex-col">
                  <div className="space-y-1">
                    <h3 className="text-[11px] font-black uppercase tracking-tight truncate text-foreground/90 group-hover:text-brand-red transition-colors">{car.name}</h3>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">{car.make} {car.model} · {car.year}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-0.5 border-y border-border/50 py-3">
                    <div className="text-center space-y-1">
                      <Zap className="h-3 w-3 mx-auto text-primary/70" />
                      <p className="text-[8px] font-bold text-muted-foreground uppercase truncate">{car.fuel_type || 'PET'}</p>
                    </div>
                    <div className="text-center space-y-1 border-x border-border/50 px-1">
                      <Activity className="h-3 w-3 mx-auto text-primary/70" />
                      <p className="text-[8px] font-bold text-muted-foreground uppercase truncate">{car.transmission || 'MT'}</p>
                    </div>
                    <div className="text-center space-y-1">
                      <Gauge className="h-3 w-3 mx-auto text-primary/70" />
                      <p className="text-[8px] font-bold text-muted-foreground uppercase truncate">{car.color || 'BLK'}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      <span>Hourly Rate</span>
                      <span className="text-foreground font-black">KES {car.price_per_hour.toLocaleString()}</span>
                    </div>
                    {car.price_per_day && (
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-primary">
                        <span>Daily Rate</span>
                        <span className="font-black">KES {car.price_per_day.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="p-5 pt-0 mt-auto">
                  <Button
                    className="w-full h-10 rounded-md bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-widest"
                    onClick={() => navigate(`/rental/${car.id}`)}
                  >
                    Initialize Reservation <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </CardFooter>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Technical Logistics Sidebar Support */}
      <section className="container mx-auto px-4 pb-20">
        <div className="bg-background border border-border p-10 rounded-xl flex flex-col md:flex-row items-center justify-between gap-8 max-w-7xl mx-auto shadow-sm">
          <div className="space-y-2 text-center md:text-left">
            <h4 className="text-xl font-black tracking-tight uppercase italic flex items-center gap-3 justify-center md:justify-start">
               <ShieldCheck className="h-6 w-6 text-brand-red" />
               Corporate Logistics Desk
            </h4>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest max-w-lg">Technical fleet support operational 24/7. Direct nationwide dispatch from Nairobi hub within 3 hours of confirmation.</p>
          </div>
          <Button size="lg" className="rounded-md px-12 h-14 bg-brand-red hover:bg-brand-red/90 text-white font-black text-[11px] uppercase tracking-widest btn-signal shadow-xl" onClick={() => navigate("/contact")}>
             Establish Contact
          </Button>
        </div>
      </section>
    </div>
  );
};

export default RentalCatalogue;