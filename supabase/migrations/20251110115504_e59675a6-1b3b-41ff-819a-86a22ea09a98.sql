-- Create wishlist table
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  car_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, car_id)
);

-- Enable RLS
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wishlist
CREATE POLICY "Users can view their own wishlist"
  ON public.wishlist FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can add to their wishlist"
  ON public.wishlist FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can remove from their wishlist"
  ON public.wishlist FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can manage all wishlists"
  ON public.wishlist FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Create comparison table
CREATE TABLE IF NOT EXISTS public.car_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  car_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for comparisons
ALTER TABLE public.car_comparisons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comparisons
CREATE POLICY "Users can view their own comparisons"
  ON public.car_comparisons FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create comparisons"
  ON public.car_comparisons FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their comparisons"
  ON public.car_comparisons FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their comparisons"
  ON public.car_comparisons FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);