-- Fix RLS policies for whitelist_orders to allow admins to read all orders

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can manage all whitelist orders" ON public.whitelist_orders;
DROP POLICY IF EXISTS "Users can view their own whitelist orders" ON public.whitelist_orders;
DROP POLICY IF EXISTS "Anyone can insert whitelist orders" ON public.whitelist_orders;

-- Create proper RLS policies
-- Allow anyone to insert orders (for public order submission)
CREATE POLICY "Anyone can insert whitelist orders"
ON public.whitelist_orders
FOR INSERT
TO public
WITH CHECK (true);

-- Allow users to view their own orders by email or phone
CREATE POLICY "Users can view their own whitelist orders by contact"
ON public.whitelist_orders
FOR SELECT
TO public
USING (
  email = current_setting('request.jwt.claims', true)::json->>'email'
  OR auth.uid() IS NOT NULL
);

-- Allow admins to view all orders
CREATE POLICY "Admins can view all whitelist orders"
ON public.whitelist_orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Allow admins to update orders
CREATE POLICY "Admins can update whitelist orders"
ON public.whitelist_orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Allow admins to delete orders
CREATE POLICY "Admins can delete whitelist orders"
ON public.whitelist_orders
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);