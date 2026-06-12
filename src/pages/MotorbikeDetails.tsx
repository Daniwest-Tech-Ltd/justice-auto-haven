import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronLeft, ChevronRight, Phone, Mail, MessageCircle, ArrowLeft, Download,
  Bike, Cpu, Gauge, Fuel, MapPin, Zap, Shield, ShieldCheck, Globe, Trophy, Activity, Headphones
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { useToast } from "@/hooks/use-toast";
import { downloadImageWithWatermark } from "@/lib/watermark";
import useDisableRightClick from "@/hooks/useDisableRightClick";
import HeroSlider from "@/components/HeroSlider";
import { getCurrentSale } from "@/lib/currentSale";

interface Motorbike {
  id: string;
  stock_id: string | null;
  make: string;
  model: string;
  year: number;
  price: number;
  engine_cc: number | null;
  transmission: string | null;
  fuel_type: string | null;
  color: string | null;
  mileage: string | null;
  condition: string | null;
  description: string | null;
  status: string | null;
  is_featured: boolean | null;
  yard_location: string | null;
  images: any;
}

const MotorbikeDetails = () => {
  useDisableRightClick();
  const { id } = useParams();
  const navigate = useNavigate();
  const sale = getCurrentSale();
  const { toast } = useToast();
  const [bike, setBike] = useState<Motorbike | null>(null);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const isUUID = id && id.length >= 32 && id.includes("-");
      const q = supabase.from("motorbikes").select("*").limit(1);
      const { data, error } = isUUID ? await q.eq("id", id) : await q.eq("stock_id", id);
      if (error || !data || data.length === 0) {
        toast({ title: "Motorbike not found", variant: "destructive" });
        navigate("/motorbikes");
        return;
      }
      setBike(data[0] as Motorbike);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <LoadingScreen />;
  if (!bike) return null;

  const images: string[] = Array.isArray(bike.images) ? bike.images : [];
  const current = images[idx] || "/placeholder.svg";

  const download = async () => {
    if (!images[idx]) return;
    try {
      await downloadImageWithWatermark(
        images[idx],
        { make: bike.make, model: bike.model, year: bike.year },
        `${bike.stock_id || bike.id}_image_${idx + 1}.jpg`
      );
      toast({ title: "Image Downloaded", description: "Saved with Justice Ultimate watermark" });
    } catch {
      toast({ title: "Download Failed", variant: "destructive" });
    }
  };

  const enquireUrl = `https://wa.me/254722827458?text=${encodeURIComponent(`Hi, I'm interested in the ${bike.year} ${bike.make} ${bike.model} (${bike.stock_id || bike.id})`)}`;

  return (
    <div className="min-h-screen bg-background selection:bg-brand-red selection:text-white font-sans antialiased overflow-x-hidden pb-20">
      {/* Background Overlays */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,hsl(var(--primary)/0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      </div>

      {/* Professional Marquee */}
      <div className="bg-primary/80 backdrop-blur-md text-white py-2 overflow-hidden border-b border-white/5 relative z-30">
        <div className="flex whitespace-nowrap animate-marquee-professional">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center shrink-0">
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <ShieldCheck className="h-3 w-3 text-brand-red" />
                Technical Audit Complete
              </span>
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <Globe className="h-3 w-3 text-brand-red" />
                Institutional Logistics
              </span>
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <Trophy className="h-3 w-3 text-brand-red" />
                Performance Certified
              </span>
              <span className="mx-12 flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">
                <Shield className="h-3 w-3 text-brand-red" />
                Rider Protection Active
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
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand-red italic">Asset Inspection Terminal</p>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white uppercase italic">
              {bike.make} <span className="text-brand-red">{bike.model}</span>
            </h1>
            <div className="flex items-center justify-center gap-3 text-xs md:text-sm text-muted-foreground font-medium uppercase tracking-widest">
               <span>Year: {bike.year}</span>
               <span className="h-1 w-1 bg-brand-red rounded-full" />
               <span>Stock ID: {bike.stock_id || 'UNIT'}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="outline"
            onClick={() => navigate("/motorbikes")}
            className="mb-8 border-border/50 hover:bg-brand-red hover:text-white transition-all gap-2 text-[10px] font-black uppercase tracking-widest"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Motorbike Fleet
          </Button>

          <div className="grid gap-12 lg:grid-cols-2 items-start">
            {/* Gallery Terminal */}
            <div className="space-y-6">
              <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-border bg-black group">
                {images.length > 0 ? (
                  <img
                    src={current}
                    alt={`${bike.make} ${bike.model}`}
                    className="h-full w-full object-contain pointer-events-none transition-transform duration-700 group-hover:scale-105"
                    draggable={false}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Bike className="h-20 w-20 text-muted-foreground opacity-20" />
                  </div>
                )}

                {images.length > 1 && (
                  <>
                    <Button variant="ghost" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-black/50 backdrop-blur hover:bg-brand-red text-white border-none rounded-full"
                      onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}>
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button variant="ghost" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-black/50 backdrop-blur hover:bg-brand-red text-white border-none rounded-full"
                      onClick={() => setIdx((i) => (i + 1) % images.length)}>
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/80 backdrop-blur px-4 py-1 text-[10px] text-white font-black uppercase tracking-widest border border-white/10">
                      Audit Image {idx + 1} / {images.length}
                    </div>
                  </>
                )}
                {images.length > 0 && (
                  <Button variant="ghost" size="icon" className="absolute bottom-4 right-4 h-10 w-10 bg-black/50 backdrop-blur hover:bg-brand-red text-white border-none rounded-full"
                    onClick={download} title="Secure Archival Download">
                    <Download className="h-5 w-5" />
                  </Button>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-4 cert-scroll">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setIdx(i)}
                      className={`flex-shrink-0 overflow-hidden rounded border-2 transition-all ${i === idx ? "border-brand-red scale-95" : "border-border hover:border-brand-red/50 opacity-60 hover:opacity-100"}`}>
                      <img src={img} alt={`v${i + 1}`} className="h-20 w-24 object-cover pointer-events-none" draggable={false} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Performance Ledger */}
            <div className="space-y-8">
              <div className="glass-strong rounded-md border border-border p-8 space-y-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full border border-primary/30 bg-primary/5 text-[8px] font-black uppercase tracking-widest mb-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Status: {bike.status || 'Verified'}
                    </div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">{bike.make} {bike.model}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Market Valuation</p>
                    <p className="text-3xl font-black text-brand-red tracking-tighter italic">KSh {Number(bike.price).toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-secondary/5 p-4 rounded border border-border">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Engine Class</p>
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-brand-red" />
                        <span className="text-sm font-bold uppercase">{bike.engine_cc ? `${bike.engine_cc} CC` : '—'}</span>
                      </div>
                   </div>
                   <div className="bg-secondary/5 p-4 rounded border border-border">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Propulsion Type</p>
                      <div className="flex items-center gap-2">
                        <Fuel className="h-4 w-4 text-brand-red" />
                        <span className="text-sm font-bold uppercase">{bike.fuel_type || 'PETROL'}</span>
                      </div>
                   </div>
                   <div className="bg-secondary/5 p-4 rounded border border-border">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Odometer Audit</p>
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-brand-red" />
                        <span className="text-sm font-bold uppercase">{bike.mileage || '0 KM'}</span>
                      </div>
                   </div>
                   <div className="bg-secondary/5 p-4 rounded border border-border">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Stock Position</p>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-brand-red" />
                        <span className="text-sm font-bold uppercase truncate">{bike.yard_location || 'Nairobi Hub'}</span>
                      </div>
                   </div>
                </div>

                <div className="space-y-3 pt-4">
                  <Button className="w-full bg-brand-red hover:bg-brand-red/90 text-white font-black uppercase tracking-[0.2em] h-12 shadow-xl btn-signal" size="lg" asChild>
                    <a href={enquireUrl} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="mr-2 h-5 w-5" /> Initiate Acquisition Query
                    </a>
                  </Button>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="border-border hover:bg-secondary font-bold uppercase tracking-widest h-12" asChild>
                       <a href="tel:+254722827458"><Phone className="mr-2 h-4 w-4 text-brand-red" /> Call Direct</a>
                    </Button>
                    <Button variant="outline" className="border-border hover:bg-secondary font-bold uppercase tracking-widest h-12" asChild>
                       <a href="mailto:support@justiceultimateautos.com"><Mail className="mr-2 h-4 w-4 text-brand-red" /> Email Audit</a>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Technical Description */}
              <div className="glass-strong rounded-md border border-border p-8 space-y-6">
                 <div className="flex items-center gap-3 border-b border-border pb-4">
                    <ShieldCheck className="h-5 w-5 text-brand-red" />
                    <h3 className="text-sm font-black uppercase tracking-widest">Asset Condition Audit</h3>
                 </div>
                 <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                    <SpecItem label="Transmission" value={bike.transmission || "Manual"} />
                    <SpecItem label="Visual Identity" value={bike.color || "Standard"} />
                    <SpecItem label="Unit Condition" value={bike.condition || "Pristine"} />
                    <SpecItem label="Legal Status" value="Cleared & Verified" />
                 </div>
                 {bike.description && (
                   <div className="pt-4 border-t border-border">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Institutional Remarks</p>
                      <p className="text-xs font-medium leading-relaxed text-foreground/80 uppercase tracking-wider">{bike.description}</p>
                   </div>
                 )}
              </div>
            </div>
          </div>
        </div>

        {/* Global Navigation Lead */}
        <div className="mt-20 border-t border-border pt-12 text-center space-y-6 max-w-2xl mx-auto relative z-10">
           <Trophy className="h-10 w-10 text-brand-red mx-auto animate-bounce" />
           <h2 className="text-2xl font-black uppercase italic tracking-tighter">Beyond the Two-Wheel Terminal</h2>
           <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground leading-relaxed">
             Justice Ultimate Automobiles provides cross-platform asset management. Access our primary automotive catalogue for high-fidelity car imports and corporate fleet services.
           </p>
           <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Button onClick={() => navigate("/catalogue")} className="bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] px-8 h-12">Primary Car Catalogue</Button>
              <Button onClick={() => navigate("/contact")} variant="outline" className="border-border hover:bg-secondary font-black uppercase tracking-[0.2em] px-8 h-12">Open Executive Line</Button>
           </div>
        </div>
      </div>
    </div>
  );
};

const SpecItem = ({ label, value }: { label: string; value: string }) => (
  <div className="space-y-1">
    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="text-xs font-bold uppercase">{value}</p>
  </div>
);

export default MotorbikeDetails;
