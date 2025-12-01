-- Drop existing type if needed and recreate with all roles
DROP TYPE IF EXISTS staff_role CASCADE;

CREATE TYPE staff_role AS ENUM (
  'operations_manager',
  'sales_manager',
  'sales_rep',
  'rental_manager',
  'rental_staff',
  'tradein_manager',
  'tradein_staff',
  'mechanic',
  'marketing_manager',
  'designer',
  'support_agent',
  'accounts_manager',
  'finance_staff',
  'driver',
  'security_officer',
  'system_admin',
  'it_support'
);

-- Create or update staff table (drop and recreate to ensure clean state)
DROP TABLE IF EXISTS public.staff_attendance CASCADE;
DROP TABLE IF EXISTS public.job_cards CASCADE;
DROP TABLE IF EXISTS public.staff CASCADE;

CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(50),
  role staff_role NOT NULL,
  department VARCHAR(100),
  branch VARCHAR(100),
  avatar_url TEXT,
  status VARCHAR(50) DEFAULT 'active',
  last_login TIMESTAMP,
  created_by UUID,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create job cards table for daily work assignments
CREATE TABLE public.job_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number VARCHAR(50) UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.staff(id) ON DELETE CASCADE,
  created_by UUID,
  vehicle_id UUID REFERENCES public.cars(id),
  priority VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(50) DEFAULT 'pending',
  start_date TIMESTAMP,
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  parts JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Create staff attendance table
CREATE TABLE public.staff_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIMESTAMP,
  check_out TIMESTAMP,
  status VARCHAR(50) DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(staff_id, date)
);

-- Enable RLS
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff table
CREATE POLICY "Admins can manage all staff"
  ON public.staff FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view own profile"
  ON public.staff FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for job_cards
CREATE POLICY "Admins can manage all job cards"
  ON public.job_cards FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view assigned job cards"
  ON public.job_cards FOR SELECT
  USING (assigned_to IN (SELECT id FROM public.staff WHERE user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can update assigned job cards"
  ON public.job_cards FOR UPDATE
  USING (assigned_to IN (SELECT id FROM public.staff WHERE user_id = auth.uid()));

-- RLS Policies for staff_attendance
CREATE POLICY "Admins can manage all attendance"
  ON public.staff_attendance FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view own attendance"
  ON public.staff_attendance FOR SELECT
  USING (staff_id IN (SELECT id FROM public.staff WHERE user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

-- Function to generate job number
CREATE OR REPLACE FUNCTION generate_job_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  job_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(job_number FROM 11) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.job_cards
  WHERE job_number LIKE 'JC-' || TO_CHAR(NOW(), 'YYYYMM') || '-%';
  
  job_num := 'JC-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(next_num::TEXT, 4, '0');
  RETURN job_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate job number
CREATE OR REPLACE FUNCTION set_job_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.job_number IS NULL THEN
    NEW.job_number := generate_job_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_job_number_trigger
  BEFORE INSERT ON public.job_cards
  FOR EACH ROW
  EXECUTE FUNCTION set_job_number();

-- Update timestamp triggers
CREATE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON public.staff
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_cards_updated_at
  BEFORE UPDATE ON public.job_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();