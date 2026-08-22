CREATE TABLE public.sales_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agreement_number TEXT UNIQUE,
  created_by UUID NOT NULL,
  agreement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  seller_name TEXT,
  seller_id_no TEXT,
  seller_address TEXT,
  seller_phone TEXT,
  seller_kra_pin TEXT,
  buyer_name TEXT,
  buyer_id_no TEXT,
  buyer_address TEXT,
  buyer_phone TEXT,
  buyer_kra_pin TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_year INTEGER,
  vehicle_registration TEXT,
  vehicle_vin TEXT,
  vehicle_engine_no TEXT,
  vehicle_body TEXT,
  vehicle_transmission TEXT,
  vehicle_fuel TEXT,
  vehicle_color TEXT,
  vehicle_seats INTEGER,
  vehicle_condition TEXT,
  purchase_price NUMERIC,
  deposit_paid NUMERIC,
  balance_payable NUMERIC,
  payment_method TEXT,
  payment_terms TEXT,
  instalment_count INTEGER,
  instalment_amount NUMERIC,
  condition_accepted BOOLEAN DEFAULT false,
  accessories JSONB DEFAULT '[]'::jsonb,
  other_accessories TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  other_documents TEXT,
  terms_accepted BOOLEAN DEFAULT false,
  seller_signature TEXT,
  buyer_signature TEXT,
  witness_name TEXT,
  witness_signature TEXT,
  pdf_path TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_agreements TO authenticated;
GRANT ALL ON public.sales_agreements TO service_role;

ALTER TABLE public.sales_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and staff can view agreements" ON public.sales_agreements
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
    OR public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'system_administrator')
  );

CREATE POLICY "Admin and staff can create agreements" ON public.sales_agreements
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
    OR public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'system_administrator')
  );

CREATE POLICY "Admin and staff can update agreements" ON public.sales_agreements
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
    OR public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'system_administrator')
  );

CREATE POLICY "Admins can delete agreements" ON public.sales_agreements
  FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'system_administrator')
  );

CREATE TRIGGER update_sales_agreements_updated_at
  BEFORE UPDATE ON public.sales_agreements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Admin and staff can read agreement files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'sales-agreements' AND (
      public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
      OR public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'system_administrator')
    )
  );

CREATE POLICY "Admin and staff can upload agreement files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'sales-agreements' AND (
      public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
      OR public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'system_administrator')
    )
  );

CREATE POLICY "Admin and staff can update agreement files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'sales-agreements' AND (
      public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff')
      OR public.has_role(auth.uid(), 'ceo') OR public.has_role(auth.uid(), 'system_administrator')
    )
  );