-- Fix search_path for generate_activation_code function
CREATE OR REPLACE FUNCTION public.generate_activation_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code text;
BEGIN
  -- Generate 8-character alphanumeric code
  code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
  RETURN code;
END;
$$;