-- Migration to fix relationship between bookings and profiles
-- Currently bookings ref auth.users, but we need to join with profiles in public schema

-- 1. Drop existing FK to auth.users if it exists (implicit from previous migration)
-- Finding constraint name might be tricky if auto-generated, but we can try to add a new one or replace column def.
-- Safest is to ALTER TABLE

ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_student_id_fkey;

-- 2. Add FK to public.profiles
-- Ensure profiles exists and has matching IDs (basic assumption of Supabase auth mapping)
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_student_id_fkey_profiles
FOREIGN KEY (student_id)
REFERENCES public.profiles(user_id)
ON DELETE CASCADE;

-- 3. Also fix reviews if needed, same pattern
ALTER TABLE public.reviews
DROP CONSTRAINT IF EXISTS reviews_student_id_fkey;

ALTER TABLE public.reviews
ADD CONSTRAINT reviews_student_id_fkey_profiles
FOREIGN KEY (student_id)
REFERENCES public.profiles(user_id)
ON DELETE CASCADE;
