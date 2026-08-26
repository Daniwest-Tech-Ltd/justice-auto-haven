import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Receipt, Download, Search, Eye, Loader2, RefreshCw, FileText, CheckCircle, XCircle, Clock, Mail } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "@/assets/logo.png";

interface Payment {
  id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  description: string | null;
  pesapal_merchant_reference: string | null;
  pesapal_order_tracking_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  completed_at: string | null;
}

export const PaymentReceiptsTab = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [generatingReceipt, setGeneratingReceipt] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments((data || []) as Payment[]);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(p => {
    const query = searchQuery.toLowerCase();
    return (
      p.customer_name?.toLowerCase().includes(query) ||
      p.customer_email?.toLowerCase().includes(query) ||
      p.pesapal_merchant_reference?.toLowerCase().includes(query) ||
      p.pesapal_order_tracking_id?.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      case "pending":
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const generateReceiptPdfBase64 = async (payment: Payment): Promise<string> => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Brand colors
    const brandRed: [number, number, number] = [220, 38, 38];
    const darkGray: [number, number, number] = [51, 51, 51];
    
    // Load and add logo
    try {
      doc.addImage("/pdf.png", 'PNG', 14, 10, 45, 18);
    } catch (e) {
      console.error("Logo failed to load in PDF:", e);
      // Logo failed to load, continue without it
    }
    
    // Company header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...brandRed);
    doc.text("JUSTICE ULTIMATE AUTOMOBILES", 60, 18);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text("Premier Car Dealership in Kenya", 60, 25);
    doc.text("Phone: 0722 827 458 | Email: info@justiceultimateautomobiles.com", 60, 30);
    
    // Separator line
    doc.setDrawColor(...brandRed);
    doc.setLineWidth(1);
    doc.line(14, 38, pageWidth - 14, 38);
    
    // Receipt title
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkGray);
    doc.text("PAYMENT RECEIPT", pageWidth / 2, 52, { align: "center" });
    
    // Receipt number box
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(14, 60, pageWidth - 28, 25, 3, 3, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Receipt Number:", 20, 70);
    doc.text("Date:", 20, 78);
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkGray);
    doc.text(payment.pesapal_merchant_reference || `RCP-${payment.id.slice(0, 8).toUpperCase()}`, 70, 70);
    doc.text(format(new Date(payment.completed_at || payment.created_at), "dd MMMM yyyy, HH:mm"), 70, 78);
    
    // Customer details section
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...brandRed);
    doc.text("CUSTOMER DETAILS", 14, 100);
    
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(14, 103, pageWidth - 14, 103);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...darkGray);
    
    const customerDetails = [
      ["Name:", payment.customer_name || "N/A"],
      ["Email:", payment.customer_email || "N/A"],
      ["Phone:", payment.customer_phone || "N/A"],
    ];
    
    let yPos = 112;
    customerDetails.forEach(([label, value]) => {
      doc.setTextColor(100, 100, 100);
      doc.text(label, 14, yPos);
      doc.setTextColor(...darkGray);
      doc.text(value, 50, yPos);
      yPos += 8;
    });
    
    // Payment details section
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...brandRed);
    doc.text("PAYMENT DETAILS", 14, yPos + 10);
    
    doc.setLineWidth(0.5);
    doc.line(14, yPos + 13, pageWidth - 14, yPos + 13);
    
    // Payment table
    const paymentTableData = [
      ["Description", payment.description || "Vehicle Payment"],
      ["Payment Method", payment.payment_method?.toUpperCase() || "PESAPAL"],
      ["Transaction ID", payment.pesapal_order_tracking_id || "N/A"],
      ["Confirmation Code", (payment.metadata?.confirmation_code as string) || payment.pesapal_merchant_reference || "N/A"],
      ["Status", payment.status.toUpperCase()],
    ];
    
    autoTable(doc, {
      startY: yPos + 18,
      head: [],
      body: paymentTableData,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [100, 100, 100], cellWidth: 60 },
        1: { textColor: darkGray },
      },
    });
    
    // Amount box
    const amountY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || yPos + 60;
    
    doc.setFillColor(220, 38, 38);
    doc.roundedRect(14, amountY + 10, pageWidth - 28, 30, 3, 3, 'F');
    
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.text("AMOUNT PAID", 20, amountY + 22);
    
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(`${payment.currency} ${payment.amount.toLocaleString()}`, pageWidth - 20, amountY + 28, { align: "right" });
    
    // Paid via Pesapal badge
    doc.setFillColor(34, 197, 94);
    doc.roundedRect(pageWidth / 2 - 35, amountY + 50, 70, 12, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("✓ PAID VIA PESAPAL", pageWidth / 2, amountY + 58, { align: "center" });
    
    // Footer separator
    doc.setDrawColor(...brandRed);
    doc.setLineWidth(0.5);
    doc.line(14, pageHeight - 35, pageWidth - 14, pageHeight - 35);
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text("Thank you for your business!", pageWidth / 2, pageHeight - 28, { align: "center" });
    doc.text("Justice Ultimate Automobiles | www.justiceultimateautomobiles.com", pageWidth / 2, pageHeight - 22, { align: "center" });
    doc.text("This is a computer-generated receipt and does not require a signature.", pageWidth / 2, pageHeight - 16, { align: "center" });
    
    // Watermark
    doc.setFontSize(50);
    doc.setTextColor(245, 245, 245);
    doc.setFont("helvetica", "bold");
    doc.text("PAID", pageWidth / 2, pageHeight / 2, { align: "center", angle: 45 });
    
    // Return base64
    return doc.output('datauristring').split(',')[1];
  };

  const generateReceipt = async (payment: Payment) => {
    setGeneratingReceipt(payment.id);
    
    try {
      // Generate PDF
      const pdfBase64 = await generateReceiptPdfBase64(payment);
      
      // Create blob and download
      const pdfBlob = new Blob([Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0))], { type: 'application/pdf' });
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `JUA-Receipt-${payment.pesapal_merchant_reference || payment.id.slice(0, 8)}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success("Receipt downloaded successfully!");
      
      // Send email to customer if they have an email
      if (payment.customer_email) {
        toast.loading("Sending receipt to customer...", { id: "email-receipt" });
        
        try {
          const { error } = await supabase.functions.invoke('send-receipt-email', {
            body: {
              customer_email: payment.customer_email,
              customer_name: payment.customer_name || "Valued Customer",
              receipt_number: payment.pesapal_merchant_reference || `RCP-${payment.id.slice(0, 8).toUpperCase()}`,
              amount: payment.amount,
              currency: payment.currency,
              payment_method: payment.payment_method || "Pesapal",
              transaction_date: format(new Date(payment.completed_at || payment.created_at), "dd MMMM yyyy, HH:mm"),
              description: payment.description || "Vehicle Payment",
              pdf_base64: pdfBase64
            }
          });
          
          if (error) throw error;
          
          toast.success("Receipt sent to customer email!", { id: "email-receipt" });
        } catch (emailError) {
          console.error("Error sending email:", emailError);
          toast.error("Receipt downloaded but email failed to send", { id: "email-receipt" });
        }
      }
    } catch (error) {
      console.error("Error generating receipt:", error);
      toast.error("Failed to generate receipt");
    } finally {
      setGeneratingReceipt(null);
    }
  };

  const completedPayments = payments.filter(p => p.status === "completed");
  const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-strong">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Receipts</p>
                <h3 className="text-2xl font-bold">{completedPayments.length}</h3>
              </div>
              <Receipt className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-strong">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <h3 className="text-2xl font-bold">KES {totalRevenue.toLocaleString()}</h3>
              </div>
              <FileText className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-strong">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Payments</p>
                <h3 className="text-2xl font-bold">{payments.filter(p => p.status === "pending").length}</h3>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <Card className="glass-strong">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Payment Receipts History
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button variant="outline" size="icon" onClick={fetchPayments}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No payment receipts found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-sm">
                        {payment.pesapal_merchant_reference || `PAY-${payment.id.slice(0, 8).toUpperCase()}`}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.customer_name || "N/A"}</p>
                          <p className="text-xs text-muted-foreground">{payment.customer_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {payment.currency} {payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {payment.payment_method || "Pesapal"}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(payment.created_at), "dd MMM yyyy")}
                        <br />
                        <span className="text-xs">{format(new Date(payment.created_at), "HH:mm")}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toast.info(`Tracking ID: ${payment.pesapal_order_tracking_id || "N/A"}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateReceipt(payment)}
                            disabled={generatingReceipt === payment.id || payment.status !== "completed"}
                            title={payment.customer_email ? "Downloads & emails receipt" : "Downloads receipt"}
                          >
                            {generatingReceipt === payment.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Download className="w-4 h-4 mr-1" />
                                {payment.customer_email && <Mail className="w-3 h-3 mr-1" />}
                                Receipt
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
