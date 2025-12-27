-- Reset the stock sequence to the next number after the highest existing stock ID
UPDATE public.stock_sequence 
SET last_number = 867, updated_at = now()
WHERE prefix = 'JUA-KEN';

-- Drop and recreate the generate_stock_id function to ensure proper formatting
CREATE OR REPLACE FUNCTION public.generate_stock_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  next_number INTEGER;
  stock_id TEXT;
BEGIN
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
  
  -- Format as JUA-KEN-XXX (3 digits minimum, but can grow)
  stock_id := 'JUA-KEN-' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN stock_id;
END;
$function$;