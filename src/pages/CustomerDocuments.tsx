import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Search, Upload, Download, FileText, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DOCUMENT_TYPES = [
  { value: "id", label: "National ID" },
  { value: "kra", label: "KRA PIN Certificate" },
  { value: "account_statement", label: "Bank Account Statement" },
  { value: "logbook", label: "Logbook" },
  { value: "insurance", label: "Insurance" },
  { value: "receipt", label: "Receipt" },
  { value: "other", label: "Other" },
];

const CustomerDocuments = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [form, setForm] = useState({ customerName: "", customerEmail: "", customerPhone: "", documentType: "id", notes: "", carInfo: "" });
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => { fetchDocuments(); }, []);

  const fetchDocuments = async () => {
    const { data } = await supabase.from("customer_documents").select("*").order("created_at", { ascending: false });
    if (data) setDocuments(data);
  };

  const handleUpload = async () => {
    if (!selectedFile || !form.customerName) return;
    setUploading(true);
    try {
      const filePath = `${Date.now()}-${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage.from("customer-documents").upload(filePath, selectedFile);
      if (uploadError) throw uploadError;

      await supabase.from("customer_documents").insert({
        customer_name: form.customerName,
        customer_email: form.customerEmail,
        customer_phone: form.customerPhone,
        document_type: form.documentType,
        file_name: selectedFile.name,
        file_path: filePath,
        file_size: selectedFile.size,
        file_type: selectedFile.type,
        car_info: form.carInfo,
        uploaded_by: user?.id,
        notes: form.notes,
      });

      toast({ title: "Document Uploaded", description: `${selectedFile.name} stored successfully` });
      setUploadDialog(false);
      setSelectedFile(null);
      setForm({ customerName: "", customerEmail: "", customerPhone: "", documentType: "id", notes: "", carInfo: "" });
      fetchDocuments();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    const { data } = await supabase.storage.from("customer-documents").download(filePath);
    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
    }
  };

  const filteredDocs = documents.filter((d) => {
    const q = searchQuery.toLowerCase();
    return (d.customer_name || "").toLowerCase().includes(q) ||
      (d.file_name || "").toLowerCase().includes(q) ||
      (d.document_type || "").toLowerCase().includes(q) ||
      (d.car_info || "").toLowerCase().includes(q) ||
      new Date(d.created_at).getFullYear().toString().includes(q);
  });

  const formatDate = (d: string) => new Date(d).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" });
  const formatSize = (bytes: number) => bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/hr")}><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="text-3xl font-bold">Customer Documents</h1>
              <p className="text-muted-foreground">Upload, store & manage customer files securely</p>
            </div>
          </div>
          <Button onClick={() => setUploadDialog(true)}><Upload className="mr-2 h-4 w-4" />Upload Document</Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center flex-wrap gap-2">
              <CardTitle>All Documents ({filteredDocs.length})</CardTitle>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name, type, date, year..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Car Info</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocs.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.customer_name}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{doc.document_type?.replace(/_/g, " ")}</Badge></TableCell>
                      <TableCell className="text-sm">{doc.file_name}</TableCell>
                      <TableCell className="text-sm">{doc.file_size ? formatSize(doc.file_size) : "—"}</TableCell>
                      <TableCell className="text-sm">{doc.car_info || "—"}</TableCell>
                      <TableCell className="text-sm">{formatDate(doc.created_at)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleDownload(doc.file_path, doc.file_name)}>
                          <Download className="h-3 w-3 mr-1" />Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredDocs.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No documents found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Upload Dialog */}
        <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload Customer Document</DialogTitle>
              <DialogDescription>Upload ID, KRA, account statements or other files</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div><Label>Customer Name *</Label><Input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} /></div>
              <div><Label>Customer Email</Label><Input type="email" value={form.customerEmail} onChange={e => setForm({ ...form, customerEmail: e.target.value })} /></div>
              <div><Label>Customer Phone</Label><Input type="tel" value={form.customerPhone} onChange={e => setForm({ ...form, customerPhone: e.target.value })} /></div>
              <div>
                <Label>Document Type</Label>
                <Select value={form.documentType} onValueChange={v => setForm({ ...form, documentType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Car Info (optional)</Label><Input placeholder="e.g. Toyota Camry 2024" value={form.carInfo} onChange={e => setForm({ ...form, carInfo: e.target.value })} /></div>
              <div>
                <Label>File *</Label>
                <Input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
              </div>
              <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadDialog(false)}>Cancel</Button>
              <Button onClick={handleUpload} disabled={uploading || !selectedFile || !form.customerName}>
                {uploading ? "Uploading..." : "Upload Document"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CustomerDocuments;
