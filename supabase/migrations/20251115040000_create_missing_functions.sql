-- Função para criar lembretes de revisão
CREATE OR REPLACE FUNCTION create_study_reminders()
RETURNS void AS $$
BEGIN
  -- Criar lembretes de revisão para usuários com base no algoritmo SM-2
  INSERT INTO public.notifications (user_id, title, message, type, scheduled_for)
  SELECT 
    user_id,
    'Revisão de Placas de Trânsito' as title,
    'Está na hora de revisar as placas de trânsito que você estudou!' as message,
    'study_reminder' as type,
    NOW() + INTERVAL '1 day' as scheduled_for
  FROM public.user_activities
  WHERE activity_type = 'traffic_sign_studied' 
    AND created_at BETWEEN NOW() - INTERVAL '7 days' AND NOW() - INTERVAL '1 day'
  GROUP BY user_id
  HAVING COUNT(*) > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar lembretes de sequência
CREATE OR REPLACE FUNCTION create_streak_reminders()
RETURNS void AS $$
BEGIN
  -- Criar lembretes para usuários que estão prestes a perder sua sequência
  INSERT INTO public.notifications (user_id, title, message, type, scheduled_for)
  SELECT 
    p.id as user_id,
    'Mantenha sua sequência de estudos!' as title,
    'Você está a um dia de perder sua sequência de ' || COALESCE(p.study_streak, 0) || ' dias. Continue estudando!' as message,
    'streak_reminder' as type,
    NOW() + INTERVAL '12 hours' as scheduled_for
  FROM public.profiles p
  WHERE p.study_streak > 0
    AND NOT EXISTS (
      SELECT 1 FROM public.user_activities ua 
      WHERE ua.user_id = p.id 
      AND ua.created_at > NOW() - INTERVAL '24 hours'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter notificações não lidas do usuário
CREATE OR REPLACE FUNCTION get_user_unread_notifications(user_uuid UUID)
RETURNS TABLE(
  id UUID,
  title TEXT,
  message TEXT,
  type TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  scheduled_for TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.message,
    n.type,
    n.is_read,
    n.created_at,
    n.scheduled_for
  FROM public.notifications n
  WHERE n.user_id = user_uuid
    AND n.is_read = false
  ORDER BY n.created_at DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION create_study_reminders() TO authenticated;
GRANT EXECUTE ON FUNCTION create_streak_reminders() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_unread_notifications(UUID) TO authenticated;