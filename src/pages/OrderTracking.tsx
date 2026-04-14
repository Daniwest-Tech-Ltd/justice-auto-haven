import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, CheckCircle, Circle, Clock, Upload, Send, Download,
  MessageSquare, FileText, Car, CreditCard, BookOpen, HandMetal, PartyPopper
} from "lucide-react";
import { toast } from "sonner";
import LoadingScreen from "@/components/LoadingScreen";

const STAGES = [
  { key: "order_placed", label: "Order Placed", icon: Car, desc: "Your order has been received" },
  { key: "car_confirmed", label: "Car Confirmed", icon: CheckCircle, desc: "Vehicle verified and confirmed" },
  { key: "payment_pending", label: "Payment Pending", icon: CreditCard, desc: "Awaiting payment" },
  { key: "payment_submitted", label: "Payment Submitted", icon: Clock, desc: "Payment under review" },
  { key: "payment_approved", label: "Payment Approved", icon: CheckCircle, desc: "Payment confirmed by finance" },
  { key: "logbook_processing", label: "Logbook Processing", icon: BookOpen, desc: "Ownership transfer in progress (3-7 days)" },
  { key: "ready_for_handover", label: "Ready for Handover", icon: HandMetal, desc: "Car ready for pickup/delivery" },
  { key: "completed", label: "Completed", icon: PartyPopper, desc: "Order complete! Enjoy your car 🎉" },
];

const OrderTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [tracking, setTracking] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && id) fetchAll();
  }, [user, id]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchAll = async () => {
    try {
      const [orderRes, trackRes, docRes, msgRes] = await Promise.all([
        supabase.from("customer_orders").select("*").eq("id", id).single(),
        supabase.from("order_tracking_log").select("*").eq("order_id", id).order("created_at", { ascending: true }),
        supabase.from("order_documents").select("*").eq("order_id", id).order("created_at", { ascending: false }),
        supabase.from("order_messages").select("*").eq("order_id", id).order("created_at", { ascending: true }),
      ]);
      if (orderRes.error) throw orderRes.error;
      setOrder(orderRes.data);
      setTracking(trackRes.data || []);
      setDocuments(docRes.data || []);
      setMessages(msgRes.data || []);
    } catch (e: any) {
      toast.error("Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const stageIndex = order ? STAGES.findIndex(s => s.key === order.status) : -1;

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    try {
      const { error } = await supabase.from("order_messages").insert({
        order_id: id, sender_id: user.id, message: newMessage.trim()
      });
      if (error) throw error;
      setNewMessage("");
      fetchAll();
    } catch { toast.error("Failed to send message"); }
  };

  const uploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const path = `${id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("order-documents").upload(path, file);
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("order_documents").insert({
        order_id: id, uploaded_by: user.id, document_type: "customer_upload",
        file_name: file.name, file_path: path, file_size: file.size, file_type: file.type
      });
      if (dbErr) throw dbErr;
      toast.success("Document uploaded");
      fetchAll();
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const downloadDoc = async (doc: any) => {
    const { data } = await supabase.storage.from("order-documents").download(doc.file_path);
    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement("a"); a.href = url; a.download = doc.file_name; a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (loading) return <LoadingScreen />;
  if (!order) return <div className="p-6 text-center">Order not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/my-orders")} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{order.car_make} {order.car_model} ({order.car_year})</h1>
            <p className="text-sm text-muted-foreground">Order ID: {order.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>

        {/* Price & Payment Info */}
        {(order.status === "payment_pending" || order.status === "payment_submitted") && (
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-yellow-500" />
                <div>
                  <p className="font-semibold">Payment Required: KSh {Number(order.payment_amount || order.car_price || 0).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.status === "payment_pending" 
                      ? "Please make payment and upload your receipt below"
                      : "Your payment is being reviewed by our finance team"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stage Timeline */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Order Progress</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-0">
              {STAGES.map((stage, idx) => {
                const isDone = idx <= stageIndex;
                const isCurrent = idx === stageIndex;
                const Icon = stage.icon;
                const trackEntry = tracking.find(t => t.status === stage.key);
                return (
                  <div key={stage.key} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                        ${isDone ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30 text-muted-foreground"} 
                        ${isCurrent ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background" : ""}`}>
                        {isDone ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      </div>
                      {idx < STAGES.length - 1 && (
                        <div className={`w-0.5 h-10 ${isDone ? "bg-primary" : "bg-muted-foreground/20"}`} />
                      )}
                    </div>
                    <div className={`pb-8 ${isCurrent ? "font-semibold" : ""}`}>
                      <p className={isDone ? "text-foreground" : "text-muted-foreground"}>{stage.label}</p>
                      <p className="text-xs text-muted-foreground">{stage.desc}</p>
                      {trackEntry && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(trackEntry.created_at).toLocaleString("en-KE")}
                          {trackEntry.message && ` — ${trackEntry.message}`}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" /> Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <input ref={fileInputRef} type="file" className="hidden" onChange={uploadDocument}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
              <Button variant="outline" className="w-full gap-2" disabled={uploading}
                onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4" /> {uploading ? "Uploading..." : "Upload Document"}
              </Button>
              {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No documents yet</p>
              ) : documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-2 rounded border text-sm">
                  <div className="truncate flex-1">
                    <p className="font-medium truncate">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(doc.created_at).toLocaleDateString("en-KE")}
                      {doc.is_request && " • Requested by sales"}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => downloadDoc(doc)}>
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Chat */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 overflow-y-auto space-y-2 mb-3 p-2 border rounded bg-muted/20">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No messages yet</p>
                ) : messages.map(msg => (
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
                <div ref={msgEndRef} />
              </div>
              <div className="flex gap-2">
                <Input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..." onKeyDown={e => e.key === "Enter" && sendMessage()} />
                <Button onClick={sendMessage} size="icon"><Send className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Details */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Order Details</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><p className="text-muted-foreground">Brand</p><p className="font-medium">{order.car_make}</p></div>
              <div><p className="text-muted-foreground">Model</p><p className="font-medium">{order.car_model}</p></div>
              <div><p className="text-muted-foreground">Year</p><p className="font-medium">{order.car_year}</p></div>
              <div><p className="text-muted-foreground">Price</p><p className="font-medium">KSh {Number(order.car_price || 0).toLocaleString()}</p></div>
              {order.car_color && <div><p className="text-muted-foreground">Color</p><p className="font-medium">{order.car_color}</p></div>}
              {order.car_vin && <div><p className="text-muted-foreground">VIN</p><p className="font-mono text-xs">{order.car_vin}</p></div>}
              {order.invoice_number && <div><p className="text-muted-foreground">Invoice</p><p className="font-medium">{order.invoice_number}</p></div>}
              {order.receipt_number && <div><p className="text-muted-foreground">Receipt</p><p className="font-medium">{order.receipt_number}</p></div>}
            </div>
            {order.notes && (
              <div className="mt-4 p-3 bg-muted/50 rounded">
                <p className="text-sm font-medium mb-1">Notes from Sales Team</p>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderTracking;
