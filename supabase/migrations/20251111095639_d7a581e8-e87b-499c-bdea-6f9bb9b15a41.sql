-- Add login tracking and online status columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS login_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_login_attempt timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone;

-- Create function to generate activation code
CREATE OR REPLACE FUNCTION public.generate_activation_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  code text;
BEGIN
  -- Generate 8-character alphanumeric code
  code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
  RETURN code;
END;
$$;

-- Create function to reset login attempts on successful login
CREATE OR REPLACE FUNCTION public.reset_login_attempts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Reset login attempts on successful auth
  UPDATE public.profiles
  SET login_attempts = 0,
      is_online = true,
      last_seen = now()
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

-- Create trigger for successful login (on auth.users)
DROP TRIGGER IF EXISTS on_successful_login ON auth.users;
CREATE TRIGGER on_successful_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION public.reset_login_attempts();