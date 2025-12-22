-- ============================================
-- SCRIPT DE CORREÇÃO PÓS-MIGRAÇÃO
-- Vrumi Connect - Supabase Independente
-- Projeto: kyuaxjkokntdmcxjurhm
-- ============================================

-- 1. Corrigir FK de bookings.student_id (apontar para profiles ao invés de auth.users)
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_student_id_fkey;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_student_id_fkey 
  FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Adicionar todas as colunas potencialmente ausentes em instructors
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS vehicle_model TEXT;
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS vehicle_transmission TEXT DEFAULT 'manual';
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS lesson_duration_minutes INTEGER DEFAULT 60;
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS price_instructor_car DECIMAL(10,2);
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS price_student_car DECIMAL(10,2);
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS total_lessons INTEGER DEFAULT 0;
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS documents_status TEXT DEFAULT 'pending';
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS cnh_document_url TEXT;
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS vehicle_document_url TEXT;
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS credential_document_url TEXT;
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS background_check_url TEXT;
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8);
ALTER TABLE public.instructors ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8);

-- 3. Criar índices de performance críticos
CREATE INDEX IF NOT EXISTS idx_bookings_student_id ON public.bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_instructor_id ON public.bookings(instructor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_date ON public.bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_instructors_status ON public.instructors(status);
CREATE INDEX IF NOT EXISTS idx_instructors_city_state ON public.instructors(city, state);
