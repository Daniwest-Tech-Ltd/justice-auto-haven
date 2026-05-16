import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronLeft, ChevronRight, Phone, Mail, MessageCircle, ArrowLeft, Download,
  Bike, Cpu, Gauge, Fuel, MapPin, Zap,
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { useToast } from "@/hooks/use-toast";
import { downloadImageWithWatermark } from "@/lib/watermark";
import useDisableRightClick from "@/hooks/useDisableRightClick";

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
    <div className="min-h-screen bg-background select-none">
      <div className="bg-primary/10 py-4">
        <div className="container mx-auto px-4 text-sm flex items-center gap-2">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>—</span>
          <Link to="/motorbikes" className="hover:text-primary">Motorbikes</Link>
          <span>—</span>
          <span className="font-semibold">{bike.make} {bike.model}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => navigate("/motorbikes")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Motorbikes
        </Button>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Gallery */}
          <div className="space-y-4">
            <div
              className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted"
              onContextMenu={(e) => e.preventDefault()}
            >
              {images.length > 0 ? (
                <img
                  src={current}
                  alt={`${bike.make} ${bike.model}`}
                  className="h-full w-full object-cover pointer-events-none"
                  draggable={false}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Bike className="h-20 w-20 text-muted-foreground" />
                </div>
              )}

              {images.length > 1 && (
                <>
                  <Button variant="secondary" size="icon" className="absolute left-4 top-1/2 -translate-y-1/2"
                    onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" size="icon" className="absolute right-4 top-1/2 -translate-y-1/2"
                    onClick={() => setIdx((i) => (i + 1) % images.length)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1 text-xs text-white font-mono">
                    {idx + 1} / {images.length}
                  </div>
                </>
              )}
              {images.length > 0 && (
                <Button variant="secondary" size="icon" className="absolute bottom-4 right-4"
                  onClick={download} title="Download image with watermark">
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setIdx(i)}
                    className={`flex-shrink-0 overflow-hidden rounded-md border-2 ${i === idx ? "border-primary" : "border-transparent"}`}>
                    <img src={img} alt={`v${i + 1}`} className="h-20 w-20 object-cover pointer-events-none" draggable={false} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-xs font-mono mb-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                MOTORBIKE // DETAILS
              </div>
              <h1 className="mb-2 text-4xl font-bold flex items-center gap-2">
                <Bike className="h-8 w-8 text-primary" />
                {bike.make} {bike.model}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xl font-semibold text-primary">{bike.year}</span>
                {bike.status && (
                  <Badge variant={bike.status === "available" ? "default" : "secondary"}>
                    {bike.status}
                  </Badge>
                )}
                {bike.is_featured && <Badge className="bg-amber-500">FEATURED</Badge>}
              </div>
            </div>

            {/* Money-green price tile */}
            <div className="relative inline-flex items-center gap-3 px-5 py-3 rounded-lg bg-gradient-to-r from-emerald-500/20 via-green-500/25 to-emerald-500/20 border border-emerald-400/50 shadow-[0_0_25px_-5px_rgba(16,185,129,0.7)] backdrop-blur-sm overflow-hidden">
              <span className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-emerald-400 to-green-600 animate-pulse" />
              <Zap className="h-5 w-5 text-emerald-300" />
              <span className="text-emerald-400 font-mono text-base font-bold">KSh</span>
              <span className="text-3xl font-extrabold font-mono tabular-nums text-emerald-300 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]">
                {Number(bike.price).toLocaleString()}
              </span>
            </div>

            <div className="space-y-3">
              <a href="tel:+254722827458"><Button className="w-full bg-green-600 hover:bg-green-700" size="lg"><Phone className="mr-2 h-5 w-5" /> +254 722 827 458</Button></a>
              <a href={enquireUrl} target="_blank" rel="noopener noreferrer"><Button className="w-full bg-green-500 hover:bg-green-600" size="lg"><MessageCircle className="mr-2 h-5 w-5" /> WhatsApp Enquiry</Button></a>
              <a href="mailto:justicevincentt@gmail.com"><Button variant="outline" className="w-full" size="lg"><Mail className="mr-2 h-5 w-5" /> Email</Button></a>
            </div>

            {bike.stock_id && (
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">Stock ID</p>
                <p className="font-semibold font-mono">{bike.stock_id}</p>
              </div>
            )}
          </div>
        </div>

        {/* Overview */}
        <Card className="mt-12 bg-card/95 backdrop-blur">
          <CardContent className="p-8">
            <h2 className="mb-6 text-3xl font-bold">Overview</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Spec label="Make" value={bike.make} />
              <Spec label="Model" value={bike.model} />
              <Spec label="Year" value={String(bike.year)} />
              <Spec label="Engine" value={bike.engine_cc ? `${bike.engine_cc} cc` : "—"} icon={<Cpu className="h-4 w-4" />} />
              <Spec label="Transmission" value={bike.transmission || "—"} icon={<Gauge className="h-4 w-4" />} />
              <Spec label="Fuel Type" value={bike.fuel_type || "—"} icon={<Fuel className="h-4 w-4" />} />
              <Spec label="Mileage" value={bike.mileage || "—"} />
              <Spec label="Color" value={bike.color || "—"} />
              <Spec label="Condition" value={bike.condition || "—"} />
              <Spec label="Yard Location" value={bike.yard_location || "—"} icon={<MapPin className="h-4 w-4" />} />
            </div>
            {bike.description && (
              <div className="mt-6">
                <p className="text-muted-foreground mb-2">Description</p>
                <p className="leading-relaxed">{bike.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Spec = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => (
  <div>
    <p className="text-muted-foreground text-sm flex items-center gap-1">{icon}{label}</p>
    <p className="font-semibold">{value}</p>
  </div>
);

export default MotorbikeDetails;
