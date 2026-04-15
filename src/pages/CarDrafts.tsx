import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, Pencil, Trash2, Eye, FileText, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CarDrafts = () => {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cars")
      .select("*")
      .eq("is_draft", true)
      .order("created_at", { ascending: false });

    if (data) setDrafts(data);
    if (error) console.error("Error fetching drafts:", error);
    setLoading(false);
  };

  const publishDraft = async (id: string) => {
    const { error } = await supabase
      .from("cars")
      .update({ is_draft: false, status: "available", is_published: true } as any)
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: "Failed to publish", variant: "destructive" });
    } else {
      toast({ title: "Published!", description: "Car is now live on the catalogue" });

      // Send notification for newly published car
      const car = drafts.find(d => d.id === id);
      if (car) {
        supabase.functions.invoke("send-new-car-notification", {
          body: {
            carId: car.id, make: car.make, model: car.model, year: car.year,
            price: car.price, stockId: car.stock_id, imageUrl: car.images?.[0] || null,
            color: car.color, fuelType: car.fuel_type, transmission: car.transmission,
            mileage: car.mileage, isUpdate: false,
          },
        }).catch(() => {});
      }
      fetchDrafts();
    }
  };

  const deleteDraft = async (id: string) => {
    const { error } = await supabase.from("cars").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete draft", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Draft removed" });
      fetchDrafts();
    }
  };

  const filtered = drafts.filter(d =>
    `${d.make} ${d.model} ${d.stock_id || ""}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-KE", {
      dateStyle: "medium", timeStyle: "short",
    });
  };

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/cars")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Car Drafts</h1>
            <p className="text-muted-foreground">{drafts.length} draft(s) saved</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search drafts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stock ID</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Saved On</TableHead>
                  <TableHead>Completeness</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">Loading drafts...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No drafts found</TableCell></TableRow>
                ) : (
                  filtered.map((draft) => {
                    const fields = [draft.make, draft.model, draft.price, draft.fuel_type, draft.transmission, draft.color, draft.engine];
                    const filled = fields.filter(Boolean).length;
                    const pct = Math.round((filled / fields.length) * 100);
                    return (
                      <TableRow key={draft.id}>
                        <TableCell className="font-mono text-sm">{draft.stock_id || "—"}</TableCell>
                        <TableCell className="font-medium">{draft.year} {draft.make || "—"} {draft.model || "—"}</TableCell>
                        <TableCell>{draft.price ? `KSh ${Number(draft.price).toLocaleString()}` : "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(draft.created_at)}</TableCell>
                        <TableCell>
                          <Badge variant={pct >= 80 ? "default" : pct >= 50 ? "secondary" : "destructive"}>
                            {pct}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/admin/cars/edit/${draft.id}`)}>
                            <Pencil className="h-3 w-3 mr-1" /> Edit
                          </Button>
                          <Button size="sm" onClick={() => publishDraft(draft.id)}>
                            <Send className="h-3 w-3 mr-1" /> Publish
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteDraft(draft.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CarDrafts;
