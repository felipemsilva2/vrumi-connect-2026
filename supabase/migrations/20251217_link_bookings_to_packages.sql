-- Link bookings to student packages
-- Allows tracking which package was used for a specific booking

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS use_package_id UUID REFERENCES student_packages(id) ON DELETE SET NULL;

COMMENT ON COLUMN bookings.use_package_id IS 
'Reference to the student package used for this booking (if any)';
