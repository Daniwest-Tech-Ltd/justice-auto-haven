-- Create backup_settings table for configuration
CREATE TABLE public.backup_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auto_backup_enabled boolean DEFAULT true,
  backup_frequency text DEFAULT 'daily',
  backup_time time DEFAULT '02:00:00',
  backup_timezone text DEFAULT 'Africa/Nairobi',
  retention_days integer DEFAULT 30,
  backup_database boolean DEFAULT true,
  backup_auth_users boolean DEFAULT true,
  backup_storage boolean DEFAULT true,
  last_backup_at timestamp with time zone,
  next_scheduled_backup timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create backup_history table for logs
CREATE TABLE public.backup_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'pending',
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  duration_seconds integer,
  tables_backed_up integer DEFAULT 0,
  rows_backed_up integer DEFAULT 0,
  users_backed_up integer DEFAULT 0,
  files_backed_up integer DEFAULT 0,
  total_size_mb numeric DEFAULT 0,
  error_message text,
  triggered_by uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- Create backup_stats table for real-time metrics
CREATE TABLE public.backup_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_tables integer DEFAULT 0,
  total_rows integer DEFAULT 0,
  total_users integer DEFAULT 0,
  total_files integer DEFAULT 0,
  database_size_mb numeric DEFAULT 0,
  storage_size_mb numeric DEFAULT 0,
  last_successful_backup timestamp with time zone,
  backup_health text DEFAULT 'unknown',
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.backup_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Admin only
CREATE POLICY "Admins can manage backup_settings" ON public.backup_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage backup_history" ON public.backup_history
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage backup_stats" ON public.backup_stats
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings
INSERT INTO public.backup_settings (id) VALUES (gen_random_uuid());

-- Insert initial stats
INSERT INTO public.backup_stats (id) VALUES (gen_random_uuid());