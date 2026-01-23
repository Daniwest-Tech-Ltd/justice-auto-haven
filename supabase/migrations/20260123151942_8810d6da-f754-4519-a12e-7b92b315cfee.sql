-- Add indexes to optimize car search and filtering
CREATE INDEX IF NOT EXISTS idx_cars_make ON public.cars (make);
CREATE INDEX IF NOT EXISTS idx_cars_model ON public.cars (model);
CREATE INDEX IF NOT EXISTS idx_cars_stock_id ON public.cars (stock_id);
CREATE INDEX IF NOT EXISTS idx_cars_transmission ON public.cars (transmission);
CREATE INDEX IF NOT EXISTS idx_cars_fuel_type ON public.cars (fuel_type);
CREATE INDEX IF NOT EXISTS idx_cars_color ON public.cars (color);
CREATE INDEX IF NOT EXISTS idx_cars_year ON public.cars (year);
CREATE INDEX IF NOT EXISTS idx_cars_status ON public.cars (status);
CREATE INDEX IF NOT EXISTS idx_cars_created_at ON public.cars (created_at DESC);

-- Full text search index for cars (combines multiple text fields)
CREATE INDEX IF NOT EXISTS idx_cars_search ON public.cars USING gin(
  to_tsvector('english', coalesce(make, '') || ' ' || coalesce(model, '') || ' ' || coalesce(stock_id, '') || ' ' || coalesce(color, ''))
);

-- Add indexes to optimize customer/profile search
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles (full_name);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles (phone);
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON public.profiles (is_online);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles (last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles (created_at DESC);

-- Full text search index for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_search ON public.profiles USING gin(
  to_tsvector('english', coalesce(full_name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(phone, ''))
);