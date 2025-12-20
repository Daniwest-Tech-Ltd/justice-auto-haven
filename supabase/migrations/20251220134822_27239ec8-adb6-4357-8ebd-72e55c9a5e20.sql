
-- Add security fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS failed_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS lock_until timestamp with time zone,
ADD COLUMN IF NOT EXISTS suspended_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS blocked_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reactivation_otp text,
ADD COLUMN IF NOT EXISTS reactivation_otp_expires timestamp with time zone,
ADD COLUMN IF NOT EXISTS security_notes text;

-- Create security events table for tracking
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL, -- 'failed_login', 'account_locked', 'account_suspended', 'account_blocked', 'otp_sent', 'otp_verified'
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Policies for security_events
CREATE POLICY "Super admins can view all security events"
ON public.security_events FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "System can insert security events"
ON public.security_events FOR INSERT
WITH CHECK (true);

CREATE POLICY "Super admins can manage security events"
ON public.security_events FOR ALL
USING (public.is_super_admin(auth.uid()));

-- Function to check if user can login
CREATE OR REPLACE FUNCTION public.can_user_login(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_record RECORD;
  result jsonb;
BEGIN
  SELECT * INTO profile_record FROM public.profiles WHERE user_id = _user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('can_login', false, 'reason', 'profile_not_found');
  END IF;
  
  -- Check if deleted
  IF profile_record.deleted_at IS NOT NULL THEN
    RETURN jsonb_build_object('can_login', false, 'reason', 'deleted', 'message', 'This account has been deleted. Please contact support.');
  END IF;
  
  -- Check if suspended
  IF profile_record.is_suspended = true THEN
    RETURN jsonb_build_object(
      'can_login', false, 
      'reason', 'suspended', 
      'message', COALESCE(profile_record.suspended_reason, 'Your account has been suspended.'),
      'requires_otp', profile_record.reactivation_otp IS NOT NULL
    );
  END IF;
  
  -- Check if blocked
  IF profile_record.blocked_at IS NOT NULL THEN
    RETURN jsonb_build_object('can_login', false, 'reason', 'blocked', 'message', 'Your account has been blocked. Please contact support.');
  END IF;
  
  -- Check if locked due to failed attempts
  IF profile_record.lock_until IS NOT NULL AND profile_record.lock_until > now() THEN
    RETURN jsonb_build_object(
      'can_login', false, 
      'reason', 'locked', 
      'message', 'Too many failed login attempts. Please try again later.',
      'lock_until', profile_record.lock_until
    );
  END IF;
  
  RETURN jsonb_build_object('can_login', true);
END;
$$;

-- Function to handle failed login attempt
CREATE OR REPLACE FUNCTION public.handle_failed_login(_user_id uuid, _ip text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_attempts integer;
  new_attempts integer;
  lock_time timestamp with time zone;
BEGIN
  SELECT failed_attempts INTO current_attempts FROM public.profiles WHERE user_id = _user_id;
  new_attempts := COALESCE(current_attempts, 0) + 1;
  
  -- Log the failed attempt
  INSERT INTO public.security_events (user_id, event_type, details, ip_address)
  VALUES (_user_id, 'failed_login', jsonb_build_object('attempt', new_attempts), _ip);
  
  IF new_attempts >= 3 THEN
    -- Lock for 1 hour and suspend
    lock_time := now() + interval '1 hour';
    
    UPDATE public.profiles 
    SET failed_attempts = new_attempts, 
        lock_until = lock_time,
        is_suspended = true,
        suspended_at = now(),
        suspended_reason = 'Auto-suspended due to multiple failed login attempts'
    WHERE user_id = _user_id;
    
    -- Log suspension
    INSERT INTO public.security_events (user_id, event_type, details, ip_address)
    VALUES (_user_id, 'account_suspended', jsonb_build_object('reason', 'failed_attempts', 'attempts', new_attempts), _ip);
    
    -- Create notification for super admins
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    SELECT ur.user_id, 'Security Alert: Account Auto-Suspended', 
           'A user account has been automatically suspended due to multiple failed login attempts.',
           'security',
           jsonb_build_object('suspended_user_id', _user_id, 'attempts', new_attempts)
    FROM public.user_roles ur WHERE ur.role = 'super_admin';
    
    RETURN jsonb_build_object('locked', true, 'suspended', true, 'lock_until', lock_time, 'attempts', new_attempts);
  ELSE
    UPDATE public.profiles SET failed_attempts = new_attempts WHERE user_id = _user_id;
    RETURN jsonb_build_object('locked', false, 'attempts', new_attempts, 'remaining', 3 - new_attempts);
  END IF;
END;
$$;

-- Function to reset login attempts on successful login
CREATE OR REPLACE FUNCTION public.reset_login_attempts(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET failed_attempts = 0, 
      lock_until = NULL,
      is_online = true,
      last_seen = now()
  WHERE user_id = _user_id;
END;
$$;

-- Function to suspend user (super admin only)
CREATE OR REPLACE FUNCTION public.suspend_user(_admin_id uuid, _user_id uuid, _reason text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin(_admin_id) THEN
    RAISE EXCEPTION 'Only super admins can suspend users';
  END IF;
  
  UPDATE public.profiles 
  SET is_suspended = true,
      suspended_at = now(),
      suspended_by = _admin_id,
      suspended_reason = COALESCE(_reason, 'Account suspended by administrator')
  WHERE user_id = _user_id;
  
  INSERT INTO public.security_events (user_id, event_type, details)
  VALUES (_user_id, 'account_suspended', jsonb_build_object('by', _admin_id, 'reason', _reason));
  
  INSERT INTO public.admin_logs (admin_id, action, details)
  VALUES (_admin_id, 'suspend_user', jsonb_build_object('user_id', _user_id, 'reason', _reason));
  
  RETURN true;
END;
$$;

-- Function to block user (super admin only)
CREATE OR REPLACE FUNCTION public.block_user(_admin_id uuid, _user_id uuid, _reason text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin(_admin_id) THEN
    RAISE EXCEPTION 'Only super admins can block users';
  END IF;
  
  UPDATE public.profiles 
  SET blocked_at = now(),
      suspended_by = _admin_id,
      security_notes = COALESCE(_reason, 'Account blocked by administrator')
  WHERE user_id = _user_id;
  
  INSERT INTO public.security_events (user_id, event_type, details)
  VALUES (_user_id, 'account_blocked', jsonb_build_object('by', _admin_id, 'reason', _reason));
  
  INSERT INTO public.admin_logs (admin_id, action, details)
  VALUES (_admin_id, 'block_user', jsonb_build_object('user_id', _user_id, 'reason', _reason));
  
  RETURN true;
END;
$$;

-- Function to unblock/reactivate user (super admin only)
CREATE OR REPLACE FUNCTION public.reactivate_user(_admin_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin(_admin_id) THEN
    RAISE EXCEPTION 'Only super admins can reactivate users';
  END IF;
  
  UPDATE public.profiles 
  SET is_suspended = false,
      suspended_at = NULL,
      suspended_by = NULL,
      suspended_reason = NULL,
      blocked_at = NULL,
      deleted_at = NULL,
      failed_attempts = 0,
      lock_until = NULL,
      reactivation_otp = NULL,
      reactivation_otp_expires = NULL
  WHERE user_id = _user_id;
  
  INSERT INTO public.security_events (user_id, event_type, details)
  VALUES (_user_id, 'account_reactivated', jsonb_build_object('by', _admin_id));
  
  INSERT INTO public.admin_logs (admin_id, action, details)
  VALUES (_admin_id, 'reactivate_user', jsonb_build_object('user_id', _user_id));
  
  RETURN true;
END;
$$;

-- Function to soft delete user (super admin only)
CREATE OR REPLACE FUNCTION public.soft_delete_user(_admin_id uuid, _user_id uuid, _reason text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin(_admin_id) THEN
    RAISE EXCEPTION 'Only super admins can delete users';
  END IF;
  
  UPDATE public.profiles 
  SET deleted_at = now(),
      suspended_by = _admin_id,
      security_notes = COALESCE(_reason, 'Account deleted by administrator')
  WHERE user_id = _user_id;
  
  INSERT INTO public.security_events (user_id, event_type, details)
  VALUES (_user_id, 'account_deleted', jsonb_build_object('by', _admin_id, 'reason', _reason));
  
  INSERT INTO public.admin_logs (admin_id, action, details)
  VALUES (_admin_id, 'delete_user', jsonb_build_object('user_id', _user_id, 'reason', _reason));
  
  RETURN true;
END;
$$;

-- Function to generate and send reactivation OTP
CREATE OR REPLACE FUNCTION public.generate_reactivation_otp(_admin_id uuid, _user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  otp_code text;
BEGIN
  IF NOT public.is_super_admin(_admin_id) THEN
    RAISE EXCEPTION 'Only super admins can generate reactivation OTP';
  END IF;
  
  -- Generate 6-digit OTP
  otp_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  
  UPDATE public.profiles 
  SET reactivation_otp = otp_code,
      reactivation_otp_expires = now() + interval '24 hours'
  WHERE user_id = _user_id;
  
  INSERT INTO public.security_events (user_id, event_type, details)
  VALUES (_user_id, 'otp_sent', jsonb_build_object('by', _admin_id));
  
  INSERT INTO public.admin_logs (admin_id, action, details)
  VALUES (_admin_id, 'send_reactivation_otp', jsonb_build_object('user_id', _user_id));
  
  RETURN otp_code;
END;
$$;

-- Function to verify reactivation OTP
CREATE OR REPLACE FUNCTION public.verify_reactivation_otp(_user_id uuid, _otp text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_record RECORD;
BEGIN
  SELECT * INTO profile_record FROM public.profiles WHERE user_id = _user_id;
  
  IF profile_record.reactivation_otp = _otp AND profile_record.reactivation_otp_expires > now() THEN
    -- Reactivate user
    UPDATE public.profiles 
    SET is_suspended = false,
        suspended_at = NULL,
        suspended_reason = NULL,
        blocked_at = NULL,
        failed_attempts = 0,
        lock_until = NULL,
        reactivation_otp = NULL,
        reactivation_otp_expires = NULL
    WHERE user_id = _user_id;
    
    INSERT INTO public.security_events (user_id, event_type, details)
    VALUES (_user_id, 'otp_verified', jsonb_build_object('self_reactivation', true));
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;
