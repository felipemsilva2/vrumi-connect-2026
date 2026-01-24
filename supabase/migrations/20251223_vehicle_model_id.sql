-- Add vehicle_model_id column for linking to vehicle models
-- This allows tracking which standard vehicle model was selected

ALTER TABLE instructors ADD COLUMN IF NOT EXISTS vehicle_model_id TEXT;

-- Add comment for documentation
COMMENT ON COLUMN instructors.vehicle_model_id IS 'ID of the selected vehicle model from the standard list';
