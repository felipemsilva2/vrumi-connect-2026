-- Add vehicle information columns to instructors table
ALTER TABLE public.instructors 
ADD COLUMN IF NOT EXISTS vehicle_model text,
ADD COLUMN IF NOT EXISTS vehicle_transmission text;

-- Add comment for documentation
COMMENT ON COLUMN public.instructors.vehicle_model IS 'Model of the instructor vehicle used for lessons';
COMMENT ON COLUMN public.instructors.vehicle_transmission IS 'Transmission type: manual or automatic';