// @ts-nocheck - Deno Edge Function
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const getCors = (req) => {
    const origin = req.headers.get('origin') || '';
    const environment = Deno.env.get('ENVIRONMENT') || 'development';
    const isProduction = environment === 'production';
    const defaultProdOrigins = ['https://vrumi.com.br', 'https://www.vrumi.com.br', 'https://app.vrumi.com.br', 'https://owtylihsslimxdiovxia.supabase.co'];
    const configuredOrigins = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(s => s.trim()).filter(Boolean);
    let allowed = isProduction ? (configuredOrigins.length > 0 ? configuredOrigins : defaultProdOrigins).includes(origin) : true;
    return { headers: { 'Access-Control-Allow-Origin': allowed ? origin : '', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }, allowed };
};

serve(async (req) => {
    const { headers } = getCors(req);
    if (req.method === 'OPTIONS') return new Response(null, { headers, status: 204 });
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return new Response(JSON.stringify({ error: 'Authorization required' }), { status: 401, headers });

        const { bookingId, reason } = await req.json();
        if (!bookingId) return new Response(JSON.stringify({ error: 'bookingId is required' }), { status: 400, headers });

        const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('id, stripe_payment_intent_id, payment_status, price, instructor_id')
            .eq('id', bookingId)
            .single();

        if (!booking) return new Response(JSON.stringify({ error: 'Booking not found' }), { status: 404, headers });
        if (booking.payment_status !== 'completed') return new Response(JSON.stringify({ error: 'Booking not paid' }), { status: 400, headers });
        if (!booking.stripe_payment_intent_id) return new Response(JSON.stringify({ error: 'No payment intent' }), { status: 400, headers });

        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), { apiVersion: '2025-08-27.basil' });

        const refund = await stripe.refunds.create({
            payment_intent: booking.stripe_payment_intent_id,
            reason: 'requested_by_customer',
            metadata: { booking_id: bookingId, refund_reason: reason || 'Cancelamento' },
        });

        await supabase.from('bookings').update({
            payment_status: 'refunded',
            status: 'cancelled',
            cancellation_reason: reason || 'Cancelamento com reembolso',
            cancelled_at: new Date().toISOString(),
        }).eq('id', bookingId);

        if (booking.instructor_id) {
            await supabase.from('instructor_transactions').insert({
                instructor_id: booking.instructor_id,
                booking_id: bookingId,
                amount: -(booking.price * 0.85),
                type: 'refund',
                status: 'completed',
                description: `Reembolso: ${reason || 'Cancelamento'}`,
                stripe_payment_intent_id: `${booking.stripe_payment_intent_id}_refund`,
            });
        }

        return new Response(JSON.stringify({
            success: true,
            refund_id: refund.id,
            refund_status: refund.status,
            amount_refunded: refund.amount / 100,
        }), { status: 200, headers });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
});
