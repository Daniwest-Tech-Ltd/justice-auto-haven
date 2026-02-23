
-- Remove the unique constraint on stock_id to allow duplicates or nulls
ALTER TABLE public.cars DROP CONSTRAINT IF EXISTS cars_stock_id_key;

-- Ensure stock_id is nullable
ALTER TABLE public.cars ALTER COLUMN stock_id DROP NOT NULL;
