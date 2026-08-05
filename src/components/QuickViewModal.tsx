import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  ChevronRight,
  Gauge,
  Settings as SettingsIcon,
  Fuel,
  ShieldCheck,
  Globe,
  Trophy,
  ArrowRight,
  Maximize2,
  Headphones,
  X
} from "lucide-react";
import { LiveViewers, SalesUrgency, StockUrgency } from "./SocialProof";
import ContactExpertModal from "./ContactExpertModal";

interface QuickViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car: any;
}

const QuickViewModal = ({ open, onOpenChange, car }: QuickViewModalProps) => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [expertModalOpen, setExpertModalOpen] = useState(false);

  if (!car) return null;

  const getImages = (): string[] => {
    if (car.main_images) {
      const parsed = typeof car.main_images === 'string' ? JSON.parse(car.main_images) : car.main_images;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    if (car.images) {
      const parsed = typeof car.images === 'string' ? JSON.parse(car.images) : car.images;
      return Array.isArray(parsed) ? (parsed.length > 0 ? parsed : ["/placeholder.svg"]) : [parsed || "/placeholder.svg"];
    }
    return ["/placeholder.svg"];
  };

  const images = getImages();

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden glass-strong border-white/10 sm:rounded-2xl shadow-[0_0_100px_-20px_rgba(0,0,0,0.5)]">
        <DialogHeader className="sr-only">
          <DialogTitle>{car.make} {car.model} Quick View</DialogTitle>
          <DialogDescription>Overview of technical specifications and acquisition details for {car.make} {car.model}.</DialogDescription>
        </DialogHeader>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-50 bg-black/20 hover:bg-black/40 text-white rounded-full h-8 w-8 border-none"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="flex flex-col md:flex-row h-full max-h-[95vh] overflow-y-auto md:overflow-hidden">
          {/* Image Section */}
          <div className="md:w-3/5 relative bg-slate-900 flex items-center justify-center min-h-[350px] md:min-h-0 border-r border-border/10">
            <img
              src={images[currentImageIndex]}
              alt={`${car.make} ${car.model}`}
              className="w-full h-full object-contain animate-in fade-in duration-500"
            />

            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full h-10 w-10 border-none transition-all hover:scale-110 active:scale-95"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white rounded-full h-10 w-10 border-none transition-all hover:scale-110 active:scale-95"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImageIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentImageIndex ? "bg-brand-red w-6" : "bg-white/40 w-1.5 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>

            <div className="absolute top-6 left-6">
               <SalesUrgency />
            </div>
          </div>

          {/* Details Section */}
          <div className="md:w-2/5 p-8 md:p-10 flex flex-col gap-8 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50">
            <div className="space-y-4">
               <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic text-foreground leading-tight">
                      {car.make} <span className="text-brand-red">{car.model}</span>
                    </h2>
                    <div className="flex items-center gap-2">
                       <Badge variant="outline" className="text-[10px] font-bold border-brand-red/30 text-brand-red uppercase px-2 py-0.5">
                         {car.year} Model
                       </Badge>
                       <Badge variant="outline" className="text-[10px] font-bold border-primary/30 text-primary uppercase px-2 py-0.5">
                         {car.status === 'available' ? 'Available' : 'Sold Out'}
                       </Badge>
                    </div>
                  </div>
               </div>
               <div className="pt-2">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Acquisition Value</p>
                 <div className="flex flex-col gap-2">
                    <div className="bg-brand-red/5 p-4 rounded-2xl border border-brand-red/10 inline-flex items-baseline gap-2 w-fit">
                       <span className="text-sm font-bold text-brand-red/70 uppercase">KSh</span>
                       <p className="text-4xl font-black text-brand-red tracking-tighter drop-shadow-sm">
                         {car.price?.toLocaleString()}
                       </p>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 animate-pulse">
                       <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                       <span className="text-[10px] font-black uppercase tracking-widest">
                          Lipa Mdogo Mdogo ...Deposit Available
                       </span>
                    </div>
                 </div>
               </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-border/50">
               <LiveViewers />
               <StockUrgency count={car.units_available} />
            </div>

            <div className="grid grid-cols-3 gap-4 border-y border-border/50 py-8">
               <div className="text-center space-y-2">
                  <div className="h-10 w-10 rounded-lg bg-secondary/30 flex items-center justify-center mx-auto">
                    <Gauge className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest leading-none">Mileage</p>
                  <p className="text-[11px] font-extrabold uppercase text-foreground">{car.mileage || '0 KM'}</p>
               </div>
               <div className="text-center space-y-2 border-x border-border/50 px-2">
                  <div className="h-10 w-10 rounded-lg bg-secondary/30 flex items-center justify-center mx-auto">
                    <SettingsIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest leading-none">Gearbox</p>
                  <p className="text-[11px] font-extrabold uppercase text-foreground truncate">{car.transmission?.slice(0, 3) || 'AUTO'}</p>
               </div>
               <div className="text-center space-y-2">
                  <div className="h-10 w-10 rounded-lg bg-secondary/30 flex items-center justify-center mx-auto">
                    <Fuel className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest leading-none">Fuel</p>
                  <p className="text-[11px] font-extrabold uppercase text-foreground">{car.fuel_type?.slice(0, 3) || 'PET'}</p>
               </div>
            </div>

            <div className="space-y-6">
               <div className="flex flex-col gap-3">
                  <Button
                    className="w-full h-14 bg-brand-red hover:bg-brand-red/90 text-white font-black text-[12px] uppercase tracking-[0.2em] rounded-xl shadow-2xl shadow-brand-red/20 transition-all duration-300"
                    onClick={() => { navigate(`/car/${car.id}`); onOpenChange(false); }}
                  >
                    View All Details <Maximize2 className="ml-2 h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full h-14 border-slate-200 dark:border-slate-800 text-foreground font-black text-[12px] uppercase tracking-[0.2em] rounded-xl hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all duration-500 group"
                    onClick={() => setExpertModalOpen(true)}
                  >
                    <Headphones className="mr-2 h-4 w-4 text-brand-red transition-transform group-hover:scale-125" />
                    Talk to an Expert
                  </Button>
               </div>

               <div className="flex items-center space-x-3 bg-secondary/20 p-4 rounded-xl border border-border/50">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                  />
                  <Label htmlFor="terms" className="text-[10px] font-bold uppercase leading-tight cursor-pointer text-muted-foreground">
                    I agree to the <Button variant="link" className="p-0 h-auto text-[10px] text-brand-red font-bold uppercase underline decoration-2 underline-offset-2" onClick={(e) => { e.preventDefault(); navigate("/terms"); onOpenChange(false); }}>Terms of Use</Button>
                  </Label>
               </div>
            </div>

            <div className="mt-auto pt-4 flex items-center justify-between opacity-50 border-t border-border/30">
               <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest"><ShieldCheck className="h-3.5 w-3.5 text-brand-red" /> NTSA Verified</div>
               <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest"><Globe className="h-3.5 w-3.5 text-brand-red" /> Support 24/7</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <ContactExpertModal
      open={expertModalOpen}
      onOpenChange={setExpertModalOpen}
      carInfo={`${car.year} ${car.make} ${car.model}`}
    />
    </>
  );
};

export default QuickViewModal;
