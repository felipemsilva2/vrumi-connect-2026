-- Migration: Add unique constraint to prevent double-booking
-- This eliminates race condition by enforcing uniqueness at database level

-- Add unique constraint on instructor_id + scheduled_date + scheduled_time
-- This prevents two bookings for the same instructor at the same time
-- Only apply to non-cancelled bookings

-- First, create a partial unique index that excludes cancelled bookings
-- This allows re-booking cancelled slots while preventing double-booking active ones
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_unique_slot 
ON public.bookings (instructor_id, scheduled_date, scheduled_time)
WHERE status NOT IN ('cancelled');

-- Add index for faster slot availability checking
CREATE INDEX IF NOT EXISTS idx_bookings_slot_check 
ON public.bookings (instructor_id, scheduled_date, status)
WHERE status NOT IN ('cancelled');

-- Comment explaining the constraint
COMMENT ON INDEX idx_bookings_unique_slot IS 
'Prevents double-booking: ensures only one active booking per instructor/date/time slot';

-- Optional: Function to safely check if slot is available (for frontend pre-validation)
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_slot_available TO authenticated;

COMMENT ON FUNCTION public.is_slot_available IS 
'Check if an instructor slot is available for booking. Returns TRUE if available, FALSE if already booked.';
