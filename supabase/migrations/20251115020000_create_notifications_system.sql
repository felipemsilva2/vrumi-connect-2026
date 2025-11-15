-- Sistema de Notificações para Lembretes de Estudo e Revisão
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('study_reminder', 'review_reminder', 'achievement', 'study_streak', 'custom')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days'
);

-- Índices para otimização
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_scheduled_for ON public.notifications(scheduled_for);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Função para criar lembretes de estudo baseados no algoritmo SM-2
CREATE OR REPLACE FUNCTION create_study_reminders()
RETURNS void AS $$
BEGIN
  -- Criar lembretes para placas que precisam ser revisadas
  INSERT INTO public.notifications (user_id, type, title, message, scheduled_for, data)
  SELECT 
    DISTINCT p.user_id,
    'review_reminder' as type,
    '⏰ Hora de revisar placas de trânsito!' as title,
    'Você tem ' || COUNT(*) || ' placas para revisar hoje. Continue seu progresso!' as message,
    CURRENT_DATE + INTERVAL '9 hours' as scheduled_for,
    jsonb_build_object(
      'sign_count', COUNT(*),
      'review_type', 'daily_review',
      'category', 'traffic_signs'
    ) as data
  FROM public.traffic_signs_review_progress p
  WHERE p.next_review <= CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = p.user_id
        AND n.type = 'review_reminder'
        AND n.scheduled_for::date = CURRENT_DATE
        AND n.created_at > CURRENT_DATE - INTERVAL '1 day'
    )
  GROUP BY p.user_id;

  -- Criar lembretes para estudar novas placas
  INSERT INTO public.notifications (user_id, type, title, message, scheduled_for, data)
  SELECT 
    u.id as user_id,
    'study_reminder' as type,
    '📚 Hora de estudar novas placas!' as title,
    'Você ainda não estudou nenhuma placa hoje. Que tal começar agora?' as message,
    CURRENT_DATE + INTERVAL '10 hours' as scheduled_for,
    jsonb_build_object(
      'study_type', 'new_signs',
      'category', 'traffic_signs',
      'priority', 'medium'
    ) as data
  FROM auth.users u
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_activities ua
    WHERE ua.user_id = u.id
      AND ua.activity_type = 'traffic_sign_study'
      AND ua.created_at::date = CURRENT_DATE
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.notifications n
    WHERE n.user_id = u.id
      AND n.type = 'study_reminder'
      AND n.scheduled_for::date = CURRENT_DATE
      AND n.created_at > CURRENT_DATE - INTERVAL '1 day'
  );
END;
$$ LANGUAGE plpgsql;

-- Função para criar lembretes de streak
CREATE OR REPLACE FUNCTION create_streak_reminders()
RETURNS void AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, scheduled_for, data)
  SELECT 
    u.id as user_id,
    'study_streak' as type,
    '🔥 Mantenha sua sequência de estudos!' as title,
    'Você está a apenas 1 dia de perder sua sequência de ' || COALESCE(us.study_streak, 0) || ' dias. Estude hoje para mantê-la!' as message,
    CURRENT_DATE + INTERVAL '19 hours' as scheduled_for,
    jsonb_build_object(
      'current_streak', COALESCE(us.study_streak, 0),
      'streak_type', 'maintain',
      'category', 'traffic_signs'
    ) as data
  FROM auth.users u
  LEFT JOIN user_statistics us ON us.user_id = u.id
  WHERE COALESCE(us.study_streak, 0) >= 3
    AND NOT EXISTS (
      SELECT 1 FROM user_activities ua
      WHERE ua.user_id = u.id
        AND ua.activity_type = 'traffic_sign_study'
        AND ua.created_at::date = CURRENT_DATE
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.user_id = u.id
        AND n.type = 'study_streak'
        AND n.scheduled_for::date = CURRENT_DATE
        AND n.created_at > CURRENT_DATE - INTERVAL '1 day'
    );
END;
$$ LANGUAGE plpgsql;

-- Função para marcar notificações como lidas
CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true,
      sent_at = NOW()
  WHERE id = notification_id
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter notificações não lidas do usuário
CREATE OR REPLACE FUNCTION get_user_unread_notifications(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  type VARCHAR,
  title VARCHAR,
  message TEXT,
  data JSONB,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT n.id, n.type, n.title, n.message, n.data, n.scheduled_for, n.created_at, n.expires_at
  FROM public.notifications n
  WHERE n.user_id = user_uuid
    AND n.is_read = false
    AND (n.scheduled_for IS NULL OR n.scheduled_for <= NOW())
    AND (n.expires_at IS NULL OR n.expires_at > NOW())
  ORDER BY n.created_at DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para limpar notificações antigas
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE expires_at < NOW()
     OR (is_read = true AND created_at < NOW() - INTERVAL '30 days');
END;
$$ LANGUAGE plpgsql;

-- Configurar RLS (Row Level Security)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas suas próprias notificações
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Política para usuários atualizarem apenas suas próprias notificações
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para usuários criarem notificações (para o sistema)
CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Conceder permissões necessárias
GRANT SELECT ON public.notifications TO anon;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT INSERT ON public.notifications TO authenticated;