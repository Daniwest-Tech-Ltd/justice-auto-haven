-- Ensure stock_sequence has a single row per prefix and is safe under concurrency

-- 1) Add a unique constraint on prefix (required for ON CONFLICT (prefix))
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'stock_sequence_prefix_key'
  ) THEN
    -- If duplicates exist, consolidate them first
    WITH d AS (
      SELECT prefix, MAX(last_number) AS max_last
      FROM public.stock_sequence
      GROUP BY prefix
    )
    UPDATE public.stock_sequence s
    SET last_number = d.max_last
    FROM d
    WHERE s.prefix = d.prefix;

    -- Delete duplicate rows, keep the one with the greatest last_number (and newest updated_at as tiebreak)
    DELETE FROM public.stock_sequence s
    USING public.stock_sequence s2
    WHERE s.prefix = s2.prefix
      AND s.id <> s2.id
      AND (s.last_number < s2.last_number OR (s.last_number = s2.last_number AND COALESCE(s.updated_at, now()) < COALESCE(s2.updated_at, now())));

    ALTER TABLE public.stock_sequence
      ADD CONSTRAINT stock_sequence_prefix_key UNIQUE (prefix);
  END IF;
END $$;

-- 2) Align sequence with existing cars (so we never generate an already-used stock_id)
-- Extract the numeric suffix from stock_id like 'JUA-KEN-139'
WITH max_used AS (
  SELECT
    MAX(NULLIF(regexp_replace(stock_id, '^JUA-KEN-', ''), '')::int) AS max_no
  FROM public.cars
  WHERE stock_id LIKE 'JUA-KEN-%'
)
INSERT INTO public.stock_sequence (prefix, last_number, updated_at)
SELECT 'JUA-KEN', COALESCE((SELECT max_no FROM max_used), 0), now()
ON CONFLICT (prefix)
DO UPDATE SET
  last_number = GREATEST(public.stock_sequence.last_number, EXCLUDED.last_number),
  updated_at = now();

-- 3) Make auto_assign_stock_id concurrency-safe: ensure row exists then atomically increment
CREATE OR REPLACE FUNCTION public.auto_assign_stock_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  IF NEW.stock_id IS NULL OR NEW.stock_id = '' THEN
    -- Ensure the prefix row exists (doesn't consume a number)
    INSERT INTO public.stock_sequence (prefix, last_number, updated_at)
    VALUES ('JUA-KEN', 0, now())
    ON CONFLICT (prefix) DO NOTHING;

    -- Atomically increment and return the new value
    UPDATE public.stock_sequence
    SET last_number = last_number + 1,
        updated_at = now()
    WHERE prefix = 'JUA-KEN'
    RETURNING last_number INTO next_number;

    NEW.stock_id := 'JUA-KEN-' || LPAD(next_number::TEXT, 3, '0');
  END IF;

  RETURN NEW;
END;
$$;

-- 4) Ensure the trigger exists
DROP TRIGGER IF EXISTS trigger_auto_stock_id ON public.cars;
CREATE TRIGGER trigger_auto_stock_id
  BEFORE INSERT ON public.cars
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_stock_id();
