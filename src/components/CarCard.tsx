import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, ChevronLeft, ChevronRight, MessageCircle, ArrowRight, Eye } from "lucide-react";

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  fuel_type: string | null;
  transmission: string | null;
  mileage: string | null;
  status: string | null;
  color: string | null;
  engine: string | null;
  images: any;
  stock_id: string | null;
  is_featured: boolean | null;
  created_at: string | null;
  yard_location: string | null;
  units_available?: number | null;
}

export const CarCard = ({ car, isWhitelisted, onToggleWishlist, onQuickView, onZoom }: {
  car: Car,
  isWhitelisted: boolean,
  onToggleWishlist: (e: React.MouseEvent, id: string) => void,
  onQuickView: (e: React.MouseEvent, car: Car) => void,
  onZoom?: (images: string[], title: string) => void
}) => {
  const navigate = useNavigate();
  const [currentIdx, setCurrentIdx] = useState(0);

  const getImages = (car: any): string[] => {
    if (car.main_images) {
      const parsed = typeof car.main_images === 'string' ? JSON.parse(car.main_images) : car.main_images;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    if (car.images) {
      const parsed = typeof car.images === 'string' ? JSON.parse(car.images) : car.images;
      return Array.isArray(parsed) ? parsed : [parsed];
    }
    return ["/placeholder.svg"];
  };

  const images = getImages(car);

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev + 1) % images.length);
  };

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleZoom = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onZoom) onZoom(images, `${car.make} ${car.model}`);
  };

  const whatsappLink = `https://wa.me/254722827458?text=${encodeURIComponent(`Hello, I'm inquiring about the ${car.year} ${car.make} ${car.model} (Stock: ${car.stock_id || car.id.slice(0,8)}) seen on your platform.`)}`;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col h-full group border border-slate-100 dark:border-slate-800">
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800" onClick={handleZoom}>
        <img
          src={images[currentIdx]}
          alt={car.model}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 cursor-zoom-in"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3">
          <Badge className="bg-white text-slate-900 border-none rounded-full px-4 py-1.5 font-black shadow-lg text-xs uppercase tracking-tight">
            {car.year}
          </Badge>
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-2">
          {car.status === 'sold' ? (
            <div className="bg-red-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xl uppercase tracking-widest border border-white/10">
               Sold Out
            </div>
          ) : (
            <div className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-2 shadow-xl uppercase tracking-widest border border-white/10">
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              In Stock
            </div>
          )}
          <button
            onClick={(e) => onToggleWishlist(e, car.id)}
            className={`h-9 w-9 rounded-full flex items-center justify-center transition-all shadow-lg backdrop-blur-md ${isWhitelisted ? 'bg-brand-red text-white' : 'bg-white/20 text-white hover:bg-white hover:text-slate-900 border border-white/20'}`}
          >
            <Heart className={`h-4.5 w-4.5 ${isWhitelisted ? 'fill-white' : ''}`} />
          </button>
          <button
            onClick={(e) => onQuickView(e, car)}
            className="h-9 w-9 rounded-full bg-white/20 text-white hover:bg-white hover:text-slate-900 border border-white/20 flex items-center justify-center transition-all shadow-lg backdrop-blur-md group-hover:bg-white group-hover:text-slate-900"
            title="Quick View"
          >
            <Eye className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Bottom Overlays */}
        <div className="absolute bottom-3 left-3">
          <div className="bg-black/40 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-lg flex items-center gap-2 uppercase tracking-[0.2em] border border-white/5">
            <MapPin className="h-3.5 w-3.5 text-emerald-400" />
            {car.yard_location?.split(',')[0] || 'NAIROBI'}
          </div>
        </div>

        <div className="absolute bottom-3 right-3">
          <div className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-black px-2.5 py-1 rounded-md border border-white/10">
            {currentIdx + 1}/{images.length}
          </div>
        </div>

        {/* Nav Arrows - Visible on hover */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImg}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/20 hover:bg-white/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextImg}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/20 hover:bg-white/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 space-y-3">
        {/* Thumbnails */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {images.slice(0, 4).map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrentIdx(i)}
              className={`h-10 w-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${currentIdx === i ? 'border-emerald-500' : 'border-transparent'}`}
            >
              <img src={img} className="h-full w-full object-cover" alt="" />
            </button>
          ))}
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Stock ID: {car.stock_id || car.id.slice(0, 8).toUpperCase()}
          </p>
          <div className="flex justify-between items-center gap-2">
            <h3 className="font-black text-slate-900 dark:text-white uppercase leading-tight italic group-hover:text-emerald-600 transition-colors">
              {car.make} {car.model}
            </h3>
            <div className="flex flex-col items-end gap-1">
              <div className="bg-brand-red/5 px-2 py-1 rounded-lg border border-brand-red/10">
                <p className="text-lg font-black text-brand-red whitespace-nowrap drop-shadow-sm leading-none">
                  <span className="text-[9px] font-bold mr-0.5 opacity-70">KSh</span>{car.price?.toLocaleString()}
                </p>
              </div>
              <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tighter leading-none animate-pulse text-right">
                Lipa Mdogo Mdogo ...Deposit Available
              </span>
            </div>
          </div>
        </div>

        {/* Spec Chips */}
        <div className="flex flex-wrap gap-2">
          <div className="bg-slate-50 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
            {car.mileage || '0 KM'}
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
            {car.transmission?.slice(0, 4) || 'AUTO'}
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
            {car.engine || 'N/A'}
          </div>
          <div className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded text-[9px] font-bold uppercase">
            {car.fuel_type || 'PETROL'}
          </div>
        </div>

        {/* Action Buttons - Always Visible */}
        <div className="pt-2 space-y-2 mt-auto">
          <Button
            className="w-full bg-[#25D366] hover:bg-[#20ba54] text-white font-bold rounded-lg h-12 shadow-md transition-all flex items-center justify-center gap-2.5 border-none"
            asChild
          >
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 fill-white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.375-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.87 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.438 9.886-9.886 9.886m11.415-15.813A11.923 11.923 0 0012.046 2.5a12.05 12.05 0 00-12.04 12.05c0 2.096.547 4.142 1.588 5.945L.057 24l4.3-.113a11.961 11.961 0 005.692 1.448h.005c6.647 0 12.054-5.406 12.057-12.056 0-3.22-1.258-6.248-3.543-8.529"/>
              </svg>
              Inquire Price
            </a>
          </Button>
          <Button
            variant="default"
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg h-12 transition-all flex items-center justify-center gap-2"
            onClick={() => navigate(`/car/${car.id}`)}
          >
            View Details
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
