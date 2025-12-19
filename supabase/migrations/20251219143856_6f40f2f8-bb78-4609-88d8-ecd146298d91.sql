-- Add credential document URL column to instructors table
ALTER TABLE public.instructors 
ADD COLUMN IF NOT EXISTS credential_document_url TEXT;