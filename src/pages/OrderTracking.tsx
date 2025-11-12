import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Search, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "@/components/LoadingScreen";

const OrderTracking = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email or phone number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const { data, error } = await supabase
        .from("whitelist_orders")
        .select("*")
        .or(`email.eq.${searchTerm},phone.eq.${searchTerm}`)
        .order("submitted_at", { ascending: false });

      if (error) throw error;

      setOrders(data || []);
      
      if (data?.length === 0) {
        toast({
          title: "No Orders Found",
          description: "We couldn't find any orders with that email or phone number",
        });
      }
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

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: { color: string; text: string } } = {
      pending: { color: "bg-yellow-500", text: "Pending Review" },
      approved: { color: "bg-green-500", text: "Approved ✅" },
      contacted: { color: "bg-blue-500", text: "We Contacted You" },
      closed: { color: "bg-gray-500", text: "Completed" },
    };
    const variant = variants[status] || variants.pending;
    return (
      <Badge className={variant.color}>
        {variant.text}
      </Badge>
    );
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="max-w-2xl mx-auto">
        <Card className="glass-strong mb-8">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Package className="h-6 w-6" />
              Track Your VIP Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Enter your Email or Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="email@example.com or 0722827458"
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch}>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Enter the email or phone number you used when placing your order to track its status.
            </p>
          </CardContent>
        </Card>

        {searched && orders.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Your Orders</h2>
            {orders.map((order) => (
              <Card key={order.id} className="glass-strong">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">
                        {order.car_make} {order.car_model} ({order.car_year})
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Submitted: {new Date(order.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-bold">KSH {order.car_price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Contact Method:</span>
                      <span className="capitalize">{order.contact_method}</span>
                    </div>
                  </div>

                  {order.status === "pending" && (
                    <div className="bg-accent/50 p-3 rounded-lg">
                      <p className="text-sm">
                        ⏳ Your order is being reviewed. We will contact you within 24 hours.
                      </p>
                    </div>
                  )}

                  {order.status === "approved" && (
                    <div className="bg-green-500/20 p-3 rounded-lg">
                      <p className="text-sm">
                        ✅ Your order has been approved! We will be in touch shortly.
                      </p>
                    </div>
                  )}

                  {order.status === "contacted" && (
                    <div className="bg-blue-500/20 p-3 rounded-lg">
                      <p className="text-sm">
                        📞 We have reached out to you. Please check your {order.contact_method}.
                      </p>
                    </div>
                  )}

                  {order.admin_notes && (
                    <div className="mt-3 p-3 bg-accent/30 rounded-lg">
                      <p className="text-sm font-medium mb-1">Admin Notes:</p>
                      <p className="text-sm text-muted-foreground">{order.admin_notes}</p>
                    </div>
                  )}

                  <div className="mt-4 p-3 bg-accent/20 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      Need help? Contact us: 📞 0722827458 | 📧 justicevincentt@gmail.com
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {searched && orders.length === 0 && (
          <Card className="glass-strong">
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Orders Found</h3>
              <p className="text-muted-foreground mb-4">
                We couldn't find any orders with that email or phone number.
              </p>
              <p className="text-sm text-muted-foreground">
                If you recently placed an order, please try again in a few minutes.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;
