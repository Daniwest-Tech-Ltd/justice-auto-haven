-- Create trigger to auto-generate stock_id on insert (only if not provided)
CREATE OR REPLACE FUNCTION public.auto_assign_stock_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Only generate if stock_id is null or empty
  IF NEW.stock_id IS NULL OR NEW.stock_id = '' THEN
    -- Lock and get next number atomically
    UPDATE public.stock_sequence
    SET last_number = last_number + 1, updated_at = now()
    WHERE prefix = 'JUA-KEN'
    RETURNING last_number INTO next_number;
    
    -- If no row was updated, initialize the sequence
    IF next_number IS NULL THEN
      INSERT INTO public.stock_sequence (prefix, last_number, updated_at)
      VALUES ('JUA-KEN', 1, now())
      ON CONFLICT (prefix) DO UPDATE SET last_number = stock_sequence.last_number + 1
      RETURNING last_number INTO next_number;
    END IF;
    
    -- Assign the generated stock_id
    NEW.stock_id := 'JUA-KEN-' || LPAD(next_number::TEXT, 3, '0');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger (drop if exists first)
DROP TRIGGER IF EXISTS trigger_auto_stock_id ON public.cars;

CREATE TRIGGER trigger_auto_stock_id
  BEFORE INSERT ON public.cars
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_stock_id();