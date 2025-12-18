-- Add payment_method column to whitelist_orders table
ALTER TABLE public.whitelist_orders 
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'contact';