import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, Shield, Users, Key, Lock, Plus, Trash2, Edit, 
  RefreshCw, Crown, CheckCircle, XCircle, Search, AlertTriangle,
  UserCog, Settings
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions, logAdminAction } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import LoadingScreen from "@/components/LoadingScreen";

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  created_at: string;
}

interface RolePermission {
  id: string;
  role: string;
  permission_id: string;
  permission?: Permission;
}

interface AdminUser {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  permissions: string[];
  isSuperAdmin: boolean;
}

interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  details: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
  admin_name?: string;
}

const RBACManagement = () => {
  const navigate = useNavigate();
  const { user, profile, role, loading } = useAuth();
  const { isSuperAdmin, hasPermission, loading: permLoading } = usePermissions(user?.id);
  const { toast } = useToast();

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Dialog states
  const [showAddPermission, setShowAddPermission] = useState(false);
  const [newPermission, setNewPermission] = useState({ name: "", description: "", category: "general" });
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);

  useEffect(() => {
    if (!loading && (!user || role?.role !== "admin")) {
      navigate("/auth");
    }
  }, [loading, user, role, navigate]);

  useEffect(() => {
    if (user && role?.role === "admin") {
      fetchAllData();
    }
  }, [user, role]);

  const fetchAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchPermissions(),
      fetchRolePermissions(),
      fetchAdminUsers(),
      fetchAdminLogs()
    ]);
    setIsLoading(false);
  };

  const fetchPermissions = async () => {
    const { data, error } = await supabase
      .from("permissions")
      .select("*")
      .order("category", { ascending: true });
    
    if (!error && data) {
      setPermissions(data);
    }
  };

  const fetchRolePermissions = async () => {
    const { data, error } = await supabase
      .from("role_permissions")
      .select(`
        id,
        role,
        permission_id,
        permissions (id, name, description, category)
      `);
    
    if (!error && data) {
      setRolePermissions(data.map((rp: any) => ({
        ...rp,
        permission: rp.permissions
      })));
    }
  };

  const fetchAdminUsers = async () => {
    // Get all users with admin, super_admin, or staff roles
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["admin", "super_admin", "staff"]);

    if (rolesError || !userRoles) return;

    const userIds = userRoles.map(r => r.user_id);
    
    const { data: admins, error } = await supabase
      .from("profiles")
      .select(`user_id, full_name, email`)
      .in("user_id", userIds);

    if (!error && admins) {
      const adminsWithPerms = await Promise.all(admins.map(async (admin) => {
        const userRole = userRoles.find(r => r.user_id === admin.user_id);
        const { data: perms } = await supabase
          .rpc('get_user_permissions', { _user_id: admin.user_id });
        
        const permNames = (perms as any[] || []).map(p => p.permission_name);
        
        return {
          ...admin,
          role: userRole?.role || 'admin',
          permissions: permNames,
          isSuperAdmin: userRole?.role === 'super_admin'
        };
      }));
      
      // Sort: super_admin first, then admin, then staff
      adminsWithPerms.sort((a, b) => {
        const order = { super_admin: 0, admin: 1, staff: 2 };
        return (order[a.role as keyof typeof order] || 3) - (order[b.role as keyof typeof order] || 3);
      });
      
      setAdminUsers(adminsWithPerms);
    }
  };

  const fetchAdminLogs = async () => {
    const { data: logs, error } = await supabase
      .from("admin_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && logs) {
      // Get admin names
      const adminIds = [...new Set(logs.map(l => l.admin_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", adminIds);

      const logsWithNames = logs.map(log => ({
        ...log,
        admin_name: profiles?.find(p => p.user_id === log.admin_id)?.full_name || 'Unknown'
      }));

      setAdminLogs(logsWithNames);
    }
  };

  const handleAddPermission = async () => {
    if (!newPermission.name) {
      toast({ title: "Error", description: "Permission name is required", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("permissions").insert({
      name: newPermission.name.toLowerCase().replace(/\s+/g, '_'),
      description: newPermission.description,
      category: newPermission.category
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Permission added successfully" });
      await logAdminAction(user!.id, 'create_permission', { permission: newPermission.name });
      setShowAddPermission(false);
      setNewPermission({ name: "", description: "", category: "general" });
      fetchPermissions();
    }
  };

  const handleDeletePermission = async (permId: string, permName: string) => {
    if (permName === 'super_admin') {
      toast({ title: "Error", description: "Cannot delete super_admin permission", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("permissions").delete().eq("id", permId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Permission deleted" });
      await logAdminAction(user!.id, 'delete_permission', { permission: permName });
      fetchPermissions();
      fetchRolePermissions();
    }
  };

  const handleToggleRolePermission = async (roleType: 'admin' | 'customer', permissionId: string, hasIt: boolean) => {
    if (hasIt) {
      // Remove permission
      await supabase
        .from("role_permissions")
        .delete()
        .eq("role", roleType)
        .eq("permission_id", permissionId);
    } else {
      // Add permission
      await supabase.from("role_permissions").insert({
        role: roleType,
        permission_id: permissionId
      });
    }

    await logAdminAction(user!.id, hasIt ? 'remove_role_permission' : 'add_role_permission', {
      role: roleType,
      permission_id: permissionId
    });

    fetchRolePermissions();
    fetchAdminUsers();
  };

  const roleHasPermission = (role: string, permissionId: string) => {
    return rolePermissions.some(rp => rp.role === role && rp.permission_id === permissionId);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      administration: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      users: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      inventory: "bg-green-500/20 text-green-400 border-green-500/30",
      orders: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      finance: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      rentals: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      system: "bg-red-500/20 text-red-400 border-red-500/30",
      analytics: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      security: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      hr: "bg-pink-500/20 text-pink-400 border-pink-500/30",
      content: "bg-teal-500/20 text-teal-400 border-teal-500/30",
      communication: "bg-violet-500/20 text-violet-400 border-violet-500/30",
      sales: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      general: "bg-gray-500/20 text-gray-400 border-gray-500/30"
    };
    return colors[category] || colors.general;
  };

  const filteredPermissions = permissions.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedPermissions = filteredPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading || permLoading || isLoading) {
    return <LoadingScreen />;
  }

  if (!user || !profile || role?.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin-dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-600/20">
                <Shield className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">RBAC Management</h1>
                <p className="text-sm text-muted-foreground">Role-Based Access Control System</p>
              </div>
            </div>
            {isSuperAdmin && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0">
                <Crown className="h-3 w-3 mr-1" />
                Super Admin
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchAllData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Key className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Permissions</p>
                  <p className="text-2xl font-bold">{permissions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Crown className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Super Admins</p>
                  <p className="text-2xl font-bold">{adminUsers.filter(a => a.role === 'super_admin').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Shield className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Admins</p>
                  <p className="text-2xl font-bold">{adminUsers.filter(a => a.role === 'admin').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-600/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <UserCog className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Staff</p>
                  <p className="text-2xl font-bold">{adminUsers.filter(a => a.role === 'staff').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Lock className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role Assignments</p>
                  <p className="text-2xl font-bold">{rolePermissions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="role-matrix">Role Matrix</TabsTrigger>
            <TabsTrigger value="admins">Admin Users</TabsTrigger>
            <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Super Admins Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-amber-500" />
                    Super Administrators
                  </CardTitle>
                  <CardDescription>Users with full system access</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {adminUsers.filter(a => a.role === 'super_admin').map(admin => (
                      <div key={admin.user_id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold">
                            {admin.full_name?.charAt(0) || 'A'}
                          </div>
                          <div>
                            <p className="font-medium">{admin.full_name}</p>
                            <p className="text-sm text-muted-foreground">{admin.email}</p>
                          </div>
                        </div>
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0">
                          Super Admin
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Permission Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Permission Categories
                  </CardTitle>
                  <CardDescription>Permissions grouped by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(groupedPermissions).map(([category, perms]) => (
                      <div key={category} className={`p-3 rounded-lg border ${getCategoryColor(category)}`}>
                        <p className="font-medium capitalize">{category}</p>
                        <p className="text-2xl font-bold">{perms.length}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Permissions</CardTitle>
                    <CardDescription>Manage system permissions</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search permissions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Dialog open={showAddPermission} onOpenChange={setShowAddPermission}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Permission
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Permission</DialogTitle>
                          <DialogDescription>Create a new system permission</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Permission Name</Label>
                            <Input
                              placeholder="e.g., manage_reports"
                              value={newPermission.name}
                              onChange={(e) => setNewPermission({ ...newPermission, name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              placeholder="What does this permission allow?"
                              value={newPermission.description}
                              onChange={(e) => setNewPermission({ ...newPermission, description: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>Category</Label>
                            <Select
                              value={newPermission.category}
                              onValueChange={(v) => setNewPermission({ ...newPermission, category: v })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="administration">Administration</SelectItem>
                                <SelectItem value="users">Users</SelectItem>
                                <SelectItem value="inventory">Inventory</SelectItem>
                                <SelectItem value="orders">Orders</SelectItem>
                                <SelectItem value="finance">Finance</SelectItem>
                                <SelectItem value="rentals">Rentals</SelectItem>
                                <SelectItem value="system">System</SelectItem>
                                <SelectItem value="analytics">Analytics</SelectItem>
                                <SelectItem value="security">Security</SelectItem>
                                <SelectItem value="hr">HR</SelectItem>
                                <SelectItem value="content">Content</SelectItem>
                                <SelectItem value="communication">Communication</SelectItem>
                                <SelectItem value="sales">Sales</SelectItem>
                                <SelectItem value="general">General</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowAddPermission(false)}>Cancel</Button>
                          <Button onClick={handleAddPermission}>Create Permission</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Permission</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Admin Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPermissions.map((perm) => (
                        <TableRow key={perm.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Key className="h-4 w-4 text-muted-foreground" />
                              <code className="text-sm bg-muted px-2 py-0.5 rounded">{perm.name}</code>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{perm.description}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getCategoryColor(perm.category)}>
                              {perm.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {roleHasPermission('admin', perm.id) ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {perm.name !== 'super_admin' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => handleDeletePermission(perm.id, perm.name)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Role Matrix Tab */}
          <TabsContent value="role-matrix">
            <Card>
              <CardHeader>
                <CardTitle>Role-Permission Matrix</CardTitle>
                <CardDescription>Real-World RBAC: Super Admin has full access, Admin can manage users, Staff and User have limited access</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Role Capability Overview */}
                <div className="mb-6 p-4 rounded-lg bg-muted/50 border">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Role Capabilities Overview
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-center">Can Login</TableHead>
                        <TableHead className="text-center">Manage Users</TableHead>
                        <TableHead className="text-center">Delete Data</TableHead>
                        <TableHead className="text-center">System Settings</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-amber-500" />
                            <span className="font-semibold">Super Admin</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center"><CheckCircle className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                        <TableCell className="text-center"><CheckCircle className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                        <TableCell className="text-center"><CheckCircle className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                        <TableCell className="text-center"><CheckCircle className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-blue-500" />
                            <span className="font-semibold">Admin</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center"><CheckCircle className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                        <TableCell className="text-center"><CheckCircle className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                        <TableCell className="text-center"><XCircle className="h-5 w-5 text-red-500 mx-auto" /></TableCell>
                        <TableCell className="text-center"><XCircle className="h-5 w-5 text-red-500 mx-auto" /></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserCog className="h-4 w-4 text-purple-500" />
                            <span className="font-semibold">Staff</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center"><CheckCircle className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                        <TableCell className="text-center"><XCircle className="h-5 w-5 text-red-500 mx-auto" /></TableCell>
                        <TableCell className="text-center"><XCircle className="h-5 w-5 text-red-500 mx-auto" /></TableCell>
                        <TableCell className="text-center"><XCircle className="h-5 w-5 text-red-500 mx-auto" /></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span className="font-semibold">User</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center"><CheckCircle className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                        <TableCell className="text-center"><XCircle className="h-5 w-5 text-red-500 mx-auto" /></TableCell>
                        <TableCell className="text-center"><XCircle className="h-5 w-5 text-red-500 mx-auto" /></TableCell>
                        <TableCell className="text-center"><XCircle className="h-5 w-5 text-red-500 mx-auto" /></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Full Permission Matrix */}
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-background">Permission</TableHead>
                        <TableHead className="text-center">
                          <div className="flex flex-col items-center">
                            <Crown className="h-4 w-4 text-amber-500 mb-1" />
                            Super Admin
                          </div>
                        </TableHead>
                        <TableHead className="text-center">
                          <div className="flex flex-col items-center">
                            <Shield className="h-4 w-4 text-blue-500 mb-1" />
                            Admin
                          </div>
                        </TableHead>
                        <TableHead className="text-center">
                          <div className="flex flex-col items-center">
                            <UserCog className="h-4 w-4 text-purple-500 mb-1" />
                            Staff
                          </div>
                        </TableHead>
                        <TableHead className="text-center">
                          <div className="flex flex-col items-center">
                            <Users className="h-4 w-4 text-gray-500 mb-1" />
                            Customer
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(groupedPermissions).map(([category, perms]) => (
                        <>
                          <TableRow key={category} className="bg-muted/50">
                            <TableCell colSpan={5} className="font-semibold capitalize">
                              {category}
                            </TableCell>
                          </TableRow>
                          {perms.map(perm => (
                            <TableRow key={perm.id}>
                              <TableCell className="sticky left-0 bg-background">
                                <div>
                                  <code className="text-sm">{perm.name}</code>
                                  <p className="text-xs text-muted-foreground">{perm.description}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                              </TableCell>
                              <TableCell className="text-center">
                                <Checkbox
                                  checked={roleHasPermission('admin', perm.id)}
                                  onCheckedChange={() => handleToggleRolePermission('admin', perm.id, roleHasPermission('admin', perm.id))}
                                  disabled={perm.name === 'super_admin' || perm.name === 'delete_data' || perm.name === 'system_settings'}
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Checkbox
                                  checked={roleHasPermission('staff', perm.id)}
                                  onCheckedChange={() => handleToggleRolePermission('staff' as any, perm.id, roleHasPermission('staff', perm.id))}
                                  disabled={perm.name === 'super_admin' || perm.name === 'manage_users' || perm.name === 'delete_data' || perm.name === 'system_settings'}
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Checkbox
                                  checked={roleHasPermission('customer', perm.id)}
                                  onCheckedChange={() => handleToggleRolePermission('customer', perm.id, roleHasPermission('customer', perm.id))}
                                  disabled={perm.name === 'super_admin' || perm.name === 'manage_users' || perm.name === 'delete_data' || perm.name === 'system_settings'}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Users Tab */}
          <TabsContent value="admins">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  Admin Users & Permissions
                </CardTitle>
                <CardDescription>View admin users and their assigned permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {adminUsers.map(admin => {
                    const getRoleBadge = () => {
                      switch (admin.role) {
                        case 'super_admin':
                          return (
                            <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0">
                              <Crown className="h-3 w-3 mr-1" />
                              Super Admin
                            </Badge>
                          );
                        case 'admin':
                          return (
                            <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          );
                        case 'staff':
                          return (
                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0">
                              <UserCog className="h-3 w-3 mr-1" />
                              Staff
                            </Badge>
                          );
                        default:
                          return <Badge variant="secondary">{admin.role}</Badge>;
                      }
                    };

                    const getAvatarColor = () => {
                      switch (admin.role) {
                        case 'super_admin': return 'bg-gradient-to-br from-amber-500 to-orange-600';
                        case 'admin': return 'bg-gradient-to-br from-blue-500 to-purple-600';
                        case 'staff': return 'bg-gradient-to-br from-purple-500 to-pink-600';
                        default: return 'bg-gradient-to-br from-gray-500 to-gray-600';
                      }
                    };

                    return (
                      <div key={admin.user_id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold ${getAvatarColor()}`}>
                              {admin.full_name?.charAt(0) || 'A'}
                            </div>
                            <div>
                              <p className="font-semibold text-lg">{admin.full_name}</p>
                              <p className="text-sm text-muted-foreground">{admin.email}</p>
                            </div>
                          </div>
                          {getRoleBadge()}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {admin.permissions.slice(0, 10).map(perm => (
                            <Badge key={perm} variant="secondary" className="text-xs">
                              {perm}
                            </Badge>
                          ))}
                          {admin.permissions.length > 10 && (
                            <Badge variant="outline" className="text-xs">
                              +{admin.permissions.length - 10} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit-logs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Admin Activity Audit Logs
                </CardTitle>
                <CardDescription>Track all administrative actions</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No audit logs yet. Actions will be recorded here.
                          </TableCell>
                        </TableRow>
                      ) : (
                        adminLogs.map(log => (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(log.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell className="font-medium">{log.admin_name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.action}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {JSON.stringify(log.details)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default RBACManagement;
