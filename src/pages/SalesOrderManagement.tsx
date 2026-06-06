import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Search, Eye, Upload, Send, Download, CheckCircle, Clock, FileText, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import LoadingScreen from "@/components/LoadingScreen";

const STAGES = [
  "order_placed", "car_confirmed", "payment_pending", "payment_submitted",
  "payment_approved", "logbook_processing", "ready_for_handover", "completed", "cancelled"
];

const STAGE_LABELS: Record<string, string> = {
  order_placed: "Order Placed", car_confirmed: "Car Confirmed",
  payment_pending: "Payment Pending", payment_submitted: "Payment Submitted",
  payment_approved: "Payment Approved", logbook_processing: "Logbook Processing",
  ready_for_handover: "Ready for Handover", completed: "Completed", cancelled: "Cancelled"
};

const SalesOrderManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error } = await supabase
        .from("customer_orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch profile info for each unique customer_id
      const customerIds = [...new Set((ordersData || []).map(o => o.customer_id).filter(Boolean))];
      const profilesMap: Record<string, any> = {};
      if (customerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email, phone")
          .in("user_id", customerIds);
        (profiles || []).forEach(p => { profilesMap[p.user_id] = p; });
      }

      const enriched = (ordersData || []).map(o => ({
        ...o,
        profiles: profilesMap[o.customer_id] || null,
      }));
      setOrders(enriched);
    } catch { toast.error("Failed to load orders"); }
    finally { setLoading(false); }
  };

  const openDetail = async (order: any) => {
    setSelectedOrder(order);
    setDetailDialog(true);
    const [msgRes, docRes] = await Promise.all([
      supabase.from("order_messages").select("*").eq("order_id", order.id).order("created_at", { ascending: true }),
      supabase.from("order_documents").select("*").eq("order_id", order.id).order("created_at", { ascending: false }),
    ]);
    setMessages(msgRes.data || []);
    setDocuments(docRes.data || []);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === "payment_approved") updates.hr_approved_at = new Date().toISOString();
      if (newStatus === "logbook_processing") updates.logbook_started_at = new Date().toISOString();
      if (newStatus === "completed") {
        updates.completed_at = new Date().toISOString();
        updates.logbook_completed_at = new Date().toISOString();
      }

      const { error } = await supabase.from("customer_orders").update(updates).eq("id", orderId);
      if (error) throw error;

      // Log tracking
      await supabase.from("order_tracking_log").insert({
        order_id: orderId, status: newStatus, message: statusNote || `Status updated to ${STAGE_LABELS[newStatus]}`,
        updated_by: user?.id
      });

      toast.success(`Order updated to ${STAGE_LABELS[newStatus]}`);
      setStatusNote("");
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus, ...updates });
      }
    } catch { toast.error("Failed to update status"); }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedOrder) return;
    try {
      await supabase.from("order_messages").insert({
        order_id: selectedOrder.id, sender_id: user!.id, message: newMessage.trim()
      });
      setNewMessage("");
      const { data } = await supabase.from("order_messages").select("*").eq("order_id", selectedOrder.id).order("created_at", { ascending: true });
      setMessages(data || []);
    } catch { toast.error("Failed to send"); }
  };

  const uploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedOrder) return;
    setUploading(true);
    try {
      const path = `${selectedOrder.id}/${Date.now()}_${file.name}`;
      await supabase.storage.from("order-documents").upload(path, file);
      await supabase.from("order_documents").insert({
        order_id: selectedOrder.id, uploaded_by: user!.id, document_type: "sales_upload",
        file_name: file.name, file_path: path, file_size: file.size, file_type: file.type
      });
      toast.success("Uploaded");
      const { data } = await supabase.from("order_documents").select("*").eq("order_id", selectedOrder.id).order("created_at", { ascending: false });
      setDocuments(data || []);
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const downloadDoc = async (doc: any) => {
    const { data } = await supabase.storage.from("order-documents").download(doc.file_path);
    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement("a"); a.href = url; a.download = doc.file_name; a.click();
    }
  };

  const filtered = orders.filter(o => {
    const matchSearch = !search || 
      (o.profiles?.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.car_make || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.car_model || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/admin/sales-management")} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Sales Order Management</h1>
            <p className="text-sm text-muted-foreground">{orders.length} total orders</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-10" placeholder="Search customer, brand, model..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STAGES.map(s => <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "New Orders", count: orders.filter(o => o.status === "order_placed").length, color: "text-blue-500" },
            { label: "Awaiting Payment", count: orders.filter(o => ["payment_pending", "payment_submitted"].includes(o.status)).length, color: "text-yellow-500" },
            { label: "Processing", count: orders.filter(o => ["payment_approved", "logbook_processing"].includes(o.status)).length, color: "text-purple-500" },
            { label: "Completed", count: orders.filter(o => o.status === "completed").length, color: "text-green-500" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Orders table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(order => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <p className="font-medium">{order.profiles?.full_name || "N/A"}</p>
                      <p className="text-xs text-muted-foreground">{order.profiles?.email}</p>
                    </TableCell>
                    <TableCell>{order.car_make} {order.car_model} ({order.car_year})</TableCell>
                    <TableCell>KSh {Number(order.car_price || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={order.status === "completed" ? "default" : order.status === "cancelled" ? "destructive" : "secondary"}>
                        {STAGE_LABELS[order.status] || order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{new Date(order.created_at).toLocaleDateString("en-KE")}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => openDetail(order)} className="gap-1">
                        <Eye className="w-3 h-3" /> Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No orders found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {selectedOrder && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedOrder.car_make} {selectedOrder.car_model} — {selectedOrder.profiles?.full_name}</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="status">
                  <TabsList className="w-full">
                    <TabsTrigger value="status" className="flex-1">Status</TabsTrigger>
                    <TabsTrigger value="docs" className="flex-1">Documents ({documents.length})</TabsTrigger>
                    <TabsTrigger value="chat" className="flex-1">Chat ({messages.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="status" className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-muted-foreground">Current:</span> <Badge>{STAGE_LABELS[selectedOrder.status]}</Badge></div>
                      <div><span className="text-muted-foreground">Price:</span> KSh {Number(selectedOrder.car_price || 0).toLocaleString()}</div>
                      <div><span className="text-muted-foreground">Customer:</span> {selectedOrder.profiles?.full_name}</div>
                      <div><span className="text-muted-foreground">Email:</span> {selectedOrder.profiles?.email}</div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Update Status</label>
                      <Select onValueChange={v => updateStatus(selectedOrder.id, v)}>
                        <SelectTrigger><SelectValue placeholder="Select next stage" /></SelectTrigger>
                        <SelectContent>
                          {STAGES.filter(s => s !== selectedOrder.status).map(s => (
                            <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Textarea placeholder="Add a note for this update..." value={statusNote} onChange={e => setStatusNote(e.target.value)} rows={2} />
                    </div>
                  </TabsContent>

                  <TabsContent value="docs" className="space-y-3">
                    <input ref={fileRef} type="file" className="hidden" onChange={uploadDoc} />
                    <Button variant="outline" className="w-full gap-2" disabled={uploading} onClick={() => fileRef.current?.click()}>
                      <Upload className="w-4 h-4" /> {uploading ? "Uploading..." : "Upload Document"}
                    </Button>
                    {documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-2 border rounded text-sm">
                        <div>
                          <p className="font-medium">{doc.file_name}</p>
                          <p className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleString("en-KE")}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => downloadDoc(doc)}><Download className="w-4 h-4" /></Button>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="chat">
                    <div className="h-48 overflow-y-auto space-y-2 p-2 border rounded bg-muted/20 mb-3">
                      {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm
                            ${msg.sender_id === user?.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                            <p>{msg.message}</p>
                            <p className="text-[10px] opacity-70 mt-1">
                              {new Date(msg.created_at).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                        placeholder="Message customer..." onKeyDown={e => e.key === "Enter" && sendMessage()} />
                      <Button onClick={sendMessage} size="icon"><Send className="w-4 h-4" /></Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SalesOrderManagement;
