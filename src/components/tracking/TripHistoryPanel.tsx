import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Route, 
  Clock, 
  Gauge, 
  Fuel, 
  AlertTriangle,
  MapPin,
  Calendar,
  Download,
  Eye
} from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface Trip {
  id: string;
  rental_car_id: string;
  booking_id: string;
  driver_name: string;
  driver_phone: string;
  start_time: string;
  end_time: string;
  start_location: any;
  end_location: any;
  route_points: any[];
  total_distance_km: number;
  max_speed: number;
  avg_speed: number;
  idle_time_minutes: number;
  fuel_consumed: number;
  violations_count: number;
  trip_status: string;
  rental_cars?: {
    name: string;
    make: string;
    model: string;
  };
}

interface TripHistoryPanelProps {
  mapboxToken: string;
}

const TripHistoryPanel = ({ mapboxToken }: TripHistoryPanelProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const fetchTrips = async () => {
    try {
      let query = supabase
        .from("trip_history")
        .select("*")
        .order("start_time", { ascending: false });

      if (dateFilter) {
        query = query.gte("start_time", `${dateFilter}T00:00:00`);
        query = query.lte("start_time", `${dateFilter}T23:59:59`);
      }

      if (statusFilter !== "all") {
        query = query.eq("trip_status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error("Error fetching trips:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [dateFilter, statusFilter]);

  // Initialize map when viewing trip
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || !isMapOpen || !selectedTrip) return;

    mapboxgl.accessToken = mapboxToken;

    const startLoc = selectedTrip.start_location;
    const endLoc = selectedTrip.end_location;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: startLoc ? [startLoc.lng, startLoc.lat] : [36.8219, -1.2921],
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      // Add start marker
      if (startLoc) {
        new mapboxgl.Marker({ color: "#22c55e" })
          .setLngLat([startLoc.lng, startLoc.lat])
          .setPopup(new mapboxgl.Popup().setHTML("<strong>Start</strong>"))
          .addTo(map.current!);
      }

      // Add end marker
      if (endLoc) {
        new mapboxgl.Marker({ color: "#ef4444" })
          .setLngLat([endLoc.lng, endLoc.lat])
          .setPopup(new mapboxgl.Popup().setHTML("<strong>End</strong>"))
          .addTo(map.current!);
      }

      // Draw route
      const routePoints = selectedTrip.route_points || [];
      if (routePoints.length > 1) {
        map.current!.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: routePoints.map((p: any) => [p.lng, p.lat]),
            },
          },
        });

        map.current!.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#3b82f6",
            "line-width": 4,
          },
        });

        // Fit bounds to route
        const bounds = new mapboxgl.LngLatBounds();
        routePoints.forEach((p: any) => bounds.extend([p.lng, p.lat]));
        map.current!.fitBounds(bounds, { padding: 50 });
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, isMapOpen, selectedTrip]);

  const viewTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setIsMapOpen(true);
  };

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return "In Progress";
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      completed: "secondary",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const exportTrips = () => {
    const csv = [
      ["Vehicle", "Driver", "Start Time", "End Time", "Distance (km)", "Max Speed", "Avg Speed", "Status"],
      ...trips.map((t) => [
        t.rental_cars?.name || `${t.rental_cars?.make} ${t.rental_cars?.model}`,
        t.driver_name || "N/A",
        new Date(t.start_time).toLocaleString(),
        t.end_time ? new Date(t.end_time).toLocaleString() : "In Progress",
        t.total_distance_km.toFixed(2),
        t.max_speed.toFixed(0),
        t.avg_speed.toFixed(0),
        t.trip_status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trip-history-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (!mapboxToken) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            Configure Mapbox token in the Live Map tab to view trip routes
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Route className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Trip History</h3>
          <Badge variant="outline">{trips.length} trips</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-auto"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportTrips}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Avg Speed</TableHead>
                <TableHead>Violations</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    <Route className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No trips recorded yet
                  </TableCell>
                </TableRow>
              ) : (
                trips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell>
                      <span className="font-medium">
                        {trip.rental_cars?.name || 
                          `${trip.rental_cars?.make} ${trip.rental_cars?.model}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{trip.driver_name || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">{trip.driver_phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(trip.start_time).toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{formatDuration(trip.start_time, trip.end_time)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{trip.total_distance_km.toFixed(1)} km</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Gauge className="h-3 w-3 text-muted-foreground" />
                        <span>{trip.avg_speed.toFixed(0)} km/h</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {trip.violations_count > 0 ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {trip.violations_count}
                        </Badge>
                      ) : (
                        <Badge variant="outline">0</Badge>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(trip.trip_status)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => viewTrip(trip)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Trip Details Dialog */}
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Trip Details</DialogTitle>
          </DialogHeader>

          {selectedTrip && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Distance</p>
                    <p className="text-lg font-bold">{selectedTrip.total_distance_km.toFixed(1)} km</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-lg font-bold">
                      {formatDuration(selectedTrip.start_time, selectedTrip.end_time)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Max Speed</p>
                    <p className="text-lg font-bold">{selectedTrip.max_speed.toFixed(0)} km/h</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Avg Speed</p>
                    <p className="text-lg font-bold">{selectedTrip.avg_speed.toFixed(0)} km/h</p>
                  </CardContent>
                </Card>
              </div>

              <div ref={mapContainer} className="h-[400px] rounded-lg border" />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Start Location</p>
                  <p className="font-medium">
                    {selectedTrip.start_location?.address || 
                      `${selectedTrip.start_location?.lat}, ${selectedTrip.start_location?.lng}`}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">End Location</p>
                  <p className="font-medium">
                    {selectedTrip.end_location?.address || 
                      (selectedTrip.end_location ? 
                        `${selectedTrip.end_location?.lat}, ${selectedTrip.end_location?.lng}` : 
                        "In Progress")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TripHistoryPanel;
