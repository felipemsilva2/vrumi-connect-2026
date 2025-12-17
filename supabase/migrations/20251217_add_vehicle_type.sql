-- Add vehicle_type column to bookings table
-- Allows students to choose between instructor's car or their own car

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(20) DEFAULT 'instructor'
CHECK (vehicle_type IN ('instructor', 'student'));

COMMENT ON COLUMN bookings.vehicle_type IS 
'Type of vehicle used: instructor (instructor''s car) or student (student''s car)';
