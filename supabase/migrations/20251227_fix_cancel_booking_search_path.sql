-- Fix security warning: Function Search Path Mutable
-- Adds SET search_path = public to prevent search path manipulation attacks

CREATE OR REPLACE FUNCTION public.cancel_booking(
    p_booking_id UUID,
    p_cancelled_by TEXT,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_booking RECORD;
    v_result JSONB;
BEGIN
    -- Get booking details
    SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Booking not found');
    END IF;

    -- Check if already cancelled
    IF v_booking.status = 'cancelled' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Booking already cancelled');
    END IF;

    -- Update booking status
    UPDATE public.bookings
    SET 
        status = 'cancelled',
        cancel_reason = p_reason,
        cancelled_by = p_cancelled_by,
        cancelled_at = NOW(),
        updated_at = NOW()
    WHERE id = p_booking_id;

    -- If booking used a package lesson, restore it
    IF v_booking.use_package_id IS NOT NULL THEN
        UPDATE public.student_packages
        SET lessons_used = GREATEST(0, lessons_used - 1)
        WHERE id = v_booking.use_package_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'booking_id', p_booking_id,
        'previous_status', v_booking.status,
        'cancelled_by', p_cancelled_by
    );
END;
$$;
