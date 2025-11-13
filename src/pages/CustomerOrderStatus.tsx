import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Package, CheckCircle, Phone, Clock } from "lucide-react";
import { toast } from "sonner";
import LoadingScreen from "@/components/LoadingScreen";

interface Order {
  id: string;
  car_make: string;
  car_model: string;
  car_year: number;
  car_price: number;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  admin_notes: string | null;
}

const CustomerOrderStatus = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchPhone, setSearchPhone] = useState("");

  useEffect(() => {
    if (user) {
      fetchUserOrders();
    }
  }, [user]);

  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      
      // Get user's email from auth
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser?.email) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("whitelist_orders")
        .select("*")
        .eq("email", authUser.email)
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

  const searchOrders = async () => {
    if (!searchEmail && !searchPhone) {
      toast.error("Please enter email or phone number");
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from("whitelist_orders")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (searchEmail) {
        query = query.eq("email", searchEmail);
      } else if (searchPhone) {
        query = query.eq("phone", searchPhone);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
      
      if (data.length === 0) {
        toast.info("No orders found with that information");
      }
    } catch (error: any) {
      console.error("Error searching orders:", error);
      toast.error("Failed to search orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "contacted":
        return <Phone className="w-5 h-5 text-blue-500" />;
      case "closed":
        return <Package className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5" />;
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

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "pending":
        return "Your order is being reviewed by our team";
      case "approved":
        return "Your order has been approved! We'll contact you soon.";
      case "contacted":
        return "We've reached out to you regarding your order";
      case "closed":
        return "This order has been completed";
      default:
        return "";
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(user ? "/customer-dashboard" : "/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Track Your Orders</h1>
            <p className="text-muted-foreground">
              View the status of your vehicle orders
            </p>
          </div>
        </div>

        {/* Search Card (for non-logged in users) */}
        {!user && (
          <Card>
            <CardHeader>
              <CardTitle>Search Orders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone Number (Alternative)</label>
                <Input
                  type="tel"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className="mt-2"
                />
              </div>
              <Button onClick={searchOrders} className="w-full gap-2">
                <Search className="w-4 h-4" />
                Search Orders
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Orders List */}
        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Orders Found</h3>
              <p className="text-muted-foreground">
                {user ? "You haven't placed any orders yet." : "No orders found with that information."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(order.status)}
                      <div>
                        <h3 className="text-lg font-semibold">
                          {order.car_make} {order.car_model} ({order.car_year})
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Submitted on {new Date(order.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="font-semibold">KSh {Number(order.car_price).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Order ID</p>
                      <p className="font-mono text-sm">{order.id.slice(0, 8)}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-1">Status Update</p>
                    <p className="text-sm text-muted-foreground">
                      {getStatusMessage(order.status)}
                    </p>
                    {order.admin_notes && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-sm font-medium mb-1">Note from our team:</p>
                        <p className="text-sm text-muted-foreground">{order.admin_notes}</p>
                      </div>
                    )}
                  </div>

                  {order.reviewed_at && (
                    <p className="text-xs text-muted-foreground mt-4">
                      Last updated: {new Date(order.reviewed_at).toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerOrderStatus;
