import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Phone, Mail, MessageSquare, Check, X, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import LoadingScreen from "@/components/LoadingScreen";

const WhitelistOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || role?.role !== "admin") {
      navigate("/auth");
      return;
    }
    fetchOrders();
  }, [user, role]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("whitelist_orders")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      // Get order details first
      const { data: orderData } = await supabase
        .from("whitelist_orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (!orderData) throw new Error("Order not found");

      // Update order status
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

      // Send automated email notification
      if (["approved", "contacted", "closed"].includes(newStatus)) {
        try {
          await supabase.functions.invoke("send-order-notification", {
            body: {
              email: orderData.email,
              phone: orderData.phone,
              customerName: orderData.full_name,
              carMake: orderData.car_make,
              carModel: orderData.car_model,
              carYear: orderData.car_year,
              status: newStatus,
              adminNotes: adminNotes[orderId] || null,
            },
          });
        } catch (emailError) {
          console.error("Email notification error:", emailError);
          // Don't fail the whole operation if email fails
        }
      }

      toast({
        title: "Success",
        description: `Order marked as ${newStatus}${["approved", "contacted", "closed"].includes(newStatus) ? " and customer notified via email" : ""}`,
      });
      fetchOrders();
      setExpandedOrder(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getContactIcon = (method: string) => {
    switch (method) {
      case "whatsapp":
        return <MessageSquare className="h-4 w-4" />;
      case "call":
        return <Phone className="h-4 w-4" />;
      case "sms":
        return <MessageSquare className="h-4 w-4" />;
      case "email":
        return <Mail className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleContact = (order: any) => {
    switch (order.contact_method) {
      case "whatsapp":
        window.open(`https://wa.me/${order.phone.replace(/^0/, "254")}`, "_blank");
        break;
      case "call":
        window.location.href = `tel:${order.phone}`;
        break;
      case "sms":
        window.location.href = `sms:${order.phone}`;
        break;
      case "email":
        window.location.href = `mailto:${order.email}`;
        break;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: string } = {
      pending: "bg-yellow-500",
      approved: "bg-green-500",
      contacted: "bg-blue-500",
      closed: "bg-gray-500",
    };
    return (
      <Badge className={variants[status] || "bg-gray-500"}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const pendingCount = orders.filter((o) => o.status === "pending").length;

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/admin-dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">VIP Whitelist Orders</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/admin/vip-analytics")} variant="outline">
            View Analytics
          </Button>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {pendingCount} Pending
          </Badge>
        </div>
      </div>

      <Card className="glass-strong">
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No orders yet
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <>
                    <TableRow key={order.id} className={order.status === "pending" ? "bg-accent/20" : ""}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(order.submitted_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.full_name}</p>
                          <p className="text-sm text-muted-foreground">{order.email}</p>
                          <p className="text-sm text-muted-foreground">{order.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {order.car_make} {order.car_model}
                          </p>
                          <p className="text-sm text-muted-foreground">{order.car_year}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold">
                        KSH {order.car_price.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleContact(order)}
                          className="flex items-center gap-2"
                        >
                          {getContactIcon(order.contact_method)}
                          {order.contact_method.toUpperCase()}
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setExpandedOrder(expandedOrder === order.id ? null : order.id)
                            }
                          >
                            {expandedOrder === order.id ? "Hide" : "Review"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedOrder === order.id && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-accent/10">
                          <div className="space-y-4 p-4">
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
                                size="sm"
                                onClick={() => handleStatusChange(order.id, "approved")}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleStatusChange(order.id, "contacted")}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Mark Contacted
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleStatusChange(order.id, "closed")}
                                variant="outline"
                              >
                                Close Order
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhitelistOrders;
