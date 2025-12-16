-- Migration: Add location coordinates to instructors for map feature

ALTER TABLE instructors
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Index for geospatial queries (helps with radius search)
CREATE INDEX IF NOT EXISTS idx_instructors_location ON instructors(latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
