-- Add admin_notes column to instructors table for internal notes
ALTER TABLE public.instructors
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

COMMENT ON COLUMN public.instructors.admin_notes IS 'Internal notes for admin use - not visible to instructors';