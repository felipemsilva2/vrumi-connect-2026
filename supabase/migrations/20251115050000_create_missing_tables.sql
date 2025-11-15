-- Criar tabela de notificações (se ainda não existir)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('study_reminder', 'streak_reminder', 'achievement', 'system')),
    is_read BOOLEAN DEFAULT false,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Criar tabela de placas de trânsito (se ainda não existir)
CREATE TABLE IF NOT EXISTS public.traffic_signs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('regulamentacao', 'advertencia', 'servicos', 'indicacao')),
    description TEXT,
    meaning TEXT NOT NULL,
    image_url TEXT,
    law_reference TEXT,
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de progresso de placas (se ainda não existir)
CREATE TABLE IF NOT EXISTS public.traffic_signs_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sign_id UUID NOT NULL REFERENCES public.traffic_signs(id) ON DELETE CASCADE,
    times_studied INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    last_studied TIMESTAMP WITH TIME ZONE,
    next_review TIMESTAMP WITH TIME ZONE,
    ease_factor REAL DEFAULT 2.5,
    interval_days INTEGER DEFAULT 0,
    repetitions INTEGER DEFAULT 0,
    is_learned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, sign_id)
);

-- Criar tabela de conquistas de placas (se ainda não existir)
CREATE TABLE IF NOT EXISTS public.traffic_signs_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('study', 'quiz', 'memory', 'streak', 'mastery', 'social')),
    icon VARCHAR(50) NOT NULL,
    requirement_type VARCHAR(50) NOT NULL,
    requirement_value INTEGER NOT NULL,
    points_reward INTEGER DEFAULT 0,
    badge_color VARCHAR(20) DEFAULT 'bronze',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de conquistas do usuário (se ainda não existir)
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.traffic_signs_achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress INTEGER DEFAULT 0,
    is_unlocked BOOLEAN DEFAULT true,
    UNIQUE(user_id, achievement_id)
);

-- Criar tabela de salas de batalha (se ainda não existir)
CREATE TABLE IF NOT EXISTS public.traffic_signs_battle_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
    max_players INTEGER DEFAULT 4,
    current_players INTEGER DEFAULT 1,
    time_per_question INTEGER DEFAULT 30,
    questions_per_round INTEGER DEFAULT 10,
    difficulty VARCHAR(20) DEFAULT 'mixed' CHECK (difficulty IN ('easy', 'medium', 'hard', 'mixed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE
);

-- Criar tabela de participantes de batalha (se ainda não existir)
CREATE TABLE IF NOT EXISTS public.traffic_signs_battle_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.traffic_signs_battle_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    is_ready BOOLEAN DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON public.notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_traffic_signs_category ON public.traffic_signs(category);
CREATE INDEX IF NOT EXISTS idx_traffic_signs_progress_user_id ON public.traffic_signs_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_traffic_signs_progress_sign_id ON public.traffic_signs_progress(sign_id);
CREATE INDEX IF NOT EXISTS idx_traffic_signs_progress_next_review ON public.traffic_signs_progress(next_review);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_battle_participants_room_id ON public.traffic_signs_battle_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_battle_participants_user_id ON public.traffic_signs_battle_participants(user_id);

-- RLS (Row Level Security)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_signs_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_signs_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_signs_battle_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_signs_battle_participants ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para notificações
CREATE POLICY "Usuários podem ver suas próprias notificações" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias notificações" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas de segurança para placas de trânsito
CREATE POLICY "Todas as placas são visíveis" ON public.traffic_signs
    FOR SELECT USING (is_active = true);

-- Políticas de segurança para progresso
CREATE POLICY "Usuários podem ver seu próprio progresso" ON public.traffic_signs_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seu próprio progresso" ON public.traffic_signs_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio progresso" ON public.traffic_signs_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas de segurança para conquistas
CREATE POLICY "Todas as conquistas são visíveis" ON public.traffic_signs_achievements
    FOR SELECT USING (is_active = true);

CREATE POLICY "Usuários podem ver suas conquistas" ON public.user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas conquistas" ON public.user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas conquistas" ON public.user_achievements
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas de segurança para batalhas
CREATE POLICY "Salas de batalha ativas são visíveis" ON public.traffic_signs_battle_rooms
    FOR SELECT USING (status IN ('waiting', 'active'));

CREATE POLICY "Anfitriões podem criar salas" ON public.traffic_signs_battle_rooms
    FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Anfitriões podem atualizar suas salas" ON public.traffic_signs_battle_rooms
    FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Participantes podem ver participações" ON public.traffic_signs_battle_participants
    FOR SELECT USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.traffic_signs_battle_rooms 
        WHERE id = room_id AND host_id = auth.uid()
    ));

CREATE POLICY "Usuários podem participar de salas" ON public.traffic_signs_battle_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar sua participação" ON public.traffic_signs_battle_participants
    FOR UPDATE USING (auth.uid() = user_id);

-- Inserir dados iniciais de conquistas
INSERT INTO public.traffic_signs_achievements (code, name, description, category, icon, requirement_type, requirement_value, points_reward, badge_color) VALUES
('first_steps', 'Primeiros Passos', 'Estude sua primeira placa de trânsito', 'study', 'BookOpen', 'study_count', 1, 10, 'bronze'),
('student', 'Estudante', 'Estude 10 placas de trânsito', 'study', 'BookOpen', 'study_count', 10, 25, 'silver'),
('scholar', 'Estudioso', 'Estude 50 placas de trânsito', 'study', 'BookOpen', 'study_count', 50, 50, 'gold'),
('quiz_novice', 'Novato em Quiz', 'Complete seu primeiro quiz de placas', 'quiz', 'Brain', 'quiz_count', 1, 15, 'bronze'),
('quiz_master', 'Mestre de Quiz', 'Complete 20 quizzes de placas', 'quiz', 'Brain', 'quiz_count', 20, 75, 'gold'),
('memory_beginner', 'Iniciante de Memória', 'Complete o jogo da memória uma vez', 'memory', 'SquareStack', 'memory_count', 1, 20, 'bronze'),
('memory_expert', 'Expert em Memória', 'Complete o jogo da memória 10 vezes', 'memory', 'SquareStack', 'memory_count', 10, 60, 'gold'),
('streak_week', 'Sequência de 7 Dias', 'Mantenha uma sequência de estudos por 7 dias', 'streak', 'Flame', 'streak_days', 7, 30, 'silver'),
('streak_month', 'Sequência de 30 Dias', 'Mantenha uma sequência de estudos por 30 dias', 'streak', 'Flame', 'streak_days', 30, 100, 'gold'),
('mastery_bronze', 'Mestre Bronze', 'Alcance 70% de acerto nas placas', 'mastery', 'Medal', 'accuracy_rate', 70, 40, 'bronze'),
('mastery_gold', 'Mestre Ouro', 'Alcance 90% de acerto nas placas', 'mastery', 'Medal', 'accuracy_rate', 90, 120, 'gold'),
('social_butterfly', 'Social', 'Compartilhe seu progresso nas redes sociais', 'social', 'Share2', 'share_count', 1, 25, 'bronze');

-- Conceder permissões de leitura
GRANT SELECT ON public.notifications TO anon, authenticated;
GRANT SELECT ON public.traffic_signs TO anon, authenticated;
GRANT SELECT ON public.traffic_signs_progress TO authenticated;
GRANT SELECT ON public.traffic_signs_achievements TO anon, authenticated;
GRANT SELECT ON public.user_achievements TO authenticated;
GRANT SELECT ON public.traffic_signs_battle_rooms TO authenticated;
GRANT SELECT ON public.traffic_signs_battle_participants TO authenticated;