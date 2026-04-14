
-- Content likes table (for blogs and videos)
CREATE TABLE public.content_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('blog', 'video')),
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Content comments table (for blogs and videos)
CREATE TABLE public.content_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('blog', 'video')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Anonymous',
  comment_text TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  contact_email TEXT,
  contact_phone TEXT,
  parent_id UUID REFERENCES public.content_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for content_likes
CREATE POLICY "Anyone can view content likes" ON public.content_likes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert content likes" ON public.content_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own likes" ON public.content_likes FOR UPDATE USING (
  (user_id = auth.uid()) OR (session_id IS NOT NULL)
);
CREATE POLICY "Users can delete own likes" ON public.content_likes FOR DELETE USING (
  (user_id = auth.uid()) OR (session_id IS NOT NULL)
);

-- RLS policies for content_comments
CREATE POLICY "Anyone can view content comments" ON public.content_comments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert content comments" ON public.content_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own comments" ON public.content_comments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own comments" ON public.content_comments FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all comments" ON public.content_comments FOR ALL USING (public.has_role(auth.uid(), 'admin'));
