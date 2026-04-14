-- Add new staff roles
ALTER TYPE staff_role ADD VALUE IF NOT EXISTS 'hr_manager';
ALTER TYPE staff_role ADD VALUE IF NOT EXISTS 'hr_staff';
ALTER TYPE staff_role ADD VALUE IF NOT EXISTS 'marketing_staff';

-- Create salary_receipts table
CREATE TABLE IF NOT EXISTS public.salary_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  payroll_id UUID REFERENCES public.payroll(id) ON DELETE SET NULL,
  receipt_number TEXT NOT NULL,
  pay_period TEXT NOT NULL,
  basic_salary NUMERIC NOT NULL DEFAULT 0,
  allowances NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  net_pay NUMERIC NOT NULL DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.salary_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage salary receipts"
ON public.salary_receipts FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view own salary receipts"
ON public.salary_receipts FOR SELECT
TO authenticated
USING (staff_id IN (SELECT id FROM public.staff WHERE user_id = auth.uid()));

-- Create receipt sequence
CREATE TABLE IF NOT EXISTS public.salary_receipt_sequence (
  prefix TEXT PRIMARY KEY DEFAULT 'JUA-SAL',
  last_number INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

INSERT INTO public.salary_receipt_sequence (prefix, last_number) VALUES ('JUA-SAL', 0) ON CONFLICT DO NOTHING;

ALTER TABLE public.salary_receipt_sequence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage salary receipt sequence"
ON public.salary_receipt_sequence FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Function to generate salary receipt number
CREATE OR REPLACE FUNCTION public.generate_salary_receipt_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number INTEGER;
  receipt_no TEXT;
BEGIN
  UPDATE public.salary_receipt_sequence
  SET last_number = last_number + 1, updated_at = now()
  WHERE prefix = 'JUA-SAL'
  RETURNING last_number INTO next_number;
  
  receipt_no := 'JUA-SAL-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(next_number::TEXT, 4, '0');
  RETURN receipt_no;
END;
$$;