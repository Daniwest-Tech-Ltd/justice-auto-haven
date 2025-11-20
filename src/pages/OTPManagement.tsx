import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Trash2, Edit, Download, RefreshCw, Key, Clock, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import LoadingScreen from "@/components/LoadingScreen";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

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

const OTPManagement = () => {
  const [otpRecords, setOtpRecords] = useState<OTPRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedOTP, setSelectedOTP] = useState<OTPRecord | null>(null);
  const [editForm, setEditForm] = useState({ code: "", expires_at: "" });
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && role?.role === "admin") {
      fetchOTPRecords();
      
      // Subscribe to real-time updates
      const subscription = supabase
        .channel("otp_changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "two_factor_auth" }, () => {
          fetchOTPRecords();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    } else if (!user) {
      navigate("/auth");
    }
  }, [user, role, navigate]);

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
      fetchOTPRecords();
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
      fetchOTPRecords();
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
    
    // Add title
    doc.setFontSize(18);
    doc.text("OTP Management Report", 14, 20);
    
    // Add metadata
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), "PPpp")}`, 14, 30);
    doc.text(`Total Records: ${otpRecords.length}`, 14, 36);
    
    // Prepare table data
    const tableData = otpRecords.map(otp => [
      otp.profiles?.full_name || "N/A",
      otp.profiles?.email || "N/A",
      otp.code,
      format(new Date(otp.created_at), "PP p"),
      format(new Date(otp.expires_at), "PP p"),
      otp.verified ? "Yes" : "No",
      new Date(otp.expires_at) < new Date() ? "Expired" : "Active",
    ]);
    
    // Add table
    autoTable(doc, {
      startY: 45,
      head: [["User", "Email", "Code", "Created", "Expires", "Verified", "Status"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 },
    });
    
    // Save PDF
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">OTP Management</h1>
            <p className="text-muted-foreground">Manage two-factor authentication codes</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={fetchOTPRecords} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
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
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeOTPs.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Expired</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expiredOTPs.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{verifiedOTPs.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* OTP Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>OTP Records</CardTitle>
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
