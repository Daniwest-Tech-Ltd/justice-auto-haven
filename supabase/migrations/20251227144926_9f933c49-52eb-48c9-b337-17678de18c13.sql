-- Add password_set and auth_provider columns to profiles table for Google OAuth password setup flow
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS password_set BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'local';

-- Update existing Google users (those with google in their metadata)
-- This will be handled by application logic