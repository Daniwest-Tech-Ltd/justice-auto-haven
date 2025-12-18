import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Trash2, 
  Edit, 
  MapPin, 
  Shield, 
  AlertTriangle,
  Circle,
  Square
} from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface Geofence {
  id: string;
  name: string;
  description: string;
  geofence_type: string;
  coordinates: any;
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  is_active: boolean;
  alert_on_entry: boolean;
  alert_on_exit: boolean;
  speed_limit: number;
  created_at: string;
}

interface GeofenceManagerProps {
  mapboxToken: string;
}

const GeofenceManager = ({ mapboxToken }: GeofenceManagerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const drawingMarkers = useRef<mapboxgl.Marker[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState<Geofence | null>(null);
  const [drawingMode, setDrawingMode] = useState<"circle" | "polygon" | null>(null);
  const [drawnPoints, setDrawnPoints] = useState<[number, number][]>([]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    geofence_type: "circle",
    center_lat: -1.2921,
    center_lng: 36.8219,
    radius_meters: 1000,
    is_active: true,
    alert_on_entry: false,
    alert_on_exit: true,
    speed_limit: 0,
  });

  const fetchGeofences = async () => {
    try {
      const { data, error } = await supabase
        .from("geofences")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGeofences(data || []);
    } catch (error) {
      console.error("Error fetching geofences:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGeofences();
  }, []);

  // Initialize map for drawing
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || !isDialogOpen) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [formData.center_lng, formData.center_lat],
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on("click", (e) => {
      if (drawingMode === "circle") {
        setFormData((prev) => ({
          ...prev,
          center_lat: e.lngLat.lat,
          center_lng: e.lngLat.lng,
        }));

        // Clear existing markers
        drawingMarkers.current.forEach((m) => m.remove());
        drawingMarkers.current = [];

        // Add center marker
        const marker = new mapboxgl.Marker({ color: "#3b82f6" })
          .setLngLat([e.lngLat.lng, e.lngLat.lat])
          .addTo(map.current!);
        drawingMarkers.current.push(marker);

        // Draw circle
        drawCircle(e.lngLat.lng, e.lngLat.lat, formData.radius_meters);
      } else if (drawingMode === "polygon") {
        const newPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
        setDrawnPoints((prev) => [...prev, newPoint]);

        const marker = new mapboxgl.Marker({ color: "#ef4444" })
          .setLngLat(newPoint)
          .addTo(map.current!);
        drawingMarkers.current.push(marker);
      }
    });

    return () => {
      drawingMarkers.current.forEach((m) => m.remove());
      map.current?.remove();
    };
  }, [mapboxToken, isDialogOpen, drawingMode]);

  const drawCircle = (lng: number, lat: number, radiusMeters: number) => {
    if (!map.current) return;

    const sourceId = "circle-source";
    const layerId = "circle-layer";

    // Remove existing layers
    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId);
    }
    if (map.current.getSource(sourceId)) {
      map.current.removeSource(sourceId);
    }

    // Create circle GeoJSON
    const points = 64;
    const coords = [];
    const km = radiusMeters / 1000;
    const distanceX = km / (111.32 * Math.cos((lat * Math.PI) / 180));
    const distanceY = km / 110.574;

    for (let i = 0; i < points; i++) {
      const theta = (i / points) * (2 * Math.PI);
      const x = lng + distanceX * Math.cos(theta);
      const y = lat + distanceY * Math.sin(theta);
      coords.push([x, y]);
    }
    coords.push(coords[0]);

    map.current.addSource(sourceId, {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [coords],
        },
      },
    });

    map.current.addLayer({
      id: layerId,
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": "#3b82f6",
        "fill-opacity": 0.3,
      },
    });
  };

  const handleSave = async () => {
    try {
      const coordinates =
        formData.geofence_type === "circle"
          ? { type: "circle", center: [formData.center_lng, formData.center_lat], radius: formData.radius_meters }
          : { type: "polygon", points: drawnPoints };

      const payload = {
        name: formData.name,
        description: formData.description,
        geofence_type: formData.geofence_type,
        coordinates,
        center_lat: formData.center_lat,
        center_lng: formData.center_lng,
        radius_meters: formData.geofence_type === "circle" ? formData.radius_meters : null,
        is_active: formData.is_active,
        alert_on_entry: formData.alert_on_entry,
        alert_on_exit: formData.alert_on_exit,
        speed_limit: formData.speed_limit || null,
      };

      if (editingGeofence) {
        const { error } = await supabase
          .from("geofences")
          .update(payload)
          .eq("id", editingGeofence.id);
        if (error) throw error;
        toast({ title: "Success", description: "Geofence updated" });
      } else {
        const { error } = await supabase.from("geofences").insert(payload);
        if (error) throw error;
        toast({ title: "Success", description: "Geofence created" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchGeofences();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this geofence?")) return;

    try {
      const { error } = await supabase.from("geofences").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: "Geofence deleted" });
      fetchGeofences();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("geofences")
        .update({ is_active: !isActive })
        .eq("id", id);
      if (error) throw error;
      fetchGeofences();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      geofence_type: "circle",
      center_lat: -1.2921,
      center_lng: 36.8219,
      radius_meters: 1000,
      is_active: true,
      alert_on_entry: false,
      alert_on_exit: true,
      speed_limit: 0,
    });
    setEditingGeofence(null);
    setDrawnPoints([]);
    setDrawingMode(null);
  };

  const openEditDialog = (geofence: Geofence) => {
    setEditingGeofence(geofence);
    setFormData({
      name: geofence.name,
      description: geofence.description || "",
      geofence_type: geofence.geofence_type,
      center_lat: geofence.center_lat || -1.2921,
      center_lng: geofence.center_lng || 36.8219,
      radius_meters: geofence.radius_meters || 1000,
      is_active: geofence.is_active,
      alert_on_entry: geofence.alert_on_entry,
      alert_on_exit: geofence.alert_on_exit,
      speed_limit: geofence.speed_limit || 0,
    });
    setIsDialogOpen(true);
  };

  if (!mapboxToken) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            Configure Mapbox token in the Live Map tab to use geofencing
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Geofence Zones</h3>
          <Badge variant="outline">{geofences.length} zones</Badge>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Geofence
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGeofence ? "Edit Geofence" : "Create New Geofence"}
              </DialogTitle>
              <DialogDescription>
                {editingGeofence 
                  ? "Update the geofence zone settings and boundaries."
                  : "Define a new geofence zone to monitor vehicle movements."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Nairobi City Limit"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe this geofence zone..."
                  />
                </div>

                <div>
                  <Label>Zone Type</Label>
                  <Select
                    value={formData.geofence_type}
                    onValueChange={(value) => {
                      setFormData({ ...formData, geofence_type: value });
                      setDrawingMode(value as "circle" | "polygon");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="circle">
                        <div className="flex items-center gap-2">
                          <Circle className="h-4 w-4" />
                          Circle (Radius)
                        </div>
                      </SelectItem>
                      <SelectItem value="polygon">
                        <div className="flex items-center gap-2">
                          <Square className="h-4 w-4" />
                          Polygon (Custom Shape)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.geofence_type === "circle" && (
                  <div>
                    <Label>Radius (meters)</Label>
                    <Input
                      type="number"
                      value={formData.radius_meters}
                      onChange={(e) => {
                        const radius = parseFloat(e.target.value) || 1000;
                        setFormData({ ...formData, radius_meters: radius });
                        if (map.current) {
                          drawCircle(formData.center_lng, formData.center_lat, radius);
                        }
                      }}
                    />
                  </div>
                )}

                <div>
                  <Label>Speed Limit (km/h, 0 = no limit)</Label>
                  <Input
                    type="number"
                    value={formData.speed_limit}
                    onChange={(e) => setFormData({ ...formData, speed_limit: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Active</Label>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Alert on Entry</Label>
                    <Switch
                      checked={formData.alert_on_entry}
                      onCheckedChange={(checked) => setFormData({ ...formData, alert_on_entry: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Alert on Exit</Label>
                    <Switch
                      checked={formData.alert_on_exit}
                      onCheckedChange={(checked) => setFormData({ ...formData, alert_on_exit: checked })}
                    />
                  </div>
                </div>

                <Button onClick={handleSave} className="w-full">
                  {editingGeofence ? "Update Geofence" : "Create Geofence"}
                </Button>
              </div>

              <div>
                <Label className="mb-2 block">
                  Click on map to {formData.geofence_type === "circle" ? "set center" : "add polygon points"}
                </Label>
                <div ref={mapContainer} className="h-[400px] rounded-lg border" />
                {formData.geofence_type === "polygon" && drawnPoints.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {drawnPoints.length} points added
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Alerts</TableHead>
                <TableHead>Speed Limit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {geofences.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No geofences created yet
                  </TableCell>
                </TableRow>
              ) : (
                geofences.map((geofence) => (
                  <TableRow key={geofence.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{geofence.name}</p>
                        <p className="text-xs text-muted-foreground">{geofence.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {geofence.geofence_type === "circle" ? (
                          <><Circle className="h-3 w-3 mr-1" /> {geofence.radius_meters}m</>
                        ) : (
                          <><Square className="h-3 w-3 mr-1" /> Polygon</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {geofence.alert_on_entry && (
                          <Badge variant="secondary" className="text-xs">Entry</Badge>
                        )}
                        {geofence.alert_on_exit && (
                          <Badge variant="secondary" className="text-xs">Exit</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {geofence.speed_limit ? `${geofence.speed_limit} km/h` : "—"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={geofence.is_active}
                        onCheckedChange={() => toggleActive(geofence.id, geofence.is_active)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(geofence)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(geofence.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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
  );
};

export default GeofenceManager;
