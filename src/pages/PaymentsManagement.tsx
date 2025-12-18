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
import LoadingScreen from "@/components/LoadingScreen";
import { format } from "date-fns";
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
  Eye
} from "lucide-react";

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
  const [ipnLogs, setIPNLogs] = useState<IPNLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPOSDialog, setShowPOSDialog] = useState(false);
  const [posLoading, setPOSLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<IPNLog | null>(null);
  
  const [posForm, setPOSForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    amount: "",
    description: ""
  });

  useEffect(() => {
    if (!authLoading && (!user || role?.role !== "admin")) {
      navigate("/");
    }
  }, [user, role, authLoading, navigate]);

  useEffect(() => {
    if (user && role?.role === "admin") {
      fetchPayments();
      fetchIPNLogs();
    }
  }, [user, role]);

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
      toast({
        title: "Error",
        description: "Failed to fetch payments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchIPNLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_ipn_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setIPNLogs(data || []);
    } catch (error) {
      console.error("Error fetching IPN logs:", error);
    }
  };

  const handlePOSPayment = async () => {
    if (!posForm.amount || !posForm.customer_name) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive"
      });
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
        toast({
          title: "Payment Initiated",
          description: "Pesapal payment page opened in new tab"
        });
        setShowPOSDialog(false);
        setPOSForm({ customer_name: "", customer_email: "", customer_phone: "", amount: "", description: "" });
        fetchPayments();
      }
    } catch (error: any) {
      console.error("POS payment error:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to initiate payment",
        variant: "destructive"
      });
    } finally {
      setPOSLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
      case "failed":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
      case "reversed":
        return <Badge variant="secondary">Reversed</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    }
  };

  const filteredPayments = payments.filter(payment => 
    payment.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.pesapal_merchant_reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.pesapal_tracking_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: payments.length,
    completed: payments.filter(p => p.status === "completed").length,
    pending: payments.filter(p => p.status === "pending").length,
    failed: payments.filter(p => p.status === "failed").length,
    totalAmount: payments.filter(p => p.status === "completed").reduce((sum, p) => sum + Number(p.amount), 0)
  };

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Payments Management</h1>
              <p className="text-muted-foreground">Pesapal transactions and IPN logs</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { fetchPayments(); fetchIPNLogs(); }}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
            <Dialog open={showPOSDialog} onOpenChange={setShowPOSDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" /> POS Payment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Initiate POS Payment</DialogTitle>
                  <DialogDescription>Create a payment for walk-in customers</DialogDescription>
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KES {stats.totalAmount.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="transactions">
          <TabsList>
            <TabsTrigger value="transactions">
              <CreditCard className="w-4 h-4 mr-2" /> Transactions
            </TabsTrigger>
            <TabsTrigger value="ipn-logs">
              <FileText className="w-4 h-4 mr-2" /> IPN Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Search by name, email, or reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

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
                          <div className="font-mono text-sm">
                            {payment.pesapal_merchant_reference || payment.id.slice(0, 8)}
                          </div>
                          {payment.pesapal_tracking_id && (
                            <div className="text-xs text-muted-foreground">
                              Track: {payment.pesapal_tracking_id}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>{payment.customer_name || "N/A"}</div>
                          <div className="text-xs text-muted-foreground">{payment.customer_email}</div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {payment.currency} {Number(payment.amount).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.payment_method}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>
                          <div>{format(new Date(payment.created_at), "MMM dd, yyyy")}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(payment.created_at), "HH:mm:ss")}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredPayments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No payments found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ipn-logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>IPN Notification Logs</CardTitle>
                <CardDescription>Pesapal instant payment notifications for debugging and audits</CardDescription>
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
                        <TableCell className="font-mono text-sm">
                          {log.pesapal_tracking_id || "N/A"}
                        </TableCell>
                        <TableCell>{log.pesapal_notification_type || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant={
                            log.status === "processed" ? "default" :
                            log.status === "error" ? "destructive" :
                            log.status === "duplicate" ? "secondary" : "outline"
                          }>
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.ip_address || "N/A"}</TableCell>
                        <TableCell>
                          {format(new Date(log.created_at), "MMM dd, HH:mm:ss")}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {ipnLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No IPN logs yet
                        </TableCell>
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
                  <div>
                    <Label>Tracking ID</Label>
                    <p className="font-mono">{selectedLog.pesapal_tracking_id || "N/A"}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <p>{selectedLog.status}</p>
                  </div>
                  <div>
                    <Label>Received At</Label>
                    <p>{format(new Date(selectedLog.created_at), "PPpp")}</p>
                  </div>
                  <div>
                    <Label>Processed At</Label>
                    <p>{selectedLog.processed_at ? format(new Date(selectedLog.processed_at), "PPpp") : "N/A"}</p>
                  </div>
                </div>
                {selectedLog.error_message && (
                  <div>
                    <Label className="text-red-600">Error Message</Label>
                    <p className="text-red-600">{selectedLog.error_message}</p>
                  </div>
                )}
                <div>
                  <Label>Raw Payload</Label>
                  <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-64 text-xs">
                    {JSON.stringify(selectedLog.payload, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* IPN URL Info */}
        <Card>
          <CardHeader>
            <CardTitle>Pesapal IPN Configuration</CardTitle>
            <CardDescription>Use this URL when registering your IPN in Pesapal dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <Label>Your IPN URL:</Label>
              <code className="block mt-2 p-3 bg-background rounded border font-mono text-sm break-all">
                https://ccsfhblxkmyqdqqcgitt.supabase.co/functions/v1/pesapal-ipn
              </code>
              <p className="text-sm text-muted-foreground mt-2">
                Request Type: <strong>POST</strong> | This URL receives payment notifications from Pesapal
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentsManagement;