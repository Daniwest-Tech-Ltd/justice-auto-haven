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
    <div className="min-h-screen bg-slate-50 selection:bg-brand-red selection:text-white font-sans antialiased overflow-x-hidden text-slate-900">
      {/* Background Overlays - Subtle & Official */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(200,210,255,0.15),transparent_70%)]" />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>

      {/* Header Info Bar */}
      <div className="relative z-10 bg-white border-b border-slate-200 py-6 shadow-sm">
        <div className="container mx-auto px-4 flex flex-wrap justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/catalogue")}
              className="h-12 px-6 border-slate-200 hover:bg-slate-900 hover:text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Our Inventory
            </Button>
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-slate-300">{car.make}</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-brand-red">{car.model}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <Badge className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg shadow-lg border-none">
                Asset ID: {car.stock_id || car.id.slice(0, 8)}
             </Badge>
             <Button variant="outline" size="icon" className="h-10 w-10 border-slate-200 rounded-xl shadow-md hover:bg-slate-100">
                <Share2 className="h-4 w-4" />
             </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid gap-16 lg:grid-cols-12">
          {/* LEFT: Image Gallery (Span 7) */}
          <div className="lg:col-span-7 space-y-8">
            <Card className="border-slate-200 bg-white p-2 overflow-hidden relative group rounded-2xl shadow-2xl">
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-slate-50">
                <img
                  src={currentImage}
                  alt={`${car.make} ${car.model}`}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 animate-flash brightness-[0.98] group-hover:brightness-105"
                />
                <div className="absolute inset-0 glass-clear opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-40 group-hover:opacity-10 transition-opacity" />

                {/* Image Nav Buttons */}
                {images.length > 1 && (
                  <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-14 w-14 rounded-full border-none bg-white/90 text-slate-900 shadow-2xl hover:bg-brand-red hover:text-white pointer-events-auto transition-all duration-300 scale-90 group-hover:scale-100"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-7 w-7" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-14 w-14 rounded-full border-none bg-white/90 text-slate-900 shadow-2xl hover:bg-brand-red hover:text-white pointer-events-auto transition-all duration-300 scale-90 group-hover:scale-100"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-7 w-7" />
                    </Button>
                  </div>
                )}

                {/* Status Badges */}
                <div className="absolute top-6 left-6 flex flex-col gap-3">
                   {car.status === "available" && car.units_available && car.units_available > 1 ? (
                     <Badge className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-lg py-2 px-5 border-none shadow-2xl">
                        Available ({car.units_available})
                     </Badge>
                   ) : (
                     <Badge className="bg-brand-red text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-lg py-2 px-5 border-none shadow-2xl">
                        Verified Unit
                     </Badge>
                   )}
                   <Badge className="bg-slate-900/80 text-white backdrop-blur-md text-[9px] font-black uppercase tracking-widest rounded-lg py-1.5 px-4 shadow-xl border-none">
                      High-Fidelity Asset
                   </Badge>
                </div>

                {/* Index Counter */}
                {images.length > 0 && (
                  <div className="absolute bottom-6 right-6 flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 border-none bg-white/90 text-slate-900 shadow-2xl hover:bg-brand-red hover:text-white transition-all rounded-xl"
                      onClick={handleDownloadImage}
                    >
                      <Download className="h-5 w-5" />
                    </Button>
                    <div className="h-12 px-6 bg-slate-900/90 backdrop-blur-md text-[11px] font-black text-white flex items-center gap-3 rounded-xl tracking-widest shadow-2xl">
                      <span className="text-brand-red">{currentImageIndex + 1}</span>
                      <span className="opacity-30">/</span>
                      <span>{images.length}</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 px-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-all duration-500 ${
                      idx === currentImageIndex
                        ? "border-brand-red shadow-lg scale-95"
                        : "border-slate-100 opacity-60 hover:opacity-100 hover:border-slate-300"
                    }`}
                  >
                    <img src={img} alt={`View ${idx + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Technical Specifications Grid */}
            <div className="space-y-8 pt-8">
               <div className="flex items-center gap-6">
                  <h2 className="text-xs font-black uppercase tracking-[0.6em] text-brand-red whitespace-nowrap">Technical Matrix</h2>
                  <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full w-32 bg-brand-red rounded-full" />
                  </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {[
                    { label: "Manufacturer", val: car.make, icon: Car },
                    { label: "Model Code", val: car.model, icon: Zap },
                    { label: "Series Year", val: car.year, icon: Calendar },
                    { label: "Odometer", val: car.mileage || "0 KM", icon: Gauge },
                    { label: "Fuel System", val: car.fuel_type || "Petrol", icon: Fuel },
                    { label: "Transmission", val: car.transmission || "Automatic", icon: Settings },
                    { label: "Power Unit", val: car.engine || "N/A", icon: Activity },
                    { label: "Drivetrain", val: car.drive_type || "AWD", icon: Globe },
                    { label: "Finish", val: car.color || "Standard", icon: Info },
                  ].map((spec, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-brand-red/20 transition-all group">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-brand-red/5 transition-colors">
                           <spec.icon className="h-4 w-4 text-slate-400 group-hover:text-brand-red transition-colors" />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{spec.label}</p>
                      </div>
                      <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">{spec.val}</p>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* RIGHT: Transaction Desk (Span 5) */}
          <div className="lg:col-span-5 space-y-10">
            <div className="space-y-8">
              <div className="space-y-3">
                <p className="text-[11px] font-black uppercase tracking-[0.5em] text-brand-red">Active Operational Ledger</p>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 uppercase leading-[0.85] italic">
                   {car.make} <br />
                   <span className="text-slate-400">{car.model}</span>
                </h1>
              </div>

              <div className="bg-white border border-slate-200 p-10 rounded-3xl relative overflow-hidden group shadow-2xl">
                 <div className="absolute top-0 right-0 p-6">
                    <Trophy className="h-10 w-10 text-slate-100 group-hover:text-brand-red/10 transition-all duration-700" />
                 </div>

                 {car.status === "available" && car.units_available && car.units_available > 1 && (
                   <div className="mb-6 flex items-center gap-3 text-emerald-600 bg-emerald-50 w-fit px-4 py-2 rounded-xl border border-emerald-100 shadow-sm">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-[11px] font-black uppercase tracking-widest">Available ({car.units_available}) units in stock</span>
                   </div>
                 )}

                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-3">Valuation Amount</p>
                 <div className="flex items-baseline gap-4">
                    <span className="text-5xl font-black text-slate-900 tracking-tighter">KSh {car.price.toLocaleString()}</span>
                    <Badge className="bg-brand-red text-white text-[9px] font-black px-3 py-1 rounded-md shadow-lg">VERIFIED</Badge>
                 </div>
                 <div className="mt-6 flex items-center gap-3 border-t border-slate-50 pt-6">
                    <div className="h-2 w-2 rounded-full bg-brand-red animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Value Synchronization Active</span>
                 </div>
              </div>

              {/* Transaction Dispatch Buttons */}
              <div className="space-y-5">
                {user && car.status === "available" && (
                  <Button
                    className="w-full h-24 bg-slate-900 hover:bg-brand-red text-white font-black text-[14px] uppercase tracking-[0.4em] rounded-2xl shadow-2xl transition-all duration-500 group overflow-hidden relative"
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
                        toast({ title: "✅ ORDER PLACED", description: "Successfully submitted to the dispatch center." });
                        navigate("/my-orders");
                      } catch (err: any) {
                        toast({ title: "System Error", description: err.message, variant: "destructive" });
                      }
                    }}
                  >
                    <div className="absolute inset-0 bg-brand-red translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    <span className="flex items-center gap-4 relative z-10">
                       <Zap className="h-6 w-6 fill-current" />
                       Buy This Car Now
                    </span>
                  </Button>
                )}

                {!user && (
                   <Button
                      className="w-full h-20 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-[12px] uppercase tracking-[0.3em] rounded-2xl transition-all shadow-md"
                      onClick={() => navigate("/auth")}
                    >
                      Login to Purchase
                   </Button>
                )}

                <div className="grid grid-cols-2 gap-4">
                   <Button
                      variant="outline"
                      className="h-16 border-slate-200 hover:bg-slate-900 hover:text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-md"
                      onClick={() => navigate(`/compare?ids=${car.id}`)}
                    >
                      Compare Matrix
                   </Button>
                   <Button
                      variant="outline"
                      className="h-16 border-slate-200 hover:bg-slate-900 hover:text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-md"
                      onClick={() => navigate("/trade-in")}
                    >
                      Exchange Car
                   </Button>
                </div>
              </div>

              {/* Advisory Dispatch - Contact Grid */}
              <div className="space-y-6">
                 <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 px-2">Support & Assistance</p>
                 <div className="grid grid-cols-1 gap-4">
                    <a href={`https://wa.me/254722827458?text=${encodeURIComponent(`[CAR INQUIRY] Hello, I am interested in the ${car.year} ${car.make} ${car.model} (Stock ID: ${car.stock_id})`)}`} target="_blank" rel="noopener noreferrer">
                      <Card className="bg-white border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group cursor-pointer p-6 rounded-2xl shadow-md hover:shadow-xl">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-5">
                              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                 <MessageCircle className="h-6 w-6" />
                              </div>
                              <div>
                                 <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-0.5">Chat on WhatsApp</p>
                                 <p className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600 uppercase tracking-tight">Direct Technical Line</p>
                              </div>
                           </div>
                           <ArrowUpRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                        </div>
                      </Card>
                    </a>

                    <div className="grid grid-cols-2 gap-4">
                       <a href="tel:+254722827458">
                         <Card className="bg-white border-slate-200 hover:bg-slate-50 transition-all group cursor-pointer p-6 rounded-2xl h-full shadow-md">
                            <div className="space-y-4">
                               <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                  <Phone className="h-5 w-5" />
                               </div>
                               <div>
                                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-0.5">Call Us</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Speak to an Agent</p>
                               </div>
                            </div>
                         </Card>
                       </a>
                       <a href="mailto:support@justiceultimateautomobiles.com">
                         <Card className="bg-white border-slate-200 hover:bg-slate-50 transition-all group cursor-pointer p-6 rounded-2xl h-full shadow-md">
                            <div className="space-y-4">
                               <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                  <Mail className="h-5 w-5" />
                               </div>
                               <div>
                                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-0.5">Email Support</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Official Inquiries</p>
                               </div>
                            </div>
                         </Card>
                       </a>
                    </div>
                 </div>
                 <div className="flex items-center justify-center gap-3 pt-4">
                    <Activity className="h-4 w-4 text-brand-red animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Support Center: Active Now</span>
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
                      <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 uppercase">Executive Overview</h2>
                      <div className="h-1 flex-1 bg-brand-red/20" />
                   </div>
                   {car.description ? (
                      <div className="bg-white border-l-4 border-brand-red p-8 rounded-r-md shadow-sm">
                         <p className="text-[11px] md:text-xs text-slate-600 leading-relaxed font-bold uppercase tracking-[0.05em] whitespace-pre-line">
                            {car.description}
                         </p>
                      </div>
                   ) : (
                      <div className="bg-white p-8 rounded-md border border-slate-100">
                         <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest italic">Official asset description pending technical upload.</p>
                      </div>
                   )}
                </div>

                {/* Available Variants */}
                {car.available_colors && car.available_colors.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                       <h3 className="text-lg font-black tracking-tight text-slate-900 uppercase">Operational Variants</h3>
                       <div className="h-1 flex-1 bg-brand-red/20" />
                    </div>
                    <Card className="bg-white border-slate-100 p-8 rounded-2xl shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6">Inventory Matrix: Alternative Finishes</p>
                      <ColorDisplay colors={car.available_colors} />
                    </Card>
                  </div>
                )}
             </div>

             <div className="lg:col-span-4">
                <Card className="bg-white border-slate-200 p-8 space-y-8 rounded-3xl shadow-2xl">
                   <div className="text-center space-y-2">
                      <p className="text-[10px] font-black text-brand-red uppercase tracking-[0.4em]">Asset Protection</p>
                      <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Verified Logistics</h4>
                   </div>

                   <div className="space-y-6">
                      {[
                        { icon: ShieldCheck, title: "7-Day Verification", desc: "Mechanical audit period" },
                        { icon: Globe, title: "Direct Sourcing", desc: "No middle-man overheads" },
                        { icon: Wallet, title: "90% Funding", desc: "Tier-1 bank integration" },
                      ].map((item, i) => (
                        <div key={i} className="flex gap-4 items-start group">
                           <div className="h-10 w-10 bg-slate-50 border border-slate-100 flex items-center justify-center rounded-xl group-hover:bg-brand-red transition-all">
                              <item.icon className="h-5 w-5 text-slate-400 group-hover:text-white" />
                           </div>
                           <div>
                              <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1">{item.title}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{item.desc}</p>
                           </div>
                        </div>
                      ))}
                   </div>

                   <Button variant="outline" className="w-full border-slate-200 text-[10px] font-black uppercase tracking-[0.3em] h-14 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-md" onClick={() => navigate("/asset-finance")}>
                      View Funding Deck
                   </Button>
                </Card>
             </div>
          </div>
        </div>

        {/* Customer Intelligence (Reviews) */}
        <div className="mt-24">
           <div className="flex flex-col items-center gap-4 mb-16 text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.6em] text-brand-red">Operational Feedback</p>
              <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-slate-900 uppercase leading-none italic">Client Intelligence</h2>
              <div className="h-1.5 w-24 bg-brand-red mt-4 rounded-full" />
           </div>
           <Card className="bg-white border-slate-200 p-10 rounded-3xl shadow-xl overflow-hidden">
              <ReviewsSection carId={car.id} carName={`${car.make} ${car.model}`} />
           </Card>
        </div>

        {/* Analytics Engine */}
        <div className="mt-24">
           <div className="flex flex-col items-center gap-4 mb-12 text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.6em] text-brand-red">Market Dynamics</p>
              <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-slate-900 uppercase leading-none italic">Asset Engagement</h2>
              <div className="h-1.5 w-24 bg-brand-red mt-4 rounded-full" />
           </div>
           <Card className="bg-white border-slate-200 p-10 rounded-3xl shadow-2xl">
              <VehicleAnalyticsChart carId={car.id} />
           </Card>
        </div>

        {/* Similar Assets - Strategic Grid */}
        {similarCars.length > 0 && (
          <div className="mt-24">
            <div className="flex flex-col items-center gap-4 mb-16 text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.6em] text-brand-red">Comparative Units</p>
              <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-slate-900 uppercase leading-none italic">Similar {car.make} Units</h2>
              <div className="h-1.5 w-24 bg-brand-red mt-4 rounded-full" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {similarCars.map((similarCar) => {
                const images = getImages(similarCar);
                return (
                  <Card
                    key={similarCar.id}
                    className="group relative bg-white border-slate-200 hover:border-brand-red/40 transition-all duration-500 cursor-pointer flex flex-col h-full hover:shadow-2xl overflow-hidden rounded-2xl border-b-4 hover:border-b-brand-red"
                    onClick={() => {
                      navigate(`/car/${similarCar.id}`);
                      window.scrollTo({ top: 0, behavior: 'instant' });
                    }}
                  >
                    <div className="aspect-[16/10] overflow-hidden relative">
                      <img src={images[0] || "/placeholder.svg"} alt={similarCar.model} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-40 group-hover:opacity-10 transition-opacity" />
                      <div className="absolute top-4 right-4">
                         <Badge className="bg-brand-red text-white text-[9px] font-black uppercase rounded-md py-1.5 px-3 border-none shadow-lg tracking-widest">Available</Badge>
                      </div>
                    </div>

                    <CardContent className="p-6 flex flex-col flex-1">
                      <div className="mb-4">
                        <div className="flex justify-between items-start gap-2">
                           <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 group-hover:text-brand-red transition-colors line-clamp-1">{similarCar.make} {similarCar.model}</h3>
                           <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-brand-red group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                        </div>
                        <p className="text-lg font-black text-slate-900 tracking-tighter mt-1">KSh {similarCar.price.toLocaleString()}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-3 border-y border-slate-100 py-4 mb-4">
                        <div className="text-center space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase">Year</p>
                          <p className="text-[11px] font-black text-slate-700">{similarCar.year}</p>
                        </div>
                        <div className="text-center border-x border-slate-100 space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase px-1">Drive</p>
                          <p className="text-[11px] font-black text-slate-700 uppercase">{similarCar.transmission?.slice(0, 3) || 'AWD'}</p>
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase">Fuel</p>
                          <p className="text-[11px] font-black text-slate-700 uppercase">{similarCar.fuel_type?.slice(0, 3) || 'PET'}</p>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-brand-red w-full scale-x-[0.2] group-hover:scale-x-100 transition-transform origin-left duration-700" />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase mt-3 tracking-widest group-hover:text-slate-900 transition-colors">Verification Active</p>
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
              <p className="text-[11px] font-black uppercase tracking-[0.6em] text-brand-red">Market Discovery</p>
              <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-slate-900 uppercase leading-none italic">You May Also Like</h2>
              <div className="h-1.5 w-24 bg-brand-red mt-4 rounded-full" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {recommendedCars.map((recCar) => {
                const images = getImages(recCar);
                return (
                  <Card
                    key={recCar.id}
                    className="group relative bg-white border-slate-200 hover:border-brand-red/40 transition-all duration-500 cursor-pointer flex flex-col h-full hover:shadow-2xl overflow-hidden rounded-2xl border-b-4 hover:border-b-brand-red"
                    onClick={() => {
                      navigate(`/car/${recCar.id}`);
                      window.scrollTo({ top: 0, behavior: 'instant' });
                    }}
                  >
                    <div className="aspect-[16/10] overflow-hidden relative">
                      <img src={images[0] || "/placeholder.svg"} alt={recCar.model} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-40 group-hover:opacity-10 transition-opacity" />
                      <div className="absolute top-4 right-4">
                         <Badge className="bg-brand-red text-white text-[9px] font-black uppercase rounded-md py-1.5 px-3 border-none shadow-lg tracking-widest">Available</Badge>
                      </div>
                    </div>

                    <CardContent className="p-6 flex flex-col flex-1">
                      <div className="mb-4">
                        <div className="flex justify-between items-start gap-2">
                           <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 group-hover:text-brand-red transition-colors line-clamp-1">{recCar.make} {recCar.model}</h3>
                           <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-brand-red group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                        </div>
                        <p className="text-lg font-black text-slate-900 tracking-tighter mt-1">KSh {recCar.price.toLocaleString()}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-3 border-y border-slate-100 py-4 mb-4">
                        <div className="text-center space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase">Year</p>
                          <p className="text-[11px] font-black text-slate-700">{recCar.year}</p>
                        </div>
                        <div className="text-center border-x border-slate-100 space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase px-1">Drive</p>
                          <p className="text-[11px] font-black text-slate-700 uppercase">{recCar.transmission?.slice(0, 3) || 'AWD'}</p>
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase">Fuel</p>
                          <p className="text-[11px] font-black text-slate-700 uppercase">{recCar.fuel_type?.slice(0, 3) || 'PET'}</p>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-brand-red w-full scale-x-[0.2] group-hover:scale-x-100 transition-transform origin-left duration-700" />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase mt-3 tracking-widest group-hover:text-slate-900 transition-colors">Verification Active</p>
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
             className="border-slate-200 text-slate-900 font-black text-[11px] uppercase tracking-[0.4em] h-18 px-16 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-xl hover:shadow-2xl"
          >
             Full Operations Ledger <ArrowRight className="ml-3 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CarDetails;
