-- Create security_incidents table for comprehensive incident tracking with MITRE mapping
CREATE TABLE IF NOT EXISTS public.security_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'investigating', 'contained', 'mitigated', 'resolved', 'closed')),
  mitre_tactics JSONB DEFAULT '[]'::jsonb,
  mitre_techniques JSONB DEFAULT '[]'::jsonb,
  affected_assets JSONB DEFAULT '[]'::jsonb,
  affected_users JSONB DEFAULT '[]'::jsonb,
  iocs JSONB DEFAULT '[]'::jsonb,
  timeline JSONB DEFAULT '[]'::jsonb,
  impact_assessment TEXT,
  remediation_steps JSONB DEFAULT '[]'::jsonb,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id)
);

-- Create threat_intelligence table for IOCs and threat feeds
CREATE TABLE IF NOT EXISTS public.threat_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ioc_type TEXT NOT NULL CHECK (ioc_type IN ('ip', 'domain', 'url', 'hash', 'email', 'cve')),
  ioc_value TEXT NOT NULL,
  threat_level TEXT NOT NULL CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
  threat_category TEXT,
  description TEXT,
  source TEXT NOT NULL,
  first_seen TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now(),
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  metadata JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create security_playbooks table for automated response
CREATE TABLE IF NOT EXISTS public.security_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  approval_required BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_executed TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create crypto_inventory table for PQC migration tracking
CREATE TABLE IF NOT EXISTS public.crypto_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('certificate', 'key', 'vpn', 'database', 'backup', 'code_signing', 'api')),
  algorithm TEXT NOT NULL,
  key_size INTEGER,
  expiry_date DATE,
  pqc_ready BOOLEAN DEFAULT false,
  pqc_migration_status TEXT DEFAULT 'not_started' CHECK (pqc_migration_status IN ('not_started', 'planning', 'in_progress', 'testing', 'completed')),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  owner TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create anomaly_baselines table for behavioral analysis
CREATE TABLE IF NOT EXISTS public.anomaly_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'ip', 'device')),
  entity_id TEXT NOT NULL,
  baseline_data JSONB NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entity_type, entity_id)
);

-- Create mitre_mappings table for ATT&CK framework
CREATE TABLE IF NOT EXISTS public.mitre_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  tactic_id TEXT NOT NULL,
  tactic_name TEXT NOT NULL,
  technique_id TEXT NOT NULL,
  technique_name TEXT NOT NULL,
  detection_rules JSONB DEFAULT '[]'::jsonb,
  mitigation_steps JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threat_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomaly_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mitre_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for security_incidents (admins only)
CREATE POLICY "Admins can view all security incidents"
  ON public.security_incidents FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage security incidents"
  ON public.security_incidents FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for threat_intelligence (admins only)
CREATE POLICY "Admins can view threat intelligence"
  ON public.threat_intelligence FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage threat intelligence"
  ON public.threat_intelligence FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for security_playbooks (admins only)
CREATE POLICY "Admins can view security playbooks"
  ON public.security_playbooks FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage security playbooks"
  ON public.security_playbooks FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for crypto_inventory (admins only)
CREATE POLICY "Admins can view crypto inventory"
  ON public.crypto_inventory FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage crypto inventory"
  ON public.crypto_inventory FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for anomaly_baselines (admins only)
CREATE POLICY "Admins can view anomaly baselines"
  ON public.anomaly_baselines FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage anomaly_baselines"
  ON public.anomaly_baselines FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for mitre_mappings (admins only)
CREATE POLICY "Admins can view MITRE mappings"
  ON public.mitre_mappings FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can create MITRE mappings"
  ON public.mitre_mappings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_security_incidents_status ON public.security_incidents(status);
CREATE INDEX idx_security_incidents_severity ON public.security_incidents(severity);
CREATE INDEX idx_security_incidents_created_at ON public.security_incidents(created_at DESC);
CREATE INDEX idx_threat_intelligence_ioc_value ON public.threat_intelligence(ioc_value);
CREATE INDEX idx_threat_intelligence_ioc_type ON public.threat_intelligence(ioc_type);
CREATE INDEX idx_threat_intelligence_active ON public.threat_intelligence(active);
CREATE INDEX idx_security_playbooks_enabled ON public.security_playbooks(enabled);
CREATE INDEX idx_crypto_inventory_pqc_ready ON public.crypto_inventory(pqc_ready);
CREATE INDEX idx_crypto_inventory_expiry_date ON public.crypto_inventory(expiry_date);
CREATE INDEX idx_anomaly_baselines_entity ON public.anomaly_baselines(entity_type, entity_id);
CREATE INDEX idx_mitre_mappings_event_type ON public.mitre_mappings(event_type);

-- Insert default MITRE ATT&CK mappings for common security events
INSERT INTO public.mitre_mappings (event_type, tactic_id, tactic_name, technique_id, technique_name, detection_rules, mitigation_steps) VALUES
('login_attempt_failed', 'TA0006', 'Credential Access', 'T1110', 'Brute Force', '["Failed login attempts > 5 in 5 minutes", "Multiple users from same IP"]', '["Rate limiting", "Account lockout", "MFA enforcement"]'),
('suspicious_activity', 'TA0009', 'Collection', 'T1005', 'Data from Local System', '["Unusual data access patterns", "Large downloads"]', '["DLP policies", "Access review", "User education"]'),
('rate_limit_exceeded', 'TA0040', 'Impact', 'T1498', 'Network Denial of Service', '["Traffic spike", "Request rate anomaly"]', '["WAF rules", "IP blocking", "CDN protection"]'),
('account_suspension', 'TA0005', 'Defense Evasion', 'T1562', 'Impair Defenses', '["Multiple failed auth attempts", "Suspicious behavior patterns"]', '["Investigation", "Password reset", "Session termination"]'),
('invalid_2fa', 'TA0006', 'Credential Access', 'T1111', 'Two-Factor Authentication Interception', '["Multiple invalid 2FA codes", "2FA bypass attempts"]', '["Enhanced 2FA", "Device fingerprinting", "User notification"]'),
('impossible_travel', 'TA0001', 'Initial Access', 'T1078', 'Valid Accounts', '["Login from distant geos in short time"]', '["Session termination", "Force reauthentication", "Geo-blocking"]'),
('sql_injection', 'TA0001', 'Initial Access', 'T1190', 'Exploit Public-Facing Application', '["SQL keywords in parameters", "Union/Select patterns"]', '["WAF rules", "Input validation", "Parameterized queries"]'),
('xss_attempt', 'TA0001', 'Initial Access', 'T1190', 'Exploit Public-Facing Application', '["Script tags in input", "Event handlers in parameters"]', '["Input sanitization", "CSP headers", "Output encoding"]'),
('data_exfiltration', 'TA0010', 'Exfiltration', 'T1041', 'Exfiltration Over C2 Channel', '["Large outbound transfers", "Unusual upload patterns"]', '["DLP", "Egress filtering", "Network monitoring"]');

-- Insert default security playbooks
INSERT INTO public.security_playbooks (name, description, trigger_conditions, actions, approval_required) VALUES
('Block Malicious IP', 'Automatically block IPs after multiple failed login attempts', 
  '{"event_type": "login_attempt_failed", "count_threshold": 5, "time_window_minutes": 5}'::jsonb,
  '[{"action": "block_ip", "duration_hours": 24}, {"action": "notify_admin"}, {"action": "create_incident"}]'::jsonb,
  false),
('Suspend Compromised Account', 'Suspend account showing signs of compromise',
  '{"event_type": "suspicious_activity", "risk_score_threshold": 80}'::jsonb,
  '[{"action": "suspend_account"}, {"action": "invalidate_sessions"}, {"action": "notify_user"}, {"action": "notify_security_team"}, {"action": "create_incident"}]'::jsonb,
  true),
('Handle Invalid 2FA', 'Respond to multiple invalid 2FA attempts',
  '{"event_type": "invalid_2fa", "count_threshold": 3, "time_window_minutes": 10}'::jsonb,
  '[{"action": "lock_account_temp"}, {"action": "require_password_reset"}, {"action": "notify_user"}, {"action": "log_incident"}]'::jsonb,
  false),
('Impossible Travel Response', 'Handle simultaneous logins from distant locations',
  '{"event_type": "impossible_travel", "distance_km_threshold": 5000, "time_minutes_threshold": 60}'::jsonb,
  '[{"action": "terminate_sessions"}, {"action": "require_reauth"}, {"action": "enable_mfa"}, {"action": "notify_user"}, {"action": "create_incident"}]'::jsonb,
  false),
('SQL Injection Response', 'Handle detected SQL injection attempts',
  '{"event_type": "sql_injection"}'::jsonb,
  '[{"action": "block_ip"}, {"action": "alert_dev_team"}, {"action": "create_waf_rule"}, {"action": "create_incident"}]'::jsonb,
  false);

-- Create trigger for updated_at on security_incidents
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_security_incidents_updated_at BEFORE UPDATE ON public.security_incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_playbooks_updated_at BEFORE UPDATE ON public.security_playbooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crypto_inventory_updated_at BEFORE UPDATE ON public.crypto_inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();