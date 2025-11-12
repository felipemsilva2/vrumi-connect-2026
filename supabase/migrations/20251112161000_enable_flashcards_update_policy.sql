-- Allow authenticated users to update SRS-related fields on flashcards
-- Note: This enables UPDATE for all flashcards rows by authenticated users.
-- If you need stricter control (e.g., limit columns), consider using column-level GRANTs and triggers.

BEGIN;

CREATE POLICY IF NOT EXISTS "Authenticated users can update flashcards SRS"
  ON public.flashcards FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

COMMIT;