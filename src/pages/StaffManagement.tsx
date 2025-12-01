import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Plus, Search, UserPlus, Briefcase } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Staff {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  department: string;
  branch: string;
  status: string;
  avatar_url: string | null;
  last_login: string | null;
}

const staffRoles = [
  { value: "operations_manager", label: "Operations Manager" },
  { value: "sales_manager", label: "Sales Manager" },
  { value: "sales_rep", label: "Sales Representative" },
  { value: "rental_manager", label: "Rental Manager" },
  { value: "rental_staff", label: "Rental Staff" },
  { value: "tradein_manager", label: "Trade-In Manager" },
  { value: "tradein_staff", label: "Trade-In Staff" },
  { value: "mechanic", label: "Mechanic" },
  { value: "marketing_manager", label: "Marketing Manager" },
  { value: "designer", label: "Graphic Designer" },
  { value: "support_agent", label: "Support Agent" },
  { value: "accounts_manager", label: "Accounts Manager" },
  { value: "finance_staff", label: "Finance Staff" },
  { value: "driver", label: "Driver" },
  { value: "security_officer", label: "Security Officer" },
  { value: "system_admin", label: "System Admin" },
  { value: "it_support", label: "IT Support" },
];

export default function StaffManagement() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    branch: "Nairobi",
  });

  useEffect(() => {
    if (role?.role !== "admin") {
      navigate("/admin-dashboard");
      return;
    }
    fetchStaff();
  }, [role, navigate]);

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStaff(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch staff");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.role) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      // Generate username from email
      const username = formData.email.split('@')[0];

      const { error } = await supabase.from("staff").insert({
        username: username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || '',
        role: formData.role,
        department: formData.department,
        branch: formData.branch,
        status: "active",
      } as any);

      if (error) throw error;

      toast.success("Staff member added successfully");
      setOpen(false);
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        role: "",
        department: "",
        branch: "Nairobi",
      });
      fetchStaff();
    } catch (error: any) {
      toast.error(error.message || "Failed to add staff member");
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staff.filter(
    (s) =>
      s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRoleLabel = (role: string) => {
    const found = staffRoles.find((r) => r.value === role);
    return found ? found.label : role;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "inactive":
        return "bg-gray-500";
      default:
        return "bg-yellow-500";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin-dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
              <p className="text-muted-foreground">Manage your team members</p>
            </div>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-5 w-5" />
                Add Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name *</Label>
                    <Input
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <Label>Last Name *</Label>
                    <Input
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="staff@justiceauto.com"
                  />
                </div>

                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+254 XXX XXX XXX"
                  />
                </div>

                <div>
                  <Label>Role *</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Department</Label>
                  <Input
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    placeholder="Enter department"
                  />
                </div>

                <div>
                  <Label>Branch</Label>
                  <Input
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    placeholder="Nairobi"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddStaff} disabled={loading}>
                  {loading ? "Adding..." : "Add Staff"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p>Loading...</p>
          ) : filteredStaff.length === 0 ? (
            <Card className="col-span-full p-8 text-center">
              <p className="text-muted-foreground">No staff members found</p>
            </Card>
          ) : (
            filteredStaff.map((member) => (
              <Card key={member.id} className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {getInitials(member.first_name, member.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">
                      {member.first_name} {member.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        <Briefcase className="h-3 w-3 mr-1" />
                        {getRoleLabel(member.role)}
                      </Badge>
                      <div className={`h-2 w-2 rounded-full ${getStatusColor(member.status)}`} />
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Department:</span>
                    <span className="font-medium">{member.department || "N/A"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Branch:</span>
                    <span className="font-medium">{member.branch}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Login:</span>
                    <span className="font-medium">
                      {member.last_login
                        ? new Date(member.last_login).toLocaleDateString()
                        : "Never"}
                    </span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
