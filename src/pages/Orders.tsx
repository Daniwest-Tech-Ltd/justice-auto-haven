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
import { ArrowLeft, Phone, MessageSquare, Mail, Send, CheckCircle, XCircle, Download, Edit, Trash2, Volume2, VolumeX, Filter, Search, Upload, FileDown, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { usePagination } from "@/hooks/usePagination";
import LoadingScreen from "@/components/LoadingScreen";
import jsPDF from "jspdf";
import "jspdf-autotable";
import logo from "@/assets/logo.png";
import { EmailTemplates } from "@/components/EmailTemplates";
import { OrderAnalytics } from "@/components/OrderAnalytics";
import { AutomatedFollowUp } from "@/components/AutomatedFollowUp";
import * as XLSX from "xlsx";

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
  const { user, role } = useAuth();
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
  const [activeTab, setActiveTab] = useState<"orders" | "analytics" | "templates" | "followup">("orders");

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
    if (role?.role !== "admin") {
      navigate("/admin-dashboard");
      return;
    }
    fetchOrders();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [role, navigate]);

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
      
      // Add logo
      const logoImg = new Image();
      logoImg.src = logo;
      await new Promise((resolve) => {
        logoImg.onload = resolve;
      });
      doc.addImage(logoImg, 'PNG', 14, 10, 30, 15);
      
      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("JUSTICE ULTIMATE AUTOMOBILES", 50, 18);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Orders Report", 50, 24);
      
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);
      doc.text(`Total Orders: ${filteredOrders.length}`, 14, 38);

      const tableData = filteredOrders.map(order => [
        order.full_name,
        `${order.car_make} ${order.car_model} (${order.car_year})`,
        `KSh ${Number(order.car_price).toLocaleString()}`,
        order.phone,
        order.email,
        order.contact_method,
        order.status,
        new Date(order.submitted_at).toLocaleDateString(),
      ]);

      (doc as any).autoTable({
        head: [['Customer', 'Vehicle', 'Price', 'Phone', 'Email', 'Contact', 'Status', 'Date']],
        body: tableData,
        startY: 45,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [220, 38, 38] },
      });

      // Watermark on each page
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(50);
        doc.setTextColor(200, 200, 200);
        doc.setFont("helvetica", "bold");
        doc.text("JUSTICE ULTIMATE AUTOMOBILES", doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() / 2, {
          align: "center",
          angle: 45
        });
      }

      doc.save(`orders-report-${new Date().toISOString().split('T')[0]}.pdf`);
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

  if (loading) {
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
        </div>

        {activeTab === "analytics" && <OrderAnalytics />}
        {activeTab === "templates" && <EmailTemplates />}
        {activeTab === "followup" && <AutomatedFollowUp />}

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
