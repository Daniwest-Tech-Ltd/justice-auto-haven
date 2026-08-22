import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Bike, Plus, Pencil, Trash2, ArrowLeft, Upload, X, RefreshCw } from "lucide-react";

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
  images: string[];
  stock_id: string | null;
  status: string | null;
  is_featured: boolean | null;
  yard_location: string | null;
}

const empty: Partial<Motorbike> = {
  make: "",
  model: "",
  year: new Date().getFullYear(),
  price: 0,
  engine_cc: null,
  transmission: "Manual",
  fuel_type: "Petrol",
  color: "",
  mileage: "",
  condition: "New",
  description: "",
  images: [],
  status: "available",
  is_featured: false,
  yard_location: "Westlands, Nairobi",
};

const MotorbikeManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bikes, setBikes] = useState<Motorbike[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<Partial<Motorbike>>(empty);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("motorbikes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load motorbikes", description: error.message, variant: "destructive" });
    } else {
      setBikes(((data || []) as any[]).map((b) => ({ ...b, images: Array.isArray(b.images) ? b.images : [] })) as Motorbike[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setForm({ ...empty });
    setOpen(true);
  };

  const openEdit = (b: Motorbike) => {
    setForm({ ...b, images: b.images || [] });
    setOpen(true);
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `motorbikes/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("car-images").upload(path, file, { upsert: false });
        if (error) throw error;
        const { data } = supabase.storage.from("car-images").getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      setForm((f) => ({ ...f, images: [...(f.images || []), ...uploaded] }));
      toast({ title: "Images uploaded", description: `${uploaded.length} file(s) added` });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url: string) => {
    setForm((f) => ({ ...f, images: (f.images || []).filter((u) => u !== url) }));
  };

  const setMainImage = (url: string) => {
    setForm((f) => {
      const imgs = (f.images || []).filter((u) => u !== url);
      return { ...f, images: [url, ...imgs] };
    });
  };

  const save = async () => {
    if (!form.make || !form.model || !form.year || !form.price) {
      toast({ title: "Missing fields", description: "Make, model, year and price are required (images are optional)", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload: any = {
      make: form.make,
      model: form.model,
      year: Number(form.year),
      price: Number(form.price),
      engine_cc: form.engine_cc ? Number(form.engine_cc) : null,
      transmission: form.transmission,
      fuel_type: form.fuel_type,
      color: form.color,
      mileage: form.mileage,
      condition: form.condition,
      description: form.description,
      images: form.images || [],
      status: form.status || "available",
      is_featured: !!form.is_featured,
      yard_location: form.yard_location,
    };
    let error;
    if (form.id) {
      ({ error } = await supabase.from("motorbikes").update(payload).eq("id", form.id));
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      payload.created_by = user?.id;
      ({ error } = await supabase.from("motorbikes").insert(payload));
    }
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: form.id ? "Motorbike updated" : "Motorbike added" });
      setOpen(false);
      load();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this motorbike permanently?")) return;
    const { error } = await supabase.from("motorbikes").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted" });
      load();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/admin-dashboard")} className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-xs font-mono mb-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                ADMIN // TERMINAL // MOTORBIKES
              </div>
              <h1 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                <Bike className="h-8 w-8 text-brand-red" />
                Motorbike Fleet Management
              </h1>
            </div>
          </div>
          <Button onClick={openNew} className="bg-brand-red hover:bg-brand-red/90 text-white font-bold uppercase tracking-widest px-6 h-12 shadow-xl">
            <Plus className="h-5 w-5 mr-2" />
            Add New Unit
          </Button>
        </div>

        <Card className="glass-strong border-border overflow-hidden">
          <CardHeader className="border-b border-border bg-secondary/10">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-black uppercase tracking-widest">Active Inventory Ledger ({bikes.length})</CardTitle>
              <div className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Live Database Terminal</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="py-20 text-center space-y-4">
                 <RefreshCw className="h-8 w-8 text-brand-red animate-spin mx-auto" />
                 <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Synchronizing Unit Data...</p>
              </div>
            ) : bikes.length === 0 ? (
              <div className="text-center py-20 bg-secondary/5 border border-dashed border-border rounded-xl">
                <Bike className="mx-auto h-16 w-16 text-muted-foreground/20 mb-4" />
                <h3 className="text-lg font-bold uppercase tracking-tight mb-2">No Units Found</h3>
                <p className="text-xs text-muted-foreground mb-6 uppercase tracking-widest">The motorbike inventory ledger is currently empty.</p>
                <Button onClick={openNew} variant="outline" className="border-brand-red/50 text-brand-red hover:bg-brand-red hover:text-white font-bold uppercase tracking-widest">
                  <Plus className="h-4 w-4 mr-2" />
                  Initialize First Unit
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {bikes.map((b) => (
                  <div
                    key={b.id}
                    className="group relative bg-background border border-border hover:border-brand-red/40 transition-all duration-300 flex flex-col h-full rounded-lg overflow-hidden hover:shadow-2xl"
                  >
                    <div className="aspect-[4/3] bg-muted relative overflow-hidden border-b border-border">
                      {b.images && b.images[0] ? (
                        <img src={b.images[0]} alt={`${b.make} ${b.model}`} className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Bike className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                        <Badge className="bg-primary text-white text-[7px] font-bold uppercase rounded-sm py-0.5 px-1.5 tracking-wider">
                           #{b.stock_id || 'UNIT'}
                        </Badge>
                      </div>
                      <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                         <Badge className={`text-white text-[7px] font-bold uppercase rounded-sm py-0.5 px-1.5 tracking-wider border-none ${b.status === 'sold' ? 'bg-red-600' : 'bg-green-600'}`}>
                            {b.status === 'sold' ? 'SOLD' : 'AVAILABLE'}
                         </Badge>
                      </div>
                      {b.is_featured && (
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-amber-500 text-white text-[7px] font-black uppercase tracking-widest">
                          Featured Unit
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <p className="font-black uppercase tracking-tight text-sm group-hover:text-brand-red transition-colors">
                          {b.make} {b.model}
                        </p>
                        <div className="flex justify-between items-center border-b border-border/50 pb-2 mb-2">
                           <p className="text-[10px] font-bold text-muted-foreground uppercase">{b.year} · {b.engine_cc ? `${b.engine_cc} CC` : "—"}</p>
                           <p className="text-sm font-black text-brand-red tracking-tighter italic">KSh {Number(b.price).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1 border-border/50 hover:bg-secondary font-bold uppercase tracking-widest text-[10px]" onClick={() => openEdit(b)}>
                          <Pencil className="h-3.5 w-3.5 mr-1 text-primary" /> Edit
                        </Button>
                        <Button size="sm" variant="outline" className="border-border/50 hover:bg-destructive/10 hover:text-destructive group/del" onClick={() => remove(b.id)}>
                          <Trash2 className="h-3.5 w-3.5 group-hover/del:scale-110 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Motorbike" : "Add Motorbike"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Make *</Label>
              <Input value={form.make || ""} onChange={(e) => setForm({ ...form, make: e.target.value })} placeholder="Yamaha" />
            </div>
            <div>
              <Label>Model *</Label>
              <Input value={form.model || ""} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="MT-09" />
            </div>
            <div>
              <Label>Year *</Label>
              <Input type="number" value={form.year || ""} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Price (KSh) *</Label>
              <Input type="number" value={form.price || ""} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Engine (cc)</Label>
              <Input type="number" value={form.engine_cc || ""} onChange={(e) => setForm({ ...form, engine_cc: e.target.value ? Number(e.target.value) : null })} />
            </div>
            <div>
              <Label>Color</Label>
              <Input value={form.color || ""} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            </div>
            <div>
              <Label>Transmission</Label>
              <Select value={form.transmission || "Manual"} onValueChange={(v) => setForm({ ...form, transmission: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manual">Manual</SelectItem>
                  <SelectItem value="Automatic">Automatic</SelectItem>
                  <SelectItem value="Semi-Automatic">Semi-Automatic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fuel Type</Label>
              <Select value={form.fuel_type || "Petrol"} onValueChange={(v) => setForm({ ...form, fuel_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Petrol">Petrol</SelectItem>
                  <SelectItem value="Electric">Electric</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Condition</Label>
              <Select value={form.condition || "New"} onValueChange={(v) => setForm({ ...form, condition: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Used">Used</SelectItem>
                  <SelectItem value="Foreign Used">Foreign Used</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status || "available"} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mileage</Label>
              <Input value={form.mileage || ""} onChange={(e) => setForm({ ...form, mileage: e.target.value })} placeholder="0 km" />
            </div>
            <div>
              <Label>Yard Location</Label>
              <Input value={form.yard_location || ""} onChange={(e) => setForm({ ...form, yard_location: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="featured"
                checked={!!form.is_featured}
                onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
              />
              <Label htmlFor="featured">Featured motorbike</Label>
            </div>

            {/* Images */}
            <div className="md:col-span-2">
              <Label>Images <span className="text-xs text-muted-foreground font-normal">(optional — first image is the main photo)</span></Label>
              <div className="mt-2">
                <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-md cursor-pointer hover:border-primary transition">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">
                    {uploading
                      ? "Uploading..."
                      : (form.images && form.images.length > 0)
                        ? "Upload more images"
                        : "Upload main image (and optional additional images)"}
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => handleUpload(e.target.files)}
                  />
                </label>
                {form.images && form.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {form.images.map((url, i) => (
                      <div key={url} className={`relative aspect-square rounded overflow-hidden border-2 ${i === 0 ? "border-primary" : "border-border"}`}>
                        <img src={url} alt="" className="object-cover w-full h-full" />
                        {i === 0 && (
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[9px] font-bold font-mono">MAIN</span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(url)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                          title="Remove"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {i !== 0 && (
                          <button
                            type="button"
                            onClick={() => setMainImage(url)}
                            className="absolute bottom-1 left-1 right-1 bg-background/90 text-foreground text-[9px] font-semibold py-0.5 rounded hover:bg-primary hover:text-primary-foreground transition"
                          >
                            Set as Main
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving..." : form.id ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MotorbikeManagement;
