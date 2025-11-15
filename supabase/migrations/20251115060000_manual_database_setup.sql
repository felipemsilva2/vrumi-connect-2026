-- Script manual para criar todas as tabelas e funções faltantes
-- Este script pode ser executado diretamente no console do Supabase

-- 1. Criar tabela de placas de trânsito
CREATE TABLE IF NOT EXISTS public.traffic_signs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    sign_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    meaning TEXT NOT NULL,
    location TEXT,
    color VARCHAR(50),
    shape VARCHAR(50),
    symbol_description TEXT,
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de progresso de placas
CREATE TABLE IF NOT EXISTS public.traffic_signs_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sign_id UUID NOT NULL REFERENCES public.traffic_signs(id) ON DELETE CASCADE,
    times_studied INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    times_incorrect INTEGER DEFAULT 0,
    last_studied TIMESTAMP WITH TIME ZONE,
    next_review TIMESTAMP WITH TIME ZONE,
    ease_factor NUMERIC DEFAULT 2.5,
    interval_days INTEGER DEFAULT 0,
    repetition_count INTEGER DEFAULT 0,
    mastered BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, sign_id)
);

-- 3. Criar tabela de notificações
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- 4. Criar tabela de conquistas
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    points INTEGER DEFAULT 0,
    threshold INTEGER NOT NULL,
    progress INTEGER DEFAULT 0,
    unlocked BOOLEAN DEFAULT false,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category, title)
);

-- 5. Criar tabela de batalhas
CREATE TABLE IF NOT EXISTS public.battles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    challenger_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    opponent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    challenger_score INTEGER DEFAULT 0,
    opponent_score INTEGER DEFAULT 0,
    winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_traffic_signs_category ON public.traffic_signs(category);
CREATE INDEX IF NOT EXISTS idx_traffic_signs_type ON public.traffic_signs(sign_type);
CREATE INDEX IF NOT EXISTS idx_traffic_signs_active ON public.traffic_signs(is_active);

CREATE INDEX IF NOT EXISTS idx_traffic_signs_progress_user ON public.traffic_signs_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_traffic_signs_progress_sign ON public.traffic_signs_progress(sign_id);
CREATE INDEX IF NOT EXISTS idx_traffic_signs_progress_next_review ON public.traffic_signs_progress(next_review);
CREATE INDEX IF NOT EXISTS idx_traffic_signs_progress_mastered ON public.traffic_signs_progress(mastered);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON public.notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

CREATE INDEX IF NOT EXISTS idx_achievements_user ON public.achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_unlocked ON public.achievements(unlocked);

CREATE INDEX IF NOT EXISTS idx_battles_challenger ON public.battles(challenger_id);
CREATE INDEX IF NOT EXISTS idx_battles_opponent ON public.battles(opponent_id);
CREATE INDEX IF NOT EXISTS idx_battles_status ON public.battles(status);

-- 7. Criar função para obter notificações não lidas
CREATE OR REPLACE FUNCTION public.get_user_unread_notifications(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    type VARCHAR,
    title VARCHAR,
    message TEXT,
    data JSONB,
    is_read BOOLEAN,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.user_id,
        n.type,
        n.title,
        n.message,
        n.data,
        n.is_read,
        n.scheduled_for,
        n.created_at
    FROM public.notifications n
    WHERE n.user_id = user_uuid 
        AND n.is_read = false
        AND (n.scheduled_for IS NULL OR n.scheduled_for <= NOW())
    ORDER BY n.created_at DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Criar função para criar lembretes de estudo
CREATE OR REPLACE FUNCTION public.create_study_reminders()
RETURNS VOID AS $$
DECLARE
    user_record RECORD;
    review_items RECORD;
    notification_count INTEGER := 0;
BEGIN
    -- Para cada usuário ativo
    FOR user_record IN 
        SELECT DISTINCT user_id 
        FROM public.traffic_signs_progress 
        WHERE next_review <= NOW() 
        AND mastered = false
    LOOP
        -- Contar quantas placas precisam ser revisadas
        SELECT COUNT(*) INTO notification_count
        FROM public.traffic_signs_progress
        WHERE user_id = user_record.user_id
        AND next_review <= NOW()
        AND mastered = false;

        -- Criar notificação se houver placas para revisar
        IF notification_count > 0 THEN
            INSERT INTO public.notifications (
                user_id,
                type,
                title,
                message,
                data,
                scheduled_for
            ) VALUES (
                user_record.user_id,
                'review_reminder',
                '⏰ Hora de revisar placas de trânsito!',
                'Você tem ' || notification_count || ' placas para revisar hoje. Continue seu progresso!',
                jsonb_build_object(
                    'sign_count', notification_count,
                    'review_type', 'daily_review',
                    'category', 'traffic_signs'
                ),
                NOW() + INTERVAL '5 minutes'
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Criar função para criar lembretes de sequência
CREATE OR REPLACE FUNCTION public.create_streak_reminders()
RETURNS VOID AS $$
DECLARE
    user_record RECORD;
    today_study_count INTEGER;
BEGIN
    -- Para cada usuário que não estudou hoje
    FOR user_record IN 
        SELECT id
        FROM auth.users
        WHERE id NOT IN (
            SELECT DISTINCT user_id 
            FROM public.user_activities 
            WHERE activity_type = 'traffic_sign_study' 
            AND created_at >= CURRENT_DATE
        )
    LOOP
        -- Verificar se já existe notificação de lembrete hoje
        IF NOT EXISTS (
            SELECT 1 
            FROM public.notifications 
            WHERE user_id = user_record.id
            AND type = 'study_reminder'
            AND created_at >= CURRENT_DATE
        ) THEN
            INSERT INTO public.notifications (
                user_id,
                type,
                title,
                message,
                data,
                scheduled_for
            ) VALUES (
                user_record.id,
                'study_reminder',
                '📚 Hora de estudar novas placas!',
                'Você ainda não estudou nenhuma placa hoje. Que tal começar agora?',
                jsonb_build_object(
                    'study_type', 'new_signs',
                    'category', 'traffic_signs',
                    'priority', 'medium'
                ),
                NOW() + INTERVAL '10 minutes'
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Conceder permissões necessárias
GRANT SELECT ON public.traffic_signs TO anon, authenticated;
GRANT ALL ON public.traffic_signs TO authenticated;

GRANT SELECT ON public.traffic_signs_progress TO anon, authenticated;
GRANT ALL ON public.traffic_signs_progress TO authenticated;

GRANT SELECT ON public.notifications TO anon, authenticated;
GRANT ALL ON public.notifications TO authenticated;

GRANT SELECT ON public.achievements TO anon, authenticated;
GRANT ALL ON public.achievements TO authenticated;

GRANT SELECT ON public.battles TO anon, authenticated;
GRANT ALL ON public.battles TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_user_unread_notifications(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_study_reminders() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_streak_reminders() TO anon, authenticated;

-- 11. Inserir dados iniciais de placas de trânsito
INSERT INTO public.traffic_signs (category, sign_type, title, description, meaning, location, color, shape, symbol_description, priority) VALUES
('regulatory', 'stop', 'Pare', 'Placa de parada obrigatória', 'Obriga o condutor a parar completamente o veículo', 'Intersecções', 'Vermelho', 'Octógono', 'Letra P branca', 1),
('regulatory', 'yield', 'Ceda a Passagem', 'Placa de cedência de passagem', 'Obriga o condutor a ceder passagem aos veículos da via transversal', 'Intersecções', 'Vermelho', 'Triângulo', 'Seta branca para baixo', 1),
('regulatory', 'no_entry', 'Proibido Entrar', 'Placa de proibição de entrada', 'Proíbe a entrada de veículos na via', 'Entradas de vias', 'Vermelho', 'Circular', 'Barra branca horizontal', 1),
('warning', 'curve_left', 'Curva à Esquerda', 'Placa de advertência de curva', 'Advertência sobre curva acentuada à esquerda', 'Antes de curvas', 'Amarelo', 'Triângulo', 'Seta curva para esquerda', 2),
('warning', 'curve_right', 'Curva à Direita', 'Placa de advertência de curva', 'Advertência sobre curva acentuada à direita', 'Antes de curvas', 'Amarelo', 'Triângulo', 'Seta curva para direita', 2),
('informational', 'hospital', 'Hospital', 'Placa de informação de hospital', 'Indica a proximidade de um hospital', 'Antes de hospitais', 'Azul', 'Quadrada', 'Letra H branca', 3);

-- 12. Inserir conquistas iniciais
INSERT INTO public.achievements (user_id, category, title, description, icon, points, threshold, progress, unlocked) VALUES
('00000000-0000-0000-0000-000000000000', 'study', 'Primeiros Passos', 'Estude sua primeira placa de trânsito', 'BookOpen', 10, 1, 0, false),
('00000000-0000-0000-0000-000000000000', 'study', 'Estudioso', 'Estude 10 placas de trânsito', 'BookOpen', 50, 10, 0, false),
('00000000-0000-0000-0000-000000000000', 'quiz', 'Acertou!', 'Acerte 5 questões consecutivas', 'Brain', 25, 5, 0, false),
('00000000-0000-0000-0000-000000000000', 'memory', 'Memória de Elefante', 'Revise 20 placas no modo de revisão', 'SquareStack', 100, 20, 0, false),
('00000000-0000-0000-0000-000000000000', 'streak', 'Sequência Iniciada', 'Estude por 3 dias consecutivos', 'Flame', 30, 3, 0, false),
('00000000-0000-0000-0000-000000000000', 'mastery', 'Mestre das Placas', 'Domine 15 placas de trânsito', 'Medal', 200, 15, 0, false),
('00000000-0000-0000-0000-000000000000', 'social', 'Compartilhador', 'Compartilhe seu progresso 5 vezes', 'Share2', 20, 5, 0, false);

-- Comando para verificar se tudo foi criado corretamente
SELECT 
    'traffic_signs' as table_name,
    COUNT(*) as record_count
FROM public.traffic_signs
UNION ALL
SELECT 
    'traffic_signs_progress' as table_name,
    COUNT(*) as record_count
FROM public.traffic_signs_progress
UNION ALL
SELECT 
    'notifications' as table_name,
    COUNT(*) as record_count
FROM public.notifications
UNION ALL
SELECT 
    'achievements' as table_name,
    COUNT(*) as record_count
FROM public.achievements
UNION ALL
SELECT 
    'battles' as table_name,
    COUNT(*) as record_count
FROM public.battles;