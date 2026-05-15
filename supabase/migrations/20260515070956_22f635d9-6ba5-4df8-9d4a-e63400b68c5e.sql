-- Enable pg_stat_statements for performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Create motorbikes table
CREATE TABLE IF NOT EXISTS public.motorbikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  engine_cc INTEGER,
  transmission TEXT,
  fuel_type TEXT DEFAULT 'Petrol',
  color TEXT,
  mileage TEXT,
  condition TEXT DEFAULT 'New',
  description TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  stock_id TEXT UNIQUE,
  status TEXT DEFAULT 'available',
  is_featured BOOLEAN DEFAULT false,
  yard_location TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.motorbikes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view motorbikes"
  ON public.motorbikes FOR SELECT
  USING (true);

CREATE POLICY "Admins and staff can insert motorbikes"
  ON public.motorbikes FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Admins and staff can update motorbikes"
  ON public.motorbikes FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Admins can delete motorbikes"
  ON public.motorbikes FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_motorbikes_updated_at
  BEFORE UPDATE ON public.motorbikes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_motorbikes_status ON public.motorbikes(status);
CREATE INDEX idx_motorbikes_make ON public.motorbikes(make);