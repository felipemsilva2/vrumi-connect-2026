-- Create study_chapters table
CREATE TABLE public.study_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  order_number INTEGER NOT NULL,
  icon TEXT,
  estimated_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create study_lessons table
CREATE TABLE public.study_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES public.study_chapters(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  order_number INTEGER NOT NULL,
  estimated_time TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create flashcards table
CREATE TABLE public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES public.study_chapters(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.study_lessons(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create quiz_questions table
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES public.study_chapters(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option TEXT CHECK (correct_option IN ('A', 'B', 'C', 'D')) NOT NULL,
  explanation TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_progress table
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.study_lessons(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT false,
  completion_date TIMESTAMP WITH TIME ZONE,
  time_spent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Create user_flashcard_stats table
CREATE TABLE public.user_flashcard_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  flashcard_id UUID REFERENCES public.flashcards(id) ON DELETE CASCADE NOT NULL,
  times_reviewed INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  times_incorrect INTEGER DEFAULT 0,
  last_reviewed TIMESTAMP WITH TIME ZONE,
  next_review TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, flashcard_id)
);

-- Create user_quiz_attempts table
CREATE TABLE public.user_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  quiz_type TEXT CHECK (quiz_type IN ('practice', 'official')) NOT NULL,
  chapter_id UUID REFERENCES public.study_chapters(id) ON DELETE SET NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  score_percentage INTEGER NOT NULL,
  time_taken INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_quiz_answers table
CREATE TABLE public.user_quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES public.user_quiz_attempts(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.quiz_questions(id) ON DELETE CASCADE NOT NULL,
  selected_option TEXT CHECK (selected_option IN ('A', 'B', 'C', 'D')) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.study_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_flashcard_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public content (chapters, lessons, flashcards, quiz_questions)
CREATE POLICY "Anyone can view study chapters"
  ON public.study_chapters FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view study lessons"
  ON public.study_lessons FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view flashcards"
  ON public.flashcards FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view quiz questions"
  ON public.quiz_questions FOR SELECT
  USING (true);

-- RLS Policies for user data
CREATE POLICY "Users can view own progress"
  ON public.user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.user_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own flashcard stats"
  ON public.user_flashcard_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcard stats"
  ON public.user_flashcard_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcard stats"
  ON public.user_flashcard_stats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own quiz attempts"
  ON public.user_quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz attempts"
  ON public.user_quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own quiz answers"
  ON public.user_quiz_answers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_quiz_attempts
    WHERE user_quiz_attempts.id = user_quiz_answers.attempt_id
    AND user_quiz_attempts.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own quiz answers"
  ON public.user_quiz_answers FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_quiz_attempts
    WHERE user_quiz_attempts.id = user_quiz_answers.attempt_id
    AND user_quiz_attempts.user_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX idx_study_lessons_chapter_id ON public.study_lessons(chapter_id);
CREATE INDEX idx_flashcards_chapter_id ON public.flashcards(chapter_id);
CREATE INDEX idx_quiz_questions_chapter_id ON public.quiz_questions(chapter_id);
CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX idx_user_flashcard_stats_user_id ON public.user_flashcard_stats(user_id);
CREATE INDEX idx_user_quiz_attempts_user_id ON public.user_quiz_attempts(user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_study_chapters_updated_at
  BEFORE UPDATE ON public.study_chapters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_study_lessons_updated_at
  BEFORE UPDATE ON public.study_lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at
  BEFORE UPDATE ON public.flashcards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quiz_questions_updated_at
  BEFORE UPDATE ON public.quiz_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_flashcard_stats_updated_at
  BEFORE UPDATE ON public.user_flashcard_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();