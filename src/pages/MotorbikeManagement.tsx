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
import { Bike, Plus, Pencil, Trash2, ArrowLeft, Upload, X } from "lucide-react";

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

  const save = async () => {
    if (!form.make || !form.model || !form.year || !form.price) {
      toast({ title: "Missing fields", description: "Make, model, year and price are required", variant: "destructive" });
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
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin-dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full border border-primary/30 bg-primary/5 text-[10px] font-mono mb-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ADMIN // MOTORBIKES
              </div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Bike className="h-6 w-6 text-primary" />
                Motorbike Management
              </h1>
            </div>
          </div>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Motorbike
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inventory ({bikes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground py-8 text-center">Loading...</p>
            ) : bikes.length === 0 ? (
              <div className="text-center py-12">
                <Bike className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">No motorbikes yet.</p>
                <Button onClick={openNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first motorbike
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bikes.map((b) => (
                  <div
                    key={b.id}
                    className="border rounded-lg overflow-hidden bg-card hover:border-primary/50 transition"
                  >
                    <div className="aspect-video bg-muted relative">
                      {b.images && b.images[0] ? (
                        <img src={b.images[0]} alt={`${b.make} ${b.model}`} className="object-cover w-full h-full" />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Bike className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                      {b.is_featured && (
                        <Badge className="absolute top-2 right-2">FEATURED</Badge>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold leading-tight">
                            {b.make} {b.model}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {b.year} · {b.engine_cc ? `${b.engine_cc}cc` : "—"} · {b.status}
                          </p>
                        </div>
                        <div className="text-emerald-500 font-mono font-bold text-sm">
                          KSh {Number(b.price).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(b)}>
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => remove(b.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
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
              <Label>Images</Label>
              <div className="mt-2">
                <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-md cursor-pointer hover:border-primary transition">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">{uploading ? "Uploading..." : "Upload images"}</span>
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
                    {form.images.map((url) => (
                      <div key={url} className="relative aspect-square rounded overflow-hidden border">
                        <img src={url} alt="" className="object-cover w-full h-full" />
                        <button
                          type="button"
                          onClick={() => removeImage(url)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
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
