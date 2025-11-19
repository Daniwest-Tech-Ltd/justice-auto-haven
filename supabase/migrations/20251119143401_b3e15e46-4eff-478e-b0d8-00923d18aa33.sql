-- Add theme column to profiles table
ALTER TABLE profiles 
ADD COLUMN theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system'));

-- Update company_settings with new version and editable fields
UPDATE company_settings 
SET system_version = '2.0.0.1' 
WHERE id = (SELECT id FROM company_settings LIMIT 1);

-- Add database_status and storage_status columns to company_settings
ALTER TABLE company_settings
ADD COLUMN database_status TEXT DEFAULT 'Connected',
ADD COLUMN storage_status TEXT DEFAULT 'Active';