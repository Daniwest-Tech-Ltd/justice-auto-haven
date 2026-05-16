import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import LoadingScreen from "@/components/LoadingScreen";
import { Bike, Gauge, Fuel, Search, Cpu, Zap } from "lucide-react";
import useDisableRightClick from "@/hooks/useDisableRightClick";

interface Motorbike {
  id: string;
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
  images: any;
  stock_id: string | null;
  status: string | null;
  is_featured: boolean | null;
  yard_location: string | null;
}

const MotorbikeCatalogue = () => {
  useDisableRightClick();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bikes, setBikes] = useState<Motorbike[]>([]);
  const [search, setSearch] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let mounted = true;
    const t = setInterval(() => {
      setProgress((p) => (p >= 95 ? p : p + 5));
    }, 60);
    (async () => {
      const { data, error } = await supabase
        .from("motorbikes")
        .select("*")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (mounted) {
        if (!error) setBikes((data || []) as Motorbike[]);
        setProgress(100);
        setTimeout(() => mounted && setLoading(false), 200);
      }
    })();
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bikes;
    return bikes.filter((b) =>
      [b.make, b.model, String(b.year), b.color, b.stock_id]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [bikes, search]);

  if (loading) return <LoadingScreen />;

  const getImage = (b: Motorbike) => {
    const imgs = Array.isArray(b.images) ? b.images : [];
    return imgs[0] || null;
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Tech loading bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-transparent z-50">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 via-primary to-emerald-400 transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.7)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Grid backdrop */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="container mx-auto px-4 py-8 relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-xs font-mono mb-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              SYSTEM // MOTORBIKES
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
              <Bike className="h-8 w-8 text-primary" />
              Motorbike Catalogue
            </h1>
            <p className="text-muted-foreground mt-1">
              Premium motorbikes — sport, cruiser, adventure & commuter
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/catalogue")}>CARS</Button>
            <Button variant="outline" onClick={() => navigate("/rental-catalogue")}>RENT</Button>
            <Button variant="outline" onClick={() => navigate("/trade-in-submission")}>TRADE IN</Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-xl mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search make, model, year, color, stock ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 font-mono"
          />
        </div>

        {filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <Bike className="mx-auto h-14 w-14 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No motorbikes available yet. Check back soon.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((b) => {
              const img = getImage(b);
              return (
                <Card
                  key={b.id}
                  onClick={() => navigate(`/motorbike/${b.stock_id || b.id}`)}
                  className="group overflow-hidden border-2 border-primary/30 bg-card/95 backdrop-blur-md hover:border-primary transition-all hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.6)] relative cursor-pointer select-none"
                  onContextMenu={(e) => e.preventDefault()}
                >
                  {/* Tech accent corner */}
                  <span className="absolute top-0 left-0 h-px w-12 bg-gradient-to-r from-emerald-400 to-transparent" />
                  <span className="absolute top-0 left-0 w-px h-12 bg-gradient-to-b from-emerald-400 to-transparent" />

                  <div className="aspect-video bg-muted relative overflow-hidden">
                    {img ? (
                      <img
                        src={img}
                        alt={`${b.make} ${b.model} ${b.year}`}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Bike className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                    {b.is_featured && (
                      <Badge className="absolute top-2 right-2 bg-primary/90 backdrop-blur">
                        FEATURED
                      </Badge>
                    )}
                    {b.stock_id && (
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-background/80 backdrop-blur text-xs font-mono border border-border">
                        {b.stock_id}
                      </div>
                    )}
                  </div>

                  <CardContent className="pt-4">
                    <h3 className="font-bold text-lg leading-tight">
                      {b.make} {b.model}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono mb-3">
                      {b.year} · {b.condition || "—"}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {b.engine_cc && (
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          <Cpu className="h-3 w-3 mr-1" />
                          {b.engine_cc}cc
                        </Badge>
                      )}
                      {b.transmission && (
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          <Gauge className="h-3 w-3 mr-1" />
                          {b.transmission}
                        </Badge>
                      )}
                      {b.fuel_type && (
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          <Fuel className="h-3 w-3 mr-1" />
                          {b.fuel_type}
                        </Badge>
                      )}
                      {b.color && (
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {b.color}
                        </Badge>
                      )}
                    </div>

                    {/* Money-green tech price tile */}
                    <div className="relative inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500/15 via-green-500/20 to-emerald-500/15 border border-emerald-400/40 shadow-[0_0_18px_-5px_rgba(16,185,129,0.6)] backdrop-blur-sm overflow-hidden">
                      <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-400 to-green-600 animate-pulse" />
                      <Zap className="h-3.5 w-3.5 text-emerald-300" />
                      <span className="text-emerald-400 font-mono text-xs font-bold">KSh</span>
                      <span className="text-xl font-extrabold font-mono tabular-nums text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.7)]">
                        {Number(b.price).toLocaleString()}
                      </span>
                    </div>
                  </CardContent>

                  <CardFooter className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => window.open(`https://wa.me/254722827458?text=Hi, I'm interested in ${b.make} ${b.model} ${b.year} (${b.stock_id || b.id})`, "_blank")}
                    >
                      Enquire
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => window.open("tel:+254722827458")}
                    >
                      Call
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MotorbikeCatalogue;
