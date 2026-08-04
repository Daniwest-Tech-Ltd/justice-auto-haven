import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Heart,
  Trash2,
  Gauge,
  Settings as SettingsIcon,
  ShoppingCart,
  Globe,
  Trophy,
  ShieldCheck as Shield,
  Activity,
  ArrowRight,
  ChevronRight,
  Clock,
  Fuel,
  Search,
  CheckCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LoadingScreen from "@/components/LoadingScreen";
import { OrderSubmissionModal } from "@/components/OrderSubmissionModal";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSlider from "@/components/HeroSlider";
import { getCurrentSale } from "@/lib/currentSale";

const Wishlist = () => {
  const sale = getCurrentSale();
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
        const localWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
        const updated = localWishlist.filter((id: string) => id !== carId);
        localStorage.setItem("wishlist", JSON.stringify(updated));
      }

      toast({
        title: "Success",
        description: "Removed from whitelist",
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
    <div className="min-h-screen bg-background selection:bg-brand-red selection:text-white font-sans antialiased overflow-x-hidden">
      <Header />
      <div className="pt-20">
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
                  <Shield className="h-3 w-3 text-brand-red" />
                  Asset Preservation
                </span>
                <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                  <Globe className="h-3 w-3 text-brand-red" />
                  Portfolio Monitoring
                </span>
                <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                  <Trophy className="h-3 w-3 text-brand-red" />
                  Verified Interest
                </span>
                <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                  <Shield className="h-3 w-3 text-brand-red" />
                  Identity Protection
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Secondary Marquee - Whitelist Insights */}
        <div className="bg-black/90 text-white/60 py-1.5 overflow-hidden border-b border-white/5 relative z-30">
          <div className="flex whitespace-nowrap animate-marquee-professional" style={{ animationDirection: 'reverse', animationDuration: '60s' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center shrink-0">
                <span className="mx-12 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.4em]">
                  <Heart className="h-2.5 w-2.5 text-primary" />
                  Saved Portfolio Registry
                </span>
                <span className="mx-12 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.4em]">
                  <Activity className="h-2.5 w-2.5 text-primary" />
                  Market Value Tracking
                </span>
                <span className="mx-12 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.4em]">
                  <CheckCircle className="h-2.5 w-2.5 text-primary" />
                  Inventory Sync Active
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
        `}</style>

        {/* Hero Header */}
        <section className="relative flex items-center justify-center border-b border-border py-16 sm:py-24 overflow-hidden">
          <HeroSlider />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-700">
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand-red">Saved Assets Hub: {sale.year}</p>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground uppercase">
                My <span className="text-brand-red">Whitelist.</span>
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
                Management portal for your selected automotive units. <br />
                {wishlist.length} {wishlist.length === 1 ? "unit" : "units"} currently indexed for acquisition.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-12 sm:h-10 px-6 rounded-md border-border hover:bg-secondary text-[10px] font-black uppercase tracking-widest w-full sm:w-auto"
                  onClick={() => navigate("/catalogue")}
                >
                  <Search className="mr-2 h-3.5 w-3.5" /> Continue Sourcing
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-12 sm:h-10 px-6 rounded-md border-border hover:bg-secondary text-[10px] font-black uppercase tracking-widest w-full sm:w-auto"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Previous Terminal
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8 md:py-12 relative z-10">
          <div className="max-w-7xl mx-auto w-full">
            {wishlist.length === 0 ? (
              <Card className="glass-strong border-border border-dashed border-2 animate-in zoom-in duration-500 w-full">
                <CardContent className="p-10 md:p-20 text-center space-y-6">
                  <div className="h-20 w-20 rounded-full bg-secondary/20 flex items-center justify-center mx-auto">
                    <Heart className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black uppercase tracking-widest">Portfolio Empty</h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                      No automotive assets have been indexed in your primary whitelist.
                    </p>
                  </div>
                  <Button
                    className="bg-brand-red hover:bg-brand-red/90 text-white font-black uppercase tracking-widest text-[10px] h-12 px-10 rounded-md shadow-xl btn-signal"
                    onClick={() => navigate("/catalogue")}
                  >
                    Scan Active Inventory
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {wishlist.map((item) => {
                  const car = item.cars;
                  if (!car) return null;

                  const images = getImages(car);
                  return (
                    <Card key={item.id} className="group relative bg-background border-border hover:border-brand-red/40 transition-all duration-500 flex flex-col h-full hover:shadow-2xl overflow-hidden rounded-md border-b-2 hover:border-b-brand-red">
                      <div className="aspect-[16/10] overflow-hidden relative">
                        <img
                          src={images[0] || "/placeholder.svg"}
                          alt={`${car.make} ${car.model}`}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                        <div className="absolute top-3 left-3">
                           <Badge className="bg-primary text-white text-[8px] font-black uppercase rounded-sm py-1 px-2 border-none">Model {car.year}</Badge>
                        </div>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-3 right-3 h-8 w-8 rounded-sm shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0"
                          onClick={() => removeFromWishlist(car.id, item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <CardContent className="p-6 flex flex-col flex-1">
                        <div className="mb-4">
                          <div className="flex justify-between items-start gap-2">
                             <h3 className="text-sm font-black uppercase tracking-widest text-white group-hover:text-brand-red transition-colors line-clamp-1">{car.make} {car.model}</h3>
                             <Activity className="h-3 w-3 text-muted-foreground group-hover:text-brand-red animate-pulse" />
                          </div>
                          <p className="text-xl font-black text-white tracking-tighter mt-1">KSh {car.price?.toLocaleString()}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 border-y border-border py-4 mb-6">
                          <div className="text-center space-y-1">
                            <p className="text-[8px] font-black text-muted-foreground uppercase">Mileage</p>
                            <p className="text-[10px] font-black text-white flex items-center justify-center gap-1">
                              <Gauge className="h-3 w-3 text-brand-red" /> {car.mileage || "N/A"}
                            </p>
                          </div>
                          <div className="text-center border-x border-border space-y-1">
                            <p className="text-[8px] font-black text-muted-foreground uppercase px-1">Fuel</p>
                            <p className="text-[10px] font-black text-white uppercase flex items-center justify-center gap-1">
                              <Fuel className="h-3 w-3 text-brand-red" /> {car.fuel_type?.slice(0, 3) || 'PET'}
                            </p>
                          </div>
                          <div className="text-center space-y-1">
                            <p className="text-[8px] font-black text-muted-foreground uppercase">Trans</p>
                            <p className="text-[10px] font-black text-white uppercase flex items-center justify-center gap-1">
                              <SettingsIcon className="h-3 w-3 text-brand-red" /> {car.transmission?.slice(0, 3) || 'AWD'}
                            </p>
                          </div>
                        </div>

                        <div className="mt-auto space-y-3">
                          <div className="flex gap-3">
                            <Button
                              size="sm"
                              onClick={() => handlePlaceOrder(car)}
                              className="flex-1 h-12 bg-brand-red hover:bg-brand-red/90 text-white font-black text-[10px] uppercase tracking-widest rounded-sm shadow-lg btn-signal"
                            >
                              <ShoppingCart className="mr-2 h-3.5 w-3.5" />
                              Initialize Order
                            </Button>
                            <Link to={`/car/${car.id}`} className="flex-1">
                              <Button variant="outline" className="w-full h-12 border-border text-white font-black text-[10px] uppercase tracking-widest rounded-sm hover:bg-secondary transition-all group/btn">
                                Details <ChevronRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
                              </Button>
                            </Link>
                          </div>
                          <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                             <div className="h-full bg-brand-red w-full scale-x-[0.4] group-hover:scale-x-100 transition-transform origin-left duration-1000" />
                          </div>
                          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest text-center group-hover:text-white transition-colors">Technical Audit Ready</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>

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
