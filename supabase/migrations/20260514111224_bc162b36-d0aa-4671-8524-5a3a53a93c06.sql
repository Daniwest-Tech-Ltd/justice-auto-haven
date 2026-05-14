
-- ============================================================
-- SECURITY HARDENING MIGRATION
-- ============================================================

-- 1) PROFILES: restrict SELECT to self + admin/staff
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins and staff can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

-- 2) USER_ROLES: drop blanket read policy
DROP POLICY IF EXISTS "Anyone can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated can view roles" ON public.user_roles;

-- 3) CARS: restrict sensitive columns from public via column privileges
REVOKE SELECT (purchase_price, supplier, notes) ON public.cars FROM anon, authenticated;
GRANT SELECT (purchase_price, supplier, notes) ON public.cars TO service_role;

-- 4) SALES_PROSPECTS: admin/staff only
DROP POLICY IF EXISTS "Authenticated can select" ON public.sales_prospects;
DROP POLICY IF EXISTS "Authenticated can insert" ON public.sales_prospects;
DROP POLICY IF EXISTS "Authenticated can update" ON public.sales_prospects;
DROP POLICY IF EXISTS "Authenticated can delete" ON public.sales_prospects;
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='sales_prospects'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.sales_prospects', p.policyname);
  END LOOP;
END$$;
CREATE POLICY "Admin and staff full access to prospects"
  ON public.sales_prospects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'staff'));

-- 5) CAR_COMMENTS: ownership-scoped UPDATE/DELETE
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='car_comments' AND cmd IN ('UPDATE','DELETE')
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.car_comments', p.policyname);
  END LOOP;
END$$;
CREATE POLICY "Users update own comments"
  ON public.car_comments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own comments"
  ON public.car_comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins manage comments"
  ON public.car_comments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6) CAR_RATINGS: ownership-scoped UPDATE/DELETE
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='car_ratings' AND cmd IN ('UPDATE','DELETE')
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.car_ratings', p.policyname);
  END LOOP;
END$$;
CREATE POLICY "Users update own ratings"
  ON public.car_ratings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own ratings"
  ON public.car_ratings FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins manage ratings"
  ON public.car_ratings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7) CAR_LIKES: ownership-scoped UPDATE/DELETE
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='car_likes' AND cmd IN ('UPDATE','DELETE')
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.car_likes', p.policyname);
  END LOOP;
END$$;
CREATE POLICY "Users update own likes"
  ON public.car_likes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own likes"
  ON public.car_likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins manage likes"
  ON public.car_likes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8) CONTENT_LIKES: restrict modify to authenticated owner only
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='content_likes' AND cmd IN ('UPDATE','DELETE')
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.content_likes', p.policyname);
  END LOOP;
END$$;
CREATE POLICY "Users update own content likes"
  ON public.content_likes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own content likes"
  ON public.content_likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins manage content likes"
  ON public.content_likes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 9) DAILY_REPORTS: replace CEO-name bypass with role check
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='daily_reports' AND cmd='DELETE'
  LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON public.daily_reports', p.policyname);
  END LOOP;
END$$;
CREATE POLICY "Admins delete daily reports"
  ON public.daily_reports FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 10) Sequences: enable RLS and admin-only
ALTER TABLE IF EXISTS public.order_invoice_sequence ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sales_receipt_sequence ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin only invoice seq" ON public.order_invoice_sequence;
DROP POLICY IF EXISTS "Admin only sales receipt seq" ON public.sales_receipt_sequence;
CREATE POLICY "Admin only invoice seq" ON public.order_invoice_sequence
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin only sales receipt seq" ON public.sales_receipt_sequence
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 11) STORAGE: order-documents — restrict to admin/staff and owner via customer_orders
DROP POLICY IF EXISTS "Users view order files" ON storage.objects;
DROP POLICY IF EXISTS "Users upload order files" ON storage.objects;
DROP POLICY IF EXISTS "Users download order files" ON storage.objects;
DROP POLICY IF EXISTS "Users update order files" ON storage.objects;

CREATE POLICY "Order docs admin staff read"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'order-documents'
    AND (
      public.has_role(auth.uid(),'admin')
      OR public.has_role(auth.uid(),'staff')
      OR EXISTS (
        SELECT 1 FROM public.customer_orders co
        WHERE co.customer_id = auth.uid()
          AND (storage.foldername(name))[1] = co.id::text
      )
    )
  );
CREATE POLICY "Order docs admin staff write"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'order-documents'
    AND (
      public.has_role(auth.uid(),'admin')
      OR public.has_role(auth.uid(),'staff')
      OR EXISTS (
        SELECT 1 FROM public.customer_orders co
        WHERE co.customer_id = auth.uid()
          AND (storage.foldername(name))[1] = co.id::text
      )
    )
  );
CREATE POLICY "Order docs admin staff update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'order-documents'
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'staff'))
  );

-- 12) STORAGE: brand-logos — admin only for write
DROP POLICY IF EXISTS "Authenticated users can upload brand logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update brand logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete brand logos" ON storage.objects;
CREATE POLICY "Admins upload brand logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'brand-logos' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update brand logos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'brand-logos' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete brand logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'brand-logos' AND public.has_role(auth.uid(),'admin'));

-- 13) STORAGE: finance-documents — drop the over-permissive duplicate INSERT
DROP POLICY IF EXISTS "Users can upload finance documents" ON storage.objects;
