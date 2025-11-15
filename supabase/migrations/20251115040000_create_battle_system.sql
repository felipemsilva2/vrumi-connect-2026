-- Create battle rooms table
CREATE TABLE IF NOT EXISTS public.traffic_sign_battle_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  max_players INTEGER NOT NULL CHECK (max_players >= 2 AND max_players <= 8),
  current_players INTEGER DEFAULT 0 CHECK (current_players >= 0 AND current_players <= max_players),
  status VARCHAR(20) NOT NULL CHECK (status IN ('waiting', 'in_progress', 'finished')),
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
  category VARCHAR(50),
  time_limit INTEGER NOT NULL CHECK (time_limit >= 10 AND time_limit <= 120),
  questions_per_player INTEGER NOT NULL CHECK (questions_per_player >= 5 AND questions_per_player <= 50),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Create battle players table
CREATE TABLE IF NOT EXISTS public.traffic_sign_battle_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.traffic_sign_battle_rooms(id) ON DELETE CASCADE,
  username VARCHAR(100) NOT NULL,
  score INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_answers INTEGER DEFAULT 0,
  is_ready BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, room_id)
);

-- Create battle questions table
CREATE TABLE IF NOT EXISTS public.traffic_sign_battle_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.traffic_sign_battle_rooms(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_answer TEXT NOT NULL,
  category VARCHAR(50),
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  time_limit INTEGER NOT NULL,
  points INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create battle player answers table
CREATE TABLE IF NOT EXISTS public.traffic_sign_battle_player_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.traffic_sign_battle_players(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.traffic_sign_battle_questions(id) ON DELETE CASCADE,
  answer TEXT,
  is_correct BOOLEAN,
  time_taken INTEGER,
  points_earned INTEGER DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, question_id)
);

-- Enable RLS
ALTER TABLE public.traffic_sign_battle_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_sign_battle_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_sign_battle_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_sign_battle_player_answers ENABLE ROW LEVEL SECURITY;

-- Create policies for battle rooms
CREATE POLICY "Anyone can view active battle rooms" ON public.traffic_sign_battle_rooms
  FOR SELECT USING (status = 'waiting');

CREATE POLICY "Authenticated users can create battle rooms" ON public.traffic_sign_battle_rooms
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Room creators can update their rooms" ON public.traffic_sign_battle_rooms
  FOR UPDATE USING (auth.uid() = created_by);

-- Create policies for battle players
CREATE POLICY "Players can view players in their room" ON public.traffic_sign_battle_players
  FOR SELECT USING (room_id IN (
    SELECT room_id FROM public.traffic_sign_battle_players WHERE user_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can join battle rooms" ON public.traffic_sign_battle_players
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Players can update their own data" ON public.traffic_sign_battle_players
  FOR UPDATE USING (user_id = auth.uid());

-- Create policies for battle questions
CREATE POLICY "Players can view questions in their room" ON public.traffic_sign_battle_questions
  FOR SELECT USING (room_id IN (
    SELECT room_id FROM public.traffic_sign_battle_players WHERE user_id = auth.uid()
  ));

-- Create policies for battle player answers
CREATE POLICY "Players can view their own answers" ON public.traffic_sign_battle_player_answers
  FOR SELECT USING (player_id IN (
    SELECT id FROM public.traffic_sign_battle_players WHERE user_id = auth.uid()
  ));

CREATE POLICY "Players can submit their own answers" ON public.traffic_sign_battle_player_answers
  FOR INSERT WITH CHECK (player_id IN (
    SELECT id FROM public.traffic_sign_battle_players WHERE user_id = auth.uid()
  ));

CREATE POLICY "Players can update their own answers" ON public.traffic_sign_battle_player_answers
  FOR UPDATE USING (player_id IN (
    SELECT id FROM public.traffic_sign_battle_players WHERE user_id = auth.uid()
  ));

-- Grant permissions
GRANT SELECT ON public.traffic_sign_battle_rooms TO anon, authenticated;
GRANT INSERT ON public.traffic_sign_battle_rooms TO authenticated;
GRANT UPDATE ON public.traffic_sign_battle_rooms TO authenticated;

GRANT SELECT ON public.traffic_sign_battle_players TO anon, authenticated;
GRANT INSERT ON public.traffic_sign_battle_players TO authenticated;
GRANT UPDATE ON public.traffic_sign_battle_players TO authenticated;

GRANT SELECT ON public.traffic_sign_battle_questions TO anon, authenticated;
GRANT INSERT ON public.traffic_sign_battle_questions TO authenticated;

GRANT SELECT ON public.traffic_sign_battle_player_answers TO anon, authenticated;
GRANT INSERT ON public.traffic_sign_battle_player_answers TO authenticated;
GRANT UPDATE ON public.traffic_sign_battle_player_answers TO authenticated;

-- Create function to generate battle questions
CREATE OR REPLACE FUNCTION generate_battle_questions(
  room_id_param UUID,
  difficulty_param VARCHAR(20),
  category_param VARCHAR(50) DEFAULT NULL,
  questions_per_player_param INTEGER DEFAULT 10,
  player_count INTEGER DEFAULT 2
)
RETURNS INTEGER AS $$
DECLARE
  total_questions INTEGER;
  questions_generated INTEGER := 0;
  selected_sign RECORD;
  question_text TEXT;
  options TEXT[];
  correct_answer TEXT;
  time_limit INTEGER;
  points INTEGER;
BEGIN
  total_questions := questions_per_player_param * player_count;
  
  -- Set time limit based on difficulty
  time_limit := CASE difficulty_param
    WHEN 'easy' THEN 45
    WHEN 'medium' THEN 30
    WHEN 'hard' THEN 20
    WHEN 'expert' THEN 15
    ELSE 30
  END;
  
  -- Generate questions
  FOR selected_sign IN
    SELECT ts.*, tq.question_text, tq.correct_answer, tq.incorrect_answers
    FROM public.traffic_signs ts
    JOIN public.traffic_sign_questions tq ON ts.id = tq.sign_id
    WHERE ts.is_active = true
    AND tq.is_active = true
    AND (category_param IS NULL OR ts.category = category_param)
    ORDER BY RANDOM()
    LIMIT total_questions
  LOOP
    -- Build options array
    options := ARRAY[selected_sign.correct_answer] || selected_sign.incorrect_answers;
    
    -- Set points based on difficulty
    points := CASE difficulty_param
      WHEN 'easy' THEN 5
      WHEN 'medium' THEN 10
      WHEN 'hard' THEN 15
      WHEN 'expert' THEN 20
      ELSE 10
    END;
    
    -- Insert battle question
    INSERT INTO public.traffic_sign_battle_questions (
      room_id, question_text, options, correct_answer, 
      category, difficulty, time_limit, points
    ) VALUES (
      room_id_param, selected_sign.question_text, options, selected_sign.correct_answer,
      selected_sign.category, selected_sign.difficulty, time_limit, points
    );
    
    questions_generated := questions_generated + 1;
  END LOOP;
  
  RETURN questions_generated;
END;
$$ LANGUAGE plpgsql;