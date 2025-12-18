import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoadingScreen from "@/components/LoadingScreen";
import { format } from "date-fns";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { 
  ArrowLeft, 
  CreditCard, 
  RefreshCw, 
  Search, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  Plus,
  Eye,
  Download,
  Send,
  Receipt,
  Mail,
  MessageSquare
} from "lucide-react";

// Helper function to auto-download PDF from HTML
const downloadPdfFromHtml = async (html: string, filename: string) => {
  // Create a hidden container to render HTML
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    // Wait a moment for styles to apply
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;
    
    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
};

interface Payment {
  id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  payment_method: string;
  status: string;
  pesapal_tracking_id: string | null;
  pesapal_merchant_reference: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  description: string | null;
  created_at: string;
  completed_at: string | null;
}

interface Invoice {
  id: string;
  invoice_no: string;
  order_id: string | null;
  customer_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  items: any[];
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  grand_total: number;
  status: string;
  sent_email: boolean;
  sent_whatsapp: boolean;
  created_at: string;
}

interface ReceiptRecord {
  id: string;
  receipt_no: string;
  invoice_id: string | null;
  customer_id: string;
  customer_name: string;
  amount_paid: number;
  payment_method: string;
  payment_reference: string | null;
  sent_email: boolean;
  sent_whatsapp: boolean;
  created_at: string;
}

interface IPNLog {
  id: string;
  payment_id: string | null;
  payload: any;
  ip_address: string | null;
  status: string;
  pesapal_tracking_id: string | null;
  pesapal_notification_type: string | null;
  processed_at: string | null;
  error_message: string | null;
  created_at: string;
}

const PaymentsManagement = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [ipnLogs, setIPNLogs] = useState<IPNLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPOSDialog, setShowPOSDialog] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [posLoading, setPOSLoading] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<IPNLog | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  
  const [posForm, setPOSForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    amount: "",
    description: ""
  });

  const [invoiceForm, setInvoiceForm] = useState({
    customer_id: "",
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_address: "",
    item_description: "",
    quantity: "1",
    unit_price: "",
    vat_rate: "16",
    notes: ""
  });

  const [receiptForm, setReceiptForm] = useState({
    customer_id: "",
    customer_name: "",
    invoice_id: "",
    amount_paid: "",
    payment_method: "cash",
    payment_reference: "",
    notes: ""
  });

  useEffect(() => {
    if (!authLoading && (!user || role?.role !== "admin")) {
      navigate("/");
    }
  }, [user, role, authLoading, navigate]);

  useEffect(() => {
    if (user && role?.role === "admin") {
      fetchAllData();
    }
  }, [user, role]);

  const fetchAllData = async () => {
    await Promise.all([
      fetchPayments(),
      fetchInvoices(),
      fetchReceipts(),
      fetchIPNLogs(),
      fetchCustomers()
    ]);
    setLoading(false);
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone")
        .order("full_name");
      if (!error) setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error) setPayments(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setInvoices(data.map(inv => ({ ...inv, items: Array.isArray(inv.items) ? inv.items : [] })) as Invoice[]);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  const fetchReceipts = async () => {
    try {
      const { data, error } = await supabase
        .from("receipts")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error) setReceipts(data || []);
    } catch (error) {
      console.error("Error fetching receipts:", error);
    }
  };

  const fetchIPNLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_ipn_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (!error) setIPNLogs(data || []);
    } catch (error) {
      console.error("Error fetching IPN logs:", error);
    }
  };

  const handlePOSPayment = async () => {
    if (!posForm.amount || !posForm.customer_name) {
      toast({ title: "Error", description: "Please fill in required fields", variant: "destructive" });
      return;
    }

    setPOSLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("pesapal-initiate", {
        body: {
          amount: parseFloat(posForm.amount),
          currency: "KES",
          customer_name: posForm.customer_name,
          customer_email: posForm.customer_email,
          customer_phone: posForm.customer_phone,
          description: posForm.description || "POS Payment",
          user_id: user?.id
        }
      });

      if (error) throw error;
      if (data.redirect_url) {
        window.open(data.redirect_url, "_blank");
        toast({ title: "Payment Initiated", description: "Pesapal payment page opened" });
        setShowPOSDialog(false);
        setPOSForm({ customer_name: "", customer_email: "", customer_phone: "", amount: "", description: "" });
        fetchPayments();
      }
    } catch (error: any) {
      toast({ title: "Payment Failed", description: error.message, variant: "destructive" });
    } finally {
      setPOSLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!invoiceForm.customer_name || !invoiceForm.item_description || !invoiceForm.unit_price) {
      toast({ title: "Error", description: "Please fill in required fields", variant: "destructive" });
      return;
    }

    setInvoiceLoading(true);
    try {
      const quantity = parseInt(invoiceForm.quantity) || 1;
      const unitPrice = parseFloat(invoiceForm.unit_price);
      const subtotal = quantity * unitPrice;
      const vatRate = parseFloat(invoiceForm.vat_rate);
      const vatAmount = (subtotal * vatRate) / 100;
      const grandTotal = subtotal + vatAmount;

      const { data, error } = await supabase.functions.invoke("generate-invoice-pdf", {
        body: {
          customer_id: invoiceForm.customer_id || user?.id,
          customer_name: invoiceForm.customer_name,
          customer_email: invoiceForm.customer_email,
          customer_phone: invoiceForm.customer_phone,
          customer_address: invoiceForm.customer_address,
          items: [{
            description: invoiceForm.item_description,
            quantity: quantity,
            unit_price: unitPrice,
            amount: subtotal
          }],
          subtotal,
          vat_rate: vatRate,
          vat_amount: vatAmount,
          grand_total: grandTotal,
          notes: invoiceForm.notes
        }
      });

      if (error) throw error;

      // Auto-download invoice PDF
      if (data.html) {
        await downloadPdfFromHtml(data.html, `Invoice-${data.invoice_no}.pdf`);
      }

      toast({ title: "Success", description: `Invoice ${data.invoice_no} generated successfully!` });
      setShowInvoiceDialog(false);
      setInvoiceForm({
        customer_id: "", customer_name: "", customer_email: "", customer_phone: "",
        customer_address: "", item_description: "", quantity: "1", unit_price: "", vat_rate: "16", notes: ""
      });
      fetchInvoices();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleGenerateReceipt = async () => {
    if (!receiptForm.customer_name || !receiptForm.amount_paid) {
      toast({ title: "Error", description: "Please fill in required fields", variant: "destructive" });
      return;
    }

    setReceiptLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-receipt-pdf", {
        body: {
          customer_id: receiptForm.customer_id || user?.id,
          customer_name: receiptForm.customer_name,
          invoice_id: receiptForm.invoice_id || null,
          amount_paid: parseFloat(receiptForm.amount_paid),
          payment_method: receiptForm.payment_method,
          payment_reference: receiptForm.payment_reference,
          notes: receiptForm.notes
        }
      });

      if (error) throw error;

      // Auto-download receipt PDF
      if (data.html) {
        await downloadPdfFromHtml(data.html, `Receipt-${data.receipt_no}.pdf`);
      }

      toast({ title: "Success", description: `Receipt ${data.receipt_no} generated successfully!` });
      setShowReceiptDialog(false);
      setReceiptForm({
        customer_id: "", customer_name: "", invoice_id: "", amount_paid: "",
        payment_method: "cash", payment_reference: "", notes: ""
      });
      fetchReceipts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setReceiptLoading(false);
    }
  };

  const handleSendInvoiceNotification = async (invoiceId: string, method: 'email' | 'whatsapp') => {
    try {
      const { error } = await supabase.functions.invoke("send-invoice-notification", {
        body: {
          invoice_id: invoiceId,
          send_email: method === 'email',
          send_whatsapp: method === 'whatsapp'
        }
      });

      if (error) throw error;
      toast({ title: "Sent!", description: `Invoice sent via ${method}` });
      fetchInvoices();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    // Regenerate and download
    const { data, error } = await supabase.functions.invoke("generate-invoice-pdf", {
      body: {
        invoice_id: invoice.id,
        customer_id: invoice.customer_id,
        customer_name: invoice.customer_name,
        customer_email: invoice.customer_email,
        customer_phone: invoice.customer_phone,
        items: invoice.items,
        subtotal: invoice.subtotal,
        vat_rate: invoice.vat_rate,
        vat_amount: invoice.vat_amount,
        grand_total: invoice.grand_total
      }
    });

    if (data?.html) {
      await downloadPdfFromHtml(data.html, `Invoice-${invoice.invoice_no}.pdf`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      case "issued":
        return <Badge className="bg-blue-500"><FileText className="w-3 h-3 mr-1" /> Issued</Badge>;
      case "paid":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Paid</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> {status}</Badge>;
    }
  };

  const filteredPayments = payments.filter(p => 
    p.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.pesapal_merchant_reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInvoices = invoices.filter(i =>
    i.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.invoice_no?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReceipts = receipts.filter(r =>
    r.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.receipt_no?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalPayments: payments.length,
    completedPayments: payments.filter(p => p.status === "completed").length,
    totalInvoices: invoices.length,
    totalReceipts: receipts.length,
    totalRevenue: payments.filter(p => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0)
  };

  if (authLoading || loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Payments & Invoicing</h1>
              <p className="text-muted-foreground">Manage payments, invoices, and receipts</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={fetchAllData}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
            <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileText className="w-4 h-4 mr-2" /> Generate Invoice
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Generate Invoice</DialogTitle>
                  <DialogDescription>Create a professional invoice for a customer</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Customer Name *</Label>
                      <Input 
                        value={invoiceForm.customer_name}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_name: e.target.value })}
                        placeholder="Customer name"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input 
                        type="email"
                        value={invoiceForm.customer_email}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_email: e.target.value })}
                        placeholder="customer@email.com"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Phone</Label>
                      <Input 
                        value={invoiceForm.customer_phone}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_phone: e.target.value })}
                        placeholder="+254..."
                      />
                    </div>
                    <div>
                      <Label>Address</Label>
                      <Input 
                        value={invoiceForm.customer_address}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_address: e.target.value })}
                        placeholder="Customer address"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Item Description *</Label>
                    <Textarea 
                      value={invoiceForm.item_description}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, item_description: e.target.value })}
                      placeholder="e.g., Toyota Axio 2016 - Full Payment"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Quantity</Label>
                      <Input 
                        type="number"
                        value={invoiceForm.quantity}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, quantity: e.target.value })}
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <Label>Unit Price (KES) *</Label>
                      <Input 
                        type="number"
                        value={invoiceForm.unit_price}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, unit_price: e.target.value })}
                        placeholder="1,200,000"
                      />
                    </div>
                    <div>
                      <Label>VAT %</Label>
                      <Input 
                        type="number"
                        value={invoiceForm.vat_rate}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, vat_rate: e.target.value })}
                        placeholder="16"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea 
                      value={invoiceForm.notes}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                      placeholder="Additional notes..."
                    />
                  </div>
                  <Button onClick={handleGenerateInvoice} disabled={invoiceLoading} className="w-full">
                    {invoiceLoading ? "Generating..." : "Generate Invoice"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Receipt className="w-4 h-4 mr-2" /> Generate Receipt
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Generate Receipt</DialogTitle>
                  <DialogDescription>Create a payment receipt</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Customer Name *</Label>
                    <Input 
                      value={receiptForm.customer_name}
                      onChange={(e) => setReceiptForm({ ...receiptForm, customer_name: e.target.value })}
                      placeholder="Customer name"
                    />
                  </div>
                  <div>
                    <Label>Link to Invoice (Optional)</Label>
                    <Select value={receiptForm.invoice_id} onValueChange={(v) => setReceiptForm({ ...receiptForm, invoice_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select invoice" />
                      </SelectTrigger>
                      <SelectContent>
                        {invoices.map(inv => (
                          <SelectItem key={inv.id} value={inv.id}>
                            {inv.invoice_no} - {inv.customer_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Amount Paid (KES) *</Label>
                      <Input 
                        type="number"
                        value={receiptForm.amount_paid}
                        onChange={(e) => setReceiptForm({ ...receiptForm, amount_paid: e.target.value })}
                        placeholder="Amount"
                      />
                    </div>
                    <div>
                      <Label>Payment Method</Label>
                      <Select value={receiptForm.payment_method} onValueChange={(v) => setReceiptForm({ ...receiptForm, payment_method: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="mpesa">M-Pesa</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Payment Reference</Label>
                    <Input 
                      value={receiptForm.payment_reference}
                      onChange={(e) => setReceiptForm({ ...receiptForm, payment_reference: e.target.value })}
                      placeholder="e.g., M-Pesa code"
                    />
                  </div>
                  <Button onClick={handleGenerateReceipt} disabled={receiptLoading} className="w-full">
                    {receiptLoading ? "Generating..." : "Generate Receipt"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={showPOSDialog} onOpenChange={setShowPOSDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" /> POS Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Initiate POS Payment</DialogTitle>
                  <DialogDescription>Create a Pesapal payment for walk-in customers</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Customer Name *</Label>
                    <Input 
                      value={posForm.customer_name}
                      onChange={(e) => setPOSForm({ ...posForm, customer_name: e.target.value })}
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input 
                      type="email"
                      value={posForm.customer_email}
                      onChange={(e) => setPOSForm({ ...posForm, customer_email: e.target.value })}
                      placeholder="customer@email.com"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input 
                      value={posForm.customer_phone}
                      onChange={(e) => setPOSForm({ ...posForm, customer_phone: e.target.value })}
                      placeholder="+254..."
                    />
                  </div>
                  <div>
                    <Label>Amount (KES) *</Label>
                    <Input 
                      type="number"
                      value={posForm.amount}
                      onChange={(e) => setPOSForm({ ...posForm, amount: e.target.value })}
                      placeholder="Enter amount"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input 
                      value={posForm.description}
                      onChange={(e) => setPOSForm({ ...posForm, description: e.target.value })}
                      placeholder="Payment description"
                    />
                  </div>
                  <Button onClick={handlePOSPayment} disabled={posLoading} className="w-full">
                    {posLoading ? "Processing..." : "Initiate Payment"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPayments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completedPayments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalInvoices}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-600">Receipts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.totalReceipts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KES {stats.totalRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search payments, invoices, or receipts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="transactions">
          <TabsList className="flex-wrap">
            <TabsTrigger value="transactions">
              <CreditCard className="w-4 h-4 mr-2" /> Transactions
            </TabsTrigger>
            <TabsTrigger value="invoices">
              <FileText className="w-4 h-4 mr-2" /> Invoices
            </TabsTrigger>
            <TabsTrigger value="receipts">
              <Receipt className="w-4 h-4 mr-2" /> Receipts
            </TabsTrigger>
            <TabsTrigger value="quick-pay">
              <DollarSign className="w-4 h-4 mr-2" /> Quick Pay
            </TabsTrigger>
            <TabsTrigger value="ipn-logs">
              <FileText className="w-4 h-4 mr-2" /> IPN Logs
            </TabsTrigger>
          </TabsList>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="font-mono text-sm">{payment.pesapal_merchant_reference || payment.id.slice(0, 8)}</div>
                        </TableCell>
                        <TableCell>
                          <div>{payment.customer_name || "N/A"}</div>
                          <div className="text-xs text-muted-foreground">{payment.customer_email}</div>
                        </TableCell>
                        <TableCell className="font-medium">{payment.currency} {Number(payment.amount).toLocaleString()}</TableCell>
                        <TableCell><Badge variant="outline">{payment.payment_method}</Badge></TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>{format(new Date(payment.created_at), "MMM dd, yyyy HH:mm")}</TableCell>
                      </TableRow>
                    ))}
                    {filteredPayments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No payments found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice No</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono font-medium">{invoice.invoice_no}</TableCell>
                        <TableCell>
                          <div>{invoice.customer_name}</div>
                          <div className="text-xs text-muted-foreground">{invoice.customer_email}</div>
                        </TableCell>
                        <TableCell className="font-medium">KES {Number(invoice.grand_total).toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {invoice.sent_email && <Badge variant="outline" className="text-xs"><Mail className="w-3 h-3" /></Badge>}
                            {invoice.sent_whatsapp && <Badge variant="outline" className="text-xs"><MessageSquare className="w-3 h-3" /></Badge>}
                          </div>
                        </TableCell>
                        <TableCell>{format(new Date(invoice.created_at), "MMM dd, yyyy")}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleDownloadInvoice(invoice)}>
                              <Download className="w-4 h-4" />
                            </Button>
                            {invoice.customer_email && (
                              <Button variant="ghost" size="sm" onClick={() => handleSendInvoiceNotification(invoice.id, 'email')}>
                                <Mail className="w-4 h-4" />
                              </Button>
                            )}
                            {invoice.customer_phone && (
                              <Button variant="ghost" size="sm" onClick={() => handleSendInvoiceNotification(invoice.id, 'whatsapp')}>
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredInvoices.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No invoices found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Receipts Tab */}
          <TabsContent value="receipts" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt No</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReceipts.map((receipt) => (
                      <TableRow key={receipt.id}>
                        <TableCell className="font-mono font-medium">{receipt.receipt_no}</TableCell>
                        <TableCell>{receipt.customer_name}</TableCell>
                        <TableCell className="font-medium">KES {Number(receipt.amount_paid).toLocaleString()}</TableCell>
                        <TableCell><Badge variant="outline">{receipt.payment_method}</Badge></TableCell>
                        <TableCell className="font-mono text-sm">{receipt.payment_reference || "N/A"}</TableCell>
                        <TableCell>{format(new Date(receipt.created_at), "MMM dd, yyyy HH:mm")}</TableCell>
                      </TableRow>
                    ))}
                    {filteredReceipts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No receipts found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quick Pay Tab */}
          <TabsContent value="quick-pay" className="space-y-4">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 via-background to-secondary/10">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Pesapal Quick Payment
                </CardTitle>
                <CardDescription>Accept payments directly from customers using Pesapal</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="flex flex-col items-center justify-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                    <CreditCard className="w-8 h-8 text-primary" />
                  </div>
                  <div className="p-6 rounded-2xl bg-card border shadow-lg w-full max-w-2xl">
                    <iframe 
                      width="100%" 
                      height="500" 
                      src="https://store.pesapal.com/embed-code?pageUrl=https://store.pesapal.com/justiceultimateautomobile" 
                      frameBorder="0" 
                      allowFullScreen
                      className="rounded-lg min-h-[500px]"
                      title="Pesapal Payment"
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Badge variant="outline" className="bg-green-500/10 text-green-600">M-Pesa</Badge>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600">Visa</Badge>
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-600">Mastercard</Badge>
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-600">Bank Transfer</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* IPN Logs Tab */}
          <TabsContent value="ipn-logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>IPN Notification Logs</CardTitle>
                <CardDescription>Pesapal instant payment notifications</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tracking ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ipnLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">{log.pesapal_tracking_id || "N/A"}</TableCell>
                        <TableCell>{log.pesapal_notification_type || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant={log.status === "processed" ? "default" : log.status === "error" ? "destructive" : "outline"}>
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.ip_address || "N/A"}</TableCell>
                        <TableCell>{format(new Date(log.created_at), "MMM dd, HH:mm:ss")}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {ipnLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No IPN logs yet</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* IPN Log Detail Dialog */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>IPN Log Details</DialogTitle>
              <DialogDescription>Raw payload and processing details</DialogDescription>
            </DialogHeader>
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Tracking ID</Label><p className="font-mono">{selectedLog.pesapal_tracking_id || "N/A"}</p></div>
                  <div><Label>Status</Label><p>{selectedLog.status}</p></div>
                  <div><Label>Received At</Label><p>{format(new Date(selectedLog.created_at), "PPpp")}</p></div>
                  <div><Label>Processed At</Label><p>{selectedLog.processed_at ? format(new Date(selectedLog.processed_at), "PPpp") : "N/A"}</p></div>
                </div>
                {selectedLog.error_message && (
                  <div><Label className="text-red-600">Error</Label><p className="text-red-600">{selectedLog.error_message}</p></div>
                )}
                <div>
                  <Label>Raw Payload</Label>
                  <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-64 text-xs">{JSON.stringify(selectedLog.payload, null, 2)}</pre>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PaymentsManagement;
