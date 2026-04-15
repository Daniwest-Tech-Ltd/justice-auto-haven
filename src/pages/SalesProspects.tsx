import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Search, Plus, Bell, Send, Trash2, Edit, UserPlus, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SalesProspects = () => {
  const [prospects, setProspects] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "", email: "", phone: "", interest: "", source: "manual",
    status: "new", notes: "", reminder_date: "",
  });

  useEffect(() => { fetchProspects(); }, []);

  const fetchProspects = async () => {
    const { data } = await supabase
      .from("sales_prospects")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setProspects(data);
  };

  const resetForm = () => setForm({ name: "", email: "", phone: "", interest: "", source: "manual", status: "new", notes: "", reminder_date: "" });

  const handleAdd = async () => {
    if (!form.name) return toast({ title: "Name required", variant: "destructive" });
    setLoading(true);
    const { error } = await supabase.from("sales_prospects").insert({
      ...form,
      reminder_date: form.reminder_date || null,
      assigned_to: user?.id,
    } as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Prospect Added" });
      resetForm();
      setAddDialog(false);
      fetchProspects();
    }
    setLoading(false);
  };

  const handleUpdate = async () => {
    if (!selectedProspect) return;
    setLoading(true);
    const { error } = await supabase.from("sales_prospects").update({
      ...form,
      reminder_date: form.reminder_date || null,
    } as any).eq("id", selectedProspect.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated" });
      setEditDialog(false);
      fetchProspects();
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("sales_prospects").delete().eq("id", id);
    toast({ title: "Deleted" });
    fetchProspects();
  };

  const sendReminder = async (prospect: any) => {
    if (!prospect.email) return toast({ title: "No email set", variant: "destructive" });
    try {
      await supabase.functions.invoke("send-notifications", {
        body: {
          type: "prospect_reminder",
          to: prospect.email,
          subject: "Follow-Up from Justice Ultimate Automobiles",
          html: `
            <div style="font-family:Arial;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
              <div style="background:linear-gradient(135deg,#f59e0b,#ea580c);padding:30px;text-align:center">
                <h1 style="color:#fff;margin:0">🚗 Justice Ultimate Automobiles</h1>
              </div>
              <div style="padding:30px">
                <h2 style="color:#1f2937">Hello ${prospect.name}! 👋</h2>
                <p style="color:#4b5563;line-height:1.8">
                  We noticed you showed interest in ${prospect.interest || "our vehicles"}. 
                  We'd love to help you find your dream car!
                </p>
                <p style="color:#4b5563">Our expert team is ready to assist with financing, test drives, and more.</p>
                <div style="text-align:center;margin:30px 0">
                  <a href="https://www.justiceultimateautomobiles.com/catalogue" 
                     style="background:linear-gradient(135deg,#f59e0b,#ea580c);color:#fff;padding:14px 36px;text-decoration:none;border-radius:8px;font-weight:600">
                    Browse Cars Now →
                  </a>
                </div>
                <div style="background:#f9fafb;padding:20px;border-radius:8px;margin-top:20px">
                  <p style="color:#6b7280;margin:0">📍 Westlands, Muthithi Road, Nairobi<br>📞 <a href="tel:0722827458" style="color:#f59e0b">0722827458</a></p>
                </div>
              </div>
              <div style="background:#1f2937;padding:20px;text-align:center">
                <p style="color:#9ca3af;margin:0;font-size:13px">© 2026 Justice Ultimate Automobiles</p>
              </div>
            </div>
          `,
        },
      });

      await supabase.from("sales_prospects").update({ reminder_sent: true } as any).eq("id", prospect.id);
      toast({ title: "Reminder Sent", description: `Email sent to ${prospect.email}` });
      fetchProspects();
    } catch {
      toast({ title: "Failed to send", variant: "destructive" });
    }
  };

  const openEdit = (p: any) => {
    setSelectedProspect(p);
    setForm({
      name: p.name, email: p.email || "", phone: p.phone || "",
      interest: p.interest || "", source: p.source || "manual",
      status: p.status || "new", notes: p.notes || "",
      reminder_date: p.reminder_date ? p.reminder_date.split("T")[0] : "",
    });
    setEditDialog(true);
  };

  const filtered = prospects.filter(p =>
    `${p.name} ${p.email || ""} ${p.phone || ""} ${p.interest || ""}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColor = (s: string) => {
    if (s === "hot") return "destructive";
    if (s === "warm") return "default";
    if (s === "converted") return "secondary";
    return "outline";
  };

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString("en-KE") : "—";

  const ProspectForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
        <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
        <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
        <div><Label>Interest</Label><Input placeholder="e.g. Toyota Prado" value={form.interest} onChange={e => setForm({...form, interest: e.target.value})} /></div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
              <SelectItem value="hot">Hot</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Source</Label>
          <Select value={form.source} onValueChange={v => setForm({...form, source: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
              <SelectItem value="social_media">Social Media</SelectItem>
              <SelectItem value="walk_in">Walk-In</SelectItem>
              <SelectItem value="phone">Phone Call</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Reminder Date</Label>
          <Input type="date" value={form.reminder_date} onChange={e => setForm({...form, reminder_date: e.target.value})} />
        </div>
      </div>
      <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
      <DialogFooter>
        <Button onClick={onSubmit} disabled={loading}>{loading ? "Saving..." : submitLabel}</Button>
      </DialogFooter>
    </div>
  );

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Sales Prospects</h1>
              <p className="text-muted-foreground">{prospects.length} prospects tracked</p>
            </div>
          </div>
          <Button onClick={() => { resetForm(); setAddDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add Prospect
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {["new", "contacted", "warm", "hot", "converted"].map(s => (
            <Card key={s}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{prospects.filter(p => p.status === s).length}</p>
                <p className="text-sm text-muted-foreground capitalize">{s}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search prospects..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reminder</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No prospects found</TableCell></TableRow>
                ) : filtered.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-sm">
                      {p.email && <div>{p.email}</div>}
                      {p.phone && <div className="text-muted-foreground">{p.phone}</div>}
                    </TableCell>
                    <TableCell>{p.interest || "—"}</TableCell>
                    <TableCell><Badge variant={statusColor(p.status) as any}>{p.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{formatDate(p.reminder_date)}</span>
                        {p.reminder_sent && <Badge variant="outline" className="text-xs ml-1">Sent</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(p.created_at)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="outline" onClick={() => openEdit(p)}><Edit className="h-3 w-3" /></Button>
                      <Button size="sm" variant="outline" onClick={() => sendReminder(p)} disabled={!p.email}>
                        <Send className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-3 w-3" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Dialog */}
        <Dialog open={addDialog} onOpenChange={setAddDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle><UserPlus className="h-5 w-5 inline mr-2" />Add New Prospect</DialogTitle></DialogHeader>
            <ProspectForm onSubmit={handleAdd} submitLabel="Add Prospect" />
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle><Edit className="h-5 w-5 inline mr-2" />Edit Prospect</DialogTitle></DialogHeader>
            <ProspectForm onSubmit={handleUpdate} submitLabel="Update" />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SalesProspects;
