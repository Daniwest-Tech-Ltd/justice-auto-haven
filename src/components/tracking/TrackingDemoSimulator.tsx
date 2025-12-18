import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Navigation,
  Gauge,
  MapPin,
  Zap
} from "lucide-react";

interface RentalCar {
  id: string;
  name: string;
  make: string;
  model: string;
}

interface SimulatorProps {
  onDataSent?: () => void;
}

const TrackingDemoSimulator = ({ onDataSent }: SimulatorProps) => {
  const [rentalCars, setRentalCars] = useState<RentalCar[]>([]);
  const [selectedCarId, setSelectedCarId] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [speed, setSpeed] = useState(40);
  const [heading, setHeading] = useState(0);
  const [ignition, setIgnition] = useState(true);
  const [fuelLevel, setFuelLevel] = useState(75);
  const [currentPosition, setCurrentPosition] = useState({
    lat: -1.2921, // Nairobi
    lng: 36.8219,
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Nairobi route simulation points
  const routePoints = [
    { lat: -1.2921, lng: 36.8219 }, // CBD
    { lat: -1.2864, lng: 36.8172 }, // Westlands
    { lat: -1.2750, lng: 36.8100 }, // Parklands
    { lat: -1.2650, lng: 36.8030 }, // Muthaiga
    { lat: -1.2550, lng: 36.7950 }, // Gigiri
    { lat: -1.2450, lng: 36.7900 }, // Village Market
    { lat: -1.2350, lng: 36.7800 }, // Runda
    { lat: -1.2550, lng: 36.7950 }, // Back to Gigiri
    { lat: -1.2750, lng: 36.8100 }, // Parklands
    { lat: -1.2921, lng: 36.8219 }, // Back to CBD
  ];
  const [routeIndex, setRouteIndex] = useState(0);

  useEffect(() => {
    fetchRentalCars();
  }, []);

  const fetchRentalCars = async () => {
    const { data } = await supabase
      .from("rental_cars")
      .select("id, name, make, model");
    setRentalCars((data as RentalCar[]) || []);
  };

  const sendGPSData = async () => {
    if (!selectedCarId) return;

    // Get device for this car
    const { data: device } = await supabase
      .from("gps_devices")
      .select("device_id")
      .eq("rental_car_id", selectedCarId)
      .single();

    if (!device) {
      // Create demo device if not exists
      const demoDeviceId = `DEMO-${selectedCarId.substring(0, 8)}`;
      await supabase.from("gps_devices").upsert({
        device_id: demoDeviceId,
        device_name: "Demo GPS Tracker",
        device_type: "demo_simulator",
        rental_car_id: selectedCarId,
        is_active: true,
        last_ping: new Date().toISOString(),
        battery_level: 95,
      }, { onConflict: "device_id" });
    }

    const deviceId = device?.device_id || `DEMO-${selectedCarId.substring(0, 8)}`;

    // Add some randomness to simulate real GPS
    const jitterLat = (Math.random() - 0.5) * 0.0005;
    const jitterLng = (Math.random() - 0.5) * 0.0005;
    const jitterSpeed = (Math.random() - 0.5) * 10;

    // Insert directly to vehicle_tracking
    const { error } = await supabase.from("vehicle_tracking").insert({
      rental_car_id: selectedCarId,
      latitude: currentPosition.lat + jitterLat,
      longitude: currentPosition.lng + jitterLng,
      speed: Math.max(0, speed + jitterSpeed),
      heading: heading,
      altitude: 1700 + Math.random() * 50,
      accuracy: 5 + Math.random() * 10,
      ignition_status: ignition,
      fuel_level: fuelLevel,
      battery_voltage: 12.4 + Math.random() * 0.4,
      device_id: deviceId,
      recorded_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error sending GPS data:", error);
    } else {
      // Update device last ping
      await supabase
        .from("gps_devices")
        .update({ last_ping: new Date().toISOString() })
        .eq("device_id", deviceId);

      onDataSent?.();
    }
  };

  const startSimulation = () => {
    if (!selectedCarId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a rental car first",
      });
      return;
    }

    setIsSimulating(true);
    toast({
      title: "Simulation Started",
      description: "GPS data is being sent every 3 seconds",
    });

    // Send immediately
    sendGPSData();

    // Then send every 3 seconds
    intervalRef.current = setInterval(() => {
      // Move along route
      setRouteIndex((prev) => {
        const next = (prev + 1) % routePoints.length;
        const targetPoint = routePoints[next];
        
        // Interpolate position
        setCurrentPosition((curr) => ({
          lat: curr.lat + (targetPoint.lat - curr.lat) * 0.3,
          lng: curr.lng + (targetPoint.lng - curr.lng) * 0.3,
        }));

        // Calculate heading
        const dx = targetPoint.lng - currentPosition.lng;
        const dy = targetPoint.lat - currentPosition.lat;
        setHeading(Math.atan2(dx, dy) * (180 / Math.PI));

        return next;
      });

      // Vary speed
      setSpeed((prev) => Math.max(10, Math.min(80, prev + (Math.random() - 0.5) * 20)));

      // Decrease fuel slowly
      setFuelLevel((prev) => Math.max(0, prev - 0.1));

      sendGPSData();
    }, 3000);
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    toast({
      title: "Simulation Stopped",
      description: "GPS data transmission paused",
    });
  };

  const resetSimulation = () => {
    stopSimulation();
    setCurrentPosition({ lat: -1.2921, lng: 36.8219 });
    setRouteIndex(0);
    setSpeed(40);
    setHeading(0);
    setFuelLevel(75);
  };

  const sendSinglePing = async () => {
    await sendGPSData();
    toast({
      title: "GPS Ping Sent",
      description: `Position: ${currentPosition.lat.toFixed(4)}, ${currentPosition.lng.toFixed(4)}`,
    });
  };

  // Trigger geofence test
  const triggerGeofenceExit = async () => {
    // Move far outside Nairobi
    setCurrentPosition({ lat: -0.5, lng: 37.5 });
    await sendGPSData();
    toast({
      variant: "destructive",
      title: "Geofence Exit Triggered",
      description: "Vehicle moved outside normal operating area",
    });
  };

  const triggerSpeedAlert = async () => {
    setSpeed(150);
    await sendGPSData();
    setSpeed(40);
    toast({
      variant: "destructive",
      title: "Speed Alert Triggered",
      description: "Vehicle exceeded speed limit at 150 km/h",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            GPS Simulator (Demo Mode)
          </span>
          {isSimulating && (
            <Badge variant="default" className="animate-pulse bg-green-500">
              LIVE
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Select Rental Car</Label>
          <Select value={selectedCarId} onValueChange={setSelectedCarId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a vehicle to simulate..." />
            </SelectTrigger>
            <SelectContent>
              {rentalCars.map((car) => (
                <SelectItem key={car.id} value={car.id}>
                  {car.name || `${car.make} ${car.model}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Current Position Display */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Position</p>
              <p className="font-mono text-sm">
                {currentPosition.lat.toFixed(4)}, {currentPosition.lng.toFixed(4)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Speed</p>
              <p className="font-mono text-sm">{speed.toFixed(0)} km/h</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Heading</p>
              <p className="font-mono text-sm">{heading.toFixed(0)}°</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-amber-500" />
            <div>
              <p className="text-xs text-muted-foreground">Fuel</p>
              <p className="font-mono text-sm">{fuelLevel.toFixed(0)}%</p>
            </div>
          </div>
        </div>

        {/* Speed Slider */}
        <div>
          <Label>Simulated Speed: {speed.toFixed(0)} km/h</Label>
          <Slider
            value={[speed]}
            onValueChange={([v]) => setSpeed(v)}
            min={0}
            max={160}
            step={5}
            className="mt-2"
          />
        </div>

        {/* Ignition Toggle */}
        <div className="flex items-center justify-between">
          <Label>Engine/Ignition</Label>
          <Switch checked={ignition} onCheckedChange={setIgnition} />
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap gap-2">
          {!isSimulating ? (
            <Button onClick={startSimulation} className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              Start Simulation
            </Button>
          ) : (
            <Button onClick={stopSimulation} variant="destructive" className="flex-1">
              <Pause className="h-4 w-4 mr-2" />
              Stop
            </Button>
          )}
          <Button onClick={resetSimulation} variant="outline">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <Button onClick={sendSinglePing} variant="outline" className="w-full">
          Send Single GPS Ping
        </Button>

        {/* Test Alerts */}
        <div className="pt-4 border-t space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Test Alerts</p>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={triggerGeofenceExit} 
              variant="outline" 
              size="sm"
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              Trigger Geofence Exit
            </Button>
            <Button 
              onClick={triggerSpeedAlert} 
              variant="outline" 
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Trigger Speed Alert
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrackingDemoSimulator;
