import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Ban, Trash2, Edit, CheckCircle, Copy } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Customer {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  is_suspended: boolean;
  activation_code: string | null;
  created_at: string;
  role: string;
  is_online: boolean;
}

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAdminId, setCurrentAdminId] = useState<string>("");
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", email: "", phone: "" });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
    getCurrentAdmin();
    
    // Refresh every 10 seconds to update online status
    const interval = setInterval(fetchCustomers, 10000);
    return () => clearInterval(interval);
  }, []);

  const getCurrentAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentAdminId(user.id);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      const customersWithRoles = profilesData?.map(profile => {
        const userRole = rolesData?.find(r => r.user_id === profile.user_id);
        return {
          ...profile,
          role: userRole?.role || "customer"
        };
      }) || [];

      setCustomers(customersWithRoles);
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

  const suspendCustomer = async (userId: string) => {
    try {
      // Get user email first
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("user_id", userId)
        .single();

      // Generate activation code
      const { data: codeData } = await supabase.rpc('generate_activation_code');
      const activationCode = codeData || Math.random().toString(36).substring(2, 10).toUpperCase();

      const { error } = await supabase
        .from("profiles")
        .update({ 
          is_suspended: true,
          suspended_at: new Date().toISOString(),
          suspended_reason: "Suspended by admin",
          activation_code: activationCode
        })
        .eq("user_id", userId);

      if (error) throw error;

      // Send suspension notification email
      if (profile?.email) {
        await supabase.functions.invoke('send-suspension-notification', {
          body: {
            email: profile.email,
            reason: "Suspended by admin",
            activationCode
          }
        });
      }

      toast({
        title: "Customer Suspended",
        description: `Activation code: ${activationCode}. Email notification sent.`,
      });
      fetchCustomers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const activateCustomer = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          is_suspended: false,
          suspended_at: null,
          suspended_reason: null,
          activation_code: null,
          login_attempts: 0
        })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Customer Activated",
        description: "Customer account has been reactivated successfully",
      });
      fetchCustomers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyActivationCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Activation code copied to clipboard",
    });
  };

  const deleteCustomer = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
      fetchCustomers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditForm({
      full_name: customer.full_name,
      email: customer.email,
      phone: customer.phone
    });
  };

  const handleEditSubmit = async () => {
    if (!editingCustomer) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update(editForm)
        .eq("user_id", editingCustomer.user_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
      setEditingCustomer(null);
      fetchCustomers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const activeCustomers = customers.filter(c => c.is_online).length;
  const inactiveCustomers = customers.length - activeCustomers;

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={() => navigate("/admin-dashboard")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card className="glass-strong mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Customer Management</CardTitle>
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="font-semibold">{activeCustomers}</span> Active
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="font-semibold">{inactiveCustomers}</span> Inactive
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Account Status</TableHead>
                  <TableHead>Activation Code</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => {
                  const isAdmin = customer.role === "admin";
                  const isCurrentUser = customer.user_id === currentAdminId;

                  return (
                    <TableRow key={customer.user_id}>
                      <TableCell>
                        {customer.is_online ? (
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                          </span>
                        ) : (
                          <span className="relative flex h-3 w-3">
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{customer.full_name}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>
                        <Badge variant={isAdmin ? "default" : "secondary"}>
                          {customer.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.is_suspended ? "destructive" : "default"}>
                          {customer.is_suspended ? "Suspended" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {customer.activation_code ? (
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {customer.activation_code}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyActivationCode(customer.activation_code!)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(customer.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {!isAdmin && !isCurrentUser && (
                            <>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEditDialog(customer)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Customer</DialogTitle>
                                    <DialogDescription>
                                      Update customer information
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Full Name</Label>
                                      <Input
                                        value={editForm.full_name}
                                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                      />
                                    </div>
                                    <div>
                                      <Label>Email</Label>
                                      <Input
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                      />
                                    </div>
                                    <div>
                                      <Label>Phone</Label>
                                      <Input
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button onClick={handleEditSubmit}>Save Changes</Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>

                              {customer.is_suspended ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => activateCustomer(customer.user_id)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              ) : (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="text-orange-600 hover:text-orange-700">
                                      <Ban className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Suspend Customer</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to suspend this customer? An activation code will be generated.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => suspendCustomer(customer.user_id)}>
                                        Suspend
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this customer? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deleteCustomer(customer.user_id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                          {isAdmin && !isCurrentUser && (
                            <Badge variant="outline">Protected</Badge>
                          )}
                          {isCurrentUser && (
                            <Badge variant="outline">You</Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCustomers;
