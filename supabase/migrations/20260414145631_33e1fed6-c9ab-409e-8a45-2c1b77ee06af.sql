
-- Create customer_orders table
CREATE TABLE public.customer_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  car_id UUID REFERENCES public.cars(id),
  car_make TEXT,
  car_model TEXT,
  car_year INTEGER,
  car_price NUMERIC,
  car_color TEXT,
  car_vin TEXT,
  assigned_sales_agent UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'order_placed' CHECK (status IN (
    'order_placed', 'car_confirmed', 'payment_pending', 'payment_submitted',
    'payment_approved', 'logbook_processing', 'ready_for_handover', 'completed', 'cancelled'
  )),
  payment_amount NUMERIC,
  payment_method TEXT,
  payment_reference TEXT,
  payment_receipt_url TEXT,
  invoice_number TEXT,
  receipt_number TEXT,
  hr_approved_at TIMESTAMPTZ,
  hr_approved_by UUID REFERENCES auth.users(id),
  logbook_started_at TIMESTAMPTZ,
  logbook_completed_at TIMESTAMPTZ,
  handover_date TIMESTAMPTZ,
  handover_location TEXT,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  customer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers view own orders" ON public.customer_orders
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Customers create own orders" ON public.customer_orders
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Admins view all orders" ON public.customer_orders
  FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Admins update all orders" ON public.customer_orders
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Admins delete orders" ON public.customer_orders
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_customer_orders_updated_at
  BEFORE UPDATE ON public.customer_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Order documents table
CREATE TABLE public.order_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.customer_orders(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  notes TEXT,
  requested_by UUID REFERENCES auth.users(id),
  is_request BOOLEAN DEFAULT false,
  request_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own order docs" ON public.order_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.customer_orders WHERE id = order_id AND customer_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'staff')
  );

CREATE POLICY "Users upload order docs" ON public.order_documents
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.customer_orders WHERE id = order_id AND customer_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'staff')
  );

CREATE POLICY "Admins delete order docs" ON public.order_documents
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Order messages table
CREATE TABLE public.order_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.customer_orders(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  attachment_url TEXT,
  attachment_name TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own order messages" ON public.order_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.customer_orders WHERE id = order_id AND customer_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'staff')
  );

CREATE POLICY "Users send order messages" ON public.order_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.customer_orders WHERE id = order_id AND customer_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'staff')
  );

CREATE POLICY "Users mark messages read" ON public.order_messages
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.customer_orders WHERE id = order_id AND customer_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'staff')
  );

-- Order tracking log for timeline
CREATE TABLE public.order_tracking_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.customer_orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  message TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_tracking_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own order tracking" ON public.order_tracking_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.customer_orders WHERE id = order_id AND customer_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'staff')
  );

CREATE POLICY "Staff insert tracking" ON public.order_tracking_log
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'staff')
    OR auth.uid() = updated_by
  );

-- Storage bucket for order documents
INSERT INTO storage.buckets (id, name, public) VALUES ('order-documents', 'order-documents', false);

CREATE POLICY "Users upload order files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'order-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users view order files" ON storage.objects
  FOR SELECT USING (bucket_id = 'order-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users download order files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'order-documents' AND auth.role() = 'authenticated');

-- Order invoice sequence
CREATE TABLE IF NOT EXISTS public.order_invoice_sequence (
  prefix TEXT PRIMARY KEY DEFAULT 'JUA-ORD',
  last_number INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.order_invoice_sequence (prefix, last_number) VALUES ('JUA-ORD', 0);

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number INTEGER;
  order_no TEXT;
BEGIN
  UPDATE public.order_invoice_sequence
  SET last_number = last_number + 1, updated_at = now()
  WHERE prefix = 'JUA-ORD'
  RETURNING last_number INTO next_number;
  
  order_no := 'JUA-ORD-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(next_number::TEXT, 4, '0');
  RETURN order_no;
END;
$$;
