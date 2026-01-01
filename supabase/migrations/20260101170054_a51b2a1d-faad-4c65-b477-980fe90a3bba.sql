-- Create asset_finance_applications table
CREATE TABLE public.asset_finance_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Personal Details
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  id_number TEXT NOT NULL,
  kra_pin TEXT NOT NULL,
  date_of_birth DATE,
  county_town TEXT,
  
  -- Employment/Business Details
  employment_type TEXT NOT NULL CHECK (employment_type IN ('salaried', 'business')),
  employer_or_business TEXT,
  job_title TEXT,
  monthly_income NUMERIC,
  employment_duration TEXT,
  business_type TEXT,
  years_in_operation INTEGER,
  
  -- Vehicle Details
  vehicle_name TEXT,
  vehicle_id UUID REFERENCES public.cars(id) ON DELETE SET NULL,
  vehicle_price NUMERIC,
  deposit_amount NUMERIC DEFAULT 0,
  finance_amount NUMERIC,
  repayment_period INTEGER DEFAULT 36, -- months
  
  -- Status and Admin
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'cancelled')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create application_documents table
CREATE TABLE public.application_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.asset_finance_applications(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('national_id', 'kra_pin', 'bank_statements', 'payslips', 'mpesa_statements', 'other')),
  file_path TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for finance documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('finance-documents', 'finance-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.asset_finance_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for asset_finance_applications
CREATE POLICY "Anyone can create applications"
ON public.asset_finance_applications
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view own applications"
ON public.asset_finance_applications
FOR SELECT
USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update own pending applications"
ON public.asset_finance_applications
FOR UPDATE
USING ((auth.uid() = user_id AND status = 'pending') OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete applications"
ON public.asset_finance_applications
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for application_documents
CREATE POLICY "Users can upload documents to own applications"
ON public.application_documents
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.asset_finance_applications
    WHERE id = application_id AND (user_id = auth.uid() OR user_id IS NULL)
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can view documents for own applications"
ON public.application_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.asset_finance_applications
    WHERE id = application_id AND (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Admins can delete documents"
ON public.application_documents
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for finance-documents bucket
CREATE POLICY "Users can upload finance documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'finance-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view own finance documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'finance-documents' AND (auth.role() = 'authenticated'));

CREATE POLICY "Admins can delete finance documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'finance-documents' AND has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_asset_finance_applications_updated_at
BEFORE UPDATE ON public.asset_finance_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();