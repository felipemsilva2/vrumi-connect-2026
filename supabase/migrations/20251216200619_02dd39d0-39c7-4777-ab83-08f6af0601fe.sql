-- Fix: Relacionar agendamentos com perfil do aluno
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_student_id_fkey;

ALTER TABLE public.bookings
ADD CONSTRAINT bookings_student_id_fkey_profiles
FOREIGN KEY (student_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;