-- Create storage bucket for instructor photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('instructor-photos', 'instructor-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view instructor photos (public bucket)
CREATE POLICY "Anyone can view instructor photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'instructor-photos');

-- Allow instructors to upload their own photos
CREATE POLICY "Instructors can upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'instructor-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow instructors to update their own photos
CREATE POLICY "Instructors can update own photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'instructor-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow instructors to delete their own photos
CREATE POLICY "Instructors can delete own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'instructor-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);