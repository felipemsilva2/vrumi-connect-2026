-- Migration: Create notification triggers for bookings

-- Function to send push notification via Edge Function
CREATE OR REPLACE FUNCTION notify_booking_status_change()
RETURNS TRIGGER AS $$
DECLARE
  student_name TEXT;
  instructor_name TEXT;
  lesson_date TEXT;
  lesson_time TEXT;
BEGIN
  -- Get names
  SELECT full_name INTO student_name FROM profiles WHERE id = NEW.student_id;
  SELECT full_name INTO instructor_name FROM instructors WHERE id = NEW.instructor_id;
  
  -- Format date and time
  lesson_date := to_char(NEW.scheduled_date, 'DD/MM');
  lesson_time := substring(NEW.scheduled_time::text from 1 for 5);

  -- Booking confirmed
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    -- Notify student
    PERFORM net.http_post(
      url := current_setting('app.supabase_functions_url') || '/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'userId', NEW.student_id,
        'title', 'Aula Confirmada! ✅',
        'body', 'Sua aula com ' || instructor_name || ' em ' || lesson_date || ' às ' || lesson_time || ' foi confirmada.',
        'data', jsonb_build_object('type', 'booking_confirmed', 'bookingId', NEW.id)
      )
    );
    
    -- Notify instructor
    PERFORM net.http_post(
      url := current_setting('app.supabase_functions_url') || '/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'userId', (SELECT user_id FROM instructors WHERE id = NEW.instructor_id),
        'title', 'Nova Aula Agendada! 🚗',
        'body', 'Aula com ' || COALESCE(student_name, 'Aluno') || ' em ' || lesson_date || ' às ' || lesson_time,
        'data', jsonb_build_object('type', 'booking_confirmed', 'bookingId', NEW.id)
      )
    );
  END IF;

  -- Booking completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Notify student to rate
    PERFORM net.http_post(
      url := current_setting('app.supabase_functions_url') || '/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'userId', NEW.student_id,
        'title', 'Como foi sua aula? ⭐',
        'body', 'Avalie sua experiência com ' || instructor_name,
        'data', jsonb_build_object('type', 'rate_instructor', 'bookingId', NEW.id, 'instructorId', NEW.instructor_id)
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS booking_status_notification_trigger ON bookings;
CREATE TRIGGER booking_status_notification_trigger
  AFTER INSERT OR UPDATE OF status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_status_change();

-- Note: For lesson reminders (1h before), use pg_cron job:
-- SELECT cron.schedule('lesson-reminders', '0 * * * *', $$
--   SELECT net.http_post(
--     url := 'your-edge-function-url/send-lesson-reminders',
--     headers := '{"Content-Type": "application/json"}'::jsonb,
--     body := '{}'::jsonb
--   )
-- $$);
