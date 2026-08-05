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
  Share2, ArrowRight, Headphones, Star, Eye, MapPin
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { useToast } from "@/hooks/use-toast";
import { ReviewsSection } from "@/components/ReviewsSection";
import { downloadImageWithWatermark } from "@/lib/watermark";
import { VehicleAnalyticsChart } from "@/components/VehicleAnalyticsChart";
import { trackVehicleView } from "@/hooks/useVehicleAnalytics";
import { useAuth } from "@/hooks/useAuth";
import { ColorDisplay } from "@/components/ColorSelector";
import { LiveViewers, SalesUrgency, StockUrgency } from "@/components/SocialProof";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import ContactExpertModal from "@/components/ContactExpertModal";
import QuickViewModal from "@/components/QuickViewModal";
import FullscreenImageViewer from "@/components/FullscreenImageViewer";
import { CarCard } from "@/components/CarCard";

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
  const [sameModelCars, setSameModelCars] = useState<Car[]>([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [expertModalOpen, setExpertModalOpen] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [selectedQuickCar, setSelectedQuickCar] = useState<any>(null);
  const [fullscreen, setFullscreen] = useState<{ images: string[]; title: string } | null>(null);

  useEffect(() => {
    fetchCarDetails();
    loadWishlist();
  }, [id, user]);

  const loadWishlist = async () => {
    if (user) {
      const { data } = await supabase.from("wishlist").select("car_id").eq("user_id", user.id);
      setWishlist(data?.map(w => w.car_id) || []);
    } else {
      setWishlist(JSON.parse(localStorage.getItem("wishlist") || "[]"));
    }
  };

  const toggleWishlist = async (e: React.MouseEvent, carId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (wishlist.includes(carId)) {
        if (user) await supabase.from("wishlist").delete().eq("user_id", user.id).eq("car_id", carId);
        else {
          const local = JSON.parse(localStorage.getItem("wishlist") || "[]");
          localStorage.setItem("wishlist", JSON.stringify(local.filter((id: string) => id !== carId)));
        }
        setWishlist(wishlist.filter(id => id !== carId));
        toast({ title: "Removed from whitelist" });
      } else {
        if (user) await supabase.from("wishlist").insert({ user_id: user.id, car_id: carId });
        else {
          const local = JSON.parse(localStorage.getItem("wishlist") || "[]");
          localStorage.setItem("wishlist", JSON.stringify([...local, carId]));
        }
        setWishlist([...wishlist, carId]);
        toast({ title: "Added to whitelist" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

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

      const { data: sameModel } = await supabase
        .from("cars")
        .select("*")
        .eq("make", data.make)
        .eq("model", data.model)
        .neq("id", data.id)
        .eq("status", "available")
        .limit(4);
      setSameModelCars(sameModel || []);

      const { data: similar } = await supabase
        .from("cars")
        .select("*")
        .eq("make", data.make)
        .neq("model", data.model)
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
  const whatsappLink = `https://wa.me/254722827458?text=${encodeURIComponent(`Hello, I'm inquiring about the ${car.year} ${car.make} ${car.model} (Stock ID: ${car.stock_id}) seen on your website.`)}`;

  return (
    <div className="min-h-screen bg-white selection:bg-brand-red selection:text-white font-sans antialiased overflow-x-hidden text-slate-900 pb-20">
      {/* Fixed Back Button */}
      <div className="fixed top-24 left-4 z-50 hidden xl:block">
        <Button
          variant="outline"
          onClick={() => navigate("/catalogue")}
          className="h-12 px-4 border-slate-200 bg-white/80 backdrop-blur-md hover:bg-slate-900 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center gap-2 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Catalogue
        </Button>
      </div>

      {/* Breadcrumbs */}
      <div className="container max-w-[1800px] mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
          <Link to="/" className="hover:text-brand-red transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/catalogue" className="hover:text-brand-red transition-colors">Vehicles</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-400 truncate">{car.make} {car.model} {car.year}</span>
        </div>
      </div>

      <div className="container max-w-[1800px] mx-auto px-4">
        {/* Top Info Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-100 pb-6 mb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest w-fit">
                In Stock
              </div>
              <div className="text-2xl font-black text-brand-red tracking-tight flex items-baseline gap-1">
                <span className="text-xs font-bold text-slate-400">KSh</span>
                {car.price.toLocaleString()}
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 uppercase">
              {car.make} {car.model} {car.year} {car.engine} {car.fuel_type}
            </h1>
          </div>
          <div className="text-right space-y-1">
            <p className="text-xl md:text-2xl font-black text-brand-red uppercase tracking-tight">
              Stock ID: <span className="text-slate-900">{car.stock_id || car.id.slice(0, 8).toUpperCase()}</span>
            </p>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              Contact: {car.yard_location?.split(',')[0] || 'Nairobi'} (+254 722 827 458)
            </p>
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-12 mb-20">
          {/* LEFT: Image Gallery (Span 8) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="relative group rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm">
              <div className="aspect-[16/10] relative">
                <img
                  src={currentImage}
                  alt={`${car.make} ${car.model}`}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Download Images Overlay */}
                <Button
                  onClick={handleDownloadImage}
                  className="absolute top-4 right-4 bg-primary/90 hover:bg-primary text-white font-bold text-[11px] uppercase tracking-widest rounded px-4 py-2 h-auto transition-all"
                >
                  Download Images
                </Button>

                {/* Nav Arrows */}
                {images.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all z-20">
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all z-20">
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}

                {/* Index Counter */}
                <div className="absolute bottom-4 left-4 bg-black/60 text-white text-[10px] font-bold px-3 py-1 rounded">
                  {currentImageIndex + 1}/{images.length}
                </div>
              </div>
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`relative w-24 aspect-[4/3] flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === currentImageIndex ? "border-emerald-500 shadow-md" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt={`View ${idx + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Quick Specs & Details (Span 4) */}
          <div className="lg:col-span-4 space-y-8">
            {/* Price Card - High Visibility Money Design */}
            <div className="bg-slate-900 text-white p-8 rounded-3xl space-y-4 shadow-2xl relative overflow-hidden border border-white/10 group animate-in fade-in slide-in-from-right-8 duration-700">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                  <Wallet className="h-20 w-20" />
               </div>
               <div className="relative z-10 space-y-1">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Acquisition Value</p>
                    <Badge className="bg-brand-red text-white text-[9px] font-bold px-2 py-0.5 rounded border-none shadow-lg">VERIFIED</Badge>
                  </div>
                  <div className="flex items-baseline gap-2 pt-2">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">KSh</span>
                    <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                      {car.price.toLocaleString()}
                    </h2>
                  </div>
                  <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/30 w-fit mt-2 animate-pulse flex items-center gap-2">
                     <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                     <span className="text-[10px] font-black uppercase tracking-[0.1em]">
                        Lipa Mdogo Mdogo ...Deposit Available
                     </span>
                  </div>
               </div>
               <div className="pt-4 border-t border-white/10 relative z-10">
                  <div className="flex items-center gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    <Activity className="h-3 w-3 text-brand-red animate-pulse" />
                    Market Synchronization Active
                  </div>
               </div>
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 gap-4">
               {[
                 { label: "Year", val: car.year, icon: Calendar, color: "text-emerald-500" },
                 { label: "Mileage", val: car.mileage || "0 km", icon: Gauge, color: "text-blue-500" },
                 { label: "Transmission", val: car.transmission || "Manual", icon: Settings, color: "text-emerald-500" },
                 { label: "Fuel Type", val: car.fuel_type || "Diesel", icon: Star, color: "text-emerald-500" }
               ].map((item, i) => (
                 <div key={i} className="bg-slate-50 p-4 rounded-xl flex flex-col items-center text-center space-y-2 border border-slate-100">
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                    <p className="text-xs font-black text-slate-900 uppercase">{item.val}</p>
                 </div>
               ))}
            </div>

            {/* Vehicle Details Table */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 border-b border-slate-100 pb-2">Vehicle Details</h3>
              <div className="grid grid-cols-1 gap-y-3">
                 {[
                   { label: "Engine", val: car.engine || "N/A" },
                   { label: "Drive Type", val: car.drive_type || "2WD" },
                   { label: "Steering", val: "Right" },
                   { label: "Color", val: car.color || "Standard" },
                   { label: "Status", val: "Available" }
                 ].map((detail, i) => (
                   <div key={i} className="flex justify-between text-[11px] font-bold uppercase tracking-tight">
                      <span className="text-slate-400">{detail.label}</span>
                      <span className="text-slate-900">{detail.val}</span>
                   </div>
                 ))}
              </div>
            </div>

            {/* Conversion Buttons */}
            <div className="space-y-3">
              <Button
                className="w-full h-14 bg-[#25D366] hover:bg-[#20ba54] text-white font-black text-[12px] uppercase tracking-widest rounded-lg flex items-center justify-center gap-3 border-none shadow-md transition-all"
                asChild
              >
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                   <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.375-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.87 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.438 9.886-9.886 9.886m11.415-15.813A11.923 11.923 0 0012.046 2.5a12.05 12.05 0 00-12.04 12.05c0 2.096.547 4.142 1.588 5.945L.057 24l4.3-.113a11.961 11.961 0 005.692 1.448h.005c6.647 0 12.054-5.406 12.057-12.056 0-3.22-1.258-6.248-3.543-8.529"/>
                   </svg>
                  WhatsApp Inquiry - {car.yard_location?.split(',')[0] || 'Nairobi'}
                </a>
              </Button>
              <Button
                onClick={handleDownloadImage}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black text-[12px] uppercase tracking-widest rounded-lg flex items-center justify-center gap-3 border-none shadow-md transition-all"
              >
                <Download className="h-5 w-5" />
                Download Images
              </Button>
            </div>
          </div>
        </div>

        {/* Vehicle Description */}
        <div className="mb-20">
          <h2 className="text-sm font-black uppercase tracking-[0.4em] text-slate-900 mb-6 flex items-center gap-4">
             Vehicle Description
             <div className="h-0.5 flex-1 bg-slate-100" />
          </h2>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-medium tracking-tight max-w-4xl">
            {car.description || `Introducing the high-quality ${car.year} ${car.make} ${car.model}. This vehicle features a powerful ${car.engine} engine and ${car.transmission} transmission. Experience outstanding performance, exceptional reliability, and long-term value. Built to tackle any task with ease, this unit is an investment in quality and efficiency for years to come.`}
          </p>
        </div>

        {/* Technical Specifications - Large Colorful Icons */}
        <div className="mb-20">
          <h2 className="text-sm font-black uppercase tracking-[0.4em] text-slate-900 mb-10 flex items-center gap-4">
             Technical Specifications
             <div className="h-0.5 flex-1 bg-slate-100" />
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
             {[
               { label: "Engine", val: car.engine || "N/A", icon: Settings, bg: "bg-blue-500" },
               { label: "Year", val: car.year, icon: Calendar, bg: "bg-emerald-500" },
               { label: "Mileage", val: car.mileage || "0 km", icon: Gauge, bg: "bg-orange-500" },
               { label: "Transmission", val: car.transmission || "Manual", icon: ArrowRight, bg: "bg-purple-500" },
               { label: "Fuel Type", val: car.fuel_type || "Diesel", icon: Zap, bg: "bg-red-500" },
               { label: "Body Type", val: "VEHICLE", icon: Eye, bg: "bg-cyan-500" },
               { label: "Drive Type", val: car.drive_type || "2WD", icon: Settings, bg: "bg-blue-600" },
               { label: "Steering", val: "Right", icon: Trophy, bg: "bg-pink-500" },
             ].map((item, i) => (
               <div key={i} className="bg-slate-50 p-8 rounded-2xl flex flex-col items-center text-center space-y-4 border border-slate-100 transition-all hover:shadow-lg">
                  <div className={`${item.bg} h-14 w-14 rounded-full flex items-center justify-center text-white shadow-lg`}>
                     <item.icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.val}</p>
                  </div>
               </div>
             ))}
          </div>
        </div>

        {/* Contact Information Box */}
        <div className="mb-20">
           <Card className="max-w-4xl border border-slate-100 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center gap-2">
                 <Phone className="h-4 w-4 text-emerald-500" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Contact Information</span>
              </div>
              <div className="p-8 flex flex-col md:flex-row justify-between items-center gap-8">
                 <div className="space-y-2">
                    <p className="text-lg font-black text-slate-900 uppercase tracking-tight">{car.yard_location?.split(',')[0] || 'Nairobi'}</p>
                    <p className="text-sm font-bold text-slate-500">+254 722 827 458</p>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                       <MapPin className="h-3 w-3" />
                       Matched to vehicle location: {car.yard_location?.split(',')[0] || 'Nairobi'}
                    </div>
                 </div>
                 <Button
                   className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] uppercase tracking-[0.2em] px-10 h-12 rounded-lg flex items-center gap-2 shadow-lg transition-all"
                   asChild
                 >
                   <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4" />
                      Chat Now
                   </a>
                 </Button>
              </div>
           </Card>
        </div>

        {/* Similar Vehicles - Same Brand */}
        {similarCars.length > 0 && (
          <div className="mt-20">
            <h2 className="text-sm font-black uppercase tracking-[0.4em] text-slate-900 mb-10 flex items-center gap-4">
               Similar {car.make} Vehicles
               <div className="h-0.5 flex-1 bg-slate-100" />
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
              {similarCars.map((similarCar) => (
                <CarCard
                  key={similarCar.id}
                  car={similarCar}
                  isWhitelisted={wishlist.includes(similarCar.id)}
                  onToggleWishlist={toggleWishlist}
                  onQuickView={(e, c) => { setSelectedQuickCar(c); setQuickViewOpen(true); }}
                />
              ))}
            </div>
          </div>
        )}

        {/* More Options - Same Model */}
        {sameModelCars.length > 0 && (
          <div className="mt-20">
            <h2 className="text-sm font-black uppercase tracking-[0.4em] text-slate-900 mb-10 flex items-center gap-4">
               More {car.make} {car.model} Options
               <div className="h-0.5 flex-1 bg-slate-100" />
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
              {sameModelCars.map((smCar) => (
                <CarCard
                  key={smCar.id}
                  car={smCar}
                  isWhitelisted={wishlist.includes(smCar.id)}
                  onToggleWishlist={toggleWishlist}
                  onQuickView={(e, c) => { setSelectedQuickCar(c); setQuickViewOpen(true); }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recommended - Different Brands */}
        {recommendedCars.length > 0 && (
          <div className="mt-20">
            <h2 className="text-sm font-black uppercase tracking-[0.4em] text-slate-900 mb-10 flex items-center gap-4">
               You May Also Like
               <div className="h-0.5 flex-1 bg-slate-100" />
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
              {recommendedCars.map((recCar) => (
                <CarCard
                  key={recCar.id}
                  car={recCar}
                  isWhitelisted={wishlist.includes(recCar.id)}
                  onToggleWishlist={toggleWishlist}
                  onQuickView={(e, c) => { setSelectedQuickCar(c); setQuickViewOpen(true); }}
                />
              ))}
            </div>
          </div>
        )}
        {/* Back to Catalogue */}
        <div className="mt-20 text-center border-t border-slate-100 pt-20">
          <Button
             variant="outline"
             onClick={() => navigate("/catalogue")}
             className="border-slate-200 text-slate-900 font-black text-[11px] uppercase tracking-[0.4em] h-16 px-16 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-md"
          >
             Browse All Cars <ArrowRight className="ml-3 h-5 w-5" />
          </Button>
        </div>
      </div>

      <ContactExpertModal
        open={expertModalOpen}
        onOpenChange={setExpertModalOpen}
        carInfo={`${car.year} ${car.make} ${car.model}`}
      />

      <QuickViewModal
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        car={selectedQuickCar}
      />

      <FullscreenImageViewer
        open={!!fullscreen}
        onOpenChange={(o) => !o && setFullscreen(null)}
        images={fullscreen?.images || []}
        title={fullscreen?.title}
      />
    </div>
  );
};

export default CarDetails;
