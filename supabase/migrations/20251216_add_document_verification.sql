-- Migration: Add document verification fields to instructors table

-- Add document columns
ALTER TABLE instructors 
ADD COLUMN IF NOT EXISTS cnh_document_url TEXT,
ADD COLUMN IF NOT EXISTS cnh_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS vehicle_document_url TEXT,
ADD COLUMN IF NOT EXISTS vehicle_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS documents_status TEXT DEFAULT 'pending' CHECK (documents_status IN ('pending', 'submitted', 'verified', 'rejected'));

-- Create storage bucket for instructor documents (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'instructor-documents',
  'instructor-documents',
  false,  -- Private bucket
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for instructor documents bucket
CREATE POLICY "Instructors can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'instructor-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Instructors can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'instructor-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Service role can access all instructor documents"
ON storage.objects FOR ALL
USING (
  bucket_id = 'instructor-documents' AND
  auth.role() = 'service_role'
);
