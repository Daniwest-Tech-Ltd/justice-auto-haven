import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  AlertTriangle, 
  Bell, 
  CheckCircle, 
  Clock,
  MapPin,
  Gauge,
  Shield,
  XCircle,
  RefreshCw
} from "lucide-react";

interface TrackingAlert {
  id: string;
  rental_car_id: string;
  booking_id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  latitude: number;
  longitude: number;
  metadata: any;
  is_read: boolean;
  is_resolved: boolean;
  resolved_by: string;
  resolved_at: string;
  resolution_notes: string;
  created_at: string;
  rental_cars?: {
    name: string;
    make: string;
    model: string;
  };
}

const TrackingAlertsPanel = () => {
  const [alerts, setAlerts] = useState<TrackingAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<TrackingAlert | null>(null);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("unresolved");
  const { toast } = useToast();

  const fetchAlerts = async () => {
    try {
      let query = supabase
        .from("tracking_alerts")
        .select("*")
        .order("created_at", { ascending: false });

      if (severityFilter !== "all") {
        query = query.eq("severity", severityFilter);
      }

      if (statusFilter === "unresolved") {
        query = query.eq("is_resolved", false);
      } else if (statusFilter === "resolved") {
        query = query.eq("is_resolved", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    // Real-time subscription for new alerts
    const channel = supabase
      .channel("tracking-alerts-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tracking_alerts" },
        (payload) => {
          const newAlert = payload.new as TrackingAlert;
          setAlerts((prev) => [newAlert, ...prev]);
          
          // Show notification for high severity alerts
          if (newAlert.severity === "high" || newAlert.severity === "critical") {
            toast({
              variant: "destructive",
              title: `⚠️ ${newAlert.title}`,
              description: newAlert.message,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [severityFilter, statusFilter]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("tracking_alerts")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_read: true } : a))
      );
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const resolveAlert = async () => {
    if (!selectedAlert) return;

    try {
      const { error } = await supabase
        .from("tracking_alerts")
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes,
        })
        .eq("id", selectedAlert.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Alert resolved",
      });

      setIsResolveOpen(false);
      setResolutionNotes("");
      fetchAlerts();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      low: "outline",
      medium: "secondary",
      high: "default",
      critical: "destructive",
    };

    const colors: Record<string, string> = {
      low: "text-blue-600",
      medium: "text-yellow-600",
      high: "text-orange-600",
      critical: "text-red-600",
    };

    return (
      <Badge variant={variants[severity] || "outline"} className={colors[severity]}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case "geofence_exit":
      case "geofence_entry":
        return <Shield className="h-4 w-4" />;
      case "speed_violation":
        return <Gauge className="h-4 w-4" />;
      case "unauthorized_movement":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const unreadCount = alerts.filter((a) => !a.is_read).length;
  const unresolvedCount = alerts.filter((a) => !a.is_resolved).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Tracking Alerts</h3>
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {unreadCount} New
            </Badge>
          )}
          <Badge variant="outline">
            {unresolvedCount} Unresolved
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unresolved">Unresolved</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchAlerts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alert Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Critical</p>
              <p className="text-xl font-bold">
                {alerts.filter((a) => a.severity === "critical" && !a.is_resolved).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">High</p>
              <p className="text-xl font-bold">
                {alerts.filter((a) => a.severity === "high" && !a.is_resolved).length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-xl font-bold">{unresolvedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Resolved Today</p>
              <p className="text-xl font-bold">
                {alerts.filter((a) => {
                  const resolvedAt = a.resolved_at ? new Date(a.resolved_at) : null;
                  const today = new Date();
                  return resolvedAt && 
                    resolvedAt.toDateString() === today.toDateString();
                }).length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alert</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No alerts found
                  </TableCell>
                </TableRow>
              ) : (
                alerts.map((alert) => (
                  <TableRow
                    key={alert.id}
                    className={!alert.is_read ? "bg-muted/50" : ""}
                    onClick={() => markAsRead(alert.id)}
                  >
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <div className={`p-1 rounded ${
                          alert.severity === "critical" ? "bg-red-100 text-red-600" :
                          alert.severity === "high" ? "bg-orange-100 text-orange-600" :
                          "bg-yellow-100 text-yellow-600"
                        }`}>
                          {getAlertIcon(alert.alert_type)}
                        </div>
                        <div>
                          <p className="font-medium">{alert.title}</p>
                          <p className="text-xs text-muted-foreground">{alert.message}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {alert.rental_cars?.name || 
                        `${alert.rental_cars?.make} ${alert.rental_cars?.model}`}
                    </TableCell>
                    <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                    <TableCell>
                      {alert.latitude && alert.longitude ? (
                        <a
                          href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <MapPin className="h-3 w-3" />
                          View Map
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {new Date(alert.created_at).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {alert.is_resolved ? (
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!alert.is_resolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAlert(alert);
                            setIsResolveOpen(true);
                          }}
                        >
                          Resolve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Resolve Alert Dialog */}
      <Dialog open={isResolveOpen} onOpenChange={setIsResolveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Alert</DialogTitle>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedAlert.title}</p>
                <p className="text-sm text-muted-foreground">{selectedAlert.message}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Resolution Notes</label>
                <Textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe how the alert was resolved..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsResolveOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={resolveAlert}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Resolved
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrackingAlertsPanel;
