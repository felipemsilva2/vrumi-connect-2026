-- Criar tabela de atividades diárias para tracking de estudo
CREATE TABLE public.daily_study_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  study_date DATE NOT NULL,
  hours_studied NUMERIC(4,2) DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  flashcards_reviewed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, study_date)
);

-- Habilitar RLS
ALTER TABLE public.daily_study_activities ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view own daily activities"
  ON public.daily_study_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily activities"
  ON public.daily_study_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily activities"
  ON public.daily_study_activities FOR UPDATE
  USING (auth.uid() = user_id);

-- Índice para performance
CREATE INDEX idx_daily_activities_user_date ON public.daily_study_activities(user_id, study_date DESC);

-- Trigger para updated_at
CREATE TRIGGER update_daily_study_activities_updated_at
  BEFORE UPDATE ON public.daily_study_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();