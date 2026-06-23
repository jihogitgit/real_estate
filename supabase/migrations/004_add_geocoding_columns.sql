-- Add geocoding columns to properties table
-- lat/lng: GPS coordinates from Naver Geocoding API
-- geocoded_at: NULL = not yet attempted; any value = attempted (even if no coords found)
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS lat         NUMERIC,
  ADD COLUMN IF NOT EXISTS lng         NUMERIC,
  ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ;
