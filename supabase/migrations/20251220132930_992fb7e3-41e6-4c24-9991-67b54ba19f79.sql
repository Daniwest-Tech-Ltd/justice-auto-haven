-- Create permissions table
CREATE TABLE public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  category text DEFAULT 'general',
  created_at timestamp with time zone DEFAULT now()
);

-- Create role_permissions mapping table
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission_id uuid REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (role, permission_id)
);

-- Create admin_logs table for audit trail
CREATE TABLE public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for permissions
CREATE POLICY "Admins can view permissions" ON public.permissions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage permissions" ON public.permissions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for role_permissions
CREATE POLICY "Admins can view role_permissions" ON public.role_permissions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage role_permissions" ON public.role_permissions
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for admin_logs
CREATE POLICY "Admins can view admin_logs" ON public.admin_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert admin_logs" ON public.admin_logs
  FOR INSERT WITH CHECK (true);

-- Insert core permissions
INSERT INTO public.permissions (name, description, category) VALUES
('manage_users', 'Create, edit, delete users', 'users'),
('manage_admins', 'Add or remove admins', 'administration'),
('manage_inventory', 'Manage cars & listings', 'inventory'),
('manage_orders', 'Approve & track orders', 'orders'),
('manage_payments', 'View & verify payments', 'finance'),
('manage_rentals', 'Manage rental bookings', 'rentals'),
('system_settings', 'System & security settings', 'system'),
('view_reports', 'Analytics & reports', 'analytics'),
('audit_logs', 'View system logs', 'security'),
('manage_staff', 'Manage staff members', 'hr'),
('manage_blogs', 'Create & edit blog posts', 'content'),
('manage_messages', 'View & respond to messages', 'communication'),
('manage_crm', 'CRM leads & interactions', 'sales'),
('manage_backups', 'System backups & recovery', 'system'),
('manage_security', 'Security settings & AI', 'security'),
('super_admin', 'Full unrestricted access', 'administration');

-- Give admin role ALL permissions (making them super admins)
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::app_role, p.id
FROM public.permissions p;

-- Create function to check if user has specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = _user_id
      AND (p.name = _permission OR p.name = 'super_admin')
  )
$$;

-- Create function to get all permissions for a user
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id uuid)
RETURNS TABLE(permission_name text, permission_category text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT p.name, p.category
  FROM public.user_roles ur
  JOIN public.role_permissions rp ON ur.role = rp.role
  JOIN public.permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = _user_id
  ORDER BY p.category, p.name
$$;