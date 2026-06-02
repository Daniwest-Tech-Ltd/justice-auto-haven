-- Add kill switch (billing block) fields to system_maintenance
ALTER TABLE public.system_maintenance
  ADD COLUMN IF NOT EXISTS kill_switch_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS kill_switch_until timestamptz,
  ADD COLUMN IF NOT EXISTS kill_switch_activated_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS kill_switch_activated_at timestamptz,
  ADD COLUMN IF NOT EXISTS billing_total_usd numeric DEFAULT 96.15,
  ADD COLUMN IF NOT EXISTS billing_vercel_usd numeric DEFAULT 61.51,
  ADD COLUMN IF NOT EXISTS billing_render_usd numeric DEFAULT 34.64,
  ADD COLUMN IF NOT EXISTS billing_resend_usd numeric DEFAULT 25.00,
  ADD COLUMN IF NOT EXISTS billing_supabase_usd numeric DEFAULT 25.00,
  ADD COLUMN IF NOT EXISTS billing_due_date date DEFAULT '2026-06-14';

-- Ensure baseline row exists
INSERT INTO public.system_maintenance (is_active, start_time, end_time, message)
SELECT false, now(), now() + interval '1 day', 'System under maintenance.'
WHERE NOT EXISTS (SELECT 1 FROM public.system_maintenance);

GRANT SELECT ON public.system_maintenance TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_maintenance TO authenticated;
GRANT ALL ON public.system_maintenance TO service_role;