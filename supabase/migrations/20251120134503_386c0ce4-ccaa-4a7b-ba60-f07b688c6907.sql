-- Create system_maintenance table for tracking maintenance windows
CREATE TABLE IF NOT EXISTS public.system_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT false,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  message text DEFAULT 'System under maintenance. Please check back later.',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_maintenance ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage maintenance
CREATE POLICY "Admins can manage maintenance"
ON public.system_maintenance
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Allow anyone to view active maintenance
CREATE POLICY "Anyone can view maintenance status"
ON public.system_maintenance
FOR SELECT
TO public
USING (true);

-- Create incident_timeline table for forensic data and evidence
CREATE TABLE IF NOT EXISTS public.incident_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES public.security_incidents(id) ON DELETE CASCADE,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  event_type text NOT NULL,
  description text NOT NULL,
  evidence jsonb DEFAULT '{}',
  performed_by uuid REFERENCES auth.users(id),
  forensic_data jsonb DEFAULT '{}',
  is_critical boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.incident_timeline ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage timeline
CREATE POLICY "Admins can manage incident timeline"
ON public.incident_timeline
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_system_maintenance_updated_at
BEFORE UPDATE ON public.system_maintenance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();