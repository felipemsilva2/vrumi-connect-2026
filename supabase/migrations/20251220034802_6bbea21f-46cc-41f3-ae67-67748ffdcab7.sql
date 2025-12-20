-- MIGRATION 2: Prevenir Double-Booking

-- Índice único para prevenir agendamentos duplicados no mesmo horário
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_unique_slot 
ON public.bookings (instructor_id, scheduled_date, scheduled_time)
WHERE status NOT IN ('cancelled');

-- Índice para otimizar checagem de slots disponíveis
CREATE INDEX IF NOT EXISTS idx_bookings_slot_check 
ON public.bookings (instructor_id, scheduled_date, status)
WHERE status NOT IN ('cancelled');

-- Função para verificar disponibilidade de slot
CREATE OR REPLACE FUNCTION public.is_slot_available(
    p_instructor_id UUID,
    p_scheduled_date DATE,
    p_scheduled_time TIME
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT NOT EXISTS (
        SELECT 1 
        FROM public.bookings
        WHERE instructor_id = p_instructor_id
          AND scheduled_date = p_scheduled_date
          AND scheduled_time = p_scheduled_time
          AND status NOT IN ('cancelled')
    );
$$;

-- Concede permissão para usuários autenticados usarem a função
GRANT EXECUTE ON FUNCTION public.is_slot_available TO authenticated;