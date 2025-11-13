-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Admins can view all whitelist orders" ON public.whitelist_orders;
DROP POLICY IF EXISTS "Admins can update whitelist orders" ON public.whitelist_orders;
DROP POLICY IF EXISTS "Admins can delete whitelist orders" ON public.whitelist_orders;
DROP POLICY IF EXISTS "Users can view orders by email" ON public.whitelist_orders;
DROP POLICY IF EXISTS "Users can view their own whitelist orders by contact" ON public.whitelist_orders;
DROP POLICY IF EXISTS "Anyone can create whitelist orders" ON public.whitelist_orders;
DROP POLICY IF EXISTS "Anyone can insert whitelist orders" ON public.whitelist_orders;

-- Create clean RLS policies for whitelist_orders
CREATE POLICY "Admins can manage all orders"
ON public.whitelist_orders
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can submit orders"
ON public.whitelist_orders
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Users can view their own orders"
ON public.whitelist_orders
FOR SELECT
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);