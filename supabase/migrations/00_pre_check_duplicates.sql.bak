-- PRE-MIGRATION CHECK: Run this BEFORE applying 20251220_prevent_double_booking.sql
-- This script identifies and resolves any existing duplicate bookings

-- Step 1: Check for existing duplicates
SELECT 
    instructor_id,
    scheduled_date,
    scheduled_time,
    COUNT(*) as duplicate_count,
    ARRAY_AGG(id) as booking_ids,
    ARRAY_AGG(status) as statuses,
    ARRAY_AGG(created_at ORDER BY created_at) as created_dates
FROM public.bookings
WHERE status NOT IN ('cancelled')
GROUP BY instructor_id, scheduled_date, scheduled_time
HAVING COUNT(*) > 1;

-- If the above returns rows, you have duplicates that need to be resolved.
-- The migration will fail until these are fixed.

-- Step 2: Auto-fix duplicates (keep the oldest, cancel the rest)
-- UNCOMMENT AND RUN ONLY IF STEP 1 SHOWS DUPLICATES

/*
WITH duplicates AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY instructor_id, scheduled_date, scheduled_time 
            ORDER BY created_at ASC
        ) as rn
    FROM public.bookings
    WHERE status NOT IN ('cancelled')
)
UPDATE public.bookings
SET 
    status = 'cancelled',
    cancellation_reason = 'Duplicate booking auto-cancelled by system',
    cancelled_at = NOW()
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);
*/

-- Step 3: Verify no duplicates remain
SELECT COUNT(*) as remaining_duplicates
FROM (
    SELECT instructor_id, scheduled_date, scheduled_time
    FROM public.bookings
    WHERE status NOT IN ('cancelled')
    GROUP BY instructor_id, scheduled_date, scheduled_time
    HAVING COUNT(*) > 1
) as dups;

-- If this returns 0, you're safe to apply the migration
