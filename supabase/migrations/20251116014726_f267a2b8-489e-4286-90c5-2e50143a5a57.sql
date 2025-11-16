-- Criar tabela traffic_signs
CREATE TABLE IF NOT EXISTS traffic_signs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT,
  meaning TEXT,
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_traffic_signs_category ON traffic_signs(category);
CREATE INDEX IF NOT EXISTS idx_traffic_signs_code ON traffic_signs(code);
CREATE INDEX IF NOT EXISTS idx_traffic_signs_tags ON traffic_signs USING GIN(tags);

-- RLS policies para traffic_signs
ALTER TABLE traffic_signs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active traffic signs" ON traffic_signs;
CREATE POLICY "Anyone can view active traffic signs"
  ON traffic_signs FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage traffic signs" ON traffic_signs;
CREATE POLICY "Admins can manage traffic signs"
  ON traffic_signs FOR ALL
  USING (is_admin());

-- Criar tabela user_preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;
CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Criar tabela notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Criar tabela user_sign_progress
CREATE TABLE IF NOT EXISTS user_sign_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sign_id UUID NOT NULL REFERENCES traffic_signs(id) ON DELETE CASCADE,
  times_reviewed INT DEFAULT 0,
  times_correct INT DEFAULT 0,
  times_incorrect INT DEFAULT 0,
  confidence_level INT DEFAULT 0 CHECK (confidence_level BETWEEN 0 AND 5),
  last_reviewed TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sign_id)
);

CREATE INDEX IF NOT EXISTS idx_user_sign_progress_user ON user_sign_progress(user_id);

ALTER TABLE user_sign_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own sign progress" ON user_sign_progress;
CREATE POLICY "Users can manage own sign progress"
  ON user_sign_progress FOR ALL
  USING (auth.uid() = user_id);

-- Criar tabela challenge_results
CREATE TABLE IF NOT EXISTS challenge_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT,
  total_questions INT NOT NULL,
  correct_answers INT NOT NULL,
  time_seconds INT NOT NULL,
  score_percentage DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenge_results_user ON challenge_results(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_results_category ON challenge_results(category, score_percentage DESC);

ALTER TABLE challenge_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own challenge results" ON challenge_results;
CREATE POLICY "Users can view own challenge results"
  ON challenge_results FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own challenge results" ON challenge_results;
CREATE POLICY "Users can insert own challenge results"
  ON challenge_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Adicionar colunas SM2 à tabela flashcards se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='flashcards' AND column_name='ease_factor') THEN
    ALTER TABLE flashcards ADD COLUMN ease_factor DECIMAL(4,2) DEFAULT 2.5;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='flashcards' AND column_name='interval_days') THEN
    ALTER TABLE flashcards ADD COLUMN interval_days INT DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='flashcards' AND column_name='repetitions') THEN
    ALTER TABLE flashcards ADD COLUMN repetitions INT DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='flashcards' AND column_name='due_date') THEN
    ALTER TABLE flashcards ADD COLUMN due_date TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='flashcards' AND column_name='last_reviewed') THEN
    ALTER TABLE flashcards ADD COLUMN last_reviewed TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='flashcards' AND column_name='lapses') THEN
    ALTER TABLE flashcards ADD COLUMN lapses INT DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_flashcards_due_date ON flashcards(due_date);

-- Criar função get_category_progress
CREATE OR REPLACE FUNCTION get_category_progress(
  p_user_id UUID,
  p_category TEXT
)
RETURNS TABLE (
  total_signs INT,
  reviewed_signs INT,
  mastered_signs INT,
  average_confidence DECIMAL
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(ts.id)::INT as total_signs,
    COUNT(usp.id)::INT as reviewed_signs,
    COUNT(CASE WHEN usp.confidence_level >= 4 THEN 1 END)::INT as mastered_signs,
    COALESCE(AVG(usp.confidence_level), 0)::DECIMAL as average_confidence
  FROM traffic_signs ts
  LEFT JOIN user_sign_progress usp 
    ON ts.id = usp.sign_id AND usp.user_id = p_user_id
  WHERE ts.category = p_category AND ts.is_active = true;
END;
$$;

-- Criar função update_user_sign_progress
CREATE OR REPLACE FUNCTION update_user_sign_progress(
  p_user_id UUID,
  p_sign_id UUID,
  p_correct BOOLEAN
)
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_sign_progress (
    user_id,
    sign_id,
    times_reviewed,
    times_correct,
    times_incorrect,
    confidence_level,
    last_reviewed
  )
  VALUES (
    p_user_id,
    p_sign_id,
    1,
    CASE WHEN p_correct THEN 1 ELSE 0 END,
    CASE WHEN p_correct THEN 0 ELSE 1 END,
    CASE WHEN p_correct THEN 1 ELSE 0 END,
    NOW()
  )
  ON CONFLICT (user_id, sign_id)
  DO UPDATE SET
    times_reviewed = user_sign_progress.times_reviewed + 1,
    times_correct = user_sign_progress.times_correct + CASE WHEN p_correct THEN 1 ELSE 0 END,
    times_incorrect = user_sign_progress.times_incorrect + CASE WHEN p_correct THEN 0 ELSE 1 END,
    confidence_level = LEAST(5, GREATEST(0,
      user_sign_progress.confidence_level + CASE WHEN p_correct THEN 1 ELSE -1 END
    )),
    last_reviewed = NOW(),
    updated_at = NOW();
END;
$$;

-- Criar função save_challenge_result
CREATE OR REPLACE FUNCTION save_challenge_result(
  p_user_id UUID,
  p_category TEXT,
  p_total_questions INT,
  p_correct_answers INT,
  p_time_seconds INT
)
RETURNS JSON 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score_percentage DECIMAL;
  v_result_id UUID;
  v_is_personal_best BOOLEAN;
  v_ranking_position INT;
BEGIN
  v_score_percentage := (p_correct_answers::DECIMAL / p_total_questions::DECIMAL) * 100;
  
  INSERT INTO challenge_results (
    user_id,
    category,
    total_questions,
    correct_answers,
    time_seconds,
    score_percentage
  )
  VALUES (
    p_user_id,
    p_category,
    p_total_questions,
    p_correct_answers,
    p_time_seconds,
    v_score_percentage
  )
  RETURNING id INTO v_result_id;
  
  SELECT NOT EXISTS (
    SELECT 1 FROM challenge_results
    WHERE user_id = p_user_id
      AND (category = p_category OR (category IS NULL AND p_category IS NULL))
      AND score_percentage > v_score_percentage
      AND id != v_result_id
  ) INTO v_is_personal_best;
  
  SELECT COUNT(*) + 1 INTO v_ranking_position
  FROM challenge_results
  WHERE (category = p_category OR (category IS NULL AND p_category IS NULL))
    AND score_percentage > v_score_percentage;
  
  RETURN json_build_object(
    'result_id', v_result_id,
    'is_personal_best', v_is_personal_best,
    'ranking_position', v_ranking_position,
    'score_percentage', v_score_percentage
  );
END;
$$;