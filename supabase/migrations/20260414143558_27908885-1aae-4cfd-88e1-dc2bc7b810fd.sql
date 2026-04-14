
-- Sales receipts with approval workflow
CREATE TABLE IF NOT EXISTS public.sales_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID REFERENCES public.cars(id),
  sale_id UUID REFERENCES public.sales(id),
  receipt_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_id_number TEXT,
  car_make TEXT,
  car_model TEXT,
  car_year INTEGER,
  car_stock_id TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  logbook_status TEXT NOT NULL DEFAULT 'processing' CHECK (logbook_status IN ('processing', 'processed', 'pending')),
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,
  receipt_file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.sales_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and staff can manage sales receipts"
  ON public.sales_receipts FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'staff')
  );

CREATE POLICY "Customers can view own receipts"
  ON public.sales_receipts FOR SELECT TO authenticated
  USING (
    customer_email IN (SELECT email FROM public.profiles WHERE user_id = auth.uid())
  );

-- Customer documents storage
CREATE TABLE IF NOT EXISTS public.customer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  document_type TEXT NOT NULL CHECK (document_type IN ('id', 'kra', 'account_statement', 'logbook', 'insurance', 'receipt', 'other')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  car_id UUID REFERENCES public.cars(id),
  car_info TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.customer_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and staff can manage customer documents"
  ON public.customer_documents FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'staff')
  );

-- Invoice reminders
CREATE TABLE IF NOT EXISTS public.invoice_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  reminder_date TIMESTAMPTZ NOT NULL,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  message TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.invoice_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invoice reminders"
  ON public.invoice_reminders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for customer documents
INSERT INTO storage.buckets (id, name, public) VALUES ('customer-documents', 'customer-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can manage customer document files"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'customer-documents' AND (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'staff')
  ));

-- Receipt number sequence for sales receipts
CREATE TABLE IF NOT EXISTS public.sales_receipt_sequence (
  prefix TEXT PRIMARY KEY DEFAULT 'JUA-SRC',
  last_number INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.sales_receipt_sequence (prefix, last_number) VALUES ('JUA-SRC', 0) ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.generate_sales_receipt_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number INTEGER;
  receipt_no TEXT;
BEGIN
  UPDATE public.sales_receipt_sequence
  SET last_number = last_number + 1, updated_at = now()
  WHERE prefix = 'JUA-SRC'
  RETURNING last_number INTO next_number;
  
  receipt_no := 'JUA-SRC-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(next_number::TEXT, 4, '0');
  RETURN receipt_no;
END;
$$;
