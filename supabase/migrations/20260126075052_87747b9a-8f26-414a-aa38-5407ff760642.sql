-- Add enterprise inventory management columns to cars table
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS purchase_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS promotion_tag text CHECK (promotion_tag IN ('new_arrival', 'hot_deal', 'price_drop', 'clearance', 'reserved', null)),
ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS inquiries_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS test_drives_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS listed_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS reserved_at timestamptz,
ADD COLUMN IF NOT EXISTS reserved_by uuid,
ADD COLUMN IF NOT EXISTS sold_at timestamptz,
ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS publish_scheduled_at timestamptz,
ADD COLUMN IF NOT EXISTS logbook_status text DEFAULT 'pending' CHECK (logbook_status IN ('pending', 'available', 'in_transfer', 'transferred')),
ADD COLUMN IF NOT EXISTS ntsa_status text DEFAULT 'pending' CHECK (ntsa_status IN ('pending', 'cleared', 'in_progress')),
ADD COLUMN IF NOT EXISTS insurance_status text DEFAULT 'none' CHECK (insurance_status IN ('none', 'active', 'expired')),
ADD COLUMN IF NOT EXISTS insurance_expiry date,
ADD COLUMN IF NOT EXISTS inspection_status text DEFAULT 'pending' CHECK (inspection_status IN ('pending', 'passed', 'failed', 'scheduled')),
ADD COLUMN IF NOT EXISTS inspection_date date,
ADD COLUMN IF NOT EXISTS supplier text,
ADD COLUMN IF NOT EXISTS import_type text DEFAULT 'import' CHECK (import_type IN ('import', 'local')),
ADD COLUMN IF NOT EXISTS meta_title text,
ADD COLUMN IF NOT EXISTS meta_description text,
ADD COLUMN IF NOT EXISTS last_price_change timestamptz,
ADD COLUMN IF NOT EXISTS previous_price numeric,
ADD COLUMN IF NOT EXISTS notes text;

-- Update status check to include more lifecycle states
ALTER TABLE public.cars DROP CONSTRAINT IF EXISTS cars_status_check;
ALTER TABLE public.cars ADD CONSTRAINT cars_status_check 
CHECK (status IN ('available', 'sold', 'reserved', 'under_repair', 'pending_inspection', 'awaiting_documents', 'returned', 'cancelled'));

-- Create car activity log for tracking changes
CREATE TABLE IF NOT EXISTS public.car_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid REFERENCES public.cars(id) ON DELETE CASCADE,
  user_id uuid,
  action text NOT NULL,
  field_changed text,
  old_value text,
  new_value text,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create car inquiries table
CREATE TABLE IF NOT EXISTS public.car_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid REFERENCES public.cars(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text NOT NULL,
  message text,
  status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'not_interested', 'converted')),
  assigned_to uuid,
  follow_up_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create test drive bookings table
CREATE TABLE IF NOT EXISTS public.test_drive_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid REFERENCES public.cars(id) ON DELETE CASCADE,
  customer_id uuid,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  scheduled_date date NOT NULL,
  scheduled_time time NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  salesperson_id uuid,
  notes text,
  feedback text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create car expenses table for tracking costs
CREATE TABLE IF NOT EXISTS public.car_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id uuid REFERENCES public.cars(id) ON DELETE CASCADE,
  expense_type text NOT NULL CHECK (expense_type IN ('shipping', 'repair', 'duty', 'registration', 'inspection', 'insurance', 'other')),
  amount numeric NOT NULL,
  description text,
  receipt_url text,
  paid_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.car_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_drive_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.car_expenses ENABLE ROW LEVEL SECURITY;

-- RLS policies for car_activity_logs
CREATE POLICY "Admins can manage car activity logs" ON public.car_activity_logs
FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Staff can view car activity logs" ON public.car_activity_logs
FOR SELECT USING (public.has_role(auth.uid(), 'staff'));

-- RLS policies for car_inquiries
CREATE POLICY "Admins can manage car inquiries" ON public.car_inquiries
FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Staff can manage car inquiries" ON public.car_inquiries
FOR ALL USING (public.has_role(auth.uid(), 'staff'));

-- RLS policies for test_drive_bookings  
CREATE POLICY "Admins can manage test drive bookings" ON public.test_drive_bookings
FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Staff can manage test drive bookings" ON public.test_drive_bookings
FOR ALL USING (public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Customers can view their own bookings" ON public.test_drive_bookings
FOR SELECT USING (auth.uid() = customer_id);

-- RLS policies for car_expenses
CREATE POLICY "Admins can manage car expenses" ON public.car_expenses
FOR ALL USING (public.is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cars_promotion_tag ON public.cars(promotion_tag);
CREATE INDEX IF NOT EXISTS idx_cars_listed_at ON public.cars(listed_at);
CREATE INDEX IF NOT EXISTS idx_cars_logbook_status ON public.cars(logbook_status);
CREATE INDEX IF NOT EXISTS idx_cars_is_published ON public.cars(is_published);
CREATE INDEX IF NOT EXISTS idx_car_inquiries_car_id ON public.car_inquiries(car_id);
CREATE INDEX IF NOT EXISTS idx_car_inquiries_status ON public.car_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_test_drive_bookings_car_id ON public.test_drive_bookings(car_id);
CREATE INDEX IF NOT EXISTS idx_car_expenses_car_id ON public.car_expenses(car_id);

-- Function to log car changes
CREATE OR REPLACE FUNCTION public.log_car_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Log price changes
    IF OLD.price IS DISTINCT FROM NEW.price THEN
      INSERT INTO public.car_activity_logs (car_id, user_id, action, field_changed, old_value, new_value)
      VALUES (NEW.id, auth.uid(), 'price_change', 'price', OLD.price::text, NEW.price::text);
      NEW.previous_price := OLD.price;
      NEW.last_price_change := now();
    END IF;
    
    -- Log status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.car_activity_logs (car_id, user_id, action, field_changed, old_value, new_value)
      VALUES (NEW.id, auth.uid(), 'status_change', 'status', OLD.status, NEW.status);
      
      IF NEW.status = 'sold' THEN
        NEW.sold_at := now();
      ELSIF NEW.status = 'reserved' THEN
        NEW.reserved_at := now();
      END IF;
    END IF;
    
    -- Log featured changes
    IF OLD.is_featured IS DISTINCT FROM NEW.is_featured THEN
      INSERT INTO public.car_activity_logs (car_id, user_id, action, field_changed, old_value, new_value)
      VALUES (NEW.id, auth.uid(), 'featured_change', 'is_featured', OLD.is_featured::text, NEW.is_featured::text);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for car activity logging
DROP TRIGGER IF EXISTS trigger_log_car_activity ON public.cars;
CREATE TRIGGER trigger_log_car_activity
BEFORE UPDATE ON public.cars
FOR EACH ROW
EXECUTE FUNCTION public.log_car_activity();

-- Function to calculate days in stock
CREATE OR REPLACE FUNCTION public.get_days_in_stock(car_listed_at timestamptz)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT EXTRACT(DAY FROM (now() - COALESCE(car_listed_at, now())))::integer;
$$;

-- Function to calculate profit margin
CREATE OR REPLACE FUNCTION public.get_profit_margin(selling_price numeric, purchase_price numeric)
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  SELECT CASE 
    WHEN purchase_price > 0 THEN ROUND(((selling_price - purchase_price) / purchase_price * 100), 2)
    ELSE 0
  END;
$$;