import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, 
  Navigation, 
  Fuel, 
  Battery, 
  RefreshCw,
  Car,
  AlertTriangle,
  Settings
} from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface VehiclePosition {
  id: string;
  rental_car_id: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  ignition_status: boolean;
  fuel_level: number;
  battery_voltage: number;
  recorded_at: string;
  rental_cars?: {
    name: string;
    make: string;
    model: string;
    license_plate?: string;
  };
}

interface VehicleTrackingMapProps {
  mapboxToken: string;
  onTokenChange?: (token: string) => void;
}

const VehicleTrackingMap = ({ mapboxToken, onTokenChange }: VehicleTrackingMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [vehicles, setVehicles] = useState<VehiclePosition[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehiclePosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenInput, setTokenInput] = useState(mapboxToken);
  const { toast } = useToast();

  // Fetch latest positions for all vehicles
  const fetchVehiclePositions = async () => {
    try {
      const { data, error } = await supabase
        .from("vehicle_tracking")
        .select("*")
        .order("recorded_at", { ascending: false });

      if (error) throw error;

      // Get unique latest position per vehicle
      const latestPositions: { [key: string]: VehiclePosition } = {};
      (data || []).forEach((pos: any) => {
        if (!latestPositions[pos.rental_car_id]) {
          latestPositions[pos.rental_car_id] = pos;
        }
      });

      setVehicles(Object.values(latestPositions));
    } catch (error) {
      console.error("Error fetching positions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [36.8219, -1.2921], // Nairobi
      zoom: 11,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Update markers when vehicles change
  useEffect(() => {
    if (!map.current) return;

    vehicles.forEach((vehicle) => {
      const el = document.createElement("div");
      el.className = "vehicle-marker";
      el.innerHTML = `
        <div class="relative">
          <div class="w-10 h-10 rounded-full ${vehicle.ignition_status ? 'bg-green-500' : 'bg-gray-500'} 
            flex items-center justify-center shadow-lg border-2 border-white cursor-pointer
            transform transition-transform hover:scale-110">
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
          </div>
          ${vehicle.speed > 0 ? `<div class="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full px-1">${Math.round(vehicle.speed)} km/h</div>` : ''}
        </div>
      `;

      // Remove existing marker if any
      if (markersRef.current[vehicle.rental_car_id]) {
        markersRef.current[vehicle.rental_car_id].remove();
      }

      const marker = new mapboxgl.Marker({ element: el, rotation: vehicle.heading })
        .setLngLat([vehicle.longitude, vehicle.latitude])
        .addTo(map.current!);

      el.addEventListener("click", () => {
        setSelectedVehicle(vehicle);
        map.current?.flyTo({
          center: [vehicle.longitude, vehicle.latitude],
          zoom: 15,
        });
      });

      markersRef.current[vehicle.rental_car_id] = marker;
    });
  }, [vehicles]);

  // Real-time subscription
  useEffect(() => {
    fetchVehiclePositions();

    const channel = supabase
      .channel("vehicle-tracking-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "vehicle_tracking" },
        (payload) => {
          const newPosition = payload.new as VehiclePosition;
          setVehicles((prev) => {
            const filtered = prev.filter((v) => v.rental_car_id !== newPosition.rental_car_id);
            return [...filtered, newPosition];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSaveToken = () => {
    if (onTokenChange && tokenInput) {
      onTokenChange(tokenInput);
      toast({
        title: "Success",
        description: "Mapbox token saved",
      });
    }
  };

  if (!mapboxToken) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configure Mapbox
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Enter your Mapbox public token to enable live vehicle tracking map.
            Get your token from <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">mapbox.com</a>
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="pk.eyJ1..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
            />
            <Button onClick={handleSaveToken}>Save Token</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-1">
            <Car className="h-3 w-3" />
            {vehicles.length} Vehicles
          </Badge>
          <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-600">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {vehicles.filter((v) => v.ignition_status).length} Active
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={fetchVehiclePositions}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden">
            <div ref={mapContainer} className="h-[500px] w-full" />
          </Card>
        </div>

        {/* Vehicle Details Sidebar */}
        <div className="space-y-4">
          {selectedVehicle ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {selectedVehicle.rental_cars?.name || 
                    `${selectedVehicle.rental_cars?.make} ${selectedVehicle.rental_cars?.model}`}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant={selectedVehicle.ignition_status ? "default" : "secondary"}>
                    {selectedVehicle.ignition_status ? "Engine On" : "Engine Off"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedVehicle.speed.toFixed(1)} km/h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedVehicle.heading.toFixed(0)}°</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Fuel className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedVehicle.fuel_level?.toFixed(0) || 'N/A'}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Battery className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedVehicle.battery_voltage?.toFixed(1) || 'N/A'}V</span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Last update: {new Date(selectedVehicle.recorded_at).toLocaleString()}
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Coordinates</p>
                  <p className="font-mono text-sm">
                    {selectedVehicle.latitude.toFixed(6)}, {selectedVehicle.longitude.toFixed(6)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Select a vehicle on the map to view details</p>
              </CardContent>
            </Card>
          )}

          {/* Vehicle List */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">All Vehicles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
              {vehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No vehicles being tracked
                </p>
              ) : (
                vehicles.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    onClick={() => {
                      setSelectedVehicle(vehicle);
                      map.current?.flyTo({
                        center: [vehicle.longitude, vehicle.latitude],
                        zoom: 15,
                      });
                    }}
                    className={`w-full p-2 rounded-lg border text-left transition-colors hover:bg-accent ${
                      selectedVehicle?.id === vehicle.id ? "bg-accent border-primary" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {vehicle.rental_cars?.name || 
                          `${vehicle.rental_cars?.make} ${vehicle.rental_cars?.model}`}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${
                        vehicle.ignition_status ? "bg-green-500" : "bg-gray-400"
                      }`} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {vehicle.speed.toFixed(0)} km/h
                    </p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VehicleTrackingMap;
