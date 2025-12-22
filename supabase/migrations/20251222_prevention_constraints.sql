-- ============================================
-- CONSTRAINTS DE PREVENÇÃO PÓS-MIGRAÇÃO
-- Execute no Supabase Dashboard > SQL Editor
-- ============================================

-- 1. CHECK constraint para status de bookings
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'));

-- 2. CHECK constraint para payment_status de bookings
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_check 
  CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded'));

-- 3. CHECK constraint para status de instructors
ALTER TABLE instructors DROP CONSTRAINT IF EXISTS instructors_status_check;
ALTER TABLE instructors ADD CONSTRAINT instructors_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'));

-- 4. CHECK constraint para documents_status de instructors
ALTER TABLE instructors DROP CONSTRAINT IF EXISTS instructors_documents_status_check;
ALTER TABLE instructors ADD CONSTRAINT instructors_documents_status_check 
  CHECK (documents_status IN ('pending', 'submitted', 'verified', 'rejected'));

-- 5. CHECK constraint para preços positivos em instructors
ALTER TABLE instructors DROP CONSTRAINT IF EXISTS instructors_price_positive;
ALTER TABLE instructors ADD CONSTRAINT instructors_price_positive 
  CHECK (price_per_lesson IS NULL OR (price_per_lesson > 0 AND price_per_lesson <= 10000));

-- 6. CHECK constraint para preços positivos em bookings
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_price_positive;
ALTER TABLE bookings ADD CONSTRAINT bookings_price_positive 
  CHECK (price IS NULL OR (price > 0 AND price <= 10000));

-- 7. Unique constraint para CPF (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'instructors_cpf_unique' AND conrelid = 'instructors'::regclass
  ) THEN
    ALTER TABLE instructors ADD CONSTRAINT instructors_cpf_unique UNIQUE (cpf);
  END IF;
END $$;

-- 8. Garantir que instructor_id em bookings é válido (FK se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bookings_instructor_id_fkey' AND conrelid = 'bookings'::regclass
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_instructor_id_fkey 
      FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 9. Garantir que booking_id em transactions é válido (FK se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'instructor_transactions_booking_id_fkey' AND conrelid = 'instructor_transactions'::regclass
  ) THEN
    ALTER TABLE instructor_transactions ADD CONSTRAINT instructor_transactions_booking_id_fkey 
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- RESULTADO: Banco agora impede dados inválidos
-- ============================================
SELECT 'Constraints de prevenção aplicadas com sucesso!' as resultado;
