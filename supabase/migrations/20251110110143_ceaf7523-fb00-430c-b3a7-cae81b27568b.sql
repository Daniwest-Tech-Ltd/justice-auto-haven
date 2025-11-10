-- Add category field to videos table
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS category text;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_videos_category ON public.videos(category);
CREATE INDEX IF NOT EXISTS idx_videos_is_published ON public.videos(is_published);