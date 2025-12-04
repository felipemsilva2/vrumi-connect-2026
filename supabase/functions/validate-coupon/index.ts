// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

declare const Deno: any;

const getCors = (req: Request) => {
  const origin = req.headers.get('origin') || '';
  const allowedList = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map((s: string) => s.trim()).filter(Boolean);
  const allowed = allowedList.length === 0 || allowedList.includes(origin);
  const headers = {
    'Access-Control-Allow-Origin': allowed ? origin : '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
  return { headers, allowed };
};

const PASS_PRICES: Record<string, number> = {
  'individual_30_days': 29.90,
  'individual_90_days': 79.90,
  'family_90_days': 84.90,
};

serve(async (req: Request) => {
  const { headers: corsHeaders, allowed } = getCors(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: allowed ? 200 : 403 });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { couponCode, passType } = await req.json();

    if (!couponCode || !passType) {
      throw new Error("Missing couponCode or passType");
    }

    const originalPrice = PASS_PRICES[passType];
    if (!originalPrice) {
      throw new Error("Invalid passType");
    }

    // Fetch coupon
    const { data: coupon, error } = await supabaseClient
      .from('coupons')
      .select('*')
      .eq('code', couponCode)
      .single();

    if (error || !coupon) {
      return new Response(JSON.stringify({ valid: false, message: "Cupom inválido" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Validate coupon
    if (!coupon.is_active) {
      return new Response(JSON.stringify({ valid: false, message: "Cupom inativo" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return new Response(JSON.stringify({ valid: false, message: "Cupom expirado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return new Response(JSON.stringify({ valid: false, message: "Limite de uso do cupom atingido" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = originalPrice * (coupon.discount_value / 100);
    } else if (coupon.discount_type === 'fixed') {
      discountAmount = coupon.discount_value;
    }

    // Ensure discount doesn't exceed price
    discountAmount = Math.min(discountAmount, originalPrice);
    const newPrice = originalPrice - discountAmount;

    return new Response(JSON.stringify({
      valid: true,
      discountAmount,
      newPrice,
      message: "Cupom aplicado com sucesso"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
