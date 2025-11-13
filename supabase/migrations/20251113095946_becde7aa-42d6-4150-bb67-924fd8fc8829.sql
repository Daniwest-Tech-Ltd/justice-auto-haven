-- Drop ALL existing policies on whitelist_orders
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'whitelist_orders' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.whitelist_orders';
    END LOOP;
END $$;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = $1
    AND user_roles.role = 'admin'
  );
$$;

-- Enable RLS
ALTER TABLE public.whitelist_orders ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view all orders
CREATE POLICY "Admins can view all orders"
ON public.whitelist_orders
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Policy for admins to insert orders
CREATE POLICY "Admins can insert orders"
ON public.whitelist_orders
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Policy for admins to update orders
CREATE POLICY "Admins can update orders"
ON public.whitelist_orders
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Policy for admins to delete orders
CREATE POLICY "Admins can delete orders"
ON public.whitelist_orders
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Policy for anyone to submit orders (for customer submissions)
CREATE POLICY "Public can submit orders"
ON public.whitelist_orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);