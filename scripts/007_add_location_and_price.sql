-- Add location data and price fields
ALTER TABLE burger_places
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS place_id TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

ALTER TABLE ratings
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2);

-- Add index for location queries
CREATE INDEX IF NOT EXISTS idx_burger_places_location ON burger_places(latitude, longitude);
