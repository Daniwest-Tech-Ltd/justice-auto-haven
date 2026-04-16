-- Drop the old status check constraint and add one that includes 'draft'
ALTER TABLE public.cars DROP CONSTRAINT cars_status_check;
ALTER TABLE public.cars ADD CONSTRAINT cars_status_check CHECK (status = ANY (ARRAY['available'::text, 'sold'::text, 'reserved'::text, 'under_repair'::text, 'pending_inspection'::text, 'awaiting_documents'::text, 'returned'::text, 'cancelled'::text, 'draft'::text]));