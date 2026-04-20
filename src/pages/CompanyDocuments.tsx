import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Pencil, Trash2, Plus, FileText, ExternalLink, Star, StarOff } from "lucide-react";

interface CompanyDocument {
  id: string;
  document_type: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string | null;
  certificate_number: string | null;
  issue_date: string | null;
  expiry_date: string | null;
  issuing_authority: string | null;
  status: string;
  is_featured: boolean;
  display_order: number;
  created_at: string;
}

const emptyForm = {
  document_type: "certificate",
  title: "",
  description: "",
  certificate_number: "",
  issue_date: "",
  expiry_date: "",
  issuing_authority: "",
  status: "active",
  is_featured: false,
  display_order: 0,
};

const CompanyDocuments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [docs, setDocs] = useState<CompanyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyDocument | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("company_documents")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error loading documents", description: error.message, variant: "destructive" });
    } else {
      setDocs((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setFile(null);
    setDialogOpen(true);
  };

  const openEdit = (doc: CompanyDocument) => {
    setEditing(doc);
    setForm({
      document_type: doc.document_type,
      title: doc.title,
      description: doc.description || "",
      certificate_number: doc.certificate_number || "",
      issue_date: doc.issue_date || "",
      expiry_date: doc.expiry_date || "",
      issuing_authority: doc.issuing_authority || "",
      status: doc.status,
      is_featured: doc.is_featured,
      display_order: doc.display_order,
    });
    setFile(null);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      let file_url = editing?.file_url || "";
      let file_name = editing?.file_name || null;
      let file_size: number | null = null;
      let mime_type: string | null = null;

      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("company-documents")
          .upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("company-documents").getPublicUrl(path);
        file_url = urlData.publicUrl;
        file_name = file.name;
        file_size = file.size;
        mime_type = file.type;
      }

      if (!file_url && !editing) {
        toast({ title: "File required", description: "Please upload a document file", variant: "destructive" });
        setSubmitting(false);
        return;
      }

      const payload: any = {
        ...form,
        file_url,
        file_name,
        issue_date: form.issue_date || null,
        expiry_date: form.expiry_date || null,
      };
      if (file_size) payload.file_size = file_size;
      if (mime_type) payload.mime_type = mime_type;

      if (editing) {
        const { error } = await supabase.from("company_documents").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Document updated" });
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        payload.uploaded_by = user?.id;
        const { error } = await supabase.from("company_documents").insert(payload);
        if (error) throw error;
        toast({ title: "Document uploaded successfully" });
      }
      setDialogOpen(false);
      load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document? This action cannot be undone.")) return;
    const { error } = await supabase.from("company_documents").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Document deleted" });
      load();
    }
  };

  const toggleFeatured = async (doc: CompanyDocument) => {
    const { error } = await supabase
      .from("company_documents")
      .update({ is_featured: !doc.is_featured })
      .eq("id", doc.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      load();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/admin-dashboard")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Upload New Document
        </Button>
      </div>

      <div className="glass-strong rounded-3xl p-8">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Company Documents</h1>
        </div>
        <p className="text-muted-foreground">
          Manage official company documents — certificates, profiles, licenses, and permits. Active documents are displayed on the public website.
        </p>
      </div>

      {loading ? (
        <div className="glass-strong rounded-2xl p-12 text-center text-muted-foreground">Loading documents…</div>
      ) : docs.length === 0 ? (
        <div className="glass-strong rounded-2xl p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No documents yet. Upload your first company document.</p>
          <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Upload Document</Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {docs.map((doc) => (
            <div key={doc.id} className="glass-strong rounded-2xl p-6 space-y-4 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs uppercase tracking-wide text-primary font-semibold">{doc.document_type}</span>
                    {doc.is_featured && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                  </div>
                  <h3 className="font-bold truncate">{doc.title}</h3>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  doc.status === "active" ? "bg-green-500/20 text-green-700 dark:text-green-400" :
                  doc.status === "expired" ? "bg-red-500/20 text-red-700 dark:text-red-400" :
                  "bg-muted text-muted-foreground"
                }`}>{doc.status}</span>
              </div>

              {doc.file_url && (
                <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="block aspect-video bg-secondary/30 rounded-lg overflow-hidden border border-border hover:border-primary transition">
                  {doc.file_url.match(/\.(png|jpg|jpeg|webp|gif)$/i) ? (
                    <img src={doc.file_url} alt={doc.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground"><FileText className="h-12 w-12" /></div>
                  )}
                </a>
              )}

              <div className="text-xs text-muted-foreground space-y-1 flex-1">
                {doc.certificate_number && <div>Cert No: <span className="text-foreground">{doc.certificate_number}</span></div>}
                {doc.issue_date && <div>Issued: <span className="text-foreground">{doc.issue_date}</span></div>}
                {doc.issuing_authority && <div className="truncate">Authority: <span className="text-foreground">{doc.issuing_authority}</span></div>}
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                <Button size="sm" variant="outline" onClick={() => openEdit(doc)} className="gap-1"><Pencil className="h-3 w-3" /> Edit</Button>
                <Button size="sm" variant="outline" onClick={() => toggleFeatured(doc)} className="gap-1">
                  {doc.is_featured ? <><StarOff className="h-3 w-3" /> Unfeature</> : <><Star className="h-3 w-3" /> Feature</>}
                </Button>
                <Button size="sm" variant="outline" asChild className="gap-1">
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3 w-3" /> View</a>
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(doc.id)} className="gap-1"><Trash2 className="h-3 w-3" /> Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Document" : "Upload New Document"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Document Type</Label>
                <Select value={form.document_type} onValueChange={(v) => setForm({ ...form, document_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="certificate">Certificate</SelectItem>
                    <SelectItem value="profile">Company Profile</SelectItem>
                    <SelectItem value="license">License</SelectItem>
                    <SelectItem value="permit">Permit</SelectItem>
                    <SelectItem value="incorporation">Certificate of Incorporation</SelectItem>
                    <SelectItem value="kra">KRA Compliance</SelectItem>
                    <SelectItem value="ntsa">NTSA License</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active (Public)</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Certificate of Professional Qualification" />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Certificate Number</Label>
                <Input value={form.certificate_number} onChange={(e) => setForm({ ...form, certificate_number: e.target.value })} placeholder="e.g. ULT-KE-2025-2581" />
              </div>
              <div>
                <Label>Issuing Authority</Label>
                <Input value={form.issuing_authority} onChange={(e) => setForm({ ...form, issuing_authority: e.target.value })} placeholder="e.g. Republic of Kenya" />
              </div>
              <div>
                <Label>Issue Date</Label>
                <Input type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>Document File {editing ? "(leave empty to keep existing)" : "*"}</Label>
              <Input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              {editing?.file_name && !file && <p className="text-xs text-muted-foreground mt-1">Current: {editing.file_name}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Display Order</Label>
                <Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="h-4 w-4" />
                  <span>Featured (highlight on homepage)</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
              <Upload className="h-4 w-4" />
              {submitting ? "Saving..." : editing ? "Update Document" : "Upload Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyDocuments;
