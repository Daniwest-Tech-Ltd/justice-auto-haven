
-- Add is_draft column to cars table
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS is_draft boolean DEFAULT false;

-- Create sales_prospects table
CREATE TABLE IF NOT EXISTS public.sales_prospects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  interest TEXT,
  source TEXT DEFAULT 'manual',
  status TEXT DEFAULT 'new',
  notes TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  reminder_date TIMESTAMPTZ,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view prospects"
  ON public.sales_prospects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert prospects"
  ON public.sales_prospects FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update prospects"
  ON public.sales_prospects FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete prospects"
  ON public.sales_prospects FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_sales_prospects_updated_at
  BEFORE UPDATE ON public.sales_prospects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
