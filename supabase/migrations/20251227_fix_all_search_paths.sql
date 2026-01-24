-- Fix security warnings: Function Search Path Mutable
-- Recreates relevant functions with SET search_path = public
-- NOTE: Education functions (update_user_streak, add_user_xp, get_user_gamification_stats)
-- are handled by 20251227_drop_education_tables.sql migration

-- =============================================================================
-- 1. cancel_booking
-- =============================================================================
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
BEGIN
    SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Booking not found');
    END IF;

    IF v_booking.status = 'cancelled' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Booking already cancelled');
    END IF;

    UPDATE public.bookings
    SET 
        status = 'cancelled',
        cancel_reason = p_reason,
        cancelled_by = p_cancelled_by,
        cancelled_at = NOW(),
        updated_at = NOW()
    WHERE id = p_booking_id;

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

-- =============================================================================
-- 2. is_admin
-- =============================================================================
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = COALESCE($1, auth.uid())
      AND ur.role = 'admin'
  );
END;
$$;

-- =============================================================================
-- 3. Move pg_net extension to 'extensions' schema (fixes Extension in Public warning)
-- =============================================================================
DO $$
BEGIN
    -- Create extensions schema if it doesn't exist
    CREATE SCHEMA IF NOT EXISTS extensions;
    
    -- Try to move pg_net to extensions schema
    -- This may fail if pg_net doesn't support schema change, which is normal
    BEGIN
        ALTER EXTENSION pg_net SET SCHEMA extensions;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not move pg_net to extensions schema: %', SQLERRM;
    END;
END $$;

