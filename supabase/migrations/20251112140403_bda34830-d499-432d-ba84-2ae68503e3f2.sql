-- Create whitelist_orders table for VIP order submissions
CREATE TABLE IF NOT EXISTS public.whitelist_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id uuid NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  car_make text NOT NULL,
  car_model text NOT NULL,
  car_year integer NOT NULL,
  car_price numeric NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  contact_method text NOT NULL CHECK (contact_method IN ('whatsapp', 'call', 'sms', 'email')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'contacted', 'closed')),
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES auth.users(id),
  admin_notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whitelist_orders ENABLE ROW LEVEL SECURITY;

-- Admin can view and manage all orders
CREATE POLICY "Admins can manage all whitelist orders"
ON public.whitelist_orders
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can create orders (no login required)
CREATE POLICY "Anyone can create whitelist orders"
ON public.whitelist_orders
FOR INSERT
WITH CHECK (true);

-- Users can view their own orders by email (if they want to check)
CREATE POLICY "Users can view orders by email"
ON public.whitelist_orders
FOR SELECT
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_whitelist_orders_status ON public.whitelist_orders(status);
CREATE INDEX idx_whitelist_orders_submitted_at ON public.whitelist_orders(submitted_at DESC);
CREATE INDEX idx_whitelist_orders_car_id ON public.whitelist_orders(car_id);