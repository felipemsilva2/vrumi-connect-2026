-- Fix the specific question pointing to incorrect R-10 instead of R-9
UPDATE public.quiz_questions
SET 
  question_text = 'A placa de regulamentação R-9 (''PROIBIDO TRÂNSITO DE CAMINHÕES'') proíbe o trânsito de caminhões. Qual a exceção para essa proibição, se houver?',
  image_url = '/traffic-signs/regulamentacao/r9-proibido-transito-caminhoes.png',
  correct_option = 'A' -- Ensure correct option is still valid (assuming text didn't change meaning)
WHERE 
  question_text LIKE '%R-10%PROIBIDO TRÂNSITO DE CAMINHÕES%';

-- Create function to fetch random questions for simulations
CREATE OR REPLACE FUNCTION get_random_quiz_questions(limit_count INT)
RETURNS SETOF quiz_questions
LANGUAGE sql
AS $$
  SELECT *
  FROM quiz_questions
  ORDER BY random()
  LIMIT limit_count;
$$;
