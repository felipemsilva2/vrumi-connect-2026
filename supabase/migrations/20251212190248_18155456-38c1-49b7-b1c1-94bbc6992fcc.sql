-- Fix search_path for gamification functions
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSON;
    v_current_streak INTEGER;
    v_longest_streak INTEGER;
    v_last_date DATE;
    v_today DATE := CURRENT_DATE;
BEGIN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date)
    VALUES (p_user_id, 0, 0, NULL)
    ON CONFLICT (user_id) DO NOTHING;
    
    SELECT current_streak, longest_streak, last_activity_date
    INTO v_current_streak, v_longest_streak, v_last_date
    FROM user_streaks
    WHERE user_id = p_user_id;
    
    IF v_last_date IS NULL OR v_last_date < v_today - INTERVAL '1 day' THEN
        v_current_streak := 1;
    ELSIF v_last_date = v_today - INTERVAL '1 day' THEN
        v_current_streak := v_current_streak + 1;
    ELSIF v_last_date = v_today THEN
        NULL;
    END IF;
    
    IF v_current_streak > v_longest_streak THEN
        v_longest_streak := v_current_streak;
    END IF;
    
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
$$;

CREATE OR REPLACE FUNCTION add_user_xp(
    p_user_id UUID,
    p_xp_amount INTEGER,
    p_action_type TEXT,
    p_description TEXT DEFAULT NULL
)
RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSON;
    v_total_xp INTEGER;
    v_new_level INTEGER;
    v_today DATE := CURRENT_DATE;
BEGIN
    INSERT INTO user_xp (user_id, total_xp, level, xp_today, last_xp_date)
    VALUES (p_user_id, 0, 1, 0, v_today)
    ON CONFLICT (user_id) DO NOTHING;
    
    UPDATE user_xp
    SET xp_today = 0, last_xp_date = v_today
    WHERE user_id = p_user_id AND last_xp_date < v_today;
    
    UPDATE user_xp
    SET 
        total_xp = total_xp + p_xp_amount,
        xp_today = xp_today + p_xp_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING total_xp INTO v_total_xp;
    
    v_new_level := GREATEST(1, (v_total_xp / 500) + 1);
    
    UPDATE user_xp
    SET level = v_new_level
    WHERE user_id = p_user_id;
    
    INSERT INTO xp_history (user_id, xp_amount, action_type, description)
    VALUES (p_user_id, p_xp_amount, p_action_type, p_description);
    
    SELECT json_build_object(
        'total_xp', v_total_xp,
        'level', v_new_level,
        'xp_added', p_xp_amount
    ) INTO v_result;
    
    RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION get_user_gamification_stats(p_user_id UUID)
RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;