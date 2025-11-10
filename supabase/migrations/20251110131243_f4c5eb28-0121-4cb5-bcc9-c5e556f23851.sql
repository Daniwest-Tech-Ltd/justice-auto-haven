-- Schedule smart notifications check every hour during business hours (8am-4pm)
SELECT cron.schedule(
  'send-smart-notifications-hourly',
  '0 8-16 * * *',
  $$
  SELECT net.http_post(
    url:='https://ccsfhblxkmyqdqqcgitt.supabase.co/functions/v1/send-smart-notifications',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjc2ZoYmx4a215cWRxcWNnaXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MzAzMjAsImV4cCI6MjA3ODIwNjMyMH0.RaeiO3GheEdNZNT6iA_DfiIg5RvGh_HLrlr9YfNg6vA"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
