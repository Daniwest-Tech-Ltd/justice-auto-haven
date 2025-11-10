-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily attendance creation at 8:00 AM Monday-Friday
SELECT cron.schedule(
  'create-daily-attendance-weekday',
  '0 8 * * 1-5',
  $$
  SELECT net.http_post(
    url:='https://ccsfhblxkmyqdqqcgitt.supabase.co/functions/v1/create-daily-attendance',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjc2ZoYmx4a215cWRxcWNnaXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MzAzMjAsImV4cCI6MjA3ODIwNjMyMH0.RaeiO3GheEdNZNT6iA_DfiIg5RvGh_HLrlr9YfNg6vA"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Schedule daily attendance creation at 9:00 AM Saturday-Sunday
SELECT cron.schedule(
  'create-daily-attendance-weekend',
  '0 9 * * 0,6',
  $$
  SELECT net.http_post(
    url:='https://ccsfhblxkmyqdqqcgitt.supabase.co/functions/v1/create-daily-attendance',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjc2ZoYmx4a215cWRxcWNnaXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MzAzMjAsImV4cCI6MjA3ODIwNjMyMH0.RaeiO3GheEdNZNT6iA_DfiIg5RvGh_HLrlr9YfNg6vA"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Schedule daily report generation at 4:00 PM every day
SELECT cron.schedule(
  'generate-daily-reports-4pm',
  '0 16 * * *',
  $$
  SELECT net.http_post(
    url:='https://ccsfhblxkmyqdqqcgitt.supabase.co/functions/v1/generate-daily-reports',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjc2ZoYmx4a215cWRxcWNnaXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MzAzMjAsImV4cCI6MjA3ODIwNjMyMH0.RaeiO3GheEdNZNT6iA_DfiIg5RvGh_HLrlr9YfNg6vA"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
