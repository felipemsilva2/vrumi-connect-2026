import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return new Response(JSON.stringify({ error: 'Missing stripe-signature' }), { status: 400 });
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || "", {
    apiVersion: "2025-08-27.basil",
  });
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || "";

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status !== 'paid') {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    const passType = session.metadata?.pass_type;
    const userId = session.metadata?.user_id;
    const secondUserEmail = session.metadata?.second_user_email || '';
    if (!passType || !userId) {
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
      });
      if (secondUser) {
        await supabase.from('user_passes').insert({
          user_id: secondUser.id,
          pass_type: passType,
          price: price / 2,
          expires_at: expiresAt.toISOString(),
          payment_status: 'completed',
        });
      }
    } else {
      await supabase.from('user_passes').insert({
        user_id: userId,
        pass_type: passType,
        price,
        expires_at: expiresAt.toISOString(),
        payment_status: 'completed',
      });
    }
  }

  // Handle Stripe Connect: Account Updated (onboarding complete)
  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account;

    // Check if onboarding is complete
    if (account.charges_enabled && account.payouts_enabled) {
      console.log(`[WEBHOOK] Account ${account.id} onboarding complete`);

      await supabase
        .from('instructors')
        .update({ stripe_onboarding_complete: true })
        .eq('stripe_account_id', account.id);
    }
  }

  // Handle Stripe Connect: PaymentIntent Succeeded (lesson paid)
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const bookingId = paymentIntent.metadata?.booking_id;

    if (bookingId) {
      console.log(`[WEBHOOK] Payment succeeded for booking ${bookingId}`);

      await supabase
        .from('bookings')
        .update({
          payment_status: 'completed',
          status: 'confirmed',
        })
        .eq('id', bookingId);

      // Create transaction record for instructor earnings
      const instructorId = paymentIntent.metadata?.instructor_id;
      const platformFee = parseInt(paymentIntent.metadata?.platform_fee || '0');
      const instructorAmount = paymentIntent.amount - platformFee;

      if (instructorId) {
        await supabase.from('transactions').insert({
          instructor_id: instructorId,
          booking_id: bookingId,
          amount: instructorAmount / 100, // Convert cents to BRL
          type: 'earning',
          status: 'completed',
          description: 'Pagamento de aula',
        });
      }
    }
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});