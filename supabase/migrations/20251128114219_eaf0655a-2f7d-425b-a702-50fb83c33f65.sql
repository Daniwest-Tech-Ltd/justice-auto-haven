-- Create table for WhatsApp webhook messages
CREATE TABLE IF NOT EXISTS public.whatsapp_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  message_data JSONB NOT NULL,
  from_number TEXT,
  message_type TEXT,
  message_id TEXT,
  timestamp BIGINT
);

-- Enable RLS
ALTER TABLE public.whatsapp_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view webhook logs
CREATE POLICY "Admins can view webhook logs"
ON public.whatsapp_webhook_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created_at 
ON public.whatsapp_webhook_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_from_number 
ON public.whatsapp_webhook_logs(from_number);