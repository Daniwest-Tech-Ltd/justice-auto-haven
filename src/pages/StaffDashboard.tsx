import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Briefcase, Clock, LogOut, RefreshCw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import DashboardHolidayBanner from "@/components/DashboardHolidayBanner";

interface JobCard {
  id: string;
  job_number: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  due_date: string;
}

interface StaffData {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  avatar_url: string | null;
}

export default function StaffDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffData | null>(null);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchStaffData();
    fetchJobCards();
  }, [user]);

  const fetchStaffData = async () => {
    try {
      const { data, error } = await supabase
        .from("staff")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;
      setStaff(data);
    } catch (error: any) {
      toast.error("Failed to load staff data");
    }
  };

  const fetchJobCards = async () => {
    try {
      const { data: staffData } = await supabase
        .from("staff")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (!staffData) return;

      const { data, error } = await supabase
        .from("job_cards")
        .select("*")
        .eq("assigned_to", staffData.id)
        .order("due_date");

      if (error) throw error;
      setJobCards(data || []);
    } catch (error: any) {
      toast.error("Failed to load job cards");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500";
      case "normal": return "bg-blue-500";
      case "low": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "in_progress": return "bg-yellow-500";
      case "pending": return "bg-orange-500";
      default: return "bg-gray-500";
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              Welcome, {staff?.first_name}!
            </h1>
            <p className="text-muted-foreground">
              {staff?.role} • {staff?.department}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search job cards..."
                className="pl-10 w-64"
              />
            </div>
            <DashboardHolidayBanner />
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                fetchStaffData();
                fetchJobCards();
                toast.success("Dashboard data refreshed");
              }}
              title="Refresh Dashboard"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Briefcase className="h-10 w-10 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Jobs</p>
                <p className="text-3xl font-bold">{jobCards.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Clock className="h-10 w-10 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold">
                  {jobCards.filter((j) => j.status === "pending").length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <Calendar className="h-10 w-10 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold">
                  {jobCards.filter((j) => j.status === "completed").length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Job Cards */}
        <div>
          <h2 className="text-2xl font-bold mb-4">My Job Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobCards.length === 0 ? (
              <Card className="col-span-full p-8 text-center">
                <p className="text-muted-foreground">No job cards assigned yet</p>
              </Card>
            ) : (
              jobCards.map((card) => (
                <Card key={card.id} className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-lg">{card.title}</h3>
                      <Badge className={`${getPriorityColor(card.priority)} text-white`}>
                        {card.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {card.job_number}
                    </p>
                    {card.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {card.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-sm text-muted-foreground">
                        Due: {new Date(card.due_date).toLocaleDateString()}
                      </span>
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
    </div>
  );
}
