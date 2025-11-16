-- Create challenge rankings table
CREATE TABLE IF NOT EXISTS public.challenge_rankings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 0,
    time_remaining INTEGER NOT NULL DEFAULT 0, -- seconds remaining
    accuracy DECIMAL(5,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category, DATE(created_at)) -- One ranking per user per category per day
);

-- Create index for performance
CREATE INDEX idx_challenge_rankings_user_id ON public.challenge_rankings(user_id);
CREATE INDEX idx_challenge_rankings_category ON public.challenge_rankings(category);
CREATE INDEX idx_challenge_rankings_score ON public.challenge_rankings(score DESC);
CREATE INDEX idx_challenge_rankings_date ON public.challenge_rankings(DATE(created_at));

-- Enable RLS
ALTER TABLE public.challenge_rankings ENABLE ROW LEVEL SECURITY;

-- Policies: Users can see all rankings but only manage their own
CREATE POLICY "Users can view all rankings" ON public.challenge_rankings
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own rankings" ON public.challenge_rankings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rankings" ON public.challenge_rankings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own rankings" ON public.challenge_rankings
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenge_rankings TO authenticated;
GRANT SELECT ON public.challenge_rankings TO anon;

-- Function to save challenge result
CREATE OR REPLACE FUNCTION public.save_challenge_result(
    p_user_id UUID,
    p_category VARCHAR(50),
    p_score INTEGER,
    p_correct_answers INTEGER,
    p_total_questions INTEGER,
    p_time_remaining INTEGER
) RETURNS JSON AS $$
DECLARE
    v_accuracy DECIMAL(5,2);
    v_ranking_position INTEGER;
    v_personal_best_score INTEGER;
    v_response JSON;
BEGIN
    -- Calculate accuracy
    v_accuracy := CASE 
        WHEN p_total_questions > 0 THEN ROUND((p_correct_answers::DECIMAL / p_total_questions) * 100, 2)
        ELSE 0
    END;

    -- Insert or update today's ranking
    INSERT INTO public.challenge_rankings (
        user_id, category, score, correct_answers, 
        total_questions, time_remaining, accuracy
    ) VALUES (
        p_user_id, p_category, p_score, p_correct_answers,
        p_total_questions, p_time_remaining, v_accuracy
    )
    ON CONFLICT (user_id, category, DATE(created_at))
    DO UPDATE SET
        score = GREATEST(public.challenge_rankings.score, EXCLUDED.score),
        correct_answers = GREATEST(public.challenge_rankings.correct_answers, EXCLUDED.correct_answers),
        total_questions = EXCLUDED.total_questions,
        time_remaining = EXCLUDED.time_remaining,
        accuracy = GREATEST(public.challenge_rankings.accuracy, EXCLUDED.accuracy),
        created_at = NOW();

    -- Get ranking position
    SELECT COUNT(*) + 1 INTO v_ranking_position
    FROM public.challenge_rankings
    WHERE category = p_category 
    AND DATE(created_at) = CURRENT_DATE
    AND score > p_score;

    -- Get personal best score for this category
    SELECT COALESCE(MAX(score), 0) INTO v_personal_best_score
    FROM public.challenge_rankings
    WHERE user_id = p_user_id 
    AND category = p_category;

    -- Return result info
    SELECT json_build_object(
        'ranking_position', v_ranking_position,
        'personal_best_score', v_personal_best_score,
        'is_new_personal_best', p_score > v_personal_best_score,
        'accuracy', v_accuracy,
        'score', p_score
    ) INTO v_response;

    RETURN v_response;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get leaderboard for a category
CREATE OR REPLACE FUNCTION public.get_challenge_leaderboard(
    p_category VARCHAR(50),
    p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
    rank_position INTEGER,
    user_id UUID,
    username TEXT,
    score INTEGER,
    correct_answers INTEGER,
    total_questions INTEGER,
    accuracy DECIMAL(5,2),
    time_remaining INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    WITH ranked_scores AS (
        SELECT 
            cr.user_id,
            COALESCE(u.raw_user_meta_data->>'full_name', u.email) as username,
            cr.score,
            cr.correct_answers,
            cr.total_questions,
            cr.accuracy,
            cr.time_remaining,
            cr.created_at,
            RANK() OVER (ORDER BY cr.score DESC, cr.accuracy DESC, cr.time_remaining DESC) as rank_position
        FROM public.challenge_rankings cr
        LEFT JOIN auth.users u ON cr.user_id = u.id
        WHERE cr.category = p_category 
        AND DATE(cr.created_at) = CURRENT_DATE
    )
    SELECT rank_position, user_id, username, score, correct_answers, total_questions, accuracy, time_remaining, created_at
    FROM ranked_scores
    ORDER BY rank_position
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get personal statistics
CREATE OR REPLACE FUNCTION public.get_personal_challenge_stats(
    p_user_id UUID
) RETURNS JSON AS $$
DECLARE
    v_total_challenges INTEGER;
    v_avg_score DECIMAL(10,2);
    v_best_category VARCHAR(50);
    v_total_score INTEGER;
    v_response JSON;
BEGIN
    -- Get total challenges
    SELECT COUNT(*) INTO v_total_challenges
    FROM public.challenge_rankings
    WHERE user_id = p_user_id;

    -- Get average score
    SELECT COALESCE(AVG(score), 0) INTO v_avg_score
    FROM public.challenge_rankings
    WHERE user_id = p_user_id;

    -- Get best category (highest total score)
    SELECT category INTO v_best_category
    FROM public.challenge_rankings
    WHERE user_id = p_user_id
    GROUP BY category
    ORDER BY SUM(score) DESC
    LIMIT 1;

    -- Get total score
    SELECT COALESCE(SUM(score), 0) INTO v_total_score
    FROM public.challenge_rankings
    WHERE user_id = p_user_id;

    RETURN json_build_object(
        'total_challenges', v_total_challenges,
        'average_score', ROUND(v_avg_score, 2),
        'best_category', v_best_category,
        'total_score', v_total_score
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;