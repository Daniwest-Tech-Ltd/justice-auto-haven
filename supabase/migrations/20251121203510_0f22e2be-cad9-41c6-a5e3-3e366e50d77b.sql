-- Add missing fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS theme_mode text DEFAULT 'light',
ADD COLUMN IF NOT EXISTS fingerprint_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS totp_enabled boolean DEFAULT false;

-- Create trusted devices table
CREATE TABLE IF NOT EXISTS trusted_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  device_name text,
  last_seen timestamptz DEFAULT now(),
  has_webauthn boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, device_id)
);

-- Create email OTPs table
CREATE TABLE IF NOT EXISTS user_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  purpose text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Add backup codes to user_totp
ALTER TABLE user_totp
ADD COLUMN IF NOT EXISTS backup_codes text[] DEFAULT '{}';

-- Enable RLS on new tables
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for trusted_devices
CREATE POLICY "Users can view own devices"
ON trusted_devices FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices"
ON trusted_devices FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own devices"
ON trusted_devices FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices"
ON trusted_devices FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for user_otps
CREATE POLICY "Users can view own OTPs"
ON user_otps FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create OTPs"
ON user_otps FOR INSERT
WITH CHECK (true);

CREATE POLICY "System can update OTPs"
ON user_otps FOR UPDATE
USING (true);

-- RLS policies for audit_logs
CREATE POLICY "Users can view own audit logs"
ON audit_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs"
ON audit_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can create audit logs"
ON audit_logs FOR INSERT
WITH CHECK (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_device ON trusted_devices(user_id, device_id);
CREATE INDEX IF NOT EXISTS idx_user_otps_user_code ON user_otps(user_id, code) WHERE NOT used;
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);