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
import { ArrowLeft, Phone, MessageSquare, Mail, Send, CheckCircle, XCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { usePagination } from "@/hooks/usePagination";
import LoadingScreen from "@/components/LoadingScreen";
import jsPDF from "jspdf";
import "jspdf-autotable";

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

  const { currentItems, currentPage, totalPages, nextPage, prevPage, goToPage } = usePagination({
    items: orders.filter(o => statusFilter === "all" || o.status === statusFilter),
    itemsPerPage: 10,
  });

  useEffect(() => {
    if (role?.role !== "admin") {
      navigate("/admin-dashboard");
      return;
    }
    fetchOrders();
    setupRealtimeSubscription();
  }, [role, navigate]);

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

  const exportToPDF = () => {
    const doc = new jsPDF();
    const filteredOrders = statusFilter === "all" ? orders : orders.filter(o => o.status === statusFilter);
    
    doc.setFontSize(18);
    doc.text("Orders Report", 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Orders: ${filteredOrders.length}`, 14, 36);

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
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`orders-report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success("PDF exported successfully!");
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
          <Button onClick={exportToPDF} className="gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        </div>

        {/* Filters and Bulk Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Filters & Bulk Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                        >
                          {expandedOrderId === order.id ? "Close" : "Review"}
                        </Button>
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
      </div>
    </div>
  );
};

export default Orders;
