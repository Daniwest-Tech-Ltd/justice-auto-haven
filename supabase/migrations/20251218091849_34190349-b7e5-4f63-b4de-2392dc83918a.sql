-- Enable required extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create function to run scheduled backup based on frequency
CREATE OR REPLACE FUNCTION public.trigger_scheduled_backup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  backup_settings_record RECORD;
BEGIN
  SELECT * INTO backup_settings_record FROM public.backup_settings LIMIT 1;
  
  IF backup_settings_record.auto_backup_enabled = true THEN
    PERFORM net.http_post(
      url := 'https://ccsfhblxkmyqdqqcgitt.supabase.co/functions/v1/run-backup',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjc2ZoYmx4a215cWRxcWNnaXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MzAzMjAsImV4cCI6MjA3ODIwNjMyMH0.RaeiO3GheEdNZNT6iA_DfiIg5RvGh_HLrlr9YfNg6vA'
      ),
      body := jsonb_build_object('backup_type', 'scheduled')
    );
    
    UPDATE public.backup_settings 
    SET next_scheduled_backup = CASE backup_frequency
      WHEN 'hourly' THEN now() + interval '1 hour'
      WHEN 'daily' THEN now() + interval '1 day'
      WHEN 'weekly' THEN now() + interval '1 week'
      WHEN 'monthly' THEN now() + interval '1 month'
      ELSE now() + interval '1 day'
    END
    WHERE id = backup_settings_record.id;
  END IF;
END;
$$;

-- Create frequency-specific backup functions
CREATE OR REPLACE FUNCTION public.run_hourly_backup()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.backup_settings WHERE auto_backup_enabled = true AND backup_frequency = 'hourly' LIMIT 1) THEN
    PERFORM public.trigger_scheduled_backup();
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.run_daily_backup()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.backup_settings WHERE auto_backup_enabled = true AND backup_frequency = 'daily' LIMIT 1) THEN
    PERFORM public.trigger_scheduled_backup();
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.run_weekly_backup()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.backup_settings WHERE auto_backup_enabled = true AND backup_frequency = 'weekly' LIMIT 1) THEN
    PERFORM public.trigger_scheduled_backup();
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.run_monthly_backup()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.backup_settings WHERE auto_backup_enabled = true AND backup_frequency = 'monthly' LIMIT 1) THEN
    PERFORM public.trigger_scheduled_backup();
  END IF;
END;
$$;

-- Schedule cron jobs
SELECT cron.schedule('hourly-backup', '0 * * * *', 'SELECT public.run_hourly_backup()');
SELECT cron.schedule('daily-backup', '0 23 * * *', 'SELECT public.run_daily_backup()');
SELECT cron.schedule('weekly-backup', '0 23 * * 0', 'SELECT public.run_weekly_backup()');
SELECT cron.schedule('monthly-backup', '0 23 1 * *', 'SELECT public.run_monthly_backup()');