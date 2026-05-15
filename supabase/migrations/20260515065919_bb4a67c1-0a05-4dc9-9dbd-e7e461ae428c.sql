
-- Fix unrestricted UPDATE on payments
DROP POLICY IF EXISTS "System can update payments" ON public.payments;
CREATE POLICY "Admins can update payments" ON public.payments
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix unrestricted UPDATE on user_otps (restrict to owner; edge functions use service_role and bypass RLS)
DROP POLICY IF EXISTS "System can update OTPs" ON public.user_otps;
CREATE POLICY "Users can update own OTPs" ON public.user_otps
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix INSERT identity forging on reaction tables: require user_id = auth.uid() (or NULL for anonymous reactions)
DROP POLICY IF EXISTS "Anyone can insert likes" ON public.car_likes;
CREATE POLICY "Users insert own likes" ON public.car_likes
  FOR INSERT TO public
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can insert ratings" ON public.car_ratings;
CREATE POLICY "Users insert own ratings" ON public.car_ratings
  FOR INSERT TO public
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can insert comments" ON public.car_comments;
CREATE POLICY "Users insert own comments" ON public.car_comments
  FOR INSERT TO public
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can insert content likes" ON public.content_likes;
CREATE POLICY "Users insert own content likes" ON public.content_likes
  FOR INSERT TO public
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can insert content comments" ON public.content_comments;
CREATE POLICY "Users insert own content comments" ON public.content_comments
  FOR INSERT TO public
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- Fix unrestricted UPDATE on payment_ipn_logs
DROP POLICY IF EXISTS "System can update IPN logs" ON public.payment_ipn_logs;
CREATE POLICY "Admins can update IPN logs" ON public.payment_ipn_logs
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix system_jobs broad policy
DROP POLICY IF EXISTS "System can manage jobs" ON public.system_jobs;
CREATE POLICY "Admins manage jobs" ON public.system_jobs
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Restrict stock_sequence SELECT to authenticated staff/admin
DROP POLICY IF EXISTS "Anyone can view stock sequence" ON public.stock_sequence;
CREATE POLICY "Staff and admins can view stock sequence" ON public.stock_sequence
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'));
