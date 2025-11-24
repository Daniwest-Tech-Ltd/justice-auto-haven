-- Add indexes to cars table for faster filtering and searching
-- These indexes will significantly improve query performance for the catalogue page

-- Index for brand/make filtering
CREATE INDEX IF NOT EXISTS idx_cars_make ON public.cars(make);

-- Index for year filtering
CREATE INDEX IF NOT EXISTS idx_cars_year ON public.cars(year);

-- Index for fuel type filtering  
CREATE INDEX IF NOT EXISTS idx_cars_fuel_type ON public.cars(fuel_type);

-- Index for status/availability filtering
CREATE INDEX IF NOT EXISTS idx_cars_status ON public.cars(status);

-- Index for price range filtering
CREATE INDEX IF NOT EXISTS idx_cars_price ON public.cars(price);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_cars_make_year_status ON public.cars(make, year, status);

-- Index for ordering by created_at (used in default listing)
CREATE INDEX IF NOT EXISTS idx_cars_created_at ON public.cars(created_at DESC);

-- Full-text search index for make and model
CREATE INDEX IF NOT EXISTS idx_cars_make_model_search ON public.cars 
USING gin(to_tsvector('english', make || ' ' || model));