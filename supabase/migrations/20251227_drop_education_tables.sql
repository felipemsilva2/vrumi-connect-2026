-- =============================================================================
-- Complete cleanup of Education module tables and functions
-- These were part of the Education product that has been discontinued
-- =============================================================================

-- Drop gamification functions first (they may depend on the tables)
DROP FUNCTION IF EXISTS public.update_user_streak(UUID);
DROP FUNCTION IF EXISTS public.add_user_xp(UUID, INTEGER, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_user_gamification_stats(UUID);

-- Drop tables (CASCADE will remove policies, triggers, etc.)
DROP TABLE IF EXISTS public.xp_history CASCADE;
DROP TABLE IF EXISTS public.user_xp CASCADE;
DROP TABLE IF EXISTS public.user_streaks CASCADE;
DROP TABLE IF EXISTS public.user_daily_goals CASCADE;

-- Also clean up any other Education-related tables if they still exist
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
