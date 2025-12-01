import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Plus, Calendar, User } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface JobCard {
  id: string;
  job_number: string;
  title: string;
  description: string;
  assigned_to: string;
  priority: string;
  status: string;
  due_date: string;
  created_at: string;
  staff?: {
    first_name: string;
    last_name: string;
  };
}

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

export default function JobCardsManagement() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigned_to: "",
    priority: "normal",
    due_date: "",
  });

  useEffect(() => {
    if (role?.role !== "admin") {
      navigate("/admin");
      return;
    }
    fetchData();
  }, [role, navigate]);

  const fetchData = async () => {
    try {
      const [jobCardsRes, staffRes] = await Promise.all([
        supabase
          .from("job_cards")
          .select(`
            *,
            staff:assigned_to (
              first_name,
              last_name
            )
          `)
          .order("created_at", { ascending: false }),
        supabase
          .from("staff")
          .select("id, first_name, last_name, role")
          .eq("status", "active")
          .order("first_name"),
      ]);

      if (jobCardsRes.error) throw jobCardsRes.error;
      if (staffRes.error) throw staffRes.error;

      setJobCards(jobCardsRes.data || []);
      setStaff(staffRes.data || []);
    } catch (error: any) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJobCard = async () => {
    if (!formData.title || !formData.assigned_to || !formData.due_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.from("job_cards").insert({
        title: formData.title,
        description: formData.description,
        assigned_to: formData.assigned_to,
        priority: formData.priority,
        due_date: formData.due_date,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Job card created successfully");
      setOpen(false);
      setFormData({
        title: "",
        description: "",
        assigned_to: "",
        priority: "normal",
        due_date: "",
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to create job card");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "normal":
        return "bg-blue-500";
      case "low":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in_progress":
        return "bg-yellow-500";
      case "pending":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Job Cards Management</h1>
              <p className="text-muted-foreground">Assign daily tasks to staff</p>
            </div>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-5 w-5" />
                Create Job Card
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Job Card</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Job title"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Job description and requirements"
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Assign To *</Label>
                  <Select
                    value={formData.assigned_to}
                    onValueChange={(value) =>
                      setFormData({ ...formData, assigned_to: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.first_name} {s.last_name} - {s.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Priority *</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) =>
                        setFormData({ ...formData, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Due Date *</Label>
                    <Input
                      type="date"
                      value={formData.due_date}
                      onChange={(e) =>
                        setFormData({ ...formData, due_date: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateJobCard} disabled={loading}>
                  {loading ? "Creating..." : "Create Job Card"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Job Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p>Loading...</p>
          ) : jobCards.length === 0 ? (
            <Card className="col-span-full p-8 text-center">
              <p className="text-muted-foreground">No job cards found</p>
            </Card>
          ) : (
            jobCards.map((card) => (
              <Card key={card.id} className="p-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{card.title}</h3>
                      <Badge className={`${getPriorityColor(card.priority)} text-white`}>
                        {card.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Job #{card.job_number}
                    </p>
                  </div>

                  {card.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {card.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {card.staff
                          ? `${card.staff.first_name} ${card.staff.last_name}`
                          : "Unassigned"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Due: {new Date(card.due_date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Badge className={`${getStatusColor(card.status)} text-white`}>
                      {card.status.replace("_", " ")}
                    </Badge>
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
