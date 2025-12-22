// @ts-nocheck - Deno Edge Function, TypeScript checks suppressed for IDE compatibility
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logWebhook = (level: 'INFO' | 'WARN' | 'ERROR', message: string, details?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString();
  const safeDetails = details ? JSON.stringify(details) : '';
  console.log(`[${timestamp}] [STRIPE-WEBHOOK] [${level}] ${message} ${safeDetails}`);
};

serve(async (req) => {
  if (req.method !== 'POST') {
    logWebhook('WARN', 'Method not allowed', { method: req.method });
    return new Response('Method Not Allowed', { status: 405 });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    logWebhook('ERROR', 'Missing stripe-signature header');
    return new Response(JSON.stringify({ error: 'Missing stripe-signature' }), { status: 400 });
  }

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

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-08-27.basil" });

  const rawBody = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logWebhook('ERROR', 'Invalid webhook signature', { error: errorMessage });
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
  }

  logWebhook('INFO', 'Event received', { type: event.type, eventId: event.id, livemode: event.livemode });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { data: existingPass } = await supabase.from('user_passes').select('id').eq('stripe_session_id', session.id).single();
      if (existingPass) {
        logWebhook('INFO', 'Session already processed', { sessionId: session.id });
        return new Response(JSON.stringify({ success: true, idempotent: true }), { status: 200 });
      }
      if (session.payment_status !== 'paid') return new Response(JSON.stringify({ success: true }), { status: 200 });

      const passType = session.metadata?.pass_type;
      const userId = session.metadata?.user_id;
      if (!passType || !userId) return new Response(JSON.stringify({ error: 'Missing metadata' }), { status: 400 });

      const durationMap = { 'individual_30_days': 30, 'individual_90_days': 90, 'family_90_days': 90 };
      const priceMap = { 'individual_30_days': 29.90, 'individual_90_days': 79.90, 'family_90_days': 84.90 };
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (durationMap[passType] || 30));

      await supabase.from('user_passes').insert({
        user_id: userId, pass_type: passType, price: priceMap[passType] || 0,
        expires_at: expiresAt.toISOString(), payment_status: 'completed', stripe_session_id: session.id
      });
      logWebhook('INFO', 'Checkout processed', { sessionId: session.id });
    }

    // account.updated
    if (event.type === 'account.updated') {
      const account = event.data.object;
      if (account.charges_enabled && account.payouts_enabled) {
        await supabase.from('instructors').update({ stripe_onboarding_complete: true }).eq('stripe_account_id', account.id);
        logWebhook('INFO', 'Account onboarding complete', { accountId: account.id });
      }
    }

    // payment_intent.succeeded
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const bookingId = paymentIntent.metadata?.booking_id;
      if (bookingId) {
        const { data: existingTx } = await supabase.from('instructor_transactions').select('id').eq('stripe_payment_intent_id', paymentIntent.id).single();
        if (existingTx) return new Response(JSON.stringify({ success: true, idempotent: true }), { status: 200 });

        await supabase.from('bookings').update({ payment_status: 'completed', status: 'confirmed' }).eq('id', bookingId);

        const instructorId = paymentIntent.metadata?.instructor_id;
        const platformFee = parseInt(paymentIntent.metadata?.platform_fee || '0');
        if (instructorId) {
          await supabase.from('instructor_transactions').insert({
            instructor_id: instructorId, booking_id: bookingId,
            amount: (paymentIntent.amount - platformFee) / 100, type: 'earning', status: 'completed',
            description: 'Pagamento de aula', stripe_payment_intent_id: paymentIntent.id
          });
        }
        logWebhook('INFO', 'Payment succeeded', { bookingId });
      }
    }

    // payment_intent.payment_failed
    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      const bookingId = paymentIntent.metadata?.booking_id;
      if (bookingId) {
        await supabase.from('bookings').update({ payment_status: 'failed', status: 'cancelled' }).eq('id', bookingId);
        logWebhook('WARN', 'Payment failed', { bookingId });
      }
    }

    // charge.refunded
    if (event.type === 'charge.refunded') {
      const charge = event.data.object;
      const paymentIntentId = charge.payment_intent;
      if (paymentIntentId) {
        // Idempotency check: verify this refund hasn't been processed
        const refundTxId = `${paymentIntentId}_refund`;
        const { data: existingRefund } = await supabase
          .from('instructor_transactions')
          .select('id')
          .eq('stripe_payment_intent_id', refundTxId)
          .single();

        if (existingRefund) {
          logWebhook('INFO', 'Refund already processed', { paymentIntentId });
          return new Response(JSON.stringify({ success: true, idempotent: true }), { status: 200 });
        }

        const { data: booking } = await supabase.from('bookings').select('id, instructor_id').eq('stripe_payment_intent_id', paymentIntentId).single();
        if (booking && charge.amount_refunded === charge.amount) {
          await supabase.from('bookings').update({
            payment_status: 'refunded', status: 'cancelled',
            cancellation_reason: 'Reembolso processado via Stripe', cancelled_at: new Date().toISOString()
          }).eq('id', booking.id);
          if (booking.instructor_id) {
            await supabase.from('instructor_transactions').insert({
              instructor_id: booking.instructor_id, booking_id: booking.id,
              amount: -(charge.amount_refunded / 100), type: 'refund', status: 'completed',
              description: 'Reembolso de aula', stripe_payment_intent_id: refundTxId
            });
          }
          logWebhook('INFO', 'Full refund processed', { bookingId: booking.id });
        }
      }
    }

    // account.application.deauthorized
    if (event.type === 'account.application.deauthorized') {
      const account = event.data.object;
      const { data: instructor } = await supabase.from('instructors')
        .update({ stripe_onboarding_complete: false }).eq('stripe_account_id', account.id).select('id').single();
      if (instructor) {
        await supabase.from('bookings').update({
          status: 'cancelled', cancellation_reason: 'Instrutor desconectou conta de pagamento', cancelled_at: new Date().toISOString()
        }).eq('instructor_id', instructor.id).eq('status', 'pending');
        logWebhook('WARN', 'Account deauthorized', { instructorId: instructor.id });
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logWebhook('ERROR', 'Webhook processing error', { eventType: event.type, error: errorMessage });
    return new Response(JSON.stringify({ error: 'Processing error' }), { status: 500 });
  }
});
