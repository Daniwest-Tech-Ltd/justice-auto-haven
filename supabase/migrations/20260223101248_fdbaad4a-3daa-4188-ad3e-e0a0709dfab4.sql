
-- Make 'make', 'model', 'year', 'price' columns have defaults so empty cars can be inserted
ALTER TABLE public.cars ALTER COLUMN make SET DEFAULT '';
ALTER TABLE public.cars ALTER COLUMN model SET DEFAULT '';
ALTER TABLE public.cars ALTER COLUMN price SET DEFAULT 0;
ALTER TABLE public.cars ALTER COLUMN year SET DEFAULT EXTRACT(YEAR FROM now())::integer;
