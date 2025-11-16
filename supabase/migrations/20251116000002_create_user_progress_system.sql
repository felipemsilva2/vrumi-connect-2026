-- Create user_sign_progress table for tracking learning progress
CREATE TABLE IF NOT EXISTS public.user_sign_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sign_id UUID NOT NULL REFERENCES public.traffic_signs(id) ON DELETE CASCADE,
    difficulty_level INTEGER DEFAULT 0 CHECK (difficulty_level >= 0 AND difficulty_level <= 5),
    -- 0 = new, 1 = hard, 2 = medium, 3 = easy, 4 = mastered, 5 = ignored
    last_reviewed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    review_count INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    next_review_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, sign_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_sign_progress_user_id ON public.user_sign_progress(user_id);
CREATE INDEX idx_user_sign_progress_sign_id ON public.user_sign_progress(sign_id);
CREATE INDEX idx_user_sign_progress_next_review ON public.user_sign_progress(next_review_date);
CREATE INDEX idx_user_sign_progress_difficulty ON public.user_sign_progress(difficulty_level);

-- Enable RLS
ALTER TABLE public.user_sign_progress ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only see and manage their own progress
CREATE POLICY "Users can view own progress" ON public.user_sign_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.user_sign_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.user_sign_progress
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress" ON public.user_sign_progress
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_sign_progress TO authenticated;

-- Function to update user progress with smart difficulty adjustment
CREATE OR REPLACE FUNCTION public.update_user_sign_progress(
    p_user_id UUID,
    p_sign_id UUID,
    p_difficulty_response TEXT -- 'easy', 'medium', 'hard'
) RETURNS JSON AS $$
DECLARE
    v_current_progress RECORD;
    v_new_difficulty INTEGER;
    v_next_review INTERVAL;
    v_response JSON;
BEGIN
    -- Get current progress or create new
    SELECT * INTO v_current_progress
    FROM public.user_sign_progress
    WHERE user_id = p_user_id AND sign_id = p_sign_id;

    -- Calculate new difficulty based on response
    IF p_difficulty_response = 'easy' THEN
        -- If easy, decrease difficulty (make it appear less frequently)
        v_new_difficulty := CASE 
            WHEN v_current_progress.difficulty_level IS NULL THEN 3
            WHEN v_current_progress.difficulty_level <= 1 THEN 2
            ELSE LEAST(v_current_progress.difficulty_level - 1, 4)
        END;
        v_next_review := INTERVAL '3 days';
    ELSIF p_difficulty_response = 'medium' THEN
        -- If medium, keep similar difficulty
        v_new_difficulty := CASE 
            WHEN v_current_progress.difficulty_level IS NULL THEN 2
            ELSE v_current_progress.difficulty_level
        END;
        v_next_review := INTERVAL '1 day';
    ELSIF p_difficulty_response = 'hard' THEN
        -- If hard, increase difficulty (make it appear more frequently)
        v_new_difficulty := CASE 
            WHEN v_current_progress.difficulty_level IS NULL THEN 1
            WHEN v_current_progress.difficulty_level >= 4 THEN 1
            ELSE GREATEST(v_current_progress.difficulty_level + 1, 1)
        END;
        v_next_review := INTERVAL '30 minutes';
    ELSE
        RAISE EXCEPTION 'Invalid difficulty response. Use: easy, medium, hard';
    END IF;

    -- Insert or update progress
    INSERT INTO public.user_sign_progress (
        user_id, sign_id, difficulty_level, last_reviewed, 
        review_count, correct_count, incorrect_count, next_review_date
    ) VALUES (
        p_user_id, p_sign_id, v_new_difficulty, NOW(),
        1, 
        CASE WHEN p_difficulty_response = 'easy' THEN 1 ELSE 0 END,
        CASE WHEN p_difficulty_response = 'hard' THEN 1 ELSE 0 END,
        NOW() + v_next_review
    )
    ON CONFLICT (user_id, sign_id) 
    DO UPDATE SET
        difficulty_level = EXCLUDED.difficulty_level,
        last_reviewed = EXCLUDED.last_reviewed,
        review_count = public.user_sign_progress.review_count + 1,
        correct_count = public.user_sign_progress.correct_count + 
            CASE WHEN p_difficulty_response = 'easy' THEN 1 ELSE 0 END,
        incorrect_count = public.user_sign_progress.incorrect_count + 
            CASE WHEN p_difficulty_response = 'hard' THEN 1 ELSE 0 END,
        next_review_date = NOW() + v_next_review,
        updated_at = NOW();

    -- Return updated progress info
    SELECT json_build_object(
        'difficulty_level', v_new_difficulty,
        'next_review_hours', EXTRACT(HOURS FROM v_next_review),
        'total_reviews', COALESCE(v_current_progress.review_count + 1, 1),
        'accuracy', CASE 
            WHEN v_current_progress.review_count > 0 THEN
                ROUND((v_current_progress.correct_count + 
                    CASE WHEN p_difficulty_response = 'easy' THEN 1 ELSE 0 END)::numeric / 
                    (v_current_progress.review_count + 1) * 100, 1)
            ELSE 100.0
        END
    ) INTO v_response;

    RETURN v_response;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get signs for study with smart prioritization
CREATE OR REPLACE FUNCTION public.get_signs_for_study(
    p_user_id UUID,
    p_category TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 20
) RETURNS TABLE (
    id UUID,
    code VARCHAR(10),
    name VARCHAR(255),
    category VARCHAR(50),
    image_url TEXT,
    description TEXT,
    user_difficulty INTEGER,
    priority_score INTEGER,
    next_review TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ts.id,
        ts.code,
        ts.name,
        ts.category,
        ts.image_url,
        ts.description,
        COALESCE(usp.difficulty_level, 0) as user_difficulty,
        -- Priority score: higher = more urgent to review
        CASE 
            WHEN usp.next_review_date IS NULL THEN 100  -- New signs get high priority
            WHEN usp.next_review_date <= NOW() THEN 90 -- Overdue reviews
            WHEN usp.difficulty_level = 1 THEN 80       -- Hard signs
            WHEN usp.difficulty_level = 2 THEN 60     -- Medium signs
            WHEN usp.difficulty_level = 3 THEN 40       -- Easy signs
            WHEN usp.difficulty_level >= 4 THEN 20      -- Mastered signs
            ELSE 50
        END as priority_score,
        usp.next_review_date
    FROM public.traffic_signs ts
    LEFT JOIN public.user_sign_progress usp ON ts.id = usp.sign_id AND usp.user_id = p_user_id
    WHERE (p_category IS NULL OR ts.category = p_category)
    AND (usp.difficulty_level IS NULL OR usp.difficulty_level < 4) -- Exclude mastered signs
    ORDER BY priority_score DESC, ts.code ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get category progress for a user
CREATE OR REPLACE FUNCTION public.get_category_progress(
    p_user_id UUID,
    p_category TEXT
) RETURNS JSON AS $$
DECLARE
    v_total_signs INTEGER;
    v_reviewed_signs INTEGER;
    v_mastered_signs INTEGER;
    v_avg_difficulty DECIMAL;
    v_progress_percentage DECIMAL;
BEGIN
    -- Get total signs in category
    SELECT COUNT(*) INTO v_total_signs
    FROM public.traffic_signs
    WHERE category = p_category;

    -- Get reviewed signs
    SELECT COUNT(*) INTO v_reviewed_signs
    FROM public.traffic_signs ts
    INNER JOIN public.user_sign_progress usp ON ts.id = usp.sign_id
    WHERE usp.user_id = p_user_id AND ts.category = p_category;

    -- Get mastered signs (difficulty >= 4)
    SELECT COUNT(*) INTO v_mastered_signs
    FROM public.traffic_signs ts
    INNER JOIN public.user_sign_progress usp ON ts.id = usp.sign_id
    WHERE usp.user_id = p_user_id AND ts.category = p_category AND usp.difficulty_level >= 4;

    -- Get average difficulty
    SELECT COALESCE(AVG(difficulty_level), 0) INTO v_avg_difficulty
    FROM public.user_sign_progress usp
    INNER JOIN public.traffic_signs ts ON usp.sign_id = ts.id
    WHERE usp.user_id = p_user_id AND ts.category = p_category;

    -- Calculate progress percentage (0-100)
    v_progress_percentage := CASE 
        WHEN v_total_signs = 0 THEN 0
        ELSE ROUND((v_mastered_signs::DECIMAL / v_total_signs) * 100, 1)
    END;

    RETURN json_build_object(
        'total_signs', v_total_signs,
        'reviewed_signs', v_reviewed_signs,
        'mastered_signs', v_mastered_signs,
        'avg_difficulty', ROUND(v_avg_difficulty, 1),
        'progress_percentage', v_progress_percentage
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;