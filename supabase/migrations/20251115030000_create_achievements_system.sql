-- Create achievements system for traffic signs
CREATE TABLE IF NOT EXISTS public.traffic_sign_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('study', 'quiz', 'memory', 'streak', 'mastery', 'social')),
  requirement_type VARCHAR(50) NOT NULL,
  requirement_value INTEGER NOT NULL,
  points_reward INTEGER DEFAULT 0,
  badge_color VARCHAR(20) DEFAULT 'blue',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user achievements table
CREATE TABLE IF NOT EXISTS public.user_traffic_sign_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES public.traffic_sign_achievements(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Create user points and levels table
CREATE TABLE IF NOT EXISTS public.user_traffic_sign_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_points INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  current_experience INTEGER DEFAULT 0,
  experience_to_next_level INTEGER DEFAULT 100,
  study_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_signs_studied INTEGER DEFAULT 0,
  total_quiz_completed INTEGER DEFAULT 0,
  total_memory_games_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.traffic_sign_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_traffic_sign_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_traffic_sign_points ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active achievements" ON public.traffic_sign_achievements
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their own achievements" ON public.user_traffic_sign_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements" ON public.user_traffic_sign_achievements
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" ON public.user_traffic_sign_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own points" ON public.user_traffic_sign_points
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own points" ON public.user_traffic_sign_points
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own points" ON public.user_traffic_sign_points
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON public.traffic_sign_achievements TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_traffic_sign_achievements TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_traffic_sign_points TO anon, authenticated;

-- Insert sample achievements
INSERT INTO public.traffic_sign_achievements (code, name, description, icon, category, requirement_type, requirement_value, points_reward, badge_color) VALUES
('first_study', 'Primeiro Estudo', 'Estude sua primeira placa de trânsito', 'book-open', 'study', 'signs_studied', 1, 10, 'green'),
('study_10', 'Estudioso Iniciante', 'Estude 10 placas de trânsito', 'book', 'study', 'signs_studied', 10, 25, 'blue'),
('study_50', 'Estudioso Intermediário', 'Estude 50 placas de trânsito', 'graduation-cap', 'study', 'signs_studied', 50, 50, 'purple'),
('study_100', 'Mestre das Placas', 'Estude 100 placas de trânsito', 'crown', 'study', 'signs_studied', 100, 100, 'gold'),
('quiz_first', 'Primeiro Quiz', 'Complete seu primeiro quiz sobre placas', 'question-circle', 'quiz', 'quiz_completed', 1, 15, 'orange'),
('quiz_10', 'Quiz Expert', 'Complete 10 quizzes sobre placas', 'brain', 'quiz', 'quiz_completed', 10, 40, 'red'),
('memory_first', 'Primeira Memória', 'Complete seu primeiro jogo de memória', 'puzzle-piece', 'memory', 'memory_games_completed', 1, 15, 'pink'),
('memory_10', 'Memória de Aço', 'Complete 10 jogos de memória', 'star', 'memory', 'memory_games_completed', 10, 40, 'indigo'),
('streak_3', 'Sequência Iniciante', 'Mantenha uma sequência de 3 dias de estudo', 'fire', 'streak', 'study_streak', 3, 20, 'yellow'),
('streak_7', 'Sequência Semanal', 'Mantenha uma sequência de 7 dias de estudo', 'calendar-week', 'streak', 'study_streak', 7, 50, 'orange'),
('streak_30', 'Sequência Mensal', 'Mantenha uma sequência de 30 dias de estudo', 'calendar-alt', 'streak', 'study_streak', 30, 100, 'red'),
('master_5', 'Especialista em Categoria', 'Domine 5 placas de uma categoria', 'medal', 'mastery', 'category_mastered', 5, 30, 'purple'),
('social_share', 'Compartilhador Social', 'Compartilhe seu progresso nas redes sociais', 'share-alt', 'social', 'social_share', 1, 10, 'blue'),
('perfect_quiz', 'Quiz Perfeito', 'Obtenha 100% de acerto em um quiz', 'trophy', 'quiz', 'perfect_quiz', 1, 25, 'gold');