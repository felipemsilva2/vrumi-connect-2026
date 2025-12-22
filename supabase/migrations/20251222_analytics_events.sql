-- Analytics Events Table
-- Used for tracking business metrics and debugging

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id),
  instructor_id UUID REFERENCES instructors(id),
  booking_id UUID REFERENCES bookings(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);

-- RLS: Only service role can write, admins can read
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage analytics" ON analytics_events
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view analytics" ON analytics_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Common event types:
-- 'booking.created', 'booking.confirmed', 'booking.cancelled', 'booking.completed'
-- 'payment.initiated', 'payment.succeeded', 'payment.failed', 'payment.refunded'
-- 'instructor.registered', 'instructor.approved', 'instructor.stripe_connected'
-- 'user.registered', 'user.login'

COMMENT ON TABLE analytics_events IS 'Business analytics and metrics tracking';
