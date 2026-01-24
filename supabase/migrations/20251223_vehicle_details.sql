-- Add vehicle detail columns to instructors table
-- These fields allow instructors to describe their training vehicle

-- Ar condicionado
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS vehicle_has_ac BOOLEAN DEFAULT FALSE;

-- Tipo de direção (hidráulica, elétrica, mecânica)
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS vehicle_steering_type TEXT DEFAULT 'hydraulic';

-- Veículo adaptado para PCD
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS vehicle_is_adapted BOOLEAN DEFAULT FALSE;

-- Cor do veículo
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS vehicle_color TEXT;

-- Add comment for documentation
COMMENT ON COLUMN instructors.vehicle_has_ac IS 'Whether the vehicle has air conditioning';
COMMENT ON COLUMN instructors.vehicle_steering_type IS 'Type of steering: hydraulic, electric, mechanical';
COMMENT ON COLUMN instructors.vehicle_is_adapted IS 'Whether the vehicle has dual controls (instructor pedals on passenger side)';
COMMENT ON COLUMN instructors.vehicle_color IS 'Color of the training vehicle';
