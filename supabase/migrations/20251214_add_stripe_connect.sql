-- Migration: Add Stripe Connect columns to instructors table
-- This enables instructor payout functionality with Stripe Connect

-- Add Stripe Connect account ID
ALTER TABLE instructors 
ADD COLUMN IF NOT EXISTS stripe_account_id text;

-- Add onboarding status
ALTER TABLE instructors 
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean DEFAULT false;

-- Add payment intent ID to bookings for tracking
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_instructors_stripe_account_id 
ON instructors(stripe_account_id) 
WHERE stripe_account_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN instructors.stripe_account_id IS 'Stripe Connect Express account ID for payouts';
COMMENT ON COLUMN instructors.stripe_onboarding_complete IS 'Whether instructor completed Stripe onboarding';
COMMENT ON COLUMN bookings.stripe_payment_intent_id IS 'Stripe PaymentIntent ID for tracking payment status';
