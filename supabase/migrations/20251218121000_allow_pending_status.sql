-- Migration: Allow 'pending' status in student_packages
-- This enables safe purchase flows where the package only becomes active after payment.

-- We need to drop the existing constraint and add the new one.
-- First, find the constraint name. It's usually student_packages_status_check.
ALTER TABLE student_packages 
DROP CONSTRAINT IF EXISTS student_packages_status_check;

ALTER TABLE student_packages 
ADD CONSTRAINT student_packages_status_check 
CHECK (status IN ('active', 'completed', 'cancelled', 'refunded', 'pending'));

-- Also adding a metadata column for extra context during plan changes/additions
ALTER TABLE student_packages 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN student_packages.status IS 'Status of the package purchase. pending is used during checkout.';
