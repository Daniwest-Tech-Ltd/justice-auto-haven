import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Phone, MessageSquare, Mail, Send, CheckCircle, XCircle, Download, Edit, Trash2, Volume2, VolumeX, Filter, Search, Upload, FileDown, BarChart3, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { usePagination } from "@/hooks/usePagination";
import LoadingScreen from "@/components/LoadingScreen";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "@/assets/logo.png";
import { EmailTemplates } from "@/components/EmailTemplates";
import { OrderAnalytics } from "@/components/OrderAnalytics";
import { AutomatedFollowUp } from "@/components/AutomatedFollowUp";
import * as XLSX from "xlsx";
import { PesapalPaymentModal } from "@/components/PesapalPaymentModal";
import { OrderPaymentsTab } from "@/components/OrderPaymentsTab";
import { PaymentReceiptsTab } from "@/components/PaymentReceiptsTab";

interface Order {
  id: string;
  car_id: string;
  car_make: string;
  car_model: string;
  car_year: number;
  car_price: number;
  full_name: string;
  phone: string;
  email: string;
  contact_method: string;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  admin_notes: string | null;
}

const Orders = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"orders" | "analytics" | "templates" | "followup" | "payments" | "receipts">("orders");
  const [showPesapalModal, setShowPesapalModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    const matchesSearch = !searchQuery || 
      o.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.phone.includes(searchQuery) ||
      o.car_make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.car_model.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const { currentItems, currentPage, totalPages, nextPage, prevPage, goToPage } = usePagination({
    items: filteredOrders,
    itemsPerPage: 10,
  });

  useEffect(() => {
    // Wait for auth to load before checking role
    if (authLoading) return;
    
    if (role?.role !== "admin") {
      navigate("/admin-dashboard");
      return;
    }
    fetchOrders();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [role, navigate, authLoading]);

  const playNotificationSound = () => {
    if (audioEnabled) {
      const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZTR0NVKzn77BiFApLpdv1xnMpBSl+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0vBSF1xu/glEcOEmCz6OyrWBQLTqjh8L1lHQU7ktjyzn0vBSV7y/HdkEAJE1y06emsWRQLUKvl8bZjGwU5jtXzzn0vBSZ7y/HdkEAJE1y06emsWRQLUKvl8bZjGwU5jtXzzn0vBSZ7y/HdkEAJE1y06emsWRQLUKvl8bZjGwU5jtXzzn0vBSZ7y/HdkEAJE1y06emsWRQLUKvl8bZjGwU5jtXzzn0vBSZ7y/HdkEAJE1y06emsWRQLUKvl8bZjGwU5jtXzzn0vBSZ7y/HdkEAJE1y06emsWRQLUKvl8bZjGwU5jtXzzn0vBSZ7y/HdkEAJE1y06emsWRQLUKvl8bZjGwU5jtXzzn0vBSZ7y/HdkEAJE1y06emsWRQLUKvl8bZjGwU5jtXzzn0vBSZ7y/HdkEAJE1y06emsWRQLUKvl8bZjGwU5jtXzzn0vBSZ7y/HdkEAJE1y06emsWRQLUKvl8bZjGwU5jtXzzn0vBSZ7y/HdkEAJE1y06emsWRQLUKvl8bZjGwU5jtXzzn0vBSZ7y/HdkEAJE1y06emsWRQLUKvl8bZjGwU5jtXzzn0vBSZ7y/HdkEAJE1y06emsWRQLUKvl8bZjGwU5jtXzzn0vBSZ7y/HdkEAJE1y06emsWRQLUKvl8bZjGwU5jtXzzn0vBSZ7y/HdkEAJE1y06emsWRQLUKvl8bZjGwU5jtXzzn0vBSZ7y/HdkEAJE1y06emsWRQLUKvl8bZjGwU5jtXzzn0vBSZ7y/HdkEAJE1y06emsWRQLUKvl8bZjGwU5jtXzzn0vBSZ7y/HdkEAJE1y06emsWRQLUKvl8bZjGwU5jtXzzn0vBSZ7y/HdkEAJE1y06emsWRQLUKvl8bZjGwU5jtXzzn0vBSZ7y/HdkEAJE1y06emsWRQLUKvl8bZjGwU5jtXzzn0vBSZ7y/HdkEAJE1y06emsWRQLUKvl8bZjGwU5jtXzzn0vBSZ7y/HdkEAJE1y06emsWRQLUKvl8bZjGwU5jtXzzn0vBSZ7y/HdkEAJE1y06emsWRQLUKvl8bZjGwU5jtXzzn0vBSZ7y/HdkEAJE1y06emsWRQLUKvl8bZjGwU5jtXzzn0vBQ==");
      audio.play().catch(() => {});
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whitelist_orders'
        },
        (payload) => {
          console.log('Order change detected:', payload);
          if (payload.eventType === 'INSERT') {
            playNotificationSound();
            toast.success("New Order Received!", {
              description: `Order from ${(payload.new as Order).full_name}`,
            });
            fetchOrders();
          } else if (payload.eventType === 'UPDATE') {
            fetchOrders();
          } else if (payload.eventType === 'DELETE') {
            fetchOrders();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("whitelist_orders")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      const { error } = await supabase
        .from("whitelist_orders")
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          admin_notes: adminNotes[orderId] || null,
        })
        .eq("id", orderId);

      if (error) throw error;

      // Send notification email
      await supabase.functions.invoke("send-order-notification", {
        body: {
          email: order.email,
          phone: order.phone,
          customerName: order.full_name,
          carMake: order.car_make,
          carModel: order.car_model,
          carYear: order.car_year,
          status: newStatus,
          adminNotes: adminNotes[orderId] || "",
        },
      });

      toast.success(`Order ${newStatus}!`);
      fetchOrders();
      setExpandedOrderId(null);
    } catch (error: any) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedOrders.length === 0) {
      toast.error("Please select orders first");
      return;
    }

    try {
      for (const orderId of selectedOrders) {
        await handleStatusChange(orderId, action);
      }
      setSelectedOrders([]);
      toast.success(`Bulk action completed: ${action}`);
    } catch (error) {
      toast.error("Failed to complete bulk action");
    }
  };

  const exportToPDF = async () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Brand colors (JUA red)
      const brandRed: [number, number, number] = [220, 38, 38];
      const darkGray: [number, number, number] = [51, 51, 51];
      
      // Add logo
      const logoImg = new Image();
      logoImg.src = logo;
      logoImg.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
      });
      doc.addImage(logoImg, 'PNG', 14, 10, 35, 18);
      
      // Header line
      doc.setDrawColor(...brandRed);
      doc.setLineWidth(1);
      doc.line(14, 32, pageWidth - 14, 32);
      
      // Company name header
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...brandRed);
      doc.text("JUSTICE ULTIMATE AUTOMOBILES", 55, 18);
      
      // Subtitle
      doc.setFontSize(14);
      doc.setTextColor(...darkGray);
      doc.text("ORDERS REPORT", 55, 26);
      
      // Report details
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`Report Generated: ${new Date().toLocaleString('en-KE', { dateStyle: 'full', timeStyle: 'short' })}`, 14, 40);
      doc.text(`Total Orders: ${filteredOrders.length}`, 14, 46);
      doc.text(`Filter Applied: ${statusFilter === 'all' ? 'All Orders' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`, 14, 52);

      // Table data
      const tableData = filteredOrders.map(order => [
        order.full_name,
        `${order.car_make} ${order.car_model} (${order.car_year})`,
        `KSh ${Number(order.car_price).toLocaleString()}`,
        order.phone,
        order.status.toUpperCase(),
        new Date(order.submitted_at).toLocaleDateString('en-KE'),
      ]);

      // Generate table using autoTable
      autoTable(doc, {
        head: [['Customer Name', 'Vehicle', 'Price (KSh)', 'Phone', 'Status', 'Date']],
        body: tableData,
        startY: 58,
        theme: 'striped',
        styles: { 
          fontSize: 9, 
          cellPadding: 3,
          textColor: darkGray,
          lineColor: [200, 200, 200],
        },
        headStyles: { 
          fillColor: brandRed,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
        },
        alternateRowStyles: {
          fillColor: [252, 252, 252],
        },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 45 },
          2: { cellWidth: 30, halign: 'right' },
          3: { cellWidth: 30 },
          4: { cellWidth: 22, halign: 'center' },
          5: { cellWidth: 25 },
        },
      });

      // Add watermark and footer to each page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Diagonal watermark
        doc.setFontSize(55);
        doc.setTextColor(240, 240, 240);
        doc.setFont("helvetica", "bold");
        doc.text("JUSTICE ULTIMATE AUTOMOBILES", pageWidth / 2, pageHeight / 2, {
          align: "center",
          angle: 45,
        });
        
        // Footer separator line
        doc.setDrawColor(...brandRed);
        doc.setLineWidth(0.5);
        doc.line(14, pageHeight - 25, pageWidth - 14, pageHeight - 25);
        
        // Footer content
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text("Justice Ultimate Automobiles | Premier Car Dealership in Kenya", 14, pageHeight - 20);
        doc.text("Phone: 0722 827 458 | 0701 460 110", 14, pageHeight - 15);
        doc.text("Email: info@justiceultimateautomobiles.com | Web: www.justiceultimateautomobiles.com", 14, pageHeight - 10);
        
        // Page number
        doc.setFontSize(9);
        doc.setTextColor(...brandRed);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 10);
      }

      doc.save(`JUA-Orders-Report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    }
  };

  const exportToExcel = () => {
    try {
      const exportData = filteredOrders.map(order => ({
        'Customer Name': order.full_name,
        'Phone': order.phone,
        'Email': order.email,
        'Vehicle': `${order.car_make} ${order.car_model} (${order.car_year})`,
        'Price': order.car_price,
        'Contact Method': order.contact_method,
        'Status': order.status,
        'Submitted': new Date(order.submitted_at).toLocaleString(),
        'Admin Notes': order.admin_notes || ''
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Orders");
      XLSX.writeFile(wb, `orders-export-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Excel file exported successfully!");
    } catch (error) {
      console.error("Error exporting Excel:", error);
      toast.error("Failed to export Excel file");
    }
  };

  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        // Validate and insert data
        for (const row of jsonData as any[]) {
          await supabase.from('whitelist_orders').insert({
            car_id: row['Car ID'], // User must provide this
            car_make: row['Vehicle Make'],
            car_model: row['Vehicle Model'],
            car_year: row['Vehicle Year'],
            car_price: row['Price'],
            full_name: row['Customer Name'],
            phone: row['Phone'],
            email: row['Email'],
            contact_method: row['Contact Method'] || 'email',
            status: row['Status'] || 'pending',
            admin_notes: row['Admin Notes'] || ''
          });
        }

        toast.success("Orders imported successfully!");
        fetchOrders();
      } catch (error) {
        console.error("Error importing Excel:", error);
        toast.error("Failed to import Excel file");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleContact = (order: Order) => {
    const { contact_method, phone, email } = order;
    
    switch (contact_method) {
      case "whatsapp":
        window.open(`https://wa.me/${phone.replace(/\D/g, "")}`, "_blank");
        break;
      case "call":
        window.open(`tel:${phone}`, "_blank");
        break;
      case "sms":
        window.open(`sms:${phone}`, "_blank");
        break;
      case "email":
        window.open(`mailto:${email}`, "_blank");
        break;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      pending: "outline",
      approved: "default",
      contacted: "secondary",
      closed: "destructive",
    };
    
    return (
      <Badge variant={variants[status] || "outline"} className="capitalize">
        {status}
      </Badge>
    );
  };

  const getContactIcon = (method: string) => {
    switch (method) {
      case "whatsapp": return <MessageSquare className="w-4 h-4" />;
      case "call": return <Phone className="w-4 h-4" />;
      case "sms": return <Send className="w-4 h-4" />;
      case "email": return <Mail className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingOrder) return;
    
    try {
      const { error } = await supabase
        .from("whitelist_orders")
        .update({
          full_name: editingOrder.full_name,
          phone: editingOrder.phone,
          email: editingOrder.email,
          admin_notes: editingOrder.admin_notes,
        })
        .eq("id", editingOrder.id);

      if (error) throw error;
      
      toast.success("Order updated successfully!");
      setIsEditDialogOpen(false);
      fetchOrders();
    } catch (error: any) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("whitelist_orders")
        .delete()
        .eq("id", orderId);

      if (error) throw error;
      
      toast.success("Order deleted successfully!");
      setDeleteOrderId(null);
      fetchOrders();
    } catch (error: any) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order");
    }
  };

  if (loading || authLoading) {
    return <LoadingScreen />;
  }

  const pendingCount = orders.filter(o => o.status === "pending").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/admin-dashboard")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Orders Management</h1>
              <p className="text-muted-foreground">
                {pendingCount} pending {pendingCount === 1 ? "order" : "orders"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setAudioEnabled(!audioEnabled)}
              title={audioEnabled ? "Disable audio notifications" : "Enable audio notifications"}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
              className="hidden"
              id="import-excel"
            />
            <Button variant="outline" asChild className="gap-2">
              <label htmlFor="import-excel" className="cursor-pointer">
                <Upload className="w-4 h-4" />
                Import Excel
              </label>
            </Button>
            <Button variant="outline" onClick={exportToExcel} className="gap-2">
              <FileDown className="w-4 h-4" />
              Export Excel
            </Button>
            <Button onClick={exportToPDF} className="gap-2">
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <Button
            variant={activeTab === "orders" ? "default" : "ghost"}
            onClick={() => setActiveTab("orders")}
          >
            Orders
          </Button>
          <Button
            variant={activeTab === "analytics" ? "default" : "ghost"}
            onClick={() => setActiveTab("analytics")}
            className="gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </Button>
          <Button
            variant={activeTab === "templates" ? "default" : "ghost"}
            onClick={() => setActiveTab("templates")}
            className="gap-2"
          >
            <Mail className="w-4 h-4" />
            Templates
          </Button>
          <Button
            variant={activeTab === "followup" ? "default" : "ghost"}
            onClick={() => setActiveTab("followup")}
          >
            Follow-up
          </Button>
          <Button
            variant={activeTab === "payments" ? "default" : "ghost"}
            onClick={() => setActiveTab("payments")}
            className="gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Payments
          </Button>
          <Button
            variant={activeTab === "receipts" ? "default" : "ghost"}
            onClick={() => setActiveTab("receipts")}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Receipts
          </Button>
        </div>

        {activeTab === "analytics" && <OrderAnalytics />}
        {activeTab === "templates" && <EmailTemplates />}
        {activeTab === "followup" && <AutomatedFollowUp />}
        
        {activeTab === "payments" && (
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Pesapal Payment Gateway
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-br from-primary/10 via-background to-primary/5 rounded-xl p-6 border border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Quick POS Payment</h3>
                    <p className="text-sm text-muted-foreground">Accept payments from walk-in customers</p>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">IPN Active</Badge>
                </div>
                
                <div className="aspect-video max-w-2xl mx-auto bg-background/50 backdrop-blur-sm rounded-lg p-4 border border-border/50">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://store.pesapal.com/embed-code?pageUrl=https://store.pesapal.com/justiceultimateautomobile" 
                    frameBorder="0" 
                    allowFullScreen
                    className="rounded-lg"
                  />
                </div>
                
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>IPN ID:</strong> 7dda9c82-21ba-4ded-984c-daeb20fa7259
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>IPN URL:</strong> https://ccsfhblxkmyqdqqcgitt.supabase.co/functions/v1/pesapal-ipn
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 bg-blue-500/10 border-blue-500/20">
                  <h4 className="font-medium text-blue-400">M-Pesa</h4>
                  <p className="text-sm text-muted-foreground">Mobile money payments</p>
                </Card>
                <Card className="p-4 bg-purple-500/10 border-purple-500/20">
                  <h4 className="font-medium text-purple-400">Card Payments</h4>
                  <p className="text-sm text-muted-foreground">Visa, Mastercard supported</p>
                </Card>
                <Card className="p-4 bg-green-500/10 border-green-500/20">
                  <h4 className="font-medium text-green-400">Bank Transfer</h4>
                  <p className="text-sm text-muted-foreground">Direct bank payments</p>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "receipts" && <PaymentReceiptsTab />}

        {activeTab === "orders" && (
          <>
        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Search & Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone, or vehicle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
              >
                All ({orders.length})
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                onClick={() => setStatusFilter("pending")}
              >
                Pending ({orders.filter(o => o.status === "pending").length})
              </Button>
              <Button
                variant={statusFilter === "approved" ? "default" : "outline"}
                onClick={() => setStatusFilter("approved")}
              >
                Approved ({orders.filter(o => o.status === "approved").length})
              </Button>
              <Button
                variant={statusFilter === "contacted" ? "default" : "outline"}
                onClick={() => setStatusFilter("contacted")}
              >
                Contacted ({orders.filter(o => o.status === "contacted").length})
              </Button>
            </div>
            {selectedOrders.length > 0 && (
              <div className="flex gap-2 ml-auto">
                <Button
                  variant="outline"
                  onClick={() => handleBulkAction("approved")}
                  className="gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Selected
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleBulkAction("contacted")}
                  className="gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Mark Contacted
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleBulkAction("closed")}
                  className="gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Close Selected
                </Button>
              </div>
            )}
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedOrders.length === currentItems.length && currentItems.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedOrders(currentItems.map(o => o.id));
                        } else {
                          setSelectedOrders([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.map((order) => (
                  <>
                    <TableRow key={order.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedOrders([...selectedOrders, order.id]);
                            } else {
                              setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.full_name}</div>
                          <div className="text-sm text-muted-foreground">{order.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.car_make} {order.car_model} ({order.car_year})
                      </TableCell>
                      <TableCell>KSh {Number(order.car_price).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleContact(order)}
                          className="gap-2"
                        >
                          {getContactIcon(order.contact_method)}
                          {order.contact_method}
                        </Button>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        {new Date(order.submitted_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                          >
                            {expandedOrderId === order.id ? "Close" : "Review"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditOrder(order)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteOrderId(order.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedOrderId === order.id && (
                      <TableRow>
                        <TableCell colSpan={8}>
                          <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                            <div>
                              <label className="text-sm font-medium">Admin Notes</label>
                              <Textarea
                                value={adminNotes[order.id] || order.admin_notes || ""}
                                onChange={(e) =>
                                  setAdminNotes({ ...adminNotes, [order.id]: e.target.value })
                                }
                                placeholder="Add notes about this order..."
                                className="mt-2"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleStatusChange(order.id, "approved")}
                                className="gap-2"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={() => handleStatusChange(order.id, "contacted")}
                                className="gap-2"
                              >
                                <Phone className="w-4 h-4" />
                                Mark Contacted
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleStatusChange(order.id, "closed")}
                                className="gap-2"
                              >
                                <XCircle className="w-4 h-4" />
                                Close Order
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={prevPage}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    onClick={() => goToPage(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
          </>
        )}
      </div>

      {/* Edit Order Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
            <DialogDescription>Update order information</DialogDescription>
          </DialogHeader>
          {editingOrder && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Customer Name</label>
                <Input
                  value={editingOrder.full_name}
                  onChange={(e) => setEditingOrder({ ...editingOrder, full_name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={editingOrder.phone}
                  onChange={(e) => setEditingOrder({ ...editingOrder, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={editingOrder.email}
                  onChange={(e) => setEditingOrder({ ...editingOrder, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Admin Notes</label>
                <Textarea
                  value={editingOrder.admin_notes || ""}
                  onChange={(e) => setEditingOrder({ ...editingOrder, admin_notes: e.target.value })}
                  placeholder="Internal notes..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteOrderId} onOpenChange={() => setDeleteOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the order from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteOrderId && handleDeleteOrder(deleteOrderId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Orders;
