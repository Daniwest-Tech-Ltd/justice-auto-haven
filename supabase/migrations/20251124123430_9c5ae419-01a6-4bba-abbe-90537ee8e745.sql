-- Create vehicle_views table to track analytics
CREATE TABLE IF NOT EXISTS public.vehicle_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicle_views ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can record views
CREATE POLICY "Anyone can record vehicle views"
  ON public.vehicle_views
  FOR INSERT
  WITH CHECK (true);

-- Policy: Admins can view all analytics
CREATE POLICY "Admins can view all vehicle views"
  ON public.vehicle_views
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Anyone can view aggregated analytics (we'll handle this in code)
CREATE POLICY "Public can view vehicle analytics"
  ON public.vehicle_views
  FOR SELECT
  USING (true);

-- Create index for better query performance
CREATE INDEX idx_vehicle_views_car_id ON public.vehicle_views(car_id);
CREATE INDEX idx_vehicle_views_viewed_at ON public.vehicle_views(viewed_at);

-- Add to realtime
ALTER TABLE public.vehicle_views REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_views;