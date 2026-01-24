-- =============================================================================
-- VRUMI CONNECT - CONSOLIDAÇÃO COMPLETA DE CORREÇÕES DE SEGURANÇA E PERFORMANCE
-- Execute este arquivo inteiro no SQL Editor do Supabase
-- =============================================================================

-- #############################################################################
-- PARTE 1: LIMPEZA COMPLETA DO MÓDULO EDUCATION
-- #############################################################################

-- Drop gamification functions first (they may depend on the tables)
DROP FUNCTION IF EXISTS public.update_user_streak(UUID);
DROP FUNCTION IF EXISTS public.add_user_xp(UUID, INTEGER, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_user_gamification_stats(UUID);

-- Drop Education tables (CASCADE will remove policies, triggers, etc.)
DROP TABLE IF EXISTS public.xp_history CASCADE;
DROP TABLE IF EXISTS public.user_xp CASCADE;
DROP TABLE IF EXISTS public.user_streaks CASCADE;
DROP TABLE IF EXISTS public.user_daily_goals CASCADE;
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.user_progress CASCADE;
DROP TABLE IF EXISTS public.lesson_contents CASCADE;
DROP TABLE IF EXISTS public.study_lessons CASCADE;
DROP TABLE IF EXISTS public.study_chapters CASCADE;
DROP TABLE IF EXISTS public.study_modules CASCADE;
DROP TABLE IF EXISTS public.quiz_questions CASCADE;
DROP TABLE IF EXISTS public.flashcards CASCADE;
DROP TABLE IF EXISTS public.user_flashcard_progress CASCADE;
DROP TABLE IF EXISTS public.user_passes CASCADE;
DROP TABLE IF EXISTS public.simulado_results CASCADE;
DROP TABLE IF EXISTS public.simulado_sessions CASCADE;

-- #############################################################################
-- PARTE 2: CORREÇÃO DE FUNÇÕES COM SEARCH_PATH
-- #############################################################################

-- cancel_booking com search_path
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

-- is_admin com search_path
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

-- Tentar mover pg_net para schema extensions
DO $$
BEGIN
    CREATE SCHEMA IF NOT EXISTS extensions;
    BEGIN
        ALTER EXTENSION pg_net SET SCHEMA extensions;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not move pg_net to extensions schema: %', SQLERRM;
    END;
END $$;

-- #############################################################################
-- PARTE 3: CORREÇÃO DE POLÍTICAS RLS (PERFORMANCE)
-- Substituindo auth.uid() por (select auth.uid())
-- #############################################################################

-- -----------------------------------------------------------------------------
-- PROFILES TABLE
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles" ON public.profiles;

CREATE POLICY "Profiles read access" ON public.profiles
FOR SELECT TO authenticated, anon
USING (true);

CREATE POLICY "Profiles update access" ON public.profiles
FOR UPDATE TO authenticated
USING (id = (select auth.uid()) OR (select public.is_admin()));

-- -----------------------------------------------------------------------------
-- CONNECT_CHAT_ROOMS TABLE
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Chat Access" ON public.connect_chat_rooms;
DROP POLICY IF EXISTS "Admins can view all chat rooms" ON public.connect_chat_rooms;

CREATE POLICY "Chat rooms access" ON public.connect_chat_rooms
FOR SELECT TO authenticated
USING (
    student_id = (select auth.uid()) 
    OR instructor_id = (select auth.uid()) 
    OR (select public.is_admin())
);

-- -----------------------------------------------------------------------------
-- CONNECT_CHAT_MESSAGES TABLE
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Msg Access" ON public.connect_chat_messages;
DROP POLICY IF EXISTS "Admins can view all chat messages" ON public.connect_chat_messages;

CREATE POLICY "Chat messages access" ON public.connect_chat_messages
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.connect_chat_rooms r
        WHERE r.id = room_id
        AND (r.student_id = (select auth.uid()) OR r.instructor_id = (select auth.uid()))
    )
    OR (select public.is_admin())
);

-- -----------------------------------------------------------------------------
-- INSTRUCTOR_AVAILABILITY TABLE
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Instructors manage own availability" ON public.instructor_availability;
DROP POLICY IF EXISTS "Public availability" ON public.instructor_availability;

CREATE POLICY "Availability access" ON public.instructor_availability
FOR SELECT TO authenticated, anon
USING (true);

CREATE POLICY "Instructors manage availability" ON public.instructor_availability
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.instructors i
        WHERE i.id = instructor_id AND i.user_id = (select auth.uid())
    )
);

-- -----------------------------------------------------------------------------
-- BOOKINGS TABLE
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can read bookings" ON public.bookings;

CREATE POLICY "Bookings select access" ON public.bookings
FOR SELECT TO authenticated
USING (
    student_id = (select auth.uid()) 
    OR instructor_id = (select auth.uid()) 
    OR (select public.is_admin())
);

CREATE POLICY "Bookings insert access" ON public.bookings
FOR INSERT TO authenticated
WITH CHECK (student_id = (select auth.uid()));

CREATE POLICY "Bookings update access" ON public.bookings
FOR UPDATE TO authenticated
USING (
    student_id = (select auth.uid()) 
    OR instructor_id = (select auth.uid()) 
    OR (select public.is_admin())
);

-- -----------------------------------------------------------------------------
-- INSTRUCTOR_TRANSACTIONS TABLE
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Instructors view own transactions" ON public.instructor_transactions;

CREATE POLICY "Instructors view own transactions" ON public.instructor_transactions
FOR SELECT TO authenticated
USING (instructor_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- REVIEWS TABLE
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users create reviews" ON public.reviews;

CREATE POLICY "Users create reviews" ON public.reviews
FOR INSERT TO authenticated
WITH CHECK (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- NOTIFICATIONS TABLE
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "User notifications" ON public.notifications;
DROP POLICY IF EXISTS "Anyone can read notifications" ON public.notifications;

CREATE POLICY "Notifications access" ON public.notifications
FOR SELECT TO authenticated
USING (user_id = (select auth.uid()));

CREATE POLICY "Notifications manage" ON public.notifications
FOR ALL TO authenticated
USING (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- INSTRUCTORS TABLE
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own instructor profile" ON public.instructors;
DROP POLICY IF EXISTS "Users can update their own instructor profile" ON public.instructors;
DROP POLICY IF EXISTS "Users can create their own instructor profile" ON public.instructors;
DROP POLICY IF EXISTS "Admins can view all instructors" ON public.instructors;
DROP POLICY IF EXISTS "Admins can update all instructors" ON public.instructors;
DROP POLICY IF EXISTS "Users can create instructor profile" ON public.instructors;
DROP POLICY IF EXISTS "Anyone can read instructors" ON public.instructors;
DROP POLICY IF EXISTS "Public instructors" ON public.instructors;

CREATE POLICY "Instructors public read" ON public.instructors
FOR SELECT TO authenticated, anon
USING (approved = true OR user_id = (select auth.uid()) OR (select public.is_admin()));

CREATE POLICY "Instructors create own" ON public.instructors
FOR INSERT TO authenticated
WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Instructors update access" ON public.instructors
FOR UPDATE TO authenticated
USING (user_id = (select auth.uid()) OR (select public.is_admin()));

-- -----------------------------------------------------------------------------
-- TRANSACTIONS TABLE
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can manage transactions" ON public.transactions;
DROP POLICY IF EXISTS "Anyone can read transactions" ON public.transactions;

CREATE POLICY "Transactions admin access" ON public.transactions
FOR ALL TO authenticated
USING ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- SUPPORT_TICKETS TABLE
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Anyone can read support_tickets" ON public.support_tickets;

CREATE POLICY "Support tickets user access" ON public.support_tickets
FOR SELECT TO authenticated
USING (user_id = (select auth.uid()) OR (select public.is_admin()));

CREATE POLICY "Support tickets create" ON public.support_tickets
FOR INSERT TO authenticated
WITH CHECK (user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- PUSH_TOKENS TABLE
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can manage own tokens" ON public.push_tokens;
DROP POLICY IF EXISTS "Admins can view all tokens" ON public.push_tokens;

CREATE POLICY "Push tokens access" ON public.push_tokens
FOR ALL TO authenticated
USING (user_id = (select auth.uid()) OR (select public.is_admin()));

-- -----------------------------------------------------------------------------
-- USER_ROLES TABLE
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Anyone can read user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "User roles select" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = (select auth.uid()) OR (select public.is_admin()));

CREATE POLICY "User roles admin manage" ON public.user_roles
FOR ALL TO authenticated
USING ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- ANALYTICS_EVENTS TABLE
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Service role can manage analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "Admins can view analytics" ON public.analytics_events;

CREATE POLICY "Analytics admin access" ON public.analytics_events
FOR ALL TO authenticated
USING ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- LESSON_PACKAGES TABLE
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Instructors can manage own packages" ON public.lesson_packages;
DROP POLICY IF EXISTS "Public read for active packages" ON public.lesson_packages;

CREATE POLICY "Lesson packages read" ON public.lesson_packages
FOR SELECT TO authenticated, anon
USING (is_active = true OR instructor_id IN (
    SELECT id FROM public.instructors WHERE user_id = (select auth.uid())
));

CREATE POLICY "Lesson packages manage" ON public.lesson_packages
FOR ALL TO authenticated
USING (
    instructor_id IN (
        SELECT id FROM public.instructors WHERE user_id = (select auth.uid())
    )
);

-- -----------------------------------------------------------------------------
-- COUPONS TABLE
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Read active coupons" ON public.coupons;

CREATE POLICY "Coupons read access" ON public.coupons
FOR SELECT TO authenticated, anon
USING (is_active = true OR (select public.is_admin()));

CREATE POLICY "Coupons admin manage" ON public.coupons
FOR ALL TO authenticated
USING ((select public.is_admin()));

-- #############################################################################
-- PARTE 4: REMOÇÃO DE ÍNDICE DUPLICADO
-- #############################################################################
DROP INDEX IF EXISTS public.instructors_cpf_unique;

-- #############################################################################
-- FIM DA MIGRAÇÃO
-- Lembre-se de ativar "Leaked Password Protection" no Dashboard:
-- Authentication -> Settings -> Security
-- #############################################################################
