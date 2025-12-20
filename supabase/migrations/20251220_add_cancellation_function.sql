-- Migration: Add cancellation function and improve booking cancellation tracking
-- This implements a minimal cancellation flow WITHOUT automatic refunds

-- Function to cancel a booking with proper logging
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
    -- Get booking details
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
    
    -- Validate booking exists
    IF v_booking IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Booking not found'
        );
    END IF;
    
    -- Validate booking can be cancelled
    IF v_booking.status IN ('cancelled', 'completed') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Booking cannot be cancelled (already cancelled or completed)'
        );
    END IF;
    
    -- Validate user has permission (student or instructor)
    IF p_cancelled_by != v_booking.student_id AND p_cancelled_by != v_booking.instructor_user_id THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User not authorized to cancel this booking'
        );
    END IF;
    
    -- Perform cancellation
    UPDATE public.bookings
    SET 
        status = 'cancelled',
        cancellation_reason = p_reason,
        cancelled_by = p_cancelled_by,
        cancelled_at = NOW(),
        updated_at = NOW()
    WHERE id = p_booking_id;
    
    -- Return success with info about next steps
    RETURN json_build_object(
        'success', true,
        'booking_id', p_booking_id,
        'previous_status', v_booking.status,
        'payment_status', v_booking.payment_status,
        'requires_refund', v_booking.payment_status = 'completed',
        'refund_note', CASE 
            WHEN v_booking.payment_status = 'completed' THEN 
                'Pagamento já efetuado. Reembolso deve ser processado manualmente via Stripe Dashboard.'
            ELSE 
                'Nenhum pagamento foi efetuado.'
        END
    );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.cancel_booking TO authenticated;

-- Comment explaining function
COMMENT ON FUNCTION public.cancel_booking IS 
'Cancels a booking. Does NOT process refunds automatically. 
If payment was completed, refund must be handled manually via Stripe Dashboard.
Returns JSON with success status and refund guidance.';

-- Add index for faster cancellation queries
CREATE INDEX IF NOT EXISTS idx_bookings_cancelled_at 
ON public.bookings(cancelled_at) 
WHERE cancelled_at IS NOT NULL;
