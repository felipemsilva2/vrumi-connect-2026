-- Add vehicle_photo_url column for instructor car photos
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS vehicle_photo_url TEXT;

COMMENT ON COLUMN instructors.vehicle_photo_url IS 'URL of the uploaded vehicle photo';
