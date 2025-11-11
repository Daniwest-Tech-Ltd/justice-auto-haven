-- Enable realtime for attendance table
ALTER TABLE public.attendance REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;