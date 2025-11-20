import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Edit, Download, RefreshCw, Key, Clock, CheckCircle, XCircle, TrendingUp, Mail, History, Trash } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import LoadingScreen from "@/components/LoadingScreen";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface OTPRecord {
  id: string;
  user_id: string;
  code: string;
  expires_at: string;
  verified: boolean;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface AuditTrail {
  id: string;
  otp_id: string | null;
  user_id: string;
  action: string;
  performed_by: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: any;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface OTPStats {
  total_verified: number;
  active_unverified: number;
  expired_total: number;
  generated_last_24h: number;
  verified_last_24h: number;
  verification_rate: number;
}

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6"];

const OTPManagement = () => {
  const [otpRecords, setOtpRecords] = useState<OTPRecord[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditTrail[]>([]);
  const [statistics, setStatistics] = useState<OTPStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedOTP, setSelectedOTP] = useState<OTPRecord | null>(null);
  const [editForm, setEditForm] = useState({ code: "", expires_at: "" });
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && role?.role === "admin") {
      fetchAllData();
      
      // Subscribe to real-time updates
      const otpSubscription = supabase
        .channel("otp_changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "two_factor_auth" }, () => {
          fetchAllData();
        })
        .subscribe();

      const auditSubscription = supabase
        .channel("audit_changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "otp_audit_trail" }, () => {
          fetchAuditTrail();
        })
        .subscribe();

      return () => {
        otpSubscription.unsubscribe();
        auditSubscription.unsubscribe();
      };
    } else if (!user) {
      navigate("/auth");
    }
  }, [user, role, navigate]);

  const fetchAllData = async () => {
    await Promise.all([
      fetchOTPRecords(),
      fetchStatistics(),
      fetchAuditTrail()
    ]);
  };

  const fetchOTPRecords = async () => {
    try {
      setLoading(true);
      
      // First get OTP records
      const { data: otpData, error: otpError } = await supabase
        .from("two_factor_auth")
        .select("*")
        .order("created_at", { ascending: false });

      if (otpError) throw otpError;

      // Then get profiles for those user IDs
      const userIds = otpData?.map(otp => otp.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      // Merge the data
      const mergedData = otpData?.map(otp => ({
        ...otp,
        profiles: profilesData?.find(p => p.user_id === otp.user_id) || { full_name: "", email: "" }
      })) || [];

      setOtpRecords(mergedData);
    } catch (error) {
      console.error("Error fetching OTP records:", error);
      toast({
        title: "Error",
        description: "Failed to load OTP records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const { data, error } = await supabase
        .from("otp_statistics")
        .select("*")
        .single();

      if (error) throw error;
      setStatistics(data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const fetchAuditTrail = async () => {
    try {
      // Get audit trail
      const { data: auditData, error: auditError } = await supabase
        .from("otp_audit_trail")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (auditError) throw auditError;

      // Get profiles
      const userIds = auditData?.map(audit => audit.user_id) || [];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);

      // Merge data
      const mergedAudit = auditData?.map(audit => ({
        ...audit,
        profiles: profilesData?.find(p => p.user_id === audit.user_id) || { full_name: "", email: "" }
      })) || [];

      setAuditTrail(mergedAudit);
    } catch (error) {
      console.error("Error fetching audit trail:", error);
    }
  };

  const handleBulkCleanup = async () => {
    if (!confirm("Are you sure you want to delete all expired OTP codes?")) return;

    try {
      setCleanupLoading(true);
      const { data, error } = await supabase.functions.invoke("otp-cleanup");

      if (error) throw error;

      toast({
        title: "Success",
        description: data.message || "Expired OTPs cleaned up successfully",
      });
      
      fetchAllData();
    } catch (error) {
      console.error("Error during cleanup:", error);
      toast({
        title: "Error",
        description: "Failed to clean up expired OTPs",
        variant: "destructive",
      });
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this OTP record?")) return;

    try {
      const { error } = await supabase
        .from("two_factor_auth")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "OTP record deleted successfully",
      });
      fetchAllData();
    } catch (error) {
      console.error("Error deleting OTP:", error);
      toast({
        title: "Error",
        description: "Failed to delete OTP record",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (otp: OTPRecord) => {
    setSelectedOTP(otp);
    setEditForm({
      code: otp.code,
      expires_at: format(new Date(otp.expires_at), "yyyy-MM-dd'T'HH:mm"),
    });
    setEditDialogOpen(true);
  };

  const handleUpdateOTP = async () => {
    if (!selectedOTP) return;

    try {
      const { error } = await supabase
        .from("two_factor_auth")
        .update({
          code: editForm.code,
          expires_at: new Date(editForm.expires_at).toISOString(),
        })
        .eq("id", selectedOTP.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "OTP record updated successfully",
      });
      setEditDialogOpen(false);
      fetchAllData();
    } catch (error) {
      console.error("Error updating OTP:", error);
      toast({
        title: "Error",
        description: "Failed to update OTP record",
        variant: "destructive",
      });
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("OTP Management Report", 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), "PPpp")}`, 14, 30);
    doc.text(`Total Records: ${otpRecords.length}`, 14, 36);
    
    const tableData = otpRecords.map(otp => [
      otp.profiles?.full_name || "N/A",
      otp.profiles?.email || "N/A",
      otp.code,
      format(new Date(otp.created_at), "PP p"),
      format(new Date(otp.expires_at), "PP p"),
      otp.verified ? "Yes" : "No",
      new Date(otp.expires_at) < new Date() ? "Expired" : "Active",
    ]);
    
    autoTable(doc, {
      startY: 45,
      head: [["User", "Email", "Code", "Created", "Expires", "Verified", "Status"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 },
    });
    
    doc.save(`otp-records-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    
    toast({
      title: "Success",
      description: "PDF exported successfully",
    });
  };

  if (loading) return <LoadingScreen />;

  const activeOTPs = otpRecords.filter(otp => new Date(otp.expires_at) > new Date());
  const expiredOTPs = otpRecords.filter(otp => new Date(otp.expires_at) <= new Date());
  const verifiedOTPs = otpRecords.filter(otp => otp.verified);

  // Analytics data
  const pieData = [
    { name: "Verified", value: verifiedOTPs.length },
    { name: "Active", value: activeOTPs.length - verifiedOTPs.length },
    { name: "Expired", value: expiredOTPs.length },
  ];

  const dailyData = otpRecords.reduce((acc: any[], otp) => {
    const date = format(new Date(otp.created_at), "MMM dd");
    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.generated += 1;
      if (otp.verified) existing.verified += 1;
    } else {
      acc.push({ date, generated: 1, verified: otp.verified ? 1 : 0 });
    }
    return acc;
  }, []).slice(-7).reverse();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">OTP Management</h1>
            <p className="text-muted-foreground">Comprehensive two-factor authentication management</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={fetchAllData} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={handleBulkCleanup} variant="destructive" disabled={cleanupLoading}>
              <Trash className="mr-2 h-4 w-4" />
              {cleanupLoading ? "Cleaning..." : "Cleanup Expired"}
            </Button>
            <Button onClick={exportToPDF}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total OTPs</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{otpRecords.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {statistics?.generated_last_24h || 0} in last 24h
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeOTPs.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {statistics?.active_unverified || 0} unverified
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{verifiedOTPs.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {statistics?.verification_rate || 0}% rate
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Expired</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expiredOTPs.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ready for cleanup
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="records" className="space-y-4">
          <TabsList>
            <TabsTrigger value="records">
              <Key className="mr-2 h-4 w-4" />
              OTP Records
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <TrendingUp className="mr-2 h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="audit">
              <History className="mr-2 h-4 w-4" />
              Audit Trail
            </TabsTrigger>
          </TabsList>

          {/* OTP Records Tab */}
          <TabsContent value="records">
            <Card>
              <CardHeader>
                <CardTitle>OTP Records</CardTitle>
                <CardDescription>View and manage all two-factor authentication codes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Verified</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {otpRecords.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground">
                            No OTP records found
                          </TableCell>
                        </TableRow>
                      ) : (
                        otpRecords.map((otp) => {
                          const isExpired = new Date(otp.expires_at) < new Date();
                          return (
                            <TableRow key={otp.id}>
                              <TableCell className="font-medium">
                                {otp.profiles?.full_name || "N/A"}
                              </TableCell>
                              <TableCell>{otp.profiles?.email || "N/A"}</TableCell>
                              <TableCell className="font-mono">{otp.code}</TableCell>
                              <TableCell className="text-sm">
                                {format(new Date(otp.created_at), "PP p")}
                              </TableCell>
                              <TableCell className="text-sm">
                                {format(new Date(otp.expires_at), "PP p")}
                              </TableCell>
                              <TableCell>
                                <Badge variant={isExpired ? "destructive" : "default"}>
                                  {isExpired ? "Expired" : "Active"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={otp.verified ? "default" : "secondary"}>
                                  {otp.verified ? "Yes" : "No"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(otp)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(otp.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>OTP Distribution</CardTitle>
                  <CardDescription>Breakdown of OTP statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Daily Activity</CardTitle>
                  <CardDescription>OTP generation and verification trends (Last 7 days)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="generated" stroke="#3b82f6" name="Generated" />
                      <Line type="monotone" dataKey="verified" stroke="#10b981" name="Verified" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Key Metrics</CardTitle>
                  <CardDescription>Performance indicators for OTP system</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Verification Rate</p>
                      <p className="text-3xl font-bold text-foreground">{statistics?.verification_rate || 0}%</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">24h Generated</p>
                      <p className="text-3xl font-bold text-foreground">{statistics?.generated_last_24h || 0}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">24h Verified</p>
                      <p className="text-3xl font-bold text-foreground">{statistics?.verified_last_24h || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Audit Trail Tab */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
                <CardDescription>Complete history of OTP actions and events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>IP Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditTrail.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No audit records found
                          </TableCell>
                        </TableRow>
                      ) : (
                        auditTrail.map((audit) => (
                          <TableRow key={audit.id}>
                            <TableCell className="text-sm">
                              {format(new Date(audit.created_at), "PPp")}
                            </TableCell>
                            <TableCell className="font-medium">
                              {audit.profiles?.full_name || "System"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                audit.action === "verified" ? "default" :
                                audit.action === "generated" ? "secondary" :
                                audit.action === "deleted" ? "destructive" :
                                "outline"
                              }>
                                {audit.action}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {audit.metadata?.reason || audit.metadata?.notification_sent ? "Notification sent" : "-"}
                            </TableCell>
                            <TableCell className="text-sm font-mono">
                              {audit.ip_address || "N/A"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit OTP Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="code">OTP Code</Label>
              <Input
                id="code"
                value={editForm.code}
                onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                maxLength={6}
              />
            </div>
            <div>
              <Label htmlFor="expires_at">Expires At</Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={editForm.expires_at}
                onChange={(e) => setEditForm({ ...editForm, expires_at: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateOTP}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OTPManagement;
