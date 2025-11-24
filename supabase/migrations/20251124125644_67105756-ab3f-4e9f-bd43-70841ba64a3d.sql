-- Create rental_cars table
CREATE TABLE IF NOT EXISTS public.rental_cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  description TEXT,
  price_per_hour NUMERIC(10,2) NOT NULL,
  price_per_day NUMERIC(10,2),
  available BOOLEAN DEFAULT true,
  stock_id TEXT,
  color TEXT,
  transmission TEXT,
  fuel_type TEXT,
  mileage TEXT,
  main_images JSONB DEFAULT '[]'::jsonb,
  additional_images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create rental_bookings table
CREATE TABLE IF NOT EXISTS public.rental_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_car_id UUID NOT NULL REFERENCES public.rental_cars(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  hours INTEGER,
  days INTEGER,
  total_price NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Update trade_ins table to match requirements
ALTER TABLE public.trade_ins
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS car_year INTEGER,
ADD COLUMN IF NOT EXISTS estimated_value NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('rental-car-images', 'rental-car-images', true),
  ('trade-in-images', 'trade-in-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for rental_cars
ALTER TABLE public.rental_cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available rental cars"
ON public.rental_cars FOR SELECT
USING (available = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage rental cars"
ON public.rental_cars FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for rental_bookings
ALTER TABLE public.rental_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookings"
ON public.rental_bookings FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create bookings"
ON public.rental_bookings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all bookings"
ON public.rental_bookings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for rental-car-images
CREATE POLICY "Anyone can view rental car images"
ON storage.objects FOR SELECT
USING (bucket_id = 'rental-car-images');

CREATE POLICY "Admins can upload rental car images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'rental-car-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update rental car images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'rental-car-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete rental car images"
ON storage.objects FOR DELETE
USING (bucket_id = 'rental-car-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for trade-in-images
CREATE POLICY "Admins can view trade-in images"
ON storage.objects FOR SELECT
USING (bucket_id = 'trade-in-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can upload trade-in images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'trade-in-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their trade-in images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'trade-in-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rental_cars_available ON public.rental_cars(available);
CREATE INDEX IF NOT EXISTS idx_rental_bookings_user ON public.rental_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_rental_bookings_car ON public.rental_bookings(rental_car_id);
CREATE INDEX IF NOT EXISTS idx_rental_bookings_status ON public.rental_bookings(status);

-- Create updated_at trigger for rental tables
CREATE TRIGGER update_rental_cars_updated_at
BEFORE UPDATE ON public.rental_cars
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rental_bookings_updated_at
BEFORE UPDATE ON public.rental_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();