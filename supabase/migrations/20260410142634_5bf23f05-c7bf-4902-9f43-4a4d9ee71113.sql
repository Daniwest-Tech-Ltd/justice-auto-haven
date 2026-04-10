
-- Car likes/dislikes table
CREATE TABLE public.car_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(car_id, user_id)
);

ALTER TABLE public.car_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes" ON public.car_likes FOR SELECT USING (true);
CREATE POLICY "Auth users can insert likes" ON public.car_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own likes" ON public.car_likes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.car_likes FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_car_likes_car_id ON public.car_likes(car_id);
CREATE INDEX idx_car_likes_user_id ON public.car_likes(user_id);

-- Car comments table
CREATE TABLE public.car_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  user_id UUID,
  display_name TEXT NOT NULL DEFAULT 'Anonymous',
  comment_text TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.car_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments" ON public.car_comments FOR SELECT USING (true);
CREATE POLICY "Auth users can insert comments" ON public.car_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own comments" ON public.car_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.car_comments FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_car_comments_car_id ON public.car_comments(car_id);

-- Trigger for updated_at
CREATE TRIGGER update_car_likes_updated_at BEFORE UPDATE ON public.car_likes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_car_comments_updated_at BEFORE UPDATE ON public.car_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
