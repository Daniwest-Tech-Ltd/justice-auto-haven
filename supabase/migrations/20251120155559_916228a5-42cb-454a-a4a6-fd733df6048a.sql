-- Create system_health table for current status
CREATE TABLE IF NOT EXISTS public.system_health (
  id text PRIMARY KEY DEFAULT 'system',
  status text NOT NULL,
  latency_ms integer,
  message text,
  suggestions jsonb DEFAULT '[]'::jsonb,
  last_checked timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Create system_health_logs table for historical tracking
CREATE TABLE IF NOT EXISTS public.system_health_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL,
  service_name text NOT NULL,
  details text,
  latency_ms integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_health
CREATE POLICY "Admins can view system health"
  ON public.system_health FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can update health status"
  ON public.system_health FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for system_health_logs
CREATE POLICY "Admins can view health logs"
  ON public.system_health_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert health logs"
  ON public.system_health_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_system_health_logs_created_at 
  ON public.system_health_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_health_logs_service_name 
  ON public.system_health_logs(service_name);

-- Insert initial record
INSERT INTO public.system_health (id, status, message, last_checked)
VALUES ('system', 'unknown', 'Waiting for first health check', now())
ON CONFLICT (id) DO NOTHING;