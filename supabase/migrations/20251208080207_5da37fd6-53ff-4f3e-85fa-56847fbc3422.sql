-- Create SMS logs table
CREATE TABLE public.sms_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  sms_type VARCHAR(50) NOT NULL DEFAULT 'general',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  api_response JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Create SMS settings table
CREATE TABLE public.sms_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sms_enabled BOOLEAN DEFAULT true,
  sandbox_mode BOOLEAN DEFAULT false,
  sender_name VARCHAR(20) DEFAULT 'JUA_AUTOS',
  otp_expiry_minutes INTEGER DEFAULT 5,
  notify_on_new_order BOOLEAN DEFAULT true,
  notify_on_new_lead BOOLEAN DEFAULT true,
  notify_on_registration BOOLEAN DEFAULT true,
  admin_phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for sms_logs (admin only)
CREATE POLICY "Admins can view SMS logs" ON public.sms_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert SMS logs" ON public.sms_logs
  FOR INSERT WITH CHECK (true);

-- RLS policies for sms_settings (admin only)
CREATE POLICY "Admins can view SMS settings" ON public.sms_settings
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update SMS settings" ON public.sms_settings
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert SMS settings" ON public.sms_settings
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.sms_settings (sms_enabled, sandbox_mode, sender_name)
VALUES (true, false, 'JUA_AUTOS');

-- Create indexes for performance
CREATE INDEX idx_sms_logs_phone ON public.sms_logs(phone);
CREATE INDEX idx_sms_logs_status ON public.sms_logs(status);
CREATE INDEX idx_sms_logs_created_at ON public.sms_logs(created_at DESC);