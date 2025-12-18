-- Create payments table for tracking all payment transactions
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.whitelist_orders(id),
  user_id UUID,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'KES',
  payment_method TEXT NOT NULL DEFAULT 'pesapal',
  status TEXT NOT NULL DEFAULT 'pending',
  pesapal_tracking_id TEXT,
  pesapal_merchant_reference TEXT UNIQUE,
  pesapal_order_tracking_id TEXT,
  description TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create payment_ipn_logs table for IPN debugging and audits
CREATE TABLE public.payment_ipn_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID REFERENCES public.payments(id),
  payload JSONB NOT NULL,
  ip_address TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  pesapal_tracking_id TEXT,
  pesapal_notification_type TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_ipn_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for payments
CREATE POLICY "Users can view their own payments" 
ON public.payments FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments" 
ON public.payments FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage payments" 
ON public.payments FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert payments" 
ON public.payments FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update payments" 
ON public.payments FOR UPDATE 
USING (true);

-- RLS policies for payment_ipn_logs
CREATE POLICY "Admins can view IPN logs" 
ON public.payment_ipn_logs FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert IPN logs" 
ON public.payment_ipn_logs FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update IPN logs" 
ON public.payment_ipn_logs FOR UPDATE 
USING (true);

-- Add indexes for performance
CREATE INDEX idx_payments_order_id ON public.payments(order_id);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_pesapal_tracking_id ON public.payments(pesapal_tracking_id);
CREATE INDEX idx_payments_merchant_reference ON public.payments(pesapal_merchant_reference);
CREATE INDEX idx_payment_ipn_logs_payment_id ON public.payment_ipn_logs(payment_id);

-- Trigger to update updated_at
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();