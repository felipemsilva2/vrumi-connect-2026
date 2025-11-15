-- Drop traffic signs related objects safely
DO $$
BEGIN
  PERFORM 1;
END $$;

DROP FUNCTION IF EXISTS public.process_traffic_signs_pdf(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_pdfs(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_extracted_signs_from_pdf(uuid) CASCADE;

DROP TABLE IF EXISTS public.extracted_traffic_signs CASCADE;
DROP TABLE IF EXISTS public.traffic_signs_pdfs CASCADE;
DROP TABLE IF EXISTS public.traffic_signs_progress CASCADE;
DROP TABLE IF EXISTS public.traffic_sign_questions CASCADE;
DROP TABLE IF EXISTS public.traffic_signs CASCADE;

-- Drop auxiliary stats/review functions if present
DROP FUNCTION IF EXISTS public.cleanup_old_notifications() CASCADE;