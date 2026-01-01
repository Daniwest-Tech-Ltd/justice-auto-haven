import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, Search, Eye, CheckCircle, XCircle, Clock, 
  Download, Phone, Mail, User, Car, DollarSign, Building2,
  ArrowLeft, RefreshCw, Filter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Link } from "react-router-dom";

const AssetFinanceManagement = () => {
  const { toast } = useToast();
  const [applications, setApplications] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    let query = supabase
      .from("asset_finance_applications")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (data) setApplications(data);
    setLoading(false);
  };

  const fetchDocuments = async (appId: string) => {
    const { data } = await supabase
      .from("application_documents")
      .select("*")
      .eq("application_id", appId);
    if (data) setDocuments(data);
  };

  const updateStatus = async (appId: string, newStatus: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get application details for email
    const app = applications.find(a => a.id === appId);
    
    const { error } = await supabase
      .from("asset_finance_applications")
      .update({ 
        status: newStatus, 
        admin_notes: adminNotes,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString()
      })
      .eq("id", appId);

    if (!error) {
      // Send email notification
      try {
        await supabase.functions.invoke("send-finance-email", {
          body: {
            applicationId: appId,
            status: newStatus,
            recipientEmail: app?.email,
            recipientName: app?.full_name,
            vehicleName: app?.vehicle_name,
            financeAmount: app?.finance_amount,
          },
        });
        toast({ title: `Application ${newStatus}`, description: "Status updated and email sent to customer" });
      } catch (emailError) {
        console.error("Email failed:", emailError);
        toast({ title: `Application ${newStatus}`, description: "Status updated (email notification failed)" });
      }
      fetchApplications();
      setSelectedApp(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      under_review: "bg-blue-100 text-blue-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return <Badge className={styles[status] || ""}>{status.replace("_", " ").toUpperCase()}</Badge>;
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === "pending").length,
    under_review: applications.filter(a => a.status === "under_review").length,
    approved: applications.filter(a => a.status === "approved").length,
    rejected: applications.filter(a => a.status === "rejected").length,
  };

  const filtered = applications.filter(app => 
    app.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.phone?.includes(searchQuery) ||
    app.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin-dashboard">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Asset Finance Applications</h1>
              <p className="text-muted-foreground">Manage and review finance applications</p>
            </div>
          </div>
          <Button onClick={fetchApplications} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card><CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p>
          </CardContent></Card>
          <Card className="border-yellow-200"><CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p><p className="text-xs">Pending</p>
          </CardContent></Card>
          <Card className="border-blue-200"><CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.under_review}</p><p className="text-xs">Under Review</p>
          </CardContent></Card>
          <Card className="border-green-200"><CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p><p className="text-xs">Approved</p>
          </CardContent></Card>
          <Card className="border-red-200"><CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p><p className="text-xs">Rejected</p>
          </CardContent></Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <Input placeholder="Search by name, phone, email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="max-w-xs" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Finance Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(app => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.full_name}</TableCell>
                  <TableCell>
                    <div className="text-sm">{app.phone}</div>
                    <div className="text-xs text-muted-foreground">{app.email}</div>
                  </TableCell>
                  <TableCell>{app.vehicle_name || "-"}</TableCell>
                  <TableCell>KES {app.finance_amount?.toLocaleString() || "-"}</TableCell>
                  <TableCell>{getStatusBadge(app.status)}</TableCell>
                  <TableCell>{format(new Date(app.created_at), "MMM dd, yyyy")}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => { setSelectedApp(app); fetchDocuments(app.id); setAdminNotes(app.admin_notes || ""); }}>
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader><DialogTitle>Application Details</DialogTitle></DialogHeader>
                        {selectedApp && (
                          <Tabs defaultValue="details">
                            <TabsList className="grid grid-cols-3 w-full">
                              <TabsTrigger value="details">Details</TabsTrigger>
                              <TabsTrigger value="documents">Documents</TabsTrigger>
                              <TabsTrigger value="action">Action</TabsTrigger>
                            </TabsList>
                            <TabsContent value="details" className="space-y-4 mt-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><strong>Name:</strong> {selectedApp.full_name}</div>
                                <div><strong>Phone:</strong> {selectedApp.phone}</div>
                                <div><strong>Email:</strong> {selectedApp.email}</div>
                                <div><strong>ID Number:</strong> {selectedApp.id_number}</div>
                                <div><strong>KRA PIN:</strong> {selectedApp.kra_pin}</div>
                                <div><strong>Employment:</strong> {selectedApp.employment_type}</div>
                                <div><strong>Employer/Business:</strong> {selectedApp.employer_or_business || "-"}</div>
                                <div><strong>Monthly Income:</strong> KES {selectedApp.monthly_income?.toLocaleString() || "-"}</div>
                                <div><strong>Vehicle:</strong> {selectedApp.vehicle_name || "-"}</div>
                                <div><strong>Vehicle Price:</strong> KES {selectedApp.vehicle_price?.toLocaleString() || "-"}</div>
                                <div><strong>Deposit:</strong> KES {selectedApp.deposit_amount?.toLocaleString() || "-"}</div>
                                <div><strong>Finance Amount:</strong> KES {selectedApp.finance_amount?.toLocaleString() || "-"}</div>
                                <div><strong>Repayment Period:</strong> {selectedApp.repayment_period} months</div>
                              </div>
                            </TabsContent>
                            <TabsContent value="documents" className="mt-4">
                              {documents.length === 0 ? <p className="text-muted-foreground">No documents uploaded</p> : (
                                <div className="space-y-2">
                                  {documents.map(doc => (
                                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                                      <span className="capitalize">{doc.document_type.replace("_", " ")}</span>
                                      <Button size="sm" variant="outline" onClick={async () => {
                                        const { data } = await supabase.storage.from("finance-documents").createSignedUrl(doc.file_path, 3600);
                                        if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                                      }}><Download className="h-4 w-4 mr-1" /> View</Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </TabsContent>
                            <TabsContent value="action" className="mt-4 space-y-4">
                              <Textarea placeholder="Add notes..." value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={4} />
                              <div className="flex gap-2 flex-wrap">
                                <Button onClick={() => updateStatus(selectedApp.id, "under_review")} variant="outline" className="border-blue-500 text-blue-600"><Clock className="h-4 w-4 mr-1" /> Mark Under Review</Button>
                                <Button onClick={() => updateStatus(selectedApp.id, "approved")} className="bg-green-600 hover:bg-green-700"><CheckCircle className="h-4 w-4 mr-1" /> Approve</Button>
                                <Button onClick={() => updateStatus(selectedApp.id, "rejected")} variant="destructive"><XCircle className="h-4 w-4 mr-1" /> Reject</Button>
                              </div>
                            </TabsContent>
                          </Tabs>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No applications found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default AssetFinanceManagement;
