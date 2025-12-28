import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  CreditCard, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  Receipt,
  Download,
  Eye
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

// Correct IPN ID from Pesapal Dashboard
const PESAPAL_IPN_ID = "7dda9c82-21ba-4ded-984c-daeb20fa7259";

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
  status: string;
}

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
  created_at: string;
  completed_at: string | null;
}

interface OrderPaymentsTabProps {
  orders: Order[];
}

export const OrderPaymentsTab = ({ orders }: OrderPaymentsTabProps) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const completedPayments = payments.filter(p => p.status === "completed");
  const pendingPayments = payments.filter(p => p.status === "pending");
  const totalRevenue = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const orderPayments = payments.filter(p => p.order_id);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> {status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-500">KES {totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-10 h-10 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed Payments</p>
                <p className="text-2xl font-bold text-blue-500">{completedPayments.length}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Payments</p>
                <p className="text-2xl font-bold text-yellow-500">{pendingPayments.length}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-500/50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Order Payments</p>
                <p className="text-2xl font-bold text-purple-500">{orderPayments.length}</p>
              </div>
              <Receipt className="w-10 h-10 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pesapal Gateway Info */}
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
                title="Pesapal Payment Gateway"
              />
            </div>
            
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>IPN ID:</strong> {PESAPAL_IPN_ID}
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

      {/* Payments Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Order Payments</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchPayments}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading payments...</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payments found. Payments will appear here after customers complete Pesapal payments.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.slice(0, 20).map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs">
                      {payment.pesapal_merchant_reference || payment.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.customer_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{payment.customer_email || "—"}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {payment.currency} {Number(payment.amount).toLocaleString()}
                    </TableCell>
                    <TableCell>{payment.payment_method || "—"}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>
                      {format(new Date(payment.created_at), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {payment.status === "completed" && (
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
