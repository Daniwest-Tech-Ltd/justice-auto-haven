-- Drop ALL existing policies on whitelist_orders
DO $$ 
DECLARE 
  pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'whitelist_orders' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.whitelist_orders', pol.policyname);
  END LOOP;
END $$;

-- Create simple, working policies for admins
CREATE POLICY "Admins can view all orders"
ON public.whitelist_orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can insert orders"
ON public.whitelist_orders
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can update orders"
ON public.whitelist_orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete orders"
ON public.whitelist_orders
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow public to insert orders (for customer submissions)
CREATE POLICY "Public can insert orders"
ON public.whitelist_orders
FOR INSERT
WITH CHECK (true);