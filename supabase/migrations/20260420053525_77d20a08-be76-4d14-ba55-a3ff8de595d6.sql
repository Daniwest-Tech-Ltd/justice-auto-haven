
-- Create storage bucket for company documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-documents', 'company-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create company_documents table
CREATE TABLE IF NOT EXISTS public.company_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_type TEXT NOT NULL, -- 'certificate', 'profile', 'license', 'permit', etc.
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  certificate_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  issuing_authority TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'expired', 'archived'
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;

-- Public can view active documents (visible on frontend)
CREATE POLICY "Anyone can view active company documents"
ON public.company_documents
FOR SELECT
USING (status = 'active');

-- Admins can manage all documents
CREATE POLICY "Admins can insert company documents"
ON public.company_documents
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update company documents"
ON public.company_documents
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete company documents"
ON public.company_documents
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all company documents"
ON public.company_documents
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to auto-update updated_at
CREATE TRIGGER update_company_documents_updated_at
BEFORE UPDATE ON public.company_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for company-documents bucket
CREATE POLICY "Public can view company document files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'company-documents');

CREATE POLICY "Admins can upload company document files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update company document files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'company-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete company document files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'company-documents' AND public.has_role(auth.uid(), 'admin'));

-- Seed initial certificate record (using existing static asset URL placeholder)
INSERT INTO public.company_documents (
  document_type, title, description, file_url, file_name,
  certificate_number, issue_date, issuing_authority, status, is_featured, display_order
) VALUES (
  'certificate',
  'Certificate of Professional Qualification',
  'Justice Ultimate Automobiles is formally recognized as a Qualified Automotive Industry Partner, authorized to operate as a professional automotive dealer in Kenya.',
  '/src/assets/company-certificate.png',
  'company-certificate.png',
  'ULT-KE-2025-2581',
  '2025-11-21',
  'HARAMBEE - Republic of Kenya',
  'active',
  true,
  1
) ON CONFLICT DO NOTHING;
