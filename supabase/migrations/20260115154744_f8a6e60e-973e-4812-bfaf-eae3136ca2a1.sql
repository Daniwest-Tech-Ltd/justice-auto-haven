-- Add available_colors column to cars table
ALTER TABLE public.cars
ADD COLUMN IF NOT EXISTS available_colors TEXT[] DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.cars.available_colors IS 'Array of other colors the same car model is available in (optional)';