-- Create system_logs table
CREATE TABLE IF NOT EXISTS public.system_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Create system_jobs table for cron monitoring
CREATE TABLE IF NOT EXISTS public.system_jobs (
  job_name text PRIMARY KEY,
  last_run timestamp with time zone,
  status text NOT NULL DEFAULT 'pending',
  execution_time integer,
  error_message text,
  next_run timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create system_health_metrics table
CREATE TABLE IF NOT EXISTS public.system_health_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  metric_name text NOT NULL,
  metric_value numeric,
  status text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Create failed_logins table (if not exists)
CREATE TABLE IF NOT EXISTS public.failed_logins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  email text,
  ip text,
  reason text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failed_logins ENABLE ROW LEVEL SECURITY;

-- Create policies for system_logs
CREATE POLICY "Admins can view system logs" 
ON public.system_logs FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert logs" 
ON public.system_logs FOR INSERT 
WITH CHECK (true);

-- Create policies for system_jobs
CREATE POLICY "Admins can view system jobs" 
ON public.system_jobs FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can manage jobs" 
ON public.system_jobs FOR ALL 
USING (true);

-- Create policies for system_health_metrics
CREATE POLICY "Admins can view health metrics" 
ON public.system_health_metrics FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert metrics" 
ON public.system_health_metrics FOR INSERT 
WITH CHECK (true);

-- Create policies for failed_logins
CREATE POLICY "Admins can view failed logins" 
ON public.failed_logins FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert failed logins" 
ON public.failed_logins FOR INSERT 
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_type ON public.system_logs(type);
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_category ON public.system_health_metrics(category);
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_created_at ON public.system_health_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_failed_logins_created_at ON public.failed_logins(created_at DESC);

-- Create trigger for system_jobs updated_at
CREATE TRIGGER update_system_jobs_updated_at
BEFORE UPDATE ON public.system_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();