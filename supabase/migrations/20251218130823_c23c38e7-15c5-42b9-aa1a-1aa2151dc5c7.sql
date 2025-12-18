-- Vehicle Tracking: Real-time GPS positions
CREATE TABLE public.vehicle_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rental_car_id UUID NOT NULL,
  booking_id UUID,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2) DEFAULT 0,
  heading DECIMAL(5, 2) DEFAULT 0,
  altitude DECIMAL(8, 2),
  accuracy DECIMAL(6, 2),
  ignition_status BOOLEAN DEFAULT false,
  fuel_level DECIMAL(5, 2),
  battery_voltage DECIMAL(4, 2),
  device_id TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Geofences: Boundary definitions
CREATE TABLE public.geofences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  geofence_type TEXT NOT NULL DEFAULT 'polygon',
  coordinates JSONB NOT NULL,
  center_lat DECIMAL(10, 8),
  center_lng DECIMAL(11, 8),
  radius_meters DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT true,
  alert_on_entry BOOLEAN DEFAULT false,
  alert_on_exit BOOLEAN DEFAULT true,
  speed_limit DECIMAL(5, 2),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Geofence Violations: When vehicles cross boundaries
CREATE TABLE public.geofence_violations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rental_car_id UUID NOT NULL,
  booking_id UUID,
  geofence_id UUID NOT NULL REFERENCES public.geofences(id) ON DELETE CASCADE,
  violation_type TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2),
  alert_sent BOOLEAN DEFAULT false,
  alert_channels JSONB DEFAULT '[]',
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trip History: Completed trips with routes
CREATE TABLE public.trip_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rental_car_id UUID NOT NULL,
  booking_id UUID,
  driver_name TEXT,
  driver_phone TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  start_location JSONB NOT NULL,
  end_location JSONB,
  route_points JSONB DEFAULT '[]',
  total_distance_km DECIMAL(10, 2) DEFAULT 0,
  max_speed DECIMAL(5, 2) DEFAULT 0,
  avg_speed DECIMAL(5, 2) DEFAULT 0,
  idle_time_minutes INTEGER DEFAULT 0,
  fuel_consumed DECIMAL(6, 2),
  violations_count INTEGER DEFAULT 0,
  trip_status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tracking Alerts: All system alerts
CREATE TABLE public.tracking_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rental_car_id UUID NOT NULL,
  booking_id UUID,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- GPS Devices: Registered tracking devices
CREATE TABLE public.gps_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE,
  device_name TEXT,
  device_type TEXT DEFAULT 'gps_tracker',
  rental_car_id UUID,
  sim_number TEXT,
  imei TEXT,
  is_active BOOLEAN DEFAULT true,
  last_ping TIMESTAMP WITH TIME ZONE,
  battery_level DECIMAL(5, 2),
  firmware_version TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_vehicle_tracking_car ON public.vehicle_tracking(rental_car_id);
CREATE INDEX idx_vehicle_tracking_time ON public.vehicle_tracking(recorded_at DESC);
CREATE INDEX idx_geofence_violations_car ON public.geofence_violations(rental_car_id);
CREATE INDEX idx_trip_history_car ON public.trip_history(rental_car_id);
CREATE INDEX idx_tracking_alerts_car ON public.tracking_alerts(rental_car_id);
CREATE INDEX idx_tracking_alerts_unread ON public.tracking_alerts(is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE public.vehicle_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geofence_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps_devices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admins
CREATE POLICY "Admins can manage vehicle_tracking" ON public.vehicle_tracking FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage geofences" ON public.geofences FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage geofence_violations" ON public.geofence_violations FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage trip_history" ON public.trip_history FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage tracking_alerts" ON public.tracking_alerts FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage gps_devices" ON public.gps_devices FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- System insert policies for tracking data
CREATE POLICY "System can insert tracking data" ON public.vehicle_tracking FOR INSERT WITH CHECK (true);
CREATE POLICY "System can insert violations" ON public.geofence_violations FOR INSERT WITH CHECK (true);
CREATE POLICY "System can insert alerts" ON public.tracking_alerts FOR INSERT WITH CHECK (true);

-- Enable realtime for live tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_tracking;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tracking_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.geofence_violations;