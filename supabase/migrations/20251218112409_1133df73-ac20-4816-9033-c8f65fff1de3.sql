
-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_no TEXT NOT NULL UNIQUE,
  order_id UUID REFERENCES public.whitelist_orders(id),
  customer_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  vat_rate NUMERIC NOT NULL DEFAULT 16,
  vat_amount NUMERIC NOT NULL DEFAULT 0,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  pdf_url TEXT,
  sent_email BOOLEAN DEFAULT false,
  sent_whatsapp BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create receipts table
CREATE TABLE public.receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_no TEXT NOT NULL UNIQUE,
  invoice_id UUID REFERENCES public.invoices(id),
  payment_id UUID REFERENCES public.payments(id),
  customer_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  amount_paid NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  payment_reference TEXT,
  pdf_url TEXT,
  sent_email BOOLEAN DEFAULT false,
  sent_whatsapp BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoice sequence table for auto-numbering
CREATE TABLE public.invoice_sequence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prefix TEXT NOT NULL DEFAULT 'JUA-INV',
  last_number INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create receipt sequence table for auto-numbering
CREATE TABLE public.receipt_sequence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prefix TEXT NOT NULL DEFAULT 'JUA-RCP',
  last_number INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert initial sequence records
INSERT INTO public.invoice_sequence (prefix, last_number) VALUES ('JUA-INV', 0);
INSERT INTO public.receipt_sequence (prefix, last_number) VALUES ('JUA-RCP', 0);

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number INTEGER;
  invoice_no TEXT;
BEGIN
  UPDATE public.invoice_sequence
  SET last_number = last_number + 1, updated_at = now()
  WHERE prefix = 'JUA-INV'
  RETURNING last_number INTO next_number;
  
  invoice_no := 'JUA-INV-' || LPAD(next_number::TEXT, 6, '0');
  RETURN invoice_no;
END;
$$;

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number INTEGER;
  receipt_no TEXT;
BEGIN
  UPDATE public.receipt_sequence
  SET last_number = last_number + 1, updated_at = now()
  WHERE prefix = 'JUA-RCP'
  RETURNING last_number INTO next_number;
  
  receipt_no := 'JUA-RCP-' || LPAD(next_number::TEXT, 6, '0');
  RETURN receipt_no;
END;
$$;

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_sequence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_sequence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
CREATE POLICY "Admins can manage invoices" ON public.invoices
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Customers can view own invoices" ON public.invoices
  FOR SELECT USING (auth.uid() = customer_id);

-- RLS Policies for receipts
CREATE POLICY "Admins can manage receipts" ON public.receipts
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Customers can view own receipts" ON public.receipts
  FOR SELECT USING (auth.uid() = customer_id);

-- RLS Policies for sequences (admin only)
CREATE POLICY "Admins can manage invoice_sequence" ON public.invoice_sequence
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage receipt_sequence" ON public.receipt_sequence
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Add indexes for performance
CREATE INDEX idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX idx_invoices_order_id ON public.invoices(order_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_receipts_invoice_id ON public.receipts(invoice_id);
CREATE INDEX idx_receipts_customer_id ON public.receipts(customer_id);
