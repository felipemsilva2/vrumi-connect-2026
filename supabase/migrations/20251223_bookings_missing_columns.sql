-- Add missing columns to bookings table

-- Add vehicle_type column
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(20) DEFAULT 'instructor';

-- Add use_package_id column (references lesson_packages)
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS use_package_id UUID;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_type ON public.bookings(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_bookings_use_package_id ON public.bookings(use_package_id);

-- Add comments
COMMENT ON COLUMN public.bookings.vehicle_type IS 'Type of vehicle: instructor or student';
COMMENT ON COLUMN public.bookings.use_package_id IS 'References the lesson package if this booking uses a package lesson';
