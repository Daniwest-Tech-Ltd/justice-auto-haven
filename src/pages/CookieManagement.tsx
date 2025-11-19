import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Download, Search, Calendar, Edit, ArrowLeft } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface CookieLog {
  id: string;
  user_ip: string;
  user_agent: string;
  decision: string;
  timestamp: string;
}

const CookieManagement = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<CookieLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<CookieLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDecision, setFilterDecision] = useState<string>("all");
  const [editingLog, setEditingLog] = useState<CookieLog | null>(null);
  const [editDecision, setEditDecision] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, filterDecision]);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("cookies_log")
        .select("*")
        .order("timestamp", { ascending: false });

      if (error) throw error;

      setLogs(data || []);
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

  const filterLogs = () => {
    let filtered = [...logs];

    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.user_ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.user_agent.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterDecision !== "all") {
      filtered = filtered.filter((log) => log.decision === filterDecision);
    }

    setFilteredLogs(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this log?")) return;

    try {
      const { error } = await supabase.from("cookies_log").delete().eq("id", id);

      if (error) throw error;

      // Log admin action
      await logAdminAction("delete", "cookies_log", id);

      toast({
        title: "Success",
        description: "Log deleted successfully",
      });

      fetchLogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (log: CookieLog) => {
    setEditingLog(log);
    setEditDecision(log.decision);
  };

  const handleSaveEdit = async () => {
    if (!editingLog) return;

    try {
      const { error } = await supabase
        .from("cookies_log")
        .update({ decision: editDecision })
        .eq("id", editingLog.id);

      if (error) throw error;

      // Log admin action
      await logAdminAction("update", "cookies_log", editingLog.id, {
        old_decision: editingLog.decision,
        new_decision: editDecision,
      });

      toast({
        title: "Success",
        description: "Log updated successfully",
      });

      setEditingLog(null);
      fetchLogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const logAdminAction = async (
    action: string,
    targetTable: string,
    targetId: string,
    details: any = {}
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from("admin_audit_log").insert({
      admin_id: user?.id,
      action,
      target_table: targetTable,
      target_id: targetId,
      details,
    });
  };

  const exportToCSV = () => {
    const headers = ["Timestamp", "IP Address", "User Agent", "Decision"];
    const rows = filteredLogs.map((log) => [
      format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss"),
      log.user_ip,
      log.user_agent,
      log.decision,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cookie-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();

    toast({
      title: "Success",
      description: "CSV exported successfully",
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Add logo (you would need to convert image to base64 or load it)
    doc.setFontSize(18);
    doc.text("Justice Ultimate Automobiles", 14, 20);
    doc.setFontSize(12);
    doc.text("Cookie Consent Logs Report", 14, 28);
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}`, 14, 35);

    const tableData = filteredLogs.map((log) => [
      format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss"),
      log.user_ip,
      log.user_agent.substring(0, 50) + "...",
      log.decision,
    ]);

    (doc as any).autoTable({
      head: [["Timestamp", "IP Address", "User Agent", "Decision"]],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
    });

    doc.save(`cookie-logs-${format(new Date(), "yyyy-MM-dd")}.pdf`);

    toast({
      title: "Success",
      description: "PDF exported successfully",
    });
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Button
          variant="outline"
          onClick={() => navigate("/admin-dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-4xl font-bold mb-2">Cookie Consent Management</h1>
        <p className="text-muted-foreground">
          View and manage user cookie consent logs
        </p>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by IP or User Agent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filterDecision} onValueChange={setFilterDecision}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by decision" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Decisions</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>

          <Button onClick={exportToPDF} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>User Agent</TableHead>
                <TableHead>Decision</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No logs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{log.user_ip}</TableCell>
                    <TableCell className="max-w-xs truncate" title={log.user_agent}>
                      {log.user_agent}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          log.decision === "accepted"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {log.decision}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(log)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(log.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredLogs.length} of {logs.length} logs
        </div>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingLog} onOpenChange={() => setEditingLog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Cookie Consent Decision</DialogTitle>
            <DialogDescription>
              Change the consent decision for this log entry
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Decision</Label>
              <Select value={editDecision} onValueChange={setEditDecision}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editingLog && (
              <div className="space-y-2 text-sm">
                <div>
                  <strong>IP:</strong> {editingLog.user_ip}
                </div>
                <div>
                  <strong>Timestamp:</strong>{" "}
                  {format(new Date(editingLog.timestamp), "yyyy-MM-dd HH:mm:ss")}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLog(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CookieManagement;