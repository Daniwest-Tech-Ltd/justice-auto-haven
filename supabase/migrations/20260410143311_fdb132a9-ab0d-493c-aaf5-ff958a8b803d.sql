
-- Make car_likes.user_id nullable and add session_id for anonymous tracking
ALTER TABLE public.car_likes ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.car_likes ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Drop old unique constraint and add new one that supports anonymous
ALTER TABLE public.car_likes DROP CONSTRAINT IF EXISTS car_likes_car_id_user_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS car_likes_user_unique ON public.car_likes(car_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS car_likes_session_unique ON public.car_likes(car_id, session_id) WHERE session_id IS NOT NULL AND user_id IS NULL;

-- Add contact fields to car_comments
ALTER TABLE public.car_comments ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.car_comments ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Auth users can insert likes" ON public.car_likes;
DROP POLICY IF EXISTS "Users can update own likes" ON public.car_likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON public.car_likes;
DROP POLICY IF EXISTS "Auth users can insert comments" ON public.car_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.car_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.car_comments;

-- New permissive policies for car_likes
CREATE POLICY "Anyone can insert likes" ON public.car_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update likes" ON public.car_likes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete likes" ON public.car_likes FOR DELETE USING (true);

-- New permissive policies for car_comments
CREATE POLICY "Anyone can insert comments" ON public.car_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update comments" ON public.car_comments FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete comments" ON public.car_comments FOR DELETE USING (true);
