import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronLeft, ChevronRight, Phone, Mail, MessageCircle,
  ArrowLeft, Download, ShieldCheck, Globe, Trophy,
  Activity, ArrowUpRight, Gauge, Fuel, Settings,
  Zap, Calendar, Car, Wallet, Info, CheckCircle,
  Share2, ArrowRight
} from "lucide-react";
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
  const [recommendedCars, setRecommendedCars] = useState<Car[]>([]);

  useEffect(() => {
    fetchCarDetails();
  }, [id]);

  useEffect(() => {
    if (car?.id) {
      trackVehicleView(car.id, user?.id);
    }
  }, [car?.id, user?.id]);

  const fetchCarDetails = async () => {
    try {
      setLoading(true);
      let query = supabase.from("cars").select("*");
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

      const { data: similar } = await supabase
        .from("cars")
        .select("*")
        .eq("make", data.make)
        .neq("id", data.id)
        .eq("status", "available")
        .limit(4);

      setSimilarCars(similar || []);

      const { data: recommended } = await supabase
        .from("cars")
        .select("*")
        .neq("make", data.make)
        .eq("status", "available")
        .limit(4);

      setRecommendedCars(recommended || []);
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
    if (car?.main_images) {
      if (Array.isArray(car.main_images) && car.main_images.length > 0) return car.main_images;
      if (typeof car.main_images === 'string') {
        try {
          const parsed = JSON.parse(car.main_images);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
    }
    if (car?.images) {
      if (Array.isArray(car.images)) return car.images;
      if (typeof car.images === "string") {
        try { return JSON.parse(car.images); } catch { return [car.images]; }
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
      toast({ title: "Image Downloaded", description: "Image saved with Justice Ultimate Automobiles watermark" });
    } catch (error) {
      toast({ title: "Download Failed", description: "Could not download image. Please try again.", variant: "destructive" });
    }
  };

  if (loading) return <LoadingScreen />;
  if (!car) return null;

  const images = getImages(car);
  const currentImage = images[currentImageIndex] || "/placeholder.svg";

  return (
    <div className="min-h-screen bg-background selection:bg-brand-red selection:text-white font-sans antialiased overflow-x-hidden">
      {/* HUD-Style Layout Overlays */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,hsl(var(--primary)/0.1),transparent_70%)]" />
        <div className="absolute inset-0 opacity-[0.015] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>

      {/* Header Info Bar */}
      <div className="relative z-10 bg-secondary/10 border-b border-border py-4">
        <div className="container mx-auto px-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/catalogue")}
              className="h-10 px-4 border-border hover:border-brand-red/50 text-[10px] font-black uppercase tracking-[0.2em] rounded-sm bg-background/50"
            >
              <ArrowLeft className="mr-2 h-3 w-3" />
              Catalogue
            </Button>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-white/40">{car.make}</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-brand-red">{car.model}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <Badge className="bg-brand-red/10 text-brand-red border border-brand-red/30 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-none">
                Asset ID: {car.stock_id || car.id.slice(0, 8)}
             </Badge>
             <Button variant="outline" size="sm" className="h-8 border-border text-[9px] font-black uppercase tracking-widest px-3 rounded-none">
                <Share2 className="mr-2 h-3 w-3" /> Share
             </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* LEFT: Image Gallery (Span 7) */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-border bg-black/40 p-1 overflow-hidden relative group rounded-md shadow-2xl">
              <div className="relative aspect-[16/10] overflow-hidden rounded-sm">
                <img
                  src={currentImage}
                  alt={`${car.make} ${car.model}`}
                  className="h-full w-full object-cover transition-all duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                {/* Image Nav Buttons */}
                {images.length > 1 && (
                  <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-full border-white/20 bg-black/40 text-white backdrop-blur-md hover:bg-brand-red hover:border-brand-red pointer-events-auto transition-all duration-300"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 rounded-full border-white/20 bg-black/40 text-white backdrop-blur-md hover:bg-brand-red hover:border-brand-red pointer-events-auto transition-all duration-300"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </div>
                )}

                {/* Status Badges */}
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                   {car.status === "available" && car.units_available && car.units_available > 1 ? (
                     <Badge className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-none py-1.5 px-4 border-none shadow-xl">
                        Available ({car.units_available})
                     </Badge>
                   ) : (
                     <Badge className="bg-brand-red text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-none py-1.5 px-4 border-none shadow-xl">
                        Verified Unit
                     </Badge>
                   )}
                   <Badge className="bg-white/10 text-white backdrop-blur-md border border-white/20 text-[9px] font-bold uppercase tracking-[0.1em] rounded-none py-1 px-3">
                      High Definition Asset
                   </Badge>
                </div>

                {/* Index Counter */}
                {images.length > 0 && (
                  <div className="absolute bottom-6 right-6 flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 border-white/20 bg-black/40 text-white backdrop-blur-md hover:bg-brand-red hover:border-brand-red transition-all rounded-sm"
                      onClick={handleDownloadImage}
                      title="Download technical asset image"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <div className="h-10 px-4 bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-black text-white flex items-center gap-2 rounded-sm tracking-[0.2em]">
                      <span className="text-brand-red">{currentImageIndex + 1}</span>
                      <span className="opacity-40">/</span>
                      <span>{images.length}</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Thumbnail Strip - Professional Grid */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative aspect-square overflow-hidden rounded-sm border transition-all duration-300 group ${
                      idx === currentImageIndex
                        ? "border-brand-red ring-1 ring-brand-red scale-95"
                        : "border-border opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt={`View ${idx + 1}`} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                    {idx === currentImageIndex && (
                       <div className="absolute inset-0 bg-brand-red/10" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Asset Audit Details - Specifications Grid */}
            <div className="space-y-6 pt-6">
               <div className="flex items-center gap-4">
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-brand-red/50 to-transparent" />
                  <h2 className="text-[10px] font-black uppercase tracking-[0.6em] text-brand-red">Technical Specifications</h2>
                  <div className="h-0.5 flex-1 bg-gradient-to-l from-brand-red/50 to-transparent" />
               </div>

               <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border border border-border overflow-hidden rounded-md shadow-xl">
                  {[
                    { label: "Manufacturer", val: car.make, icon: Car },
                    { label: "Model Code", val: car.model, icon: Zap },
                    { label: "Production Year", val: car.year, icon: Calendar },
                    { label: "Log Mileage", val: car.mileage || "0 KM", icon: Gauge },
                    { label: "Fuel System", val: car.fuel_type || "Petrol", icon: Fuel },
                    { label: "Transmission", val: car.transmission || "Automatic", icon: Settings },
                    { label: "Power Unit", val: car.engine || "N/A", icon: Activity },
                    { label: "Drivetrain", val: car.drive_type || "AWD", icon: Globe },
                    { label: "Exterior Finish", val: car.color || "Standard", icon: Info },
                  ].map((spec, i) => (
                    <div key={i} className="bg-background p-6 group hover:bg-secondary/5 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{spec.label}</p>
                        <spec.icon className="h-3.5 w-3.5 text-brand-red/50 group-hover:text-brand-red transition-colors" />
                      </div>
                      <p className="text-xs font-black text-white uppercase tracking-tight truncate">{spec.val}</p>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* RIGHT: Transaction Desk (Span 5) */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-red">Active Strategic Asset</p>
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white uppercase leading-[0.9]">
                   {car.make} <br />
                   <span className="text-white/60">{car.model}</span>
                </h1>
              </div>

              <div className="bg-secondary/10 border border-border p-8 rounded-md relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4">
                    <Trophy className="h-8 w-8 text-brand-red/10 group-hover:text-brand-red/20 transition-all duration-700" />
                 </div>

                 {car.status === "available" && car.units_available && car.units_available > 1 && (
                   <div className="mb-4 flex items-center gap-2 text-emerald-500 bg-emerald-500/10 w-fit px-3 py-1 rounded-sm border border-emerald-500/20">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Available ({car.units_available}) units in stock</span>
                   </div>
                 )}

                 <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.4em] mb-2">Valuation Amount</p>
                 <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-black text-white tracking-tighter">KES {car.price.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-brand-red uppercase tracking-widest">* Verified</span>
                 </div>
                 <div className="mt-4 flex items-center gap-2">
                    <Activity className="h-3 w-3 text-brand-red animate-pulse" />
                    <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em]">Market Value Verified</span>
                 </div>
              </div>

              {/* Transaction Dispatch Buttons */}
              <div className="space-y-4">
                {user && car.status === "available" && (
                  <Button
                    className="w-full h-20 bg-brand-red hover:bg-brand-red/90 text-white font-black text-[13px] uppercase tracking-[0.4em] rounded-sm btn-signal shadow-2xl transition-all"
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
                        toast({ title: "✅ PROTOCOL INITIATED", description: "Order successfully submitted to the dispatch center." });
                        navigate("/my-orders");
                      } catch (err: any) {
                        toast({ title: "System Error", description: err.message, variant: "destructive" });
                      }
                    }}
                  >
                    <span className="flex items-center gap-3">
                       <Zap className="h-5 w-5 fill-current" />
                       Initialize Asset Acquisition
                    </span>
                  </Button>
                )}

                <div className="grid grid-cols-2 gap-4">
                   <Button
                      variant="outline"
                      className="h-16 border-border hover:border-brand-red/40 bg-background text-[11px] font-black uppercase tracking-[0.2em] rounded-sm transition-all"
                      onClick={() => navigate(`/compare?ids=${car.id}`)}
                    >
                      Compare Matrix
                   </Button>
                   <Button
                      variant="outline"
                      className="h-16 border-border hover:border-brand-red/40 bg-background text-[11px] font-black uppercase tracking-[0.2em] rounded-sm transition-all"
                      onClick={() => navigate("/trade-in")}
                    >
                      Asset Exchange
                   </Button>
                </div>
              </div>

              {/* Advisory Dispatch - Contact Grid */}
              <div className="space-y-4">
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 px-1">Technical Advisory Desk</p>
                 <div className="grid grid-cols-1 gap-3">
                    <a href={`https://wa.me/254722827458?text=${encodeURIComponent(`[ASSET QUERY] I'm interested in the ${car.year} ${car.make} ${car.model} (ID: ${car.stock_id})`)}`} target="_blank" rel="noopener noreferrer">
                      <Card className="bg-green-500/5 border-green-500/20 hover:bg-green-500 hover:border-green-500 transition-all group cursor-pointer p-4 rounded-sm">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              <MessageCircle className="h-5 w-5 text-green-500 group-hover:text-white transition-colors" />
                              <div>
                                 <p className="text-[10px] font-black text-white uppercase tracking-widest mb-0.5">Secure Dispatch</p>
                                 <p className="text-[9px] font-bold text-muted-foreground group-hover:text-white/80 uppercase tracking-tight">WhatsApp technical line</p>
                              </div>
                           </div>
                           <ArrowUpRight className="h-4 w-4 text-green-500 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                        </div>
                      </Card>
                    </a>

                    <div className="grid grid-cols-2 gap-3">
                       <a href="tel:+254722827458">
                         <Card className="bg-primary/5 border-border hover:bg-primary hover:border-primary transition-all group cursor-pointer p-4 rounded-sm h-full">
                            <div className="space-y-3">
                               <Phone className="h-5 w-5 text-primary group-hover:text-white" />
                               <div>
                                  <p className="text-[10px] font-black text-white uppercase tracking-widest mb-0.5">Voice Desk</p>
                                  <p className="text-[9px] font-bold text-muted-foreground group-hover:text-white/80 uppercase tracking-tight">Direct Comms</p>
                               </div>
                            </div>
                         </Card>
                       </a>
                       <a href="mailto:support@justiceultimateautomobiles.com">
                         <Card className="bg-primary/5 border-border hover:bg-primary hover:border-primary transition-all group cursor-pointer p-4 rounded-sm h-full">
                            <div className="space-y-3">
                               <Mail className="h-5 w-5 text-primary group-hover:text-white" />
                               <div>
                                  <p className="text-[10px] font-black text-white uppercase tracking-widest mb-0.5">Formal Query</p>
                                  <p className="text-[9px] font-bold text-muted-foreground group-hover:text-white/80 uppercase tracking-tight">Email Support</p>
                               </div>
                            </div>
                         </Card>
                       </a>
                    </div>
                 </div>
                 <div className="flex items-center justify-center gap-2 pt-2">
                    <Activity className="h-3 w-3 text-brand-red animate-pulse" />
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">Technical Agents Online: Active Now</span>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Narrative & Colors Section */}
        <div className="mt-24 space-y-16">
          <div className="grid lg:grid-cols-12 gap-12">
             <div className="lg:col-span-8 space-y-8">
                <div className="space-y-4">
                   <div className="flex items-center gap-4">
                      <h2 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase">Executive Overview</h2>
                      <div className="h-1 flex-1 bg-brand-red/20" />
                   </div>
                   {car.description ? (
                      <div className="bg-secondary/5 border-l-4 border-brand-red p-8 rounded-r-md">
                         <p className="text-[11px] md:text-xs text-white/80 leading-relaxed font-bold uppercase tracking-[0.05em] whitespace-pre-line">
                            {car.description}
                         </p>
                      </div>
                   ) : (
                      <div className="bg-secondary/5 p-8 rounded-md border border-border">
                         <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest italic">Official asset description pending technical upload.</p>
                      </div>
                   )}
                </div>

                {/* Available Variants */}
                {car.available_colors && car.available_colors.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                       <h3 className="text-lg font-black tracking-tight text-white uppercase">Operational Variants</h3>
                       <div className="h-1 flex-1 bg-brand-red/20" />
                    </div>
                    <Card className="bg-background border-border p-8 rounded-md">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mb-6">Inventory Matrix: Alternative Finishes</p>
                      <ColorDisplay colors={car.available_colors} />
                    </Card>
                  </div>
                )}
             </div>

             <div className="lg:col-span-4">
                <Card className="bg-card border-border p-8 space-y-8 rounded-md shadow-2xl">
                   <div className="text-center space-y-2">
                      <p className="text-[10px] font-black text-brand-red uppercase tracking-[0.4em]">Asset Protection</p>
                      <h4 className="text-lg font-black text-white uppercase tracking-tight">Verified Logistics</h4>
                   </div>

                   <div className="space-y-6">
                      {[
                        { icon: ShieldCheck, title: "7-Day Verification", desc: "Mechanical audit period" },
                        { icon: Globe, title: "Direct Sourcing", desc: "No middle-man overheads" },
                        { icon: Wallet, title: "90% Funding", desc: "Tier-1 bank integration" },
                      ].map((item, i) => (
                        <div key={i} className="flex gap-4 items-start group">
                           <div className="h-10 w-10 bg-primary/10 border border-primary/20 flex items-center justify-center rounded-sm group-hover:bg-brand-red transition-colors">
                              <item.icon className="h-5 w-5 text-primary group-hover:text-white" />
                           </div>
                           <div>
                              <p className="text-[11px] font-black text-white uppercase tracking-widest mb-1">{item.title}</p>
                              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">{item.desc}</p>
                           </div>
                        </div>
                      ))}
                   </div>

                   <Button variant="outline" className="w-full border-border text-[9px] font-black uppercase tracking-[0.3em] h-12 rounded-sm" onClick={() => navigate("/asset-finance")}>
                      View Funding Deck
                   </Button>
                </Card>
             </div>
          </div>
        </div>

        {/* Customer Intelligence (Reviews) */}
        <div className="mt-24">
           <div className="flex flex-col items-center gap-4 mb-16 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.6em] text-brand-red">Operational Feedback</p>
              <h2 className="text-xl md:text-3xl font-black tracking-tighter text-white uppercase leading-none">Client Intelligence</h2>
              <div className="h-1 w-20 bg-brand-red mt-2" />
           </div>
           <Card className="bg-black/20 border-border p-8 rounded-md overflow-hidden">
              <ReviewsSection carId={car.id} carName={`${car.make} ${car.model}`} />
           </Card>
        </div>

        {/* Analytics Engine */}
        <div className="mt-24">
           <div className="flex flex-col items-center gap-4 mb-12 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.6em] text-brand-red">Market Dynamics</p>
              <h2 className="text-xl md:text-3xl font-black tracking-tighter text-white uppercase leading-none">Asset Engagement</h2>
              <div className="h-1 w-20 bg-brand-red mt-2" />
           </div>
           <Card className="bg-background border-border p-8 rounded-md shadow-2xl">
              <VehicleAnalyticsChart carId={car.id} />
           </Card>
        </div>

        {/* Similar Assets - Strategic Grid */}
        {similarCars.length > 0 && (
          <div className="mt-24">
            <div className="flex flex-col items-center gap-4 mb-16 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.6em] text-brand-red">Comparative Units</p>
              <h2 className="text-xl md:text-3xl font-black tracking-tighter text-white uppercase leading-none">Similar {car.make} Units</h2>
              <div className="h-1 w-20 bg-brand-red mt-2" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {similarCars.map((similarCar) => {
                const images = getImages(similarCar);
                return (
                  <Card
                    key={similarCar.id}
                    className="group relative bg-background border-border hover:border-brand-red/40 transition-all duration-300 cursor-pointer flex flex-col h-full hover:shadow-2xl overflow-hidden rounded-md"
                    onClick={() => {
                      navigate(`/car/${similarCar.id}`);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <div className="aspect-[16/10] overflow-hidden relative">
                      <img src={images[0] || "/placeholder.svg"} alt={similarCar.model} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                      <div className="absolute top-3 right-3">
                         <Badge className="bg-brand-red text-white text-[8px] font-black uppercase rounded-sm py-1 px-2 border-none">Available</Badge>
                      </div>
                    </div>

                    <CardContent className="p-5 flex flex-col flex-1">
                      <div className="mb-4">
                        <div className="flex justify-between items-start gap-2">
                           <h3 className="text-xs font-black uppercase tracking-widest text-white group-hover:text-brand-red transition-colors line-clamp-1">{similarCar.make} {similarCar.model}</h3>
                           <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-brand-red group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                        </div>
                        <p className="text-base font-black text-white tracking-tighter mt-1">KSh {similarCar.price.toLocaleString()}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 border-y border-border py-3 mb-4">
                        <div className="text-center space-y-1">
                          <p className="text-[8px] font-black text-muted-foreground uppercase">Model</p>
                          <p className="text-[10px] font-black text-white">{similarCar.year}</p>
                        </div>
                        <div className="text-center border-x border-border space-y-1">
                          <p className="text-[8px] font-black text-muted-foreground uppercase px-1">Drive</p>
                          <p className="text-[10px] font-black text-white uppercase">{similarCar.transmission?.slice(0, 3) || 'AWD'}</p>
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-[8px] font-black text-muted-foreground uppercase">Fuel</p>
                          <p className="text-[10px] font-black text-white uppercase">{similarCar.fuel_type?.slice(0, 3) || 'PET'}</p>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                           <div className="h-full bg-brand-red w-full scale-x-[0.2] group-hover:scale-x-100 transition-transform origin-left duration-700" />
                        </div>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase mt-2 tracking-widest group-hover:text-white transition-colors">Verification Active</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Recommended Assets - strategic discovery */}
        {recommendedCars.length > 0 && (
          <div className="mt-24">
            <div className="flex flex-col items-center gap-4 mb-16 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.6em] text-brand-red">Market Discovery</p>
              <h2 className="text-xl md:text-3xl font-black tracking-tighter text-white uppercase leading-none">You May Also Like</h2>
              <div className="h-1 w-20 bg-brand-red mt-2" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recommendedCars.map((recCar) => {
                const images = getImages(recCar);
                return (
                  <Card
                    key={recCar.id}
                    className="group relative bg-background border-border hover:border-brand-red/40 transition-all duration-300 cursor-pointer flex flex-col h-full hover:shadow-2xl overflow-hidden rounded-md"
                    onClick={() => {
                      navigate(`/car/${recCar.id}`);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <div className="aspect-[16/10] overflow-hidden relative">
                      <img src={images[0] || "/placeholder.svg"} alt={recCar.model} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                      <div className="absolute top-3 right-3">
                         <Badge className="bg-brand-red text-white text-[8px] font-black uppercase rounded-sm py-1 px-2 border-none">Available</Badge>
                      </div>
                    </div>

                    <CardContent className="p-5 flex flex-col flex-1">
                      <div className="mb-4">
                        <div className="flex justify-between items-start gap-2">
                           <h3 className="text-xs font-black uppercase tracking-widest text-white group-hover:text-brand-red transition-colors line-clamp-1">{recCar.make} {recCar.model}</h3>
                           <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-brand-red group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                        </div>
                        <p className="text-base font-black text-white tracking-tighter mt-1">KSh {recCar.price.toLocaleString()}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 border-y border-border py-3 mb-4">
                        <div className="text-center space-y-1">
                          <p className="text-[8px] font-black text-muted-foreground uppercase">Model</p>
                          <p className="text-[10px] font-black text-white">{recCar.year}</p>
                        </div>
                        <div className="text-center border-x border-border space-y-1">
                          <p className="text-[8px] font-black text-muted-foreground uppercase px-1">Drive</p>
                          <p className="text-[10px] font-black text-white uppercase">{recCar.transmission?.slice(0, 3) || 'AWD'}</p>
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-[8px] font-black text-muted-foreground uppercase">Fuel</p>
                          <p className="text-[10px] font-black text-white uppercase">{recCar.fuel_type?.slice(0, 3) || 'PET'}</p>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                           <div className="h-full bg-brand-red w-full scale-x-[0.2] group-hover:scale-x-100 transition-transform origin-left duration-700" />
                        </div>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase mt-2 tracking-widest group-hover:text-white transition-colors">Verification Active</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-24 text-center">
          <Button
             variant="outline"
             onClick={() => navigate("/catalogue")}
             className="border-border text-white font-black text-[10px] uppercase tracking-[0.4em] h-14 px-12 rounded-md hover:bg-white hover:text-primary transition-all"
          >
             Full Operations Ledger <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CarDetails;
