-- Update has_role to accept TEXT instead of enum so the JS RPC call works correctly
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
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
      AND (
        role::text = _role
        OR (_role = 'admin' AND role::text = 'super_admin')
      )
  );
$$;