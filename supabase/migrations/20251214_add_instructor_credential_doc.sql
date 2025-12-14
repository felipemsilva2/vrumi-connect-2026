-- Add credential document URL column to instructors table
ALTER TABLE instructors 
ADD COLUMN IF NOT EXISTS credential_document_url TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN instructors.credential_document_url IS 'URL of the DETRAN credential document uploaded by the instructor';

-- Create storage bucket for instructor documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('instructor-documents', 'instructor-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for instructor documents
CREATE POLICY "Instructors can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'instructor-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Instructors can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'instructor-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public can view instructor documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'instructor-documents');
