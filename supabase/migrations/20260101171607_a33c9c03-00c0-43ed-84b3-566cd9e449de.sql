-- Create email_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID REFERENCES public.asset_finance_applications(id) ON DELETE SET NULL,
    email_type TEXT NOT NULL,
    recipient TEXT NOT NULL,
    subject TEXT,
    body TEXT,
    status TEXT DEFAULT 'sent',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view email logs"
ON public.email_logs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "System can insert email logs"
ON public.email_logs FOR INSERT
WITH CHECK (true);

-- Add index for faster queries
CREATE INDEX idx_email_logs_application ON public.email_logs(application_id);
CREATE INDEX idx_email_logs_sent_at ON public.email_logs(sent_at DESC);