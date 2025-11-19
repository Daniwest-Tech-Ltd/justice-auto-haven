-- Create cookies_log table for tracking user consent
CREATE TABLE IF NOT EXISTS public.cookies_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_ip TEXT,
  user_agent TEXT,
  decision TEXT NOT NULL CHECK (decision IN ('accepted', 'declined')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create admin_audit_log table for tracking admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cookies_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cookies_log
CREATE POLICY "Admins can view cookie logs"
  ON public.cookies_log
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update cookie logs"
  ON public.cookies_log
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete cookie logs"
  ON public.cookies_log
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert cookie logs"
  ON public.cookies_log
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for admin_audit_log
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_log
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert audit logs"
  ON public.admin_audit_log
  FOR INSERT
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX idx_cookies_log_timestamp ON public.cookies_log(timestamp DESC);
CREATE INDEX idx_cookies_log_decision ON public.cookies_log(decision);
CREATE INDEX idx_cookies_log_user_ip ON public.cookies_log(user_ip);
CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX idx_admin_audit_log_admin_id ON public.admin_audit_log(admin_id);