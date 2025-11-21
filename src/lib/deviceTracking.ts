import { supabase } from "@/integrations/supabase/client";

// Get or create device ID
export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('device_id');
  
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('device_id', deviceId);
  }
  
  return deviceId;
};

// Get device info
export const getDeviceInfo = () => {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
  };
};

// Register or update trusted device
export const registerTrustedDevice = async (
  userId: string, 
  hasWebauthn: boolean = false,
  deviceName?: string
) => {
  const deviceId = getDeviceId();
  const deviceInfo = getDeviceInfo();
  
  const { error } = await supabase
    .from('trusted_devices')
    .upsert({
      user_id: userId,
      device_id: deviceId,
      device_name: deviceName || `${deviceInfo.platform} - ${deviceInfo.userAgent.substring(0, 50)}`,
      has_webauthn: hasWebauthn,
      last_seen: new Date().toISOString()
    }, {
      onConflict: 'user_id,device_id'
    });
  
  if (error) {
    console.error('Error registering trusted device:', error);
  }
};

// Check if current device is trusted with WebAuthn
export const checkTrustedDevice = async (userId: string): Promise<{
  isTrusted: boolean;
  hasWebauthn: boolean;
}> => {
  const deviceId = getDeviceId();
  
  const { data, error } = await supabase
    .from('trusted_devices')
    .select('has_webauthn')
    .eq('user_id', userId)
    .eq('device_id', deviceId)
    .single();
  
  if (error || !data) {
    return { isTrusted: false, hasWebauthn: false };
  }
  
  // Update last seen
  await supabase
    .from('trusted_devices')
    .update({ last_seen: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('device_id', deviceId);
  
  return {
    isTrusted: true,
    hasWebauthn: data.has_webauthn
  };
};

// Get all trusted devices for user
export const getTrustedDevices = async (userId: string) => {
  const { data, error } = await supabase
    .from('trusted_devices')
    .select('*')
    .eq('user_id', userId)
    .order('last_seen', { ascending: false });
  
  if (error) {
    console.error('Error fetching trusted devices:', error);
    return [];
  }
  
  return data || [];
};

// Remove a trusted device
export const removeTrustedDevice = async (deviceId: string) => {
  const { error } = await supabase
    .from('trusted_devices')
    .delete()
    .eq('id', deviceId);
  
  if (error) {
    console.error('Error removing trusted device:', error);
    throw error;
  }
};