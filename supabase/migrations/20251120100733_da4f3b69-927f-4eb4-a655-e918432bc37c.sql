-- Create OTP audit trail table
CREATE TABLE IF NOT EXISTS public.otp_audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  otp_id UUID REFERENCES public.two_factor_auth(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('generated', 'verified', 'deleted', 'expired', 'resent')),
  performed_by UUID,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_otp_audit_user_id ON public.otp_audit_trail(user_id);
CREATE INDEX idx_otp_audit_action ON public.otp_audit_trail(action);
CREATE INDEX idx_otp_audit_created_at ON public.otp_audit_trail(created_at DESC);

-- Enable RLS
ALTER TABLE public.otp_audit_trail ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON public.otp_audit_trail
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON public.otp_audit_trail
  FOR INSERT
  WITH CHECK (true);

-- Create OTP statistics view
CREATE OR REPLACE VIEW public.otp_statistics AS
SELECT
  COUNT(*) FILTER (WHERE verified = true) as total_verified,
  COUNT(*) FILTER (WHERE verified = false AND expires_at > now()) as active_unverified,
  COUNT(*) FILTER (WHERE expires_at <= now()) as expired_total,
  COUNT(*) FILTER (WHERE created_at >= now() - interval '24 hours') as generated_last_24h,
  COUNT(*) FILTER (WHERE verified = true AND created_at >= now() - interval '24 hours') as verified_last_24h,
  ROUND(
    COUNT(*) FILTER (WHERE verified = true)::numeric / 
    NULLIF(COUNT(*)::numeric, 0) * 100, 2
  ) as verification_rate
FROM public.two_factor_auth;

-- Grant access to view
GRANT SELECT ON public.otp_statistics TO authenticated;