-- Add background check document URL column to instructors table
ALTER TABLE instructors 
ADD COLUMN IF NOT EXISTS background_check_url TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN instructors.background_check_url IS 'URL of the Criminal Background Check document uploaded by the instructor';

-- Update the existing check constraint for documents_status if needed
-- (The existing constraint is documents_status IN ('pending', 'submitted', 'verified', 'rejected'))
-- No change needed there, just adding a column.
