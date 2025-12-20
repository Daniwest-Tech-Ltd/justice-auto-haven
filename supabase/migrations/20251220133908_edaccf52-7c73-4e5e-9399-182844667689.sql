
-- Add new permissions for the role matrix
INSERT INTO public.permissions (name, category, description) VALUES
('can_login', 'access', 'Can log into the system'),
('manage_users', 'users', 'Can manage users and their accounts'),
('delete_data', 'data', 'Can delete data from the system'),
('system_settings', 'system', 'Can access and modify system settings')
ON CONFLICT (name) DO NOTHING;

-- Clear existing role_permissions to reset
DELETE FROM public.role_permissions;

-- Super Admin gets ALL permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'super_admin'::app_role, id FROM public.permissions;

-- Admin gets: can_login, manage_users (NOT delete_data, NOT system_settings)
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::app_role, id FROM public.permissions 
WHERE name IN ('can_login', 'manage_users', 'view_dashboard', 'view_analytics', 'view_reports', 'manage_inventory', 'manage_orders', 'manage_payments', 'manage_staff', 'manage_rentals', 'manage_crm', 'manage_blogs', 'manage_videos', 'manage_job_cards', 'manage_brands', 'view_messages', 'send_messages', 'view_notifications', 'manage_hr', 'view_payroll');

-- Staff gets: can_login only
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'staff'::app_role, id FROM public.permissions 
WHERE name IN ('can_login', 'view_dashboard', 'view_reports');

-- Customer/User gets: can_login only
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'customer'::app_role, id FROM public.permissions 
WHERE name IN ('can_login');

-- Assign Justice and Daniwest as super_admin
UPDATE public.user_roles 
SET role = 'super_admin'::app_role
WHERE user_id IN (
  SELECT user_id FROM public.profiles 
  WHERE full_name ILIKE '%Justice%' OR full_name ILIKE '%Daniwest%'
);

-- If they don't have roles yet, add them as super_admin
INSERT INTO public.user_roles (user_id, role)
SELECT p.user_id, 'super_admin'::app_role
FROM public.profiles p
WHERE (p.full_name ILIKE '%Justice%' OR p.full_name ILIKE '%Daniwest%')
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Create a function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'super_admin'::app_role
  )
$$;
