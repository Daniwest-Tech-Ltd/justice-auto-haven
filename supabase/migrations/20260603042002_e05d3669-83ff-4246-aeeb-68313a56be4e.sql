
ALTER TABLE public.system_maintenance
  ADD COLUMN IF NOT EXISTS billing_vercel_exceeded_date date DEFAULT '2026-06-03',
  ADD COLUMN IF NOT EXISTS billing_vercel_due_date date DEFAULT '2026-06-17',
  ADD COLUMN IF NOT EXISTS billing_vercel_upgrade_usd numeric DEFAULT 20,
  ADD COLUMN IF NOT EXISTS billing_vercel_past_due boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS billing_vercel_note text DEFAULT 'Hosting & bandwidth will be suspended. Public site, catalogue and customer pages will be unreachable until upgraded.',

  ADD COLUMN IF NOT EXISTS billing_render_exceeded_date date DEFAULT '2026-05-06',
  ADD COLUMN IF NOT EXISTS billing_render_due_date date DEFAULT '2026-06-20',
  ADD COLUMN IF NOT EXISTS billing_render_upgrade_usd numeric DEFAULT 19,
  ADD COLUMN IF NOT EXISTS billing_render_past_due boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS billing_render_note text DEFAULT 'Backend services and cron jobs will stop. Background processors, webhooks and scheduled tasks will not run.',

  ADD COLUMN IF NOT EXISTS billing_resend_exceeded_date date DEFAULT '2026-06-01',
  ADD COLUMN IF NOT EXISTS billing_resend_due_date date DEFAULT '2026-06-15',
  ADD COLUMN IF NOT EXISTS billing_resend_upgrade_usd numeric DEFAULT 20,
  ADD COLUMN IF NOT EXISTS billing_resend_past_due boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS billing_resend_note text DEFAULT 'Email delivery is disabled. OTPs, password resets, receipts and notifications will not be sent until upgraded.',

  ADD COLUMN IF NOT EXISTS billing_supabase_exceeded_date date DEFAULT '2026-06-14',
  ADD COLUMN IF NOT EXISTS billing_supabase_due_date date DEFAULT '2026-06-14',
  ADD COLUMN IF NOT EXISTS billing_supabase_upgrade_usd numeric DEFAULT 25,
  ADD COLUMN IF NOT EXISTS billing_supabase_past_due boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS billing_supabase_note text DEFAULT 'Database, auth and storage will be paused. Logins, orders and all data access will be blocked until the Pro plan is renewed.';
