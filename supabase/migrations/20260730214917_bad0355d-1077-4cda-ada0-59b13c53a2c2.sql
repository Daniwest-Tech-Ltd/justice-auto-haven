CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.cleanup_old_system_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  m int := 0; l int := 0; s int := 0; n int := 0; a int := 0; c int := 0;
BEGIN
  DELETE FROM public.system_health_metrics WHERE created_at < now() - interval '24 hours';
  GET DIAGNOSTICS m = ROW_COUNT;

  DELETE FROM public.system_health_logs WHERE created_at < now() - interval '24 hours';
  GET DIAGNOSTICS l = ROW_COUNT;

  DELETE FROM public.system_logs WHERE created_at < now() - interval '24 hours';
  GET DIAGNOSTICS s = ROW_COUNT;

  DELETE FROM public.notifications
  WHERE (is_read = true AND created_at < now() - interval '24 hours')
     OR created_at < now() - interval '3 days';
  GET DIAGNOSTICS n = ROW_COUNT;

  DELETE FROM public.activity_logs WHERE created_at < now() - interval '24 hours';
  GET DIAGNOSTICS a = ROW_COUNT;

  BEGIN
    DELETE FROM cron.job_run_details WHERE end_time < now() - interval '24 hours';
    GET DIAGNOSTICS c = ROW_COUNT;
  EXCEPTION WHEN OTHERS THEN
    c := -1;
  END;

  RETURN jsonb_build_object(
    'system_health_metrics', m,
    'system_health_logs', l,
    'system_logs', s,
    'notifications', n,
    'activity_logs', a,
    'cron_job_run_details', c,
    'ran_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_old_system_data() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_system_data() TO service_role;

SELECT cron.unschedule('cleanup-old-system-data')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-old-system-data');

SELECT cron.schedule(
  'cleanup-old-system-data',
  '0 * * * *',
  $$ SELECT public.cleanup_old_system_data(); $$
);