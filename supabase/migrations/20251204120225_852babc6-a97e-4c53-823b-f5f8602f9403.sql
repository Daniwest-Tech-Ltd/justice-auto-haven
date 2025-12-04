-- Add country_code column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS country_code text DEFAULT '+254';

-- Update existing records to have the default Kenya code
UPDATE public.profiles 
SET country_code = '+254' 
WHERE country_code IS NULL;