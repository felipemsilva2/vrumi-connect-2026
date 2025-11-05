-- Create storage bucket for traffic signs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'traffic-signs',
  'traffic-signs',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
);

-- Create RLS policies for traffic-signs bucket
CREATE POLICY "Public read access for traffic signs"
ON storage.objects
FOR SELECT
USING (bucket_id = 'traffic-signs');

CREATE POLICY "Authenticated users can upload traffic signs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'traffic-signs' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update traffic signs"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'traffic-signs' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete traffic signs"
ON storage.objects
FOR DELETE
USING (bucket_id = 'traffic-signs' AND auth.role() = 'authenticated');

-- Add image_url column to quiz_questions table
ALTER TABLE quiz_questions 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add image_url column to flashcards table
ALTER TABLE flashcards 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add images column to study_lessons table for multiple images
ALTER TABLE study_lessons 
ADD COLUMN IF NOT EXISTS images JSONB;