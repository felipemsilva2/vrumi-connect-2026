-- 1. Adiciona stripe_session_id na tabela user_passes
ALTER TABLE user_passes 
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT UNIQUE;

-- 2. Adiciona stripe_payment_intent_id na tabela instructor_transactions (ajustado nome correto)
ALTER TABLE instructor_transactions 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT UNIQUE;

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_passes_stripe_session_id 
ON user_passes(stripe_session_id) WHERE stripe_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_instructor_transactions_stripe_payment_intent_id 
ON instructor_transactions(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;