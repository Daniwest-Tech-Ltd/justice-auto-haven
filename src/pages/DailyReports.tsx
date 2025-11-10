import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Trash2, FileText, Calendar, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DailyReport {
  id: string;
  user_id: string;
  date: string;
  period_start: string;
  period_end: string;
  file_path: string;
  generated_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

const DailyReports = () => {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const { user, role, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isCEO = profile?.full_name?.toLowerCase().includes("ceo");

  useEffect(() => {
    if (user && role?.role === "admin") {
      fetchReports();
    }
  }, [user, role]);

  useEffect(() => {
    filterReports();
  }, [reports, filterDate, filterUser]);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("daily_reports")
        .select("*")
        .order("date", { ascending: false })
        .order("generated_at", { ascending: false });

      if (error) throw error;
      
      // Fetch user profiles separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(r => r.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", userIds);
        
        const enrichedData = data.map(report => ({
          ...report,
          profiles: profiles?.find(p => p.user_id === report.user_id)
        }));
        
        setReports(enrichedData as any);
      } else {
        setReports([]);
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

  const filterReports = () => {
    let filtered = [...reports];

    if (filterDate) {
      filtered = filtered.filter(r => r.date === filterDate);
    }

    if (filterUser) {
      filtered = filtered.filter(r => 
        r.profiles?.full_name?.toLowerCase().includes(filterUser.toLowerCase()) ||
        r.profiles?.email?.toLowerCase().includes(filterUser.toLowerCase())
      );
    }

    setFilteredReports(filtered);
  };

  const handleDownload = async (report: DailyReport) => {
    toast({
      title: "Downloading",
      description: "Report download started...",
    });
    // In production, you would download from the file_path
    window.open(report.file_path, '_blank');
  };

  const handleDelete = async (reportId: string) => {
    if (!isCEO) {
      toast({
        title: "Unauthorized",
        description: "Only CEO can delete reports",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("daily_reports")
        .delete()
        .eq("id", reportId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Report deleted successfully",
      });
      fetchReports();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin-dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold">Daily Reports</h1>
              <p className="text-muted-foreground">View and manage staff activity reports</p>
            </div>
          </div>
          <FileText className="h-8 w-8 text-primary" />
        </div>

        {/* Filters */}
        <Card className="glass-strong">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="filterDate">Filter by Date</Label>
                <Input
                  id="filterDate"
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="filterUser">Filter by Staff</Label>
                <Input
                  id="filterUser"
                  type="text"
                  placeholder="Search by name or email..."
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Table */}
        <Card className="glass-strong">
          <CardHeader>
            <CardTitle>
              Reports ({filteredReports.length})
              {isCEO && <Badge variant="secondary" className="ml-2">CEO Access</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Generated At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No reports found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{report.profiles?.full_name || "Unknown"}</p>
                          <p className="text-sm text-muted-foreground">{report.profiles?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(report.date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(report.period_start).toLocaleTimeString()} - {new Date(report.period_end).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(report.generated_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(report)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          {isCEO && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Report?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the report.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(report.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DailyReports;
