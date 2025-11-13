-- Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  template_type text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create followup_rules table
CREATE TABLE IF NOT EXISTS public.followup_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  days_after integer NOT NULL,
  status_filter text NOT NULL,
  template_id uuid NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT followup_rules_template_id_fkey FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followup_rules ENABLE ROW LEVEL SECURITY;

-- Policies for email_templates
CREATE POLICY "Admins can manage email templates"
ON public.email_templates
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Policies for followup_rules
CREATE POLICY "Admins can manage followup rules"
ON public.followup_rules
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Insert default email templates
INSERT INTO public.email_templates (name, subject, body, template_type) VALUES
('Order Confirmation', 'Your Order Has Been Received', 'Dear {{name}},\n\nThank you for your interest in {{car}}.\n\nWe have received your order and will contact you shortly.\n\nBest regards,\nJustice Ultimate Automobiles', 'order_confirmation'),
('Order Approved', 'Your Order Has Been Approved', 'Dear {{name}},\n\nGreat news! Your order for {{car}} (Price: KES {{price}}) has been approved.\n\nWe will contact you soon to finalize the details.\n\nBest regards,\nJustice Ultimate Automobiles', 'status_update'),
('Follow Up', 'Following Up on Your Order', 'Dear {{name}},\n\nWe wanted to follow up on your interest in {{car}}.\n\nAre you still interested? Please let us know if you have any questions.\n\nBest regards,\nJustice Ultimate Automobiles', 'follow_up')
ON CONFLICT DO NOTHING;