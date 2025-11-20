-- Add account status column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active' 
CHECK (account_status IN ('active', 'suspended', 'blocked'));

-- Update existing suspended accounts to use the new status
UPDATE profiles 
SET account_status = CASE 
  WHEN is_suspended = true THEN 'suspended'
  ELSE 'active'
END;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON profiles(account_status);