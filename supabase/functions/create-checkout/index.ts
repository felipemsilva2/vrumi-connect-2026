import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const getCors = (req: Request) => {
  const origin = req.headers.get('origin') || '';
  const allowedList = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(s => s.trim()).filter(Boolean);
  const allowed = allowedList.length === 0 || allowedList.includes(origin);
  const headers = {
    'Access-Control-Allow-Origin': allowed ? origin : '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
  return { headers, allowed };
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

// Mapping pass types to Stripe price_ids
const PASS_PRICE_MAP: Record<string, string> = {
  'individual_30_days': 'price_1SRv6IBn4R59TxYiEOHYZaec',
  'individual_90_days': 'price_1SRv6VBn4R59TxYimqMYExYf',
  'family_90_days': 'price_1SRv6jBn4R59TxYiOHUtX9kE',
};

// Pass prices in cents for coupon calculation
const PASS_PRICES: Record<string, number> = {
  'individual_30_days': 2990,
  'individual_90_days': 7990,
  'family_90_days': 8490,
};

serve(async (req) => {
  const { headers: corsHeaders, allowed } = getCors(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: allowed ? 200 : 403 });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    logStep("User authenticated", { userId: user.id, email: user.email });

    const { passType, secondUserEmail, couponCode } = await req.json();

    if (!passType || !PASS_PRICE_MAP[passType]) {
      throw new Error(`Invalid pass type: ${passType}`);
    }

    logStep("Pass type received", { passType, secondUserEmail, couponCode });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("No existing customer found");
    }

    // Handle coupon logic
    let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined = undefined;
    let couponId: string | null = null;

    if (couponCode) {
      logStep("Validating coupon", { couponCode });

      const { data: coupon, error: couponError } = await supabaseClient
        .from('coupons')
        .select('*')
        .eq('code', couponCode)
        .single();

      if (!couponError && coupon && coupon.is_active) {
        const now = new Date();
        const expiresAt = coupon.expires_at ? new Date(coupon.expires_at) : null;
        const isExpired = expiresAt && expiresAt < now;
        const isLimitReached = coupon.max_uses && coupon.used_count >= coupon.max_uses;

        if (!isExpired && !isLimitReached) {
          couponId = coupon.id;

          // Calculate discount amount in cents
          const originalPrice = PASS_PRICES[passType];
          let discountAmount = 0;
          if (coupon.discount_type === 'percentage') {
            discountAmount = Math.round(originalPrice * (coupon.discount_value / 100));
          } else if (coupon.discount_type === 'fixed') {
            discountAmount = Math.round(coupon.discount_value * 100); // Convert reais to cents
          }

          // Create a Stripe coupon for this session
          try {
            const stripeCoupon = await stripe.coupons.create({
              amount_off: discountAmount,
              currency: 'brl',
              duration: 'once',
              name: `Cupom ${couponCode}`,
            });

            discounts = [{ coupon: stripeCoupon.id }];
            logStep("Stripe coupon created", { stripeCouponId: stripeCoupon.id, discountAmount });
          } catch (stripeCouponError) {
            logStep("Failed to create Stripe coupon", { error: stripeCouponError });
          }
        } else {
          logStep("Coupon invalid (expired or limit reached)", { code: couponCode });
        }
      } else {
        logStep("Coupon not found or inactive", { code: couponCode });
      }
    }

    // Create checkout session
    const priceId = PASS_PRICE_MAP[passType];
    logStep("Creating checkout session", { priceId, customerId, hasDiscount: !!discounts });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      discounts: discounts,
      success_url: `${req.headers.get("origin")}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/checkout/cancel`,
      metadata: {
        user_id: user.id,
        pass_type: passType,
        second_user_email: secondUserEmail || '',
        coupon_code: couponCode || '',
        coupon_id: couponId || '',
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Increment coupon usage if applied
    if (couponId) {
      const { data: couponData } = await supabaseClient
        .from('coupons')
        .select('used_count')
        .eq('id', couponId)
        .single();

      if (couponData) {
        await supabaseClient
          .from('coupons')
          .update({ used_count: (couponData.used_count || 0) + 1 })
          .eq('id', couponId);
      }
    }

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
