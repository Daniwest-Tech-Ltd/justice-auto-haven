-- Create company_settings table
CREATE TABLE IF NOT EXISTS public.company_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name text NOT NULL DEFAULT 'Justice Ultimate Automobiles',
  email text NOT NULL DEFAULT 'info@justiceauto.com',
  phone text NOT NULL DEFAULT '+254 722 827 458',
  location text NOT NULL DEFAULT 'Nairobi, Kenya',
  system_version text NOT NULL DEFAULT '1.0.0',
  environment text NOT NULL DEFAULT 'Production',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view company settings" 
ON public.company_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can update company settings" 
ON public.company_settings 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert company settings" 
ON public.company_settings 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default company settings
INSERT INTO public.company_settings (company_name, email, phone, location, system_version, environment)
VALUES ('Justice Ultimate Automobiles', 'info@justiceauto.com', '+254 722 827 458', 'Nairobi, Kenya', '1.0.0', 'Production')
ON CONFLICT DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_company_settings_updated_at
BEFORE UPDATE ON public.company_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();