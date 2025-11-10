-- Create enum for staff roles
CREATE TYPE staff_role AS ENUM ('ceo', 'manager', 'sales_executive', 'technician', 'accountant', 'hr_manager', 'receptionist', 'driver');

-- Create staff table for HR system
CREATE TABLE public.staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  staff_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  department TEXT NOT NULL,
  position staff_role NOT NULL,
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  salary NUMERIC,
  status TEXT NOT NULL DEFAULT 'active',
  emergency_contact TEXT,
  address TEXT,
  photo_url TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payroll table
CREATE TABLE public.payroll (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  basic_salary NUMERIC NOT NULL,
  allowances NUMERIC DEFAULT 0,
  overtime_pay NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  net_pay NUMERIC NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  clock_in TIMESTAMP WITH TIME ZONE,
  clock_out TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(staff_id, date)
);

-- Create CRM leads table
CREATE TABLE public.crm_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  source TEXT,
  interest TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  assigned_to UUID REFERENCES public.staff(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create CRM interactions table
CREATE TABLE public.crm_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  interaction_type TEXT NOT NULL,
  notes TEXT,
  next_follow_up DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff
CREATE POLICY "Admins can manage all staff" ON public.staff
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view their own record" ON public.staff
  FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for payroll
CREATE POLICY "Admins can manage payroll" ON public.payroll
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view their own payroll" ON public.payroll
  FOR SELECT USING (
    staff_id IN (SELECT id FROM public.staff WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS Policies for attendance
CREATE POLICY "Admins can manage attendance" ON public.attendance
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view their own attendance" ON public.attendance
  FOR SELECT USING (
    staff_id IN (SELECT id FROM public.staff WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS Policies for CRM
CREATE POLICY "Admins can manage CRM leads" ON public.crm_leads
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage CRM interactions" ON public.crm_interactions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON public.staff
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_leads_updated_at
  BEFORE UPDATE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();