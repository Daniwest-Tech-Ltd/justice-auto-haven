-- Add month column to cars table
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS month text;

-- Update image structure to support main and additional images
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS main_images jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS additional_images jsonb DEFAULT '[]'::jsonb;

-- Migrate existing images to main_images
UPDATE public.cars 
SET main_images = COALESCE(images, '[]'::jsonb)
WHERE main_images = '[]'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN public.cars.main_images IS 'Up to 8 main vehicle images';
COMMENT ON COLUMN public.cars.additional_images IS 'Up to 4 additional vehicle images';
COMMENT ON COLUMN public.cars.month IS 'Month of manufacture (Jan, Feb, Mar, etc.)';
COMMENT ON COLUMN public.cars.images IS 'Deprecated: Use main_images and additional_images instead';