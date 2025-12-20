-- Migration: Add idempotency columns for Stripe webhook
-- This ensures duplicate webhook events don't cause duplicate database entries

-- Add stripe_session_id to user_passes for checkout.session.completed idempotency
ALTER TABLE user_passes 
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT UNIQUE;

-- Add stripe_payment_intent_id to transactions for payment_intent.succeeded idempotency
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT UNIQUE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_passes_stripe_session_id 
ON user_passes(stripe_session_id) WHERE stripe_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_stripe_payment_intent_id 
ON transactions(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

-- Comment explaining purpose
COMMENT ON COLUMN user_passes.stripe_session_id IS 'Stripe Checkout Session ID for idempotency check';
COMMENT ON COLUMN transactions.stripe_payment_intent_id IS 'Stripe PaymentIntent ID for idempotency check';
