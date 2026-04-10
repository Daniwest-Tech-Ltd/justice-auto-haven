
-- Car ratings table
CREATE TABLE public.car_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID REFERENCES public.cars(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique: one rating per user per car, one rating per session per car
CREATE UNIQUE INDEX car_ratings_user_unique ON public.car_ratings(car_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX car_ratings_session_unique ON public.car_ratings(car_id, session_id) WHERE session_id IS NOT NULL AND user_id IS NULL;

ALTER TABLE public.car_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ratings" ON public.car_ratings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert ratings" ON public.car_ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update ratings" ON public.car_ratings FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete ratings" ON public.car_ratings FOR DELETE USING (true);

-- Add parent_id to car_comments for replies
ALTER TABLE public.car_comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.car_comments(id) ON DELETE CASCADE;

-- Index for faster reply lookups
CREATE INDEX IF NOT EXISTS idx_car_comments_parent_id ON public.car_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_car_ratings_car_id ON public.car_ratings(car_id);
