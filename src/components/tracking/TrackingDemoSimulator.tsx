import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
  CheckCircle2
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

const TrackingDemoSimulator = () => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
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
  const [route, setRoute] = useState<"nairobi" | "highway" | "custom">("nairobi");
  const [alerts, setAlerts] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const stepRef = useRef(0);

  // Nairobi city route (around CBD)
  const nairobiRoute = [
    { lat: -1.2921, lng: 36.8219 }, // Kenyatta International Convention Centre
    { lat: -1.2864, lng: 36.8172 }, // Uhuru Gardens direction
    { lat: -1.2833, lng: 36.8231 }, // Towards Parliament
    { lat: -1.2799, lng: 36.8291 }, // University Way
    { lat: -1.2756, lng: 36.8189 }, // Westlands direction
    { lat: -1.2692, lng: 36.8103 }, // Parklands
    { lat: -1.2744, lng: 36.8056 }, // Museum Hill
    { lat: -1.2821, lng: 36.8119 }, // Back towards CBD
    { lat: -1.2921, lng: 36.8219 }, // Return to start
  ];

  // Highway route (Nairobi to Thika)
  const highwayRoute = [
    { lat: -1.2219, lng: 36.8886 }, // Start of Thika Road
    { lat: -1.1989, lng: 36.8923 },
    { lat: -1.1756, lng: 36.8967 },
    { lat: -1.1523, lng: 36.9012 },
    { lat: -1.1289, lng: 36.9056 },
    { lat: -1.1056, lng: 36.9101 },
    { lat: -1.0823, lng: 36.9145 }, // Towards Thika
    { lat: -1.0589, lng: 36.9189 },
    { lat: -1.0356, lng: 36.9234 }, // Near Thika
  ];

  const currentRoute = route === "highway" ? highwayRoute : nairobiRoute;

  const sendTrackingData = async (data: SimulatedVehicle) => {
    try {
      // Insert directly to vehicle_tracking table for demo
      const { error } = await supabase
        .from("vehicle_tracking")
        .insert({
          rental_car_id: null, // Demo mode
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

      // Check for speed alerts
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
    
    // Calculate heading
    const heading = Math.atan2(
      nextPoint.lng - currentPoint.lng,
      nextPoint.lat - currentPoint.lat
    ) * (180 / Math.PI);

    // Calculate distance and speed
    const distance = Math.sqrt(
      Math.pow(nextPoint.lat - currentPoint.lat, 2) +
      Math.pow(nextPoint.lng - currentPoint.lng, 2)
    );
    
    // Speed based on route type
    const baseSpeed = route === "highway" ? 90 : 40;
    const speedVariation = Math.random() * 20 - 10;
    const speed = vehicle.ignition ? Math.max(0, baseSpeed + speedVariation) : 0;

    // Fuel consumption
    const fuelConsumption = vehicle.ignition ? 0.01 * simulationSpeed : 0;

    setVehicle(prev => ({
      ...prev,
      latitude: currentPoint.lat,
      longitude: currentPoint.lng,
      speed: speed,
      heading: (heading + 360) % 360,
      fuelLevel: Math.max(0, prev.fuelLevel - fuelConsumption),
    }));

    // Send data to database
    sendTrackingData({
      ...vehicle,
      latitude: currentPoint.lat,
      longitude: currentPoint.lng,
      speed: speed,
      heading: (heading + 360) % 360,
    });

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
    setVehicle({
      id: "DEMO-GPS-001",
      name: "Demo Vehicle",
      latitude: currentRoute[0].lat,
      longitude: currentRoute[0].lng,
      speed: 0,
      heading: 0,
      ignition: false,
      fuelLevel: 85,
      batteryVoltage: 12.6,
    });
    setAlerts([]);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Demo Simulator
        </CardTitle>
        <CardDescription>
          Simulate GPS tracking to see how the system works
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vehicle Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-muted rounded-lg text-center">
            <Gauge className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{vehicle.speed.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">km/h</p>
          </div>
          <div className="p-3 bg-muted rounded-lg text-center">
            <Navigation className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{vehicle.heading.toFixed(0)}°</p>
            <p className="text-xs text-muted-foreground">Heading</p>
          </div>
          <div className="p-3 bg-muted rounded-lg text-center">
            <Fuel className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{vehicle.fuelLevel.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Fuel</p>
          </div>
          <div className="p-3 bg-muted rounded-lg text-center">
            <Battery className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{vehicle.batteryVoltage.toFixed(1)}V</p>
            <p className="text-xs text-muted-foreground">Battery</p>
          </div>
        </div>

        {/* Location */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-medium">Current Location</span>
            <Badge variant={vehicle.ignition ? "default" : "secondary"}>
              {vehicle.ignition ? "Engine On" : "Engine Off"}
            </Badge>
          </div>
          <p className="text-sm font-mono">
            {vehicle.latitude.toFixed(6)}, {vehicle.longitude.toFixed(6)}
          </p>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Ignition</Label>
            <Switch 
              checked={vehicle.ignition} 
              onCheckedChange={handleIgnitionToggle}
            />
          </div>

          <div className="space-y-2">
            <Label>Route</Label>
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

          <div className="space-y-2">
            <Label>Simulation Speed: {simulationSpeed}x</Label>
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

        {/* Recent Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Recent Alerts
            </Label>
            <div className="space-y-1 max-h-32 overflow-y-auto">
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

        {/* Status Indicator */}
        <div className="flex items-center gap-2 text-sm">
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
  );
};

export default TrackingDemoSimulator;
