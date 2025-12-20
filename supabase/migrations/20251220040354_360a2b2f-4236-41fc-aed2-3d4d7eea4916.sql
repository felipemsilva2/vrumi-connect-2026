-- MIGRATION 3: Função de Cancelamento

CREATE OR REPLACE FUNCTION public.cancel_booking(
    p_booking_id UUID,
    p_cancelled_by UUID,
    p_reason TEXT DEFAULT 'Cancelado pelo usuário'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking RECORD;
    v_result JSON;
BEGIN
    SELECT 
        b.id,
        b.student_id,
        b.instructor_id,
        b.status,
        b.payment_status,
        b.price,
        i.user_id as instructor_user_id
    INTO v_booking
    FROM public.bookings b
    JOIN public.instructors i ON i.id = b.instructor_id
    WHERE b.id = p_booking_id;
    
    IF v_booking IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Booking not found');
    END IF;
    
    IF v_booking.status IN ('cancelled', 'completed') THEN
        RETURN json_build_object('success', false, 'error', 'Booking cannot be cancelled');
    END IF;
    
    IF p_cancelled_by != v_booking.student_id AND p_cancelled_by != v_booking.instructor_user_id THEN
        RETURN json_build_object('success', false, 'error', 'User not authorized');
    END IF;
    
    UPDATE public.bookings
    SET 
        status = 'cancelled',
        cancellation_reason = p_reason,
        cancelled_by = p_cancelled_by,
        cancelled_at = NOW(),
        updated_at = NOW()
    WHERE id = p_booking_id;
    
    RETURN json_build_object(
        'success', true,
        'booking_id', p_booking_id,
        'previous_status', v_booking.status,
        'payment_status', v_booking.payment_status,
        'requires_refund', v_booking.payment_status = 'completed',
        'refund_note', CASE 
            WHEN v_booking.payment_status = 'completed' THEN 
                'Reembolso deve ser processado manualmente via Stripe Dashboard.'
            ELSE 
                'Nenhum pagamento foi efetuado.'
        END
    );
END;
$$;

-- Permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION public.cancel_booking TO authenticated;

-- Índice para buscas por cancelled_at
CREATE INDEX IF NOT EXISTS idx_bookings_cancelled_at 
ON public.bookings(cancelled_at) 
WHERE cancelled_at IS NOT NULL;

-- Índice para stripe_session_id (já existe a coluna)
CREATE INDEX IF NOT EXISTS idx_user_passes_stripe_session_id 
ON user_passes(stripe_session_id) WHERE stripe_session_id IS NOT NULL;

-- Índice para stripe_payment_intent_id em instructor_transactions
CREATE INDEX IF NOT EXISTS idx_instructor_transactions_stripe_pi 
ON instructor_transactions(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;