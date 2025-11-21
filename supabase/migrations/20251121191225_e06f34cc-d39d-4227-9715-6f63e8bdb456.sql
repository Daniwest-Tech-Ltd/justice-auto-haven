-- Create user_totp table for authenticator app
CREATE TABLE IF NOT EXISTS public.user_totp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  backup_codes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create user_fingerprints table for WebAuthn
CREATE TABLE IF NOT EXISTS public.user_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  device_name TEXT,
  last_used TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add 2FA preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS two_fa_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS preferred_2fa TEXT DEFAULT 'email_otp' CHECK (preferred_2fa IN ('email_otp', 'totp', 'fingerprint'));

-- Enable RLS
ALTER TABLE public.user_totp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_fingerprints ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_totp
CREATE POLICY "Users can view own TOTP settings"
  ON public.user_totp FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own TOTP settings"
  ON public.user_totp FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own TOTP settings"
  ON public.user_totp FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own TOTP settings"
  ON public.user_totp FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_fingerprints
CREATE POLICY "Users can view own fingerprints"
  ON public.user_fingerprints FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fingerprints"
  ON public.user_fingerprints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fingerprints"
  ON public.user_fingerprints FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fingerprints"
  ON public.user_fingerprints FOR DELETE
  USING (auth.uid() = user_id);