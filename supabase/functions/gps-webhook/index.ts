import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GPSData {
  device_id: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  accuracy?: number;
  ignition?: boolean;
  fuel_level?: number;
  battery_voltage?: number;
  timestamp?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    console.log("Received GPS data:", body);

    // Support multiple GPS data formats (Teltonika, Queclink, Coban, etc.)
    let gpsData: GPSData;

    // Normalize different GPS tracker formats
    if (body.imei || body.device_id || body.deviceId) {
      gpsData = {
        device_id: body.imei || body.device_id || body.deviceId,
        latitude: parseFloat(body.latitude || body.lat || body.gps?.lat || 0),
        longitude: parseFloat(body.longitude || body.lng || body.lon || body.gps?.lng || 0),
        speed: parseFloat(body.speed || body.velocity || 0),
        heading: parseFloat(body.heading || body.course || body.direction || 0),
        altitude: parseFloat(body.altitude || body.alt || 0),
        accuracy: parseFloat(body.accuracy || body.hdop || 0),
        ignition: body.ignition ?? body.acc ?? body.engine_on ?? false,
        fuel_level: parseFloat(body.fuel || body.fuel_level || 0),
        battery_voltage: parseFloat(body.battery || body.voltage || body.power || 0),
        timestamp: body.timestamp || body.datetime || new Date().toISOString(),
      };
    } else {
      gpsData = body as GPSData;
    }

    // Find the GPS device and get associated rental car
    const { data: device, error: deviceError } = await supabase
      .from("gps_devices")
      .select("id, rental_car_id, is_active")
      .eq("device_id", gpsData.device_id)
      .single();

    if (deviceError || !device) {
      console.log("Unknown device:", gpsData.device_id);
      return new Response(
        JSON.stringify({ error: "Device not registered", device_id: gpsData.device_id }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!device.is_active) {
      return new Response(
        JSON.stringify({ error: "Device is inactive" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update device last ping
    await supabase
      .from("gps_devices")
      .update({ 
        last_ping: new Date().toISOString(),
        battery_level: gpsData.battery_voltage 
      })
      .eq("id", device.id);

    // Get active booking for this rental car
    const { data: activeBooking } = await supabase
      .from("rental_bookings")
      .select("id")
      .eq("rental_car_id", device.rental_car_id)
      .eq("status", "confirmed")
      .lte("start_date", new Date().toISOString())
      .gte("end_date", new Date().toISOString())
      .single();

    // Insert tracking record
    const { data: trackingRecord, error: trackingError } = await supabase
      .from("vehicle_tracking")
      .insert({
        rental_car_id: device.rental_car_id,
        booking_id: activeBooking?.id || null,
        latitude: gpsData.latitude,
        longitude: gpsData.longitude,
        speed: gpsData.speed || 0,
        heading: gpsData.heading || 0,
        altitude: gpsData.altitude,
        accuracy: gpsData.accuracy,
        ignition_status: gpsData.ignition || false,
        fuel_level: gpsData.fuel_level,
        battery_voltage: gpsData.battery_voltage,
        device_id: gpsData.device_id,
        recorded_at: gpsData.timestamp || new Date().toISOString(),
      })
      .select()
      .single();

    if (trackingError) {
      console.error("Error inserting tracking data:", trackingError);
      throw trackingError;
    }

    // Check geofence violations
    const { data: geofences } = await supabase
      .from("geofences")
      .select("*")
      .eq("is_active", true);

    for (const geofence of geofences || []) {
      const isInside = checkPointInGeofence(
        gpsData.latitude,
        gpsData.longitude,
        geofence
      );

      // Get last known position to determine entry/exit
      const { data: lastPositions } = await supabase
        .from("vehicle_tracking")
        .select("latitude, longitude")
        .eq("rental_car_id", device.rental_car_id)
        .order("recorded_at", { ascending: false })
        .limit(2);

      let wasInside = false;
      if (lastPositions && lastPositions.length > 1) {
        wasInside = checkPointInGeofence(
          lastPositions[1].latitude,
          lastPositions[1].longitude,
          geofence
        );
      }

      // Check for entry violation
      if (isInside && !wasInside && geofence.alert_on_entry) {
        await createViolation(supabase, device.rental_car_id, activeBooking?.id, geofence, "entry", gpsData);
      }

      // Check for exit violation
      if (!isInside && wasInside && geofence.alert_on_exit) {
        await createViolation(supabase, device.rental_car_id, activeBooking?.id, geofence, "exit", gpsData);
      }

      // Check speed limit violation
      if (isInside && geofence.speed_limit && gpsData.speed && gpsData.speed > geofence.speed_limit) {
        await createSpeedViolation(supabase, device.rental_car_id, activeBooking?.id, geofence, gpsData);
      }
    }

    // Update trip if active
    if (activeBooking) {
      await updateTrip(supabase, device.rental_car_id, activeBooking.id, gpsData);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        tracking_id: trackingRecord.id,
        message: "GPS data recorded successfully" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("GPS webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Check if point is inside geofence
function checkPointInGeofence(lat: number, lng: number, geofence: any): boolean {
  const coords = geofence.coordinates;
  
  if (geofence.geofence_type === "circle") {
    const centerLat = geofence.center_lat || coords.center?.[1];
    const centerLng = geofence.center_lng || coords.center?.[0];
    const radius = geofence.radius_meters || coords.radius;
    
    const distance = getDistanceKm(lat, lng, centerLat, centerLng) * 1000;
    return distance <= radius;
  } else if (geofence.geofence_type === "polygon") {
    const points = coords.points || coords;
    return isPointInPolygon(lat, lng, points);
  }
  
  return false;
}

// Haversine formula for distance
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Ray casting algorithm for polygon
function isPointInPolygon(lat: number, lng: number, points: any[]): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].lng || points[i][0];
    const yi = points[i].lat || points[i][1];
    const xj = points[j].lng || points[j][0];
    const yj = points[j].lat || points[j][1];

    if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

// Create geofence violation
async function createViolation(supabase: any, carId: string, bookingId: string | null, geofence: any, type: string, gpsData: GPSData) {
  const violationType = type === "entry" ? "geofence_entry" : "geofence_exit";
  
  // Insert violation
  await supabase.from("geofence_violations").insert({
    rental_car_id: carId,
    booking_id: bookingId,
    geofence_id: geofence.id,
    violation_type: violationType,
    latitude: gpsData.latitude,
    longitude: gpsData.longitude,
    speed: gpsData.speed,
  });

  // Create alert
  await supabase.from("tracking_alerts").insert({
    rental_car_id: carId,
    booking_id: bookingId,
    alert_type: violationType,
    severity: "high",
    title: `Geofence ${type === "entry" ? "Entry" : "Exit"} Alert`,
    message: `Vehicle ${type === "entry" ? "entered" : "exited"} geofence: ${geofence.name}`,
    latitude: gpsData.latitude,
    longitude: gpsData.longitude,
    metadata: { geofence_id: geofence.id, geofence_name: geofence.name },
  });

  // Send notifications (non-blocking)
  try {
    await sendAlertNotifications(supabase, carId, bookingId, `Geofence ${type} Alert`, 
      `Vehicle ${type === "entry" ? "entered" : "exited"} restricted zone: ${geofence.name}`);
  } catch (e) {
    console.error("Failed to send notifications:", e);
  }
}

// Create speed violation
async function createSpeedViolation(supabase: any, carId: string, bookingId: string | null, geofence: any, gpsData: GPSData) {
  await supabase.from("tracking_alerts").insert({
    rental_car_id: carId,
    booking_id: bookingId,
    alert_type: "speed_violation",
    severity: gpsData.speed! > geofence.speed_limit * 1.5 ? "critical" : "high",
    title: "Speed Limit Exceeded",
    message: `Vehicle traveling at ${gpsData.speed?.toFixed(0)} km/h in ${geofence.speed_limit} km/h zone`,
    latitude: gpsData.latitude,
    longitude: gpsData.longitude,
    metadata: { 
      speed: gpsData.speed, 
      speed_limit: geofence.speed_limit,
      geofence_id: geofence.id 
    },
  });
}

// Update active trip
async function updateTrip(supabase: any, carId: string, bookingId: string, gpsData: GPSData) {
  const { data: activeTrip } = await supabase
    .from("trip_history")
    .select("*")
    .eq("rental_car_id", carId)
    .eq("booking_id", bookingId)
    .eq("trip_status", "active")
    .single();

  if (activeTrip) {
    const routePoints = activeTrip.route_points || [];
    routePoints.push({ lat: gpsData.latitude, lng: gpsData.longitude, time: new Date().toISOString() });

    // Calculate distance
    let totalDistance = activeTrip.total_distance_km || 0;
    if (routePoints.length > 1) {
      const prev = routePoints[routePoints.length - 2];
      totalDistance += getDistanceKm(prev.lat, prev.lng, gpsData.latitude, gpsData.longitude);
    }

    await supabase
      .from("trip_history")
      .update({
        route_points: routePoints,
        total_distance_km: totalDistance,
        max_speed: Math.max(activeTrip.max_speed || 0, gpsData.speed || 0),
        avg_speed: routePoints.length > 0 ? 
          (activeTrip.avg_speed * (routePoints.length - 1) + (gpsData.speed || 0)) / routePoints.length : 
          gpsData.speed || 0,
        end_location: { lat: gpsData.latitude, lng: gpsData.longitude },
      })
      .eq("id", activeTrip.id);
  } else if (gpsData.ignition) {
    // Start new trip when ignition turns on
    await supabase.from("trip_history").insert({
      rental_car_id: carId,
      booking_id: bookingId,
      start_time: new Date().toISOString(),
      start_location: { lat: gpsData.latitude, lng: gpsData.longitude },
      route_points: [{ lat: gpsData.latitude, lng: gpsData.longitude, time: new Date().toISOString() }],
      trip_status: "active",
    });
  }
}

// Send alert notifications
async function sendAlertNotifications(supabase: any, carId: string, bookingId: string | null, title: string, message: string) {
  // Get booking customer details
  if (bookingId) {
    const { data: booking } = await supabase
      .from("rental_bookings")
      .select("customer_name, customer_email, customer_phone")
      .eq("id", bookingId)
      .single();

    if (booking?.customer_phone) {
      // Send SMS via Brevo
      const brevoKey = Deno.env.get("BREVO_SMS_API_KEY");
      if (brevoKey) {
        try {
          await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
            method: "POST",
            headers: {
              "api-key": brevoKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sender: "JUA-Track",
              recipient: booking.customer_phone.replace(/^0/, "254"),
              content: `${title}: ${message}`,
            }),
          });
        } catch (e) {
          console.error("SMS send failed:", e);
        }
      }
    }
  }

  // Always notify admins
  const { data: admins } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");

  for (const admin of admins || []) {
    await supabase.from("notifications").insert({
      user_id: admin.user_id,
      title,
      message,
      type: "tracking_alert",
      metadata: { rental_car_id: carId, booking_id: bookingId },
    });
  }
}
