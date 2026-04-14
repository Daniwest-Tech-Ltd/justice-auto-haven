import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Package, ShoppingCart, Eye, Plus } from "lucide-react";
import { toast } from "sonner";
import LoadingScreen from "@/components/LoadingScreen";

const ORDER_STAGES = [
  { key: "order_placed", label: "Order Placed", color: "bg-blue-500" },
  { key: "car_confirmed", label: "Car Confirmed", color: "bg-indigo-500" },
  { key: "payment_pending", label: "Payment Pending", color: "bg-yellow-500" },
  { key: "payment_submitted", label: "Payment Submitted", color: "bg-orange-500" },
  { key: "payment_approved", label: "Payment Approved", color: "bg-emerald-500" },
  { key: "logbook_processing", label: "Logbook Processing", color: "bg-purple-500" },
  { key: "ready_for_handover", label: "Ready for Handover", color: "bg-teal-500" },
  { key: "completed", label: "Completed", color: "bg-green-600" },
];

const MyOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("customer_orders")
        .select("*")
        .eq("customer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (e: any) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const getStageIndex = (status: string) => ORDER_STAGES.findIndex(s => s.key === status);
  
  const getStatusBadge = (status: string) => {
    const stage = ORDER_STAGES.find(s => s.key === status);
    if (status === "cancelled") return <Badge variant="destructive">Cancelled</Badge>;
    if (status === "completed") return <Badge className="bg-green-600 text-white">Completed ✅</Badge>;
    return <Badge variant="secondary">{stage?.label || status}</Badge>;
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/customer-dashboard")} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">My Orders</h1>
            <p className="text-muted-foreground text-sm">Track your car orders in real-time</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Orders Yet</h3>
              <p className="text-muted-foreground mb-4">Browse our catalogue to find your dream car</p>
              <Button onClick={() => navigate("/catalogue")} className="gap-2">
                <ShoppingCart className="w-4 h-4" /> Browse Catalogue
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const stageIdx = getStageIndex(order.status);
              const progress = order.status === "cancelled" ? 0 : ((stageIdx + 1) / ORDER_STAGES.length) * 100;
              return (
                <Card key={order.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/my-orders/${order.id}`)}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {order.car_make} {order.car_model} ({order.car_year})
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Ordered: {new Date(order.created_at).toLocaleDateString("en-KE", {
                            weekday: "short", year: "numeric", month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit"
                          })}
                        </p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>

                    {/* Progress bar */}
                    {order.status !== "cancelled" && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        KSh {Number(order.car_price || 0).toLocaleString()}
                      </p>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Eye className="w-3 h-3" /> Track Order
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
