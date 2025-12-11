-- Admin Notes table for storing admin notes with rich text content
CREATE TABLE public.admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  title text NOT NULL,
  slug text UNIQUE,
  content text NOT NULL,
  excerpt text,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_published boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_admin_notes_created_at ON public.admin_notes (created_at DESC);
CREATE INDEX idx_admin_notes_admin_id ON public.admin_notes (admin_id);

-- RLS Policies
CREATE POLICY "Admins can manage admin_notes"
ON public.admin_notes
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Generated Documents table for storing documentation and reports
CREATE TABLE public.generated_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_by uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('documentation', 'report')),
  title text NOT NULL,
  description text,
  file_url text,
  version text DEFAULT 'v2',
  pages integer,
  word_count integer,
  generated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;

-- Create index
CREATE INDEX idx_generated_documents_type ON public.generated_documents (type);
CREATE INDEX idx_generated_documents_generated_at ON public.generated_documents (generated_at DESC);

-- RLS Policies
CREATE POLICY "Admins can manage generated_documents"
ON public.generated_documents
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updating updated_at on admin_notes
CREATE TRIGGER update_admin_notes_updated_at
BEFORE UPDATE ON public.admin_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();