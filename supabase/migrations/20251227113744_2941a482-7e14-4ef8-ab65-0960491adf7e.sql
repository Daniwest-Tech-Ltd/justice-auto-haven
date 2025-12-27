-- Reset stock sequence to 113 so next car gets JUA-KEN-114
UPDATE public.stock_sequence 
SET last_number = 113, updated_at = now()
WHERE prefix = 'JUA-KEN';