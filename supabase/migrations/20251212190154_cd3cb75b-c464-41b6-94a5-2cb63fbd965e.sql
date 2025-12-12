-- =====================================================
-- VRUMI MOBILE - GAMIFICATION & FEATURES SQL
-- =====================================================

-- =====================================================
-- FASE 1: GAMIFICAÇÃO BASE (Streaks, XP, Metas)
-- =====================================================

-- 1. User Streaks Table
CREATE TABLE IF NOT EXISTS user_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_date DATE,
    streak_freeze_available BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User XP Table
CREATE TABLE IF NOT EXISTS user_xp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    total_xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    xp_today INTEGER DEFAULT 0,
    last_xp_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. XP History
CREATE TABLE IF NOT EXISTS xp_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    xp_amount INTEGER NOT NULL,
    action_type TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Daily Goals Table
CREATE TABLE IF NOT EXISTS user_daily_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    daily_goal_minutes INTEGER DEFAULT 10,
    goal_completed_today BOOLEAN DEFAULT FALSE,
    minutes_studied_today INTEGER DEFAULT 0,
    last_goal_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- FASE 3: CONQUISTAS (Achievements)
-- =====================================================

-- 5. User Achievements Table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_key TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_key)
);

-- =====================================================
-- FASE 4: ANOTAÇÕES (Notes)
-- =====================================================

-- 6. User Notes Table
CREATE TABLE IF NOT EXISTS user_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    related_content JSONB,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

-- Policies for user_streaks
DROP POLICY IF EXISTS "Users can view own streaks" ON user_streaks;
DROP POLICY IF EXISTS "Users can insert own streaks" ON user_streaks;
DROP POLICY IF EXISTS "Users can update own streaks" ON user_streaks;
CREATE POLICY "Users can view own streaks" ON user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streaks" ON user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streaks" ON user_streaks FOR UPDATE USING (auth.uid() = user_id);

-- Policies for user_xp
DROP POLICY IF EXISTS "Users can view own xp" ON user_xp;
DROP POLICY IF EXISTS "Users can insert own xp" ON user_xp;
DROP POLICY IF EXISTS "Users can update own xp" ON user_xp;
CREATE POLICY "Users can view own xp" ON user_xp FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own xp" ON user_xp FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own xp" ON user_xp FOR UPDATE USING (auth.uid() = user_id);

-- Policies for xp_history
DROP POLICY IF EXISTS "Users can view own xp history" ON xp_history;
DROP POLICY IF EXISTS "Users can insert own xp history" ON xp_history;
CREATE POLICY "Users can view own xp history" ON xp_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own xp history" ON xp_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for user_daily_goals
DROP POLICY IF EXISTS "Users can manage own daily goals" ON user_daily_goals;
CREATE POLICY "Users can manage own daily goals" ON user_daily_goals FOR ALL USING (auth.uid() = user_id);

-- Policies for user_achievements
DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON user_achievements;
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for user_notes
DROP POLICY IF EXISTS "Users can manage own notes" ON user_notes;
CREATE POLICY "Users can manage own notes" ON user_notes FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update streak on activity
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
    v_current_streak INTEGER;
    v_longest_streak INTEGER;
    v_last_date DATE;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- Get or create streak record
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date)
    VALUES (p_user_id, 0, 0, NULL)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Get current values
    SELECT current_streak, longest_streak, last_activity_date
    INTO v_current_streak, v_longest_streak, v_last_date
    FROM user_streaks
    WHERE user_id = p_user_id;
    
    -- Logic for streak update
    IF v_last_date IS NULL OR v_last_date < v_today - INTERVAL '1 day' THEN
        -- Streak broken or first activity
        v_current_streak := 1;
    ELSIF v_last_date = v_today - INTERVAL '1 day' THEN
        -- Consecutive day
        v_current_streak := v_current_streak + 1;
    ELSIF v_last_date = v_today THEN
        -- Already counted today, do nothing
        NULL;
    END IF;
    
    -- Update longest if needed
    IF v_current_streak > v_longest_streak THEN
        v_longest_streak := v_current_streak;
    END IF;
    
    -- Save changes
    UPDATE user_streaks
    SET 
        current_streak = v_current_streak,
        longest_streak = v_longest_streak,
        last_activity_date = v_today,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    SELECT json_build_object(
        'current_streak', v_current_streak,
        'longest_streak', v_longest_streak,
        'last_activity_date', v_today
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add XP
CREATE OR REPLACE FUNCTION add_user_xp(
    p_user_id UUID,
    p_xp_amount INTEGER,
    p_action_type TEXT,
    p_description TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
    v_total_xp INTEGER;
    v_new_level INTEGER;
    v_today DATE := CURRENT_DATE;
BEGIN
    -- Get or create XP record
    INSERT INTO user_xp (user_id, total_xp, level, xp_today, last_xp_date)
    VALUES (p_user_id, 0, 1, 0, v_today)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Reset daily XP if new day
    UPDATE user_xp
    SET xp_today = 0, last_xp_date = v_today
    WHERE user_id = p_user_id AND last_xp_date < v_today;
    
    -- Add XP
    UPDATE user_xp
    SET 
        total_xp = total_xp + p_xp_amount,
        xp_today = xp_today + p_xp_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING total_xp INTO v_total_xp;
    
    -- Calculate level (every 500 XP = 1 level)
    v_new_level := GREATEST(1, (v_total_xp / 500) + 1);
    
    UPDATE user_xp
    SET level = v_new_level
    WHERE user_id = p_user_id;
    
    -- Log to history
    INSERT INTO xp_history (user_id, xp_amount, action_type, description)
    VALUES (p_user_id, p_xp_amount, p_action_type, p_description);
    
    SELECT json_build_object(
        'total_xp', v_total_xp,
        'level', v_new_level,
        'xp_added', p_xp_amount
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user gamification stats
CREATE OR REPLACE FUNCTION get_user_gamification_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'streak', (
            SELECT json_build_object(
                'current', COALESCE(current_streak, 0),
                'longest', COALESCE(longest_streak, 0),
                'last_activity', last_activity_date,
                'is_active_today', (last_activity_date = CURRENT_DATE)
            )
            FROM user_streaks WHERE user_id = p_user_id
        ),
        'xp', (
            SELECT json_build_object(
                'total', COALESCE(total_xp, 0),
                'level', COALESCE(level, 1),
                'today', COALESCE(xp_today, 0),
                'xp_to_next_level', 500 - (COALESCE(total_xp, 0) % 500)
            )
            FROM user_xp WHERE user_id = p_user_id
        ),
        'daily_goal', (
            SELECT json_build_object(
                'goal_minutes', COALESCE(daily_goal_minutes, 10),
                'minutes_today', COALESCE(minutes_studied_today, 0),
                'completed', COALESCE(goal_completed_today, false)
            )
            FROM user_daily_goals WHERE user_id = p_user_id
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_xp_user_id ON user_xp(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_history_user_id ON xp_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_goals_user_id ON user_daily_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON user_notes(user_id);