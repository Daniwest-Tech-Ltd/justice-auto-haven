import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import LoadingScreen from "@/components/LoadingScreen";
import VehicleTrackingMap from "@/components/tracking/VehicleTrackingMap";
import GeofenceManager from "@/components/tracking/GeofenceManager";
import TripHistoryPanel from "@/components/tracking/TripHistoryPanel";
import TrackingAlertsPanel from "@/components/tracking/TrackingAlertsPanel";
import GPSDeviceManager from "@/components/tracking/GPSDeviceManager";
import TrackingDemoSimulator from "@/components/tracking/TrackingDemoSimulator";
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  MapPin, 
  Shield, 
  Route, 
  Bell, 
  Cpu,
  Car,
  Info,
  Wifi,
  Radio,
  CheckCircle2,
  Zap
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RentalBooking {
  id: string;
  rental_car_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
  created_at: string;
  rental_cars: {
    name: string;
    make: string;
    model: string;
  };
}

const RentalManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<RentalBooking[]>([]);
  const [mapboxToken, setMapboxToken] = useState(() => {
    return localStorage.getItem("mapbox_token") || "";
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("rental_bookings")
        .select(`
          *,
          rental_cars (
            name,
            make,
            model
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch rental bookings",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("rental_bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Booking ${newStatus} successfully`,
      });

      fetchBookings();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      confirmed: "default",
      cancelled: "destructive",
      completed: "default",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleMapboxTokenChange = (token: string) => {
    setMapboxToken(token);
    localStorage.setItem("mapbox_token", token);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <Button onClick={() => navigate("/admin/dashboard")} variant="ghost">
          <ArrowLeft className="mr-2" /> Back to Dashboard
        </Button>
        <Button onClick={() => navigate("/admin/add-rental-car")}>
          <Plus className="mr-2" /> Add Rental Car
        </Button>
      </div>

      <Tabs defaultValue="bookings" className="space-y-6">
        <TabsList className="grid grid-cols-4 md:grid-cols-8 gap-2 h-auto p-1">
          <TabsTrigger value="bookings" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Bookings</span>
          </TabsTrigger>
          <TabsTrigger value="live-map" className="gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Live Map</span>
          </TabsTrigger>
          <TabsTrigger value="geofences" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Geofences</span>
          </TabsTrigger>
          <TabsTrigger value="trips" className="gap-2">
            <Route className="h-4 w-4" />
            <span className="hidden sm:inline">Trips</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="devices" className="gap-2">
            <Cpu className="h-4 w-4" />
            <span className="hidden sm:inline">Devices</span>
          </TabsTrigger>
          <TabsTrigger value="simulator" className="gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Demo</span>
          </TabsTrigger>
          <TabsTrigger value="setup" className="gap-2">
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">Setup</span>
          </TabsTrigger>
        </TabsList>

        {/* Bookings Tab */}
        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Rental Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="mx-auto h-12 w-12 mb-4" />
                  <p>No rental bookings yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Total Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{booking.customer_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {booking.customer_email}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {booking.customer_phone}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {booking.rental_cars?.name || 
                            `${booking.rental_cars?.make} ${booking.rental_cars?.model}`}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p><strong>Start:</strong> {new Date(booking.start_date).toLocaleString()}</p>
                            <p><strong>End:</strong> {new Date(booking.end_date).toLocaleString()}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">
                            KES {booking.total_price.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(booking.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {booking.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => updateBookingStatus(booking.id, "confirmed")}
                                >
                                  Confirm
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updateBookingStatus(booking.id, "cancelled")}
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                            {booking.status === "confirmed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateBookingStatus(booking.id, "completed")}
                              >
                                Mark Complete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Live Map Tab */}
        <TabsContent value="live-map">
          <VehicleTrackingMap 
            mapboxToken={mapboxToken} 
            onTokenChange={handleMapboxTokenChange}
          />
        </TabsContent>

        {/* Geofences Tab */}
        <TabsContent value="geofences">
          <GeofenceManager mapboxToken={mapboxToken} />
        </TabsContent>

        {/* Trip History Tab */}
        <TabsContent value="trips">
          <TripHistoryPanel mapboxToken={mapboxToken} />
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <TrackingAlertsPanel />
        </TabsContent>

        {/* GPS Devices Tab */}
        <TabsContent value="devices">
          <GPSDeviceManager />
        </TabsContent>

        {/* Hardware Setup Guide Tab */}
        <TabsContent value="setup">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Webhook Endpoint */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  GPS Webhook Endpoint
                </CardTitle>
                <CardDescription>
                  Configure your GPS hardware to send data to this endpoint
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-muted rounded-lg font-mono text-sm break-all border">
                  POST https://ccsfhblxkmyqdqqcgitt.supabase.co/functions/v1/gps-webhook
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Required Payload Format:</p>
                  <pre className="p-3 bg-muted rounded-lg text-xs overflow-auto border">
{`{
  "device_id": "GPS-DEVICE-001",
  "latitude": -1.2921,
  "longitude": 36.8219,
  "speed": 45.5,
  "heading": 180,
  "ignition": true,
  "fuel_level": 75,
  "battery_voltage": 12.6,
  "timestamp": "2025-12-18T12:00:00Z"
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Supported Hardware */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="h-5 w-5" />
                  Supported GPS Hardware
                </CardTitle>
                <CardDescription>
                  Compatible GPS tracker devices for real-time tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "Teltonika FMB920", desc: "Professional fleet tracker with OBD-II" },
                    { name: "Queclink GV300", desc: "Compact vehicle tracker with 3G/4G" },
                    { name: "Coban TK103B", desc: "Budget-friendly GPS tracker" },
                    { name: "Concox GT06N", desc: "Popular fleet management device" },
                    { name: "Tramigo T23", desc: "Advanced telematics device" },
                  ].map((device) => (
                    <div key={device.name} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">{device.name}</p>
                        <p className="text-sm text-muted-foreground">{device.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Setup Steps */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Hardware Setup Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
                    <h4 className="font-semibold">Install GPS Device</h4>
                    <p className="text-sm text-muted-foreground">
                      Install the GPS tracker hardware in your rental vehicle, typically connected to the OBD-II port or hardwired to the vehicle power.
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
                    <h4 className="font-semibold">Configure Device</h4>
                    <p className="text-sm text-muted-foreground">
                      Configure the GPS device to send data to the webhook endpoint above. Set reporting interval (recommended: 30 seconds).
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
                    <h4 className="font-semibold">Register in System</h4>
                    <p className="text-sm text-muted-foreground">
                      Go to the "Devices" tab and register the GPS device with its unique device ID and assign it to a rental car.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Demo Simulator Tab */}
        <TabsContent value="simulator">
          <TrackingDemoSimulator 
            mapboxToken={mapboxToken}
            onTokenChange={handleMapboxTokenChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RentalManagement;
