// @ts-nocheck - Deno Edge Function, TypeScript checks suppressed for IDE compatibility
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// Secure logging - never log sensitive data
const logWebhook = (level: 'INFO' | 'WARN' | 'ERROR', message: string, details?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString();
  const safeDetails = details ? JSON.stringify(details) : '';
  console.log(`[${timestamp}] [STRIPE-WEBHOOK] [${level}] ${message} ${safeDetails}`);
};

serve(async (req) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    logWebhook('WARN', 'Method not allowed', { method: req.method });
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Validate stripe-signature header
  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    logWebhook('ERROR', 'Missing stripe-signature header');
    return new Response(JSON.stringify({ error: 'Missing stripe-signature' }), { status: 400 });
  }

  // CRITICAL: Validate webhook secret is configured
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!webhookSecret || webhookSecret === '') {
    logWebhook('ERROR', 'STRIPE_WEBHOOK_SECRET not configured - BLOCKING REQUEST');
    return new Response(JSON.stringify({ error: 'Webhook not configured' }), { status: 500 });
  }

  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeSecretKey || stripeSecretKey === '') {
    logWebhook('ERROR', 'STRIPE_SECRET_KEY not configured');
    return new Response(JSON.stringify({ error: 'Stripe not configured' }), { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-08-27.basil",
  });

  // Parse and validate event signature
  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logWebhook('ERROR', 'Invalid webhook signature', { error: errorMessage });
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
  }

  logWebhook('INFO', 'Event received', {
    type: event.type,
    eventId: event.id,
    livemode: event.livemode
  });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Handle checkout.session.completed (Education passes)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      // Idempotency check: verify if this session was already processed
      const { data: existingPass } = await supabase
        .from('user_passes')
        .select('id')
        .eq('stripe_session_id', session.id)
        .single();

      if (existingPass) {
        logWebhook('INFO', 'Session already processed (idempotent)', { sessionId: session.id });
        return new Response(JSON.stringify({ success: true, idempotent: true }), { status: 200 });
      }

      if (session.payment_status !== 'paid') {
        logWebhook('INFO', 'Session not paid, skipping', { status: session.payment_status });
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      const passType = session.metadata?.pass_type;
      const userId = session.metadata?.user_id;
      const secondUserEmail = session.metadata?.second_user_email || '';

      if (!passType || !userId) {
        logWebhook('ERROR', 'Missing metadata in session', { sessionId: session.id });
        return new Response(JSON.stringify({ error: 'Missing metadata' }), { status: 400 });
      }

      const durationMap: Record<string, number> = {
        'individual_30_days': 30,
        'individual_90_days': 90,
        'family_90_days': 90,
      };
      const priceMap: Record<string, number> = {
        'individual_30_days': 29.90,
        'individual_90_days': 79.90,
        'family_90_days': 84.90,
      };
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (durationMap[passType] || 30));
      const price = priceMap[passType] || 0;

      if (passType === 'family_90_days' && secondUserEmail) {
        const { data: users } = await supabase.auth.admin.listUsers();
        const secondUser = users?.users?.find(u => u.email === secondUserEmail);

        await supabase.from('user_passes').insert({
          user_id: userId,
          pass_type: passType,
          price: price / 2,
          expires_at: expiresAt.toISOString(),
          payment_status: 'completed',
          stripe_session_id: session.id, // For idempotency
        });

        if (secondUser) {
          await supabase.from('user_passes').insert({
            user_id: secondUser.id,
            pass_type: passType,
            price: price / 2,
            expires_at: expiresAt.toISOString(),
            payment_status: 'completed',
            stripe_session_id: `${session.id}_secondary`, // Unique for secondary user
          });
        }
      } else {
        await supabase.from('user_passes').insert({
          user_id: userId,
          pass_type: passType,
          price,
          expires_at: expiresAt.toISOString(),
          payment_status: 'completed',
          stripe_session_id: session.id, // For idempotency
        });
      }

      logWebhook('INFO', 'Checkout session processed', { sessionId: session.id, passType, userId });
    }

    // Handle Stripe Connect: Account Updated (onboarding complete)
    if (event.type === 'account.updated') {
      const account = event.data.object as Stripe.Account;

      // Check if onboarding is complete
      if (account.charges_enabled && account.payouts_enabled) {
        logWebhook('INFO', 'Account onboarding complete', { accountId: account.id });

        const { error } = await supabase
          .from('instructors')
          .update({ stripe_onboarding_complete: true })
          .eq('stripe_account_id', account.id);

        if (error) {
          logWebhook('ERROR', 'Failed to update instructor onboarding status', { accountId: account.id, error: error.message });
        }
      }
    }

    // Handle Stripe Connect: PaymentIntent Succeeded (lesson paid)
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const bookingId = paymentIntent.metadata?.booking_id;

      if (bookingId) {
        // Idempotency check: verify if transaction already exists
        const { data: existingTransaction } = await supabase
          .from('transactions')
          .select('id')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single();

        if (existingTransaction) {
          logWebhook('INFO', 'PaymentIntent already processed (idempotent)', {
            paymentIntentId: paymentIntent.id,
            bookingId
          });
          return new Response(JSON.stringify({ success: true, idempotent: true }), { status: 200 });
        }

        logWebhook('INFO', 'Payment succeeded', { paymentIntentId: paymentIntent.id, bookingId });

        const { error: bookingError } = await supabase
          .from('bookings')
          .update({
            payment_status: 'completed',
            status: 'confirmed',
          })
          .eq('id', bookingId);

        if (bookingError) {
          logWebhook('ERROR', 'Failed to update booking', { bookingId, error: bookingError.message });
        }

        // Create transaction record for instructor earnings
        const instructorId = paymentIntent.metadata?.instructor_id;
        const platformFee = parseInt(paymentIntent.metadata?.platform_fee || '0');
        const instructorAmount = paymentIntent.amount - platformFee;

        if (instructorId) {
          const { error: txError } = await supabase.from('transactions').insert({
            instructor_id: instructorId,
            booking_id: bookingId,
            amount: instructorAmount / 100, // Convert cents to BRL
            type: 'earning',
            status: 'completed',
            description: 'Pagamento de aula',
            stripe_payment_intent_id: paymentIntent.id, // For idempotency
          });

          if (txError) {
            logWebhook('ERROR', 'Failed to create transaction', {
              bookingId,
              instructorId,
              error: txError.message
            });
          } else {
            logWebhook('INFO', 'Transaction created', {
              bookingId,
              instructorId,
              amount: instructorAmount / 100
            });
          }
        }
      }
    }

    // Handle PaymentIntent Failed
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const bookingId = paymentIntent.metadata?.booking_id;

      if (bookingId) {
        logWebhook('WARN', 'Payment failed', {
          paymentIntentId: paymentIntent.id,
          bookingId,
          failureMessage: paymentIntent.last_payment_error?.message
        });

        await supabase
          .from('bookings')
          .update({
            payment_status: 'failed',
            status: 'cancelled',
          })
          .eq('id', bookingId);
      }
    }

    // Handle Charge Refunded (full or partial refund)
    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = charge.payment_intent as string;

      if (paymentIntentId) {
        // Get booking by payment intent ID
        const { data: booking } = await supabase
          .from('bookings')
          .select('id, instructor_id')
          .eq('stripe_payment_intent_id', paymentIntentId)
          .single();

        if (booking) {
          const isFullRefund = charge.amount_refunded === charge.amount;

          logWebhook('WARN', 'Charge refunded', {
            chargeId: charge.id,
            paymentIntentId,
            bookingId: booking.id,
            amountRefunded: charge.amount_refunded / 100,
            isFullRefund
          });

          if (isFullRefund) {
            // Full refund: cancel booking and mark transaction as refunded
            await supabase
              .from('bookings')
              .update({
                payment_status: 'refunded',
                status: 'cancelled',
                cancellation_reason: 'Reembolso processado via Stripe',
                cancelled_at: new Date().toISOString(),
              })
              .eq('id', booking.id);

            // Create refund transaction record
            if (booking.instructor_id) {
              await supabase.from('transactions').insert({
                instructor_id: booking.instructor_id,
                booking_id: booking.id,
                amount: -(charge.amount_refunded / 100), // Negative for refund
                type: 'refund',
                status: 'completed',
                description: 'Reembolso de aula',
                stripe_payment_intent_id: `${paymentIntentId}_refund`,
              });
            }

            logWebhook('INFO', 'Full refund processed', { bookingId: booking.id });
          } else {
            // Partial refund: just log, don't change booking status
            logWebhook('INFO', 'Partial refund processed (no status change)', {
              bookingId: booking.id,
              amountRefunded: charge.amount_refunded / 100
            });
          }
        }
      }
    }

    // Handle Account Deauthorized (instructor disconnected their Stripe account)
    if (event.type === 'account.application.deauthorized') {
      const account = event.data.object as Stripe.Account;

      logWebhook('WARN', 'Account deauthorized', { accountId: account.id });

      // Mark instructor as having incomplete onboarding (they need to reconnect)
      const { data: instructor, error } = await supabase
        .from('instructors')
        .update({
          stripe_onboarding_complete: false,
          // Note: We keep stripe_account_id for reference, but it's now invalid
        })
        .eq('stripe_account_id', account.id)
        .select('id, full_name')
        .single();

      if (error) {
        logWebhook('ERROR', 'Failed to update deauthorized instructor', {
          accountId: account.id,
          error: error.message
        });
      } else if (instructor) {
        logWebhook('WARN', 'Instructor Stripe account deauthorized', {
          instructorId: instructor.id,
          instructorName: instructor.full_name,
          accountId: account.id
        });

        // Cancel any pending bookings for this instructor (they can't receive payments)
        const { data: pendingBookings } = await supabase
          .from('bookings')
          .update({
            status: 'cancelled',
            cancellation_reason: 'Instrutor desconectou conta de pagamento',
            cancelled_at: new Date().toISOString(),
          })
          .eq('instructor_id', instructor.id)
          .eq('status', 'pending')
          .select('id');

        if (pendingBookings && pendingBookings.length > 0) {
          logWebhook('WARN', 'Cancelled pending bookings due to deauthorization', {
            instructorId: instructor.id,
            cancelledCount: pendingBookings.length
          });
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logWebhook('ERROR', 'Webhook processing error', {
      eventType: event.type,
      eventId: event.id,
      error: errorMessage
    });
    // Return 200 to prevent Stripe from retrying (we logged the error)
    // For critical errors, consider returning 500 to trigger retry
    return new Response(JSON.stringify({ error: 'Processing error' }), { status: 500 });
  }
});