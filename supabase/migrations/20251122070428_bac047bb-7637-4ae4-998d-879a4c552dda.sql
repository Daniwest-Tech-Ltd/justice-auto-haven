-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_name text DEFAULT 'Justice Ultimate Automobiles',
  system_description text,
  system_logo_url text,
  favicon_url text,
  support_email text DEFAULT 'support@justiceauto.com',
  support_phone text DEFAULT '+254 722 827 458',
  whatsapp_support text,
  default_country text DEFAULT 'Kenya',
  default_currency text DEFAULT 'KES',
  currency_format jsonb DEFAULT '{"symbol": "KSh", "position": "before", "decimals": 2}'::jsonb,
  timezone text DEFAULT 'Africa/Nairobi',
  date_format text DEFAULT 'DD/MM/YYYY',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Authentication Settings Table
CREATE TABLE IF NOT EXISTS auth_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signup_enabled boolean DEFAULT true,
  phone_verification_enabled boolean DEFAULT true,
  email_verification_enabled boolean DEFAULT true,
  two_fa_enabled boolean DEFAULT true,
  google_oauth_enabled boolean DEFAULT false,
  facebook_oauth_enabled boolean DEFAULT false,
  apple_oauth_enabled boolean DEFAULT false,
  password_min_length integer DEFAULT 8,
  password_require_symbols boolean DEFAULT true,
  session_timeout_minutes integer DEFAULT 60,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Localization Settings
CREATE TABLE IF NOT EXISTS localization_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  default_language text DEFAULT 'en',
  auto_language_detection boolean DEFAULT true,
  rtl_support boolean DEFAULT false,
  available_languages jsonb DEFAULT '["en", "sw"]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Storage Settings
CREATE TABLE IF NOT EXISTS storage_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text DEFAULT 'supabase',
  max_upload_size_mb integer DEFAULT 10,
  allowed_file_types text[] DEFAULT ARRAY['jpg','jpeg','png','pdf','doc','docx'],
  backup_enabled boolean DEFAULT true,
  backup_schedule text DEFAULT 'daily',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Firewall Rules Table
CREATE TABLE IF NOT EXISTS firewall_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name text NOT NULL,
  rule_type text NOT NULL, -- 'allow' or 'block'
  ip_address text,
  ip_range text,
  country_code text,
  enabled boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Allowed IPs
CREATE TABLE IF NOT EXISTS allowed_ips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL UNIQUE,
  description text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Security Configuration
CREATE TABLE IF NOT EXISTS security_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_limiting_enabled boolean DEFAULT true,
  rate_limit_requests integer DEFAULT 100,
  rate_limit_window_minutes integer DEFAULT 15,
  brute_force_protection boolean DEFAULT true,
  max_login_attempts integer DEFAULT 5,
  lockout_duration_minutes integer DEFAULT 30,
  bot_protection_enabled boolean DEFAULT true,
  csrf_protection_enabled boolean DEFAULT true,
  jwt_expiry_hours integer DEFAULT 24,
  encryption_level text DEFAULT 'AES-256',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI Security Settings
CREATE TABLE IF NOT EXISTS ai_security_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  behaviour_monitoring_enabled boolean DEFAULT true,
  threat_detection_enabled boolean DEFAULT true,
  fraud_detection_enabled boolean DEFAULT true,
  facial_recognition_enabled boolean DEFAULT false,
  auto_block_suspicious boolean DEFAULT false,
  confidence_threshold numeric DEFAULT 0.85,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notification Configuration
CREATE TABLE IF NOT EXISTS notification_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_provider text DEFAULT 'smtp',
  email_enabled boolean DEFAULT true,
  sms_provider text,
  sms_enabled boolean DEFAULT false,
  whatsapp_enabled boolean DEFAULT false,
  push_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Email Templates
CREATE TABLE IF NOT EXISTS notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL UNIQUE,
  template_type text NOT NULL, -- 'email', 'sms', 'whatsapp'
  subject text,
  body text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payment Configuration
CREATE TABLE IF NOT EXISTS payment_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mpesa_enabled boolean DEFAULT false,
  mpesa_consumer_key text,
  mpesa_consumer_secret text,
  mpesa_shortcode text,
  paypal_enabled boolean DEFAULT false,
  paypal_client_id text,
  paypal_secret text,
  stripe_enabled boolean DEFAULT false,
  stripe_public_key text,
  stripe_secret_key text,
  bank_transfer_enabled boolean DEFAULT true,
  bank_details jsonb,
  auto_currency_conversion boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Privacy Settings (GDPR)
CREATE TABLE IF NOT EXISTS privacy_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cookie_consent_enabled boolean DEFAULT true,
  cookie_auto_consent boolean DEFAULT false,
  data_retention_days integer DEFAULT 365,
  allow_data_export boolean DEFAULT true,
  allow_data_deletion boolean DEFAULT true,
  privacy_policy_url text,
  terms_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Branding Settings
CREATE TABLE IF NOT EXISTS branding_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_color text DEFAULT '#1e40af',
  secondary_color text DEFAULT '#7c3aed',
  accent_color text DEFAULT '#f59e0b',
  logo_primary_url text,
  logo_white_url text,
  logo_icon_url text,
  hero_text text DEFAULT 'Welcome to Justice Ultimate Automobiles',
  hero_images jsonb DEFAULT '[]'::jsonb,
  footer_text text,
  social_links jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT false,
  whatsapp_notifications boolean DEFAULT false,
  push_notifications boolean DEFAULT true,
  newsletter_enabled boolean DEFAULT false,
  marketing_emails boolean DEFAULT false,
  hide_profile boolean DEFAULT false,
  hide_phone boolean DEFAULT false,
  hide_email boolean DEFAULT false,
  hide_online_status boolean DEFAULT false,
  allow_session_tracking boolean DEFAULT true,
  personalized_ads boolean DEFAULT false,
  data_sharing boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Payment Methods
CREATE TABLE IF NOT EXISTS user_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method_type text NOT NULL, -- 'card', 'mpesa', 'bank'
  last_four text,
  mpesa_number text,
  is_default boolean DEFAULT false,
  billing_address jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Backup Logs
CREATE TABLE IF NOT EXISTS backup_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type text NOT NULL,
  file_path text,
  file_size_mb numeric,
  status text DEFAULT 'pending',
  error_message text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on all tables
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE localization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE firewall_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowed_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for System Settings (Admin only)
CREATE POLICY "Admins can manage system_settings"
  ON system_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage auth_settings"
  ON auth_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage localization_settings"
  ON localization_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage storage_settings"
  ON storage_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage firewall_rules"
  ON firewall_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage allowed_ips"
  ON allowed_ips FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage security_config"
  ON security_config FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage ai_security_settings"
  ON ai_security_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage notification_config"
  ON notification_config FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage notification_templates"
  ON notification_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage payment_config"
  ON payment_config FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage privacy_settings"
  ON privacy_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage branding_settings"
  ON branding_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view backup_logs"
  ON backup_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can create backup_logs"
  ON backup_logs FOR INSERT
  WITH CHECK (true);

-- RLS Policies for User Preferences (Users manage their own)
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for Payment Methods
CREATE POLICY "Users can manage own payment methods"
  ON user_payment_methods FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert default settings
INSERT INTO system_settings (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;
INSERT INTO auth_settings (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;
INSERT INTO localization_settings (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;
INSERT INTO storage_settings (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;
INSERT INTO security_config (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;
INSERT INTO ai_security_settings (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;
INSERT INTO notification_config (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;
INSERT INTO payment_config (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;
INSERT INTO privacy_settings (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;
INSERT INTO branding_settings (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX idx_firewall_rules_ip ON firewall_rules(ip_address);
CREATE INDEX idx_allowed_ips_ip ON allowed_ips(ip_address);
CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX idx_payment_methods_user ON user_payment_methods(user_id);
CREATE INDEX idx_backup_logs_status ON backup_logs(status);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auth_settings_updated_at BEFORE UPDATE ON auth_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_security_config_updated_at BEFORE UPDATE ON security_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();