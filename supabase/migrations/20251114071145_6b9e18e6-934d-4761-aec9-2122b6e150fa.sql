-- Add VIN and VIN history fields to cars table
ALTER TABLE cars
ADD COLUMN IF NOT EXISTS vin TEXT,
ADD COLUMN IF NOT EXISTS vin_history TEXT;

-- Add comment to explain fields
COMMENT ON COLUMN cars.vin IS 'Vehicle Identification Number (17-digit code)';
COMMENT ON COLUMN cars.vin_history IS 'Detailed vehicle history including accidents, service records, import details, etc.';