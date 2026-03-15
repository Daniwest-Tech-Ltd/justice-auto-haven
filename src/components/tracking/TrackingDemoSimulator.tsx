import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Car, 
  Gauge, 
  Navigation,
  Fuel,
  Battery,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Settings
} from "lucide-react";

interface SimulatedVehicle {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  ignition: boolean;
  fuelLevel: number;
  batteryVoltage: number;
}

interface TrackingDemoSimulatorProps {
  mapboxToken?: string;
  onTokenChange?: (token: string) => void;
}

const TrackingDemoSimulator = ({ mapboxToken, onTokenChange }: TrackingDemoSimulatorProps) => {
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const routeLayerAdded = useRef(false);
  
  const [isRunning, setIsRunning] = useState(false);
  const [tokenInput, setTokenInput] = useState(mapboxToken || "");
  const [vehicle, setVehicle] = useState<SimulatedVehicle>({
    id: "DEMO-GPS-001",
    name: "Demo Vehicle",
    latitude: -1.2921,
    longitude: 36.8219,
    speed: 0,
    heading: 0,
    ignition: false,
    fuelLevel: 85,
    batteryVoltage: 12.6,
  });
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [route, setRoute] = useState<"nairobi" | "highway">("nairobi");
  const [alerts, setAlerts] = useState<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef = useRef(0);

  // Nairobi city route (around CBD)
  const nairobiRoute = [
    { lat: -1.2921, lng: 36.8219 },
    { lat: -1.2864, lng: 36.8172 },
    { lat: -1.2833, lng: 36.8231 },
    { lat: -1.2799, lng: 36.8291 },
    { lat: -1.2756, lng: 36.8189 },
    { lat: -1.2692, lng: 36.8103 },
    { lat: -1.2744, lng: 36.8056 },
    { lat: -1.2821, lng: 36.8119 },
    { lat: -1.2921, lng: 36.8219 },
  ];

  // Highway route (Nairobi to Thika)
  const highwayRoute = [
    { lat: -1.2219, lng: 36.8886 },
    { lat: -1.1989, lng: 36.8923 },
    { lat: -1.1756, lng: 36.8967 },
    { lat: -1.1523, lng: 36.9012 },
    { lat: -1.1289, lng: 36.9056 },
    { lat: -1.1056, lng: 36.9101 },
    { lat: -1.0823, lng: 36.9145 },
    { lat: -1.0589, lng: 36.9189 },
    { lat: -1.0356, lng: 36.9234 },
  ];

  const currentRoute = route === "highway" ? highwayRoute : nairobiRoute;

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [currentRoute[0].lng, currentRoute[0].lat],
      zoom: route === "highway" ? 10 : 13,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add route line when map loads
    map.current.on("load", () => {
      addRouteLine();
      addVehicleMarker();
    });

    return () => {
      markerRef.current?.remove();
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Update route when changed
  useEffect(() => {
    if (!map.current) return;
    
    map.current.flyTo({
      center: [currentRoute[0].lng, currentRoute[0].lat],
      zoom: route === "highway" ? 10 : 13,
    });
    
    if (map.current.isStyleLoaded()) {
      addRouteLine();
    }
  }, [route]);

  const addRouteLine = () => {
    if (!map.current) return;

    const sourceId = "route-source";
    const layerId = "route-layer";

    // Remove existing
    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId);
    }
    if (map.current.getSource(sourceId)) {
      map.current.removeSource(sourceId);
    }

    // Add route line
    map.current.addSource(sourceId, {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: currentRoute.map(p => [p.lng, p.lat]),
        },
      },
    });

    map.current.addLayer({
      id: layerId,
      type: "line",
      source: sourceId,
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#3b82f6",
        "line-width": 4,
        "line-opacity": 0.7,
      },
    });
  };

  const addVehicleMarker = () => {
    if (!map.current) return;

    // Create custom marker element
    const el = document.createElement("div");
    el.className = "vehicle-demo-marker";
    el.innerHTML = `
      <div class="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg border-3 border-white animate-pulse">
        <svg class="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
        </svg>
      </div>
    `;

    markerRef.current = new mapboxgl.Marker({ element: el })
      .setLngLat([currentRoute[0].lng, currentRoute[0].lat])
      .addTo(map.current);
  };

  // Update marker position when vehicle moves
  useEffect(() => {
    if (markerRef.current && map.current) {
      markerRef.current.setLngLat([vehicle.longitude, vehicle.latitude]);
      
      // Smoothly follow vehicle
      if (isRunning) {
        map.current.easeTo({
          center: [vehicle.longitude, vehicle.latitude],
          duration: 1000,
        });
      }
    }
  }, [vehicle.latitude, vehicle.longitude]);

  const sendTrackingData = async (data: SimulatedVehicle) => {
    try {
      const { error } = await supabase
        .from("vehicle_tracking")
        .insert({
          rental_car_id: null,
          device_id: data.id,
          latitude: data.latitude,
          longitude: data.longitude,
          speed: data.speed,
          heading: data.heading,
          ignition: data.ignition,
          fuel_level: data.fuelLevel,
          battery_voltage: data.batteryVoltage,
          raw_data: {
            demo: true,
            vehicle_name: data.name,
            route: route,
          },
        });

      if (error) {
        console.error("Error inserting tracking data:", error);
      }

      if (data.speed > 80) {
        const alertMsg = `Speed alert: ${data.speed.toFixed(0)} km/h exceeds limit`;
        setAlerts(prev => [alertMsg, ...prev.slice(0, 4)]);
        
        toast({
          variant: "destructive",
          title: "Speed Alert!",
          description: alertMsg,
        });
      }
    } catch (err) {
      console.error("Simulation error:", err);
    }
  };

  const simulateMovement = () => {
    const step = stepRef.current % currentRoute.length;
    const nextStep = (step + 1) % currentRoute.length;
    
    const currentPoint = currentRoute[step];
    const nextPoint = currentRoute[nextStep];
    
    const heading = Math.atan2(
      nextPoint.lng - currentPoint.lng,
      nextPoint.lat - currentPoint.lat
    ) * (180 / Math.PI);

    const baseSpeed = route === "highway" ? 90 : 40;
    const speedVariation = Math.random() * 20 - 10;
    const speed = vehicle.ignition ? Math.max(0, baseSpeed + speedVariation) : 0;

    const fuelConsumption = vehicle.ignition ? 0.01 * simulationSpeed : 0;

    const newVehicle = {
      ...vehicle,
      latitude: currentPoint.lat,
      longitude: currentPoint.lng,
      speed: speed,
      heading: (heading + 360) % 360,
      fuelLevel: Math.max(0, vehicle.fuelLevel - fuelConsumption),
    };

    setVehicle(newVehicle);
    sendTrackingData(newVehicle);
    stepRef.current++;
  };

  useEffect(() => {
    if (isRunning && vehicle.ignition) {
      intervalRef.current = setInterval(simulateMovement, 2000 / simulationSpeed);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, vehicle.ignition, simulationSpeed, route]);

  const handleStartStop = () => {
    if (!isRunning) {
      setVehicle(prev => ({ ...prev, ignition: true }));
      toast({
        title: "Simulation Started",
        description: "Vehicle is now moving along the route",
      });
    } else {
      toast({
        title: "Simulation Paused",
        description: "Vehicle movement paused",
      });
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    stepRef.current = 0;
    const startPoint = currentRoute[0];
    setVehicle({
      id: "DEMO-GPS-001",
      name: "Demo Vehicle",
      latitude: startPoint.lat,
      longitude: startPoint.lng,
      speed: 0,
      heading: 0,
      ignition: false,
      fuelLevel: 85,
      batteryVoltage: 12.6,
    });
    setAlerts([]);
    
    if (map.current) {
      map.current.flyTo({
        center: [startPoint.lng, startPoint.lat],
        zoom: route === "highway" ? 10 : 13,
      });
    }
    
    toast({
      title: "Simulation Reset",
      description: "Vehicle returned to starting position",
    });
  };

  const handleIgnitionToggle = (checked: boolean) => {
    setVehicle(prev => ({ ...prev, ignition: checked, speed: checked ? prev.speed : 0 }));
    if (!checked) {
      setIsRunning(false);
    }
  };

  const handleSaveToken = () => {
    if (onTokenChange && tokenInput) {
      onTokenChange(tokenInput);
      toast({
        title: "Success",
        description: "Mapbox token saved",
      });
    }
  };

  // Show token input if no token
  if (!mapboxToken) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configure Map
          </CardTitle>
          <CardDescription>
            Enter your Mapbox public token to enable the live tracking map
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Get your free token from{" "}
            <a 
              href="https://mapbox.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary underline"
            >
              mapbox.com
            </a>{" "}
            (Account → Tokens)
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Map */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5 text-primary" />
            Live Tracking Map
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div ref={mapContainer} className="h-[450px] w-full" />
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Demo Simulator
          </CardTitle>
          <CardDescription>
            Simulate GPS tracking to see the car move on the map
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Vehicle Status */}
          <div className="grid grid-cols-4 gap-2">
            <div className="p-2 bg-muted rounded-lg text-center">
              <Gauge className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{vehicle.speed.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">km/h</p>
            </div>
            <div className="p-2 bg-muted rounded-lg text-center">
              <Navigation className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{vehicle.heading.toFixed(0)}°</p>
              <p className="text-xs text-muted-foreground">Heading</p>
            </div>
            <div className="p-2 bg-muted rounded-lg text-center">
              <Fuel className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{vehicle.fuelLevel.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">Fuel</p>
            </div>
            <div className="p-2 bg-muted rounded-lg text-center">
              <Battery className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{vehicle.batteryVoltage.toFixed(1)}V</p>
              <p className="text-xs text-muted-foreground">Battery</p>
            </div>
          </div>

          {/* Location */}
          <div className="p-2 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Current Location</span>
              <Badge variant={vehicle.ignition ? "default" : "secondary"} className="text-xs">
                {vehicle.ignition ? "Engine On" : "Engine Off"}
              </Badge>
            </div>
            <p className="text-xs font-mono">
              {vehicle.latitude.toFixed(6)}, {vehicle.longitude.toFixed(6)}
            </p>
          </div>

          {/* Controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Ignition</Label>
              <Switch 
                checked={vehicle.ignition} 
                onCheckedChange={handleIgnitionToggle}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Route</Label>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant={route === "nairobi" ? "default" : "outline"}
                  onClick={() => { setRoute("nairobi"); handleReset(); }}
                >
                  Nairobi CBD
                </Button>
                <Button 
                  size="sm" 
                  variant={route === "highway" ? "default" : "outline"}
                  onClick={() => { setRoute("highway"); handleReset(); }}
                >
                  Thika Highway
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Speed: {simulationSpeed}x</Label>
              <Slider
                value={[simulationSpeed]}
                onValueChange={([value]) => setSimulationSpeed(value)}
                min={0.5}
                max={5}
                step={0.5}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleStartStop} 
                className="flex-1"
                disabled={!vehicle.ignition}
              >
                {isRunning ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" /> Start
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="space-y-1">
              <Label className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Recent Alerts
              </Label>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {alerts.map((alert, idx) => (
                  <div 
                    key={idx} 
                    className="text-xs p-2 bg-yellow-500/10 border border-yellow-500/20 rounded"
                  >
                    {alert}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-2 text-sm pt-2 border-t">
            {isRunning ? (
              <>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-green-500">Live tracking active</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Simulation ready</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrackingDemoSimulator;