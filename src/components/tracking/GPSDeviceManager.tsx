import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
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
  Cpu,
  Wifi,
  WifiOff,
  Battery,
  Signal,
  RefreshCw
} from "lucide-react";

interface GPSDevice {
  id: string;
  device_id: string;
  device_name: string;
  device_type: string;
  rental_car_id: string;
  sim_number: string;
  imei: string;
  is_active: boolean;
  last_ping: string;
  battery_level: number;
  firmware_version: string;
  created_at: string;
  rental_cars?: {
    name: string;
    make: string;
    model: string;
  };
}

interface RentalCar {
  id: string;
  name: string;
  make: string;
  model: string;
}

const GPSDeviceManager = () => {
  const [devices, setDevices] = useState<GPSDevice[]>([]);
  const [rentalCars, setRentalCars] = useState<RentalCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<GPSDevice | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    device_id: "",
    device_name: "",
    device_type: "gps_tracker",
    rental_car_id: "",
    sim_number: "",
    imei: "",
    firmware_version: "",
    is_active: true,
  });

  const fetchDevices = async () => {
    try {
      const { data, error } = await supabase
        .from("gps_devices")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDevices((data || []) as GPSDevice[]);
    } catch (error) {
      console.error("Error fetching devices:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRentalCars = async () => {
    try {
      const { data, error } = await supabase
        .from("rental_cars")
        .select("id, name, make, model")
        .eq("is_available", true);

      if (error) throw error;
      setRentalCars(data || []);
    } catch (error) {
      console.error("Error fetching rental cars:", error);
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchRentalCars();
  }, []);

  const handleSave = async () => {
    try {
      const payload = {
        device_id: formData.device_id,
        device_name: formData.device_name,
        device_type: formData.device_type,
        rental_car_id: formData.rental_car_id || null,
        sim_number: formData.sim_number || null,
        imei: formData.imei || null,
        firmware_version: formData.firmware_version || null,
        is_active: formData.is_active,
      };

      if (editingDevice) {
        const { error } = await supabase
          .from("gps_devices")
          .update(payload)
          .eq("id", editingDevice.id);
        if (error) throw error;
        toast({ title: "Success", description: "Device updated" });
      } else {
        const { error } = await supabase.from("gps_devices").insert(payload);
        if (error) throw error;
        toast({ title: "Success", description: "Device registered" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchDevices();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this device?")) return;

    try {
      const { error } = await supabase.from("gps_devices").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: "Device deleted" });
      fetchDevices();
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
        .from("gps_devices")
        .update({ is_active: !isActive })
        .eq("id", id);
      if (error) throw error;
      fetchDevices();
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
      device_id: "",
      device_name: "",
      device_type: "gps_tracker",
      rental_car_id: "",
      sim_number: "",
      imei: "",
      firmware_version: "",
      is_active: true,
    });
    setEditingDevice(null);
  };

  const openEditDialog = (device: GPSDevice) => {
    setEditingDevice(device);
    setFormData({
      device_id: device.device_id,
      device_name: device.device_name || "",
      device_type: device.device_type,
      rental_car_id: device.rental_car_id || "",
      sim_number: device.sim_number || "",
      imei: device.imei || "",
      firmware_version: device.firmware_version || "",
      is_active: device.is_active,
    });
    setIsDialogOpen(true);
  };

  const isOnline = (lastPing: string | null) => {
    if (!lastPing) return false;
    const diff = Date.now() - new Date(lastPing).getTime();
    return diff < 5 * 60 * 1000; // 5 minutes
  };

  const activeDevices = devices.filter((d) => d.is_active);
  const onlineDevices = devices.filter((d) => isOnline(d.last_ping));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">GPS Devices</h3>
          </div>
          <Badge variant="outline">{devices.length} devices</Badge>
          <Badge variant="outline" className="bg-green-500/10 text-green-600">
            {onlineDevices.length} online
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchDevices}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Device
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingDevice ? "Edit Device" : "Register GPS Device"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Device ID *</Label>
                    <Input
                      value={formData.device_id}
                      onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
                      placeholder="e.g., GPS-001"
                    />
                  </div>
                  <div>
                    <Label>Device Name</Label>
                    <Input
                      value={formData.device_name}
                      onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
                      placeholder="e.g., Tracker Unit 1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Device Type</Label>
                  <Select
                    value={formData.device_type}
                    onValueChange={(value) => setFormData({ ...formData, device_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gps_tracker">GPS Tracker</SelectItem>
                      <SelectItem value="obd_device">OBD Device</SelectItem>
                      <SelectItem value="mobile_app">Mobile App</SelectItem>
                      <SelectItem value="hardwired">Hardwired GPS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Assign to Vehicle</Label>
                  <Select
                    value={formData.rental_car_id}
                    onValueChange={(value) => setFormData({ ...formData, rental_car_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {rentalCars.map((car) => (
                        <SelectItem key={car.id} value={car.id}>
                          {car.name || `${car.make} ${car.model}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>SIM Number</Label>
                    <Input
                      value={formData.sim_number}
                      onChange={(e) => setFormData({ ...formData, sim_number: e.target.value })}
                      placeholder="+254..."
                    />
                  </div>
                  <div>
                    <Label>IMEI</Label>
                    <Input
                      value={formData.imei}
                      onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                      placeholder="Device IMEI"
                    />
                  </div>
                </div>

                <div>
                  <Label>Firmware Version</Label>
                  <Input
                    value={formData.firmware_version}
                    onChange={(e) => setFormData({ ...formData, firmware_version: e.target.value })}
                    placeholder="e.g., v2.1.0"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>

                <Button onClick={handleSave} className="w-full">
                  {editingDevice ? "Update Device" : "Register Device"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Device Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Devices</p>
              <p className="text-xl font-bold">{devices.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
              <Wifi className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Online</p>
              <p className="text-xl font-bold">{onlineDevices.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
              <WifiOff className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Offline</p>
              <p className="text-xl font-bold">{activeDevices.length - onlineDevices.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <Battery className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Low Battery</p>
              <p className="text-xl font-bold">
                {devices.filter((d) => d.battery_level && d.battery_level < 20).length}
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
                <TableHead>Device</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Battery</TableHead>
                <TableHead>Last Ping</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Cpu className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No GPS devices registered
                  </TableCell>
                </TableRow>
              ) : (
                devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{device.device_name || device.device_id}</p>
                        <p className="text-xs text-muted-foreground font-mono">{device.device_id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{device.device_type}</Badge>
                    </TableCell>
                    <TableCell>
                      {device.rental_cars ? (
                        device.rental_cars.name || 
                          `${device.rental_cars.make} ${device.rental_cars.model}`
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isOnline(device.last_ping) ? (
                        <Badge variant="default" className="bg-green-500">
                          <Signal className="h-3 w-3 mr-1" />
                          Online
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <WifiOff className="h-3 w-3 mr-1" />
                          Offline
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {device.battery_level !== null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                device.battery_level > 50 ? "bg-green-500" :
                                device.battery_level > 20 ? "bg-yellow-500" : "bg-red-500"
                              }`}
                              style={{ width: `${device.battery_level}%` }}
                            />
                          </div>
                          <span className="text-xs">{device.battery_level}%</span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {device.last_ping ? (
                        <span className="text-sm">
                          {new Date(device.last_ping).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Switch
                          checked={device.is_active}
                          onCheckedChange={() => toggleActive(device.id, device.is_active)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(device)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(device.id)}
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

export default GPSDeviceManager;
