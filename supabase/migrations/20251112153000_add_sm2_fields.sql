-- Add spaced repetition fields to flashcards without losing existing data
-- IMPORTANT: Preserve existing structure and data; only add new fields and defaults

BEGIN;

-- 1) Add new columns (snake_case for consistency)
ALTER TABLE public.flashcards
  ADD COLUMN IF NOT EXISTS ease_factor NUMERIC NOT NULL DEFAULT 2.5,
  ADD COLUMN IF NOT EXISTS interval_days INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS repetitions INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_reviewed TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS lapses INTEGER NOT NULL DEFAULT 0;

-- 2) Ensure existing rows receive desired default values
UPDATE public.flashcards
SET
  ease_factor = COALESCE(ease_factor, 2.5),
  interval_days = COALESCE(interval_days, 1),
  repetitions = COALESCE(repetitions, 0),
  due_date = COALESCE(due_date, NOW()),
  last_reviewed = COALESCE(last_reviewed, NULL),
  lapses = COALESCE(lapses, 0);

-- 3) Helpful index for due queries
CREATE INDEX IF NOT EXISTS idx_flashcards_due_date ON public.flashcards(due_date);

COMMIT;