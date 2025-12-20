// @ts-nocheck - Deno Edge Function
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// Secure CORS with environment-aware defaults
const getCors = (req: Request) => {
    const origin = req.headers.get('origin') || '';
    const environment = Deno.env.get('ENVIRONMENT') || 'development';
    const isProduction = environment === 'production';

    const defaultProdOrigins = [
        'https://vrumi.com.br',
        'https://www.vrumi.com.br',
        'https://app.vrumi.com.br',
        'https://owtylihsslimxdiovxia.supabase.co',
    ];

    const configuredOrigins = (Deno.env.get('ALLOWED_ORIGINS') || '')
        .split(',').map(s => s.trim()).filter(Boolean);

    let allowed = false;

    if (isProduction) {
        const allowedList = configuredOrigins.length > 0 ? configuredOrigins : defaultProdOrigins;
        allowed = allowedList.includes(origin);
    } else {
        allowed = configuredOrigins.length === 0
            || configuredOrigins.includes(origin)
            || origin.includes('localhost')
            || origin.includes('127.0.0.1')
            || origin.includes('192.168.')
            || origin === '';
    }

    const headers = {
        'Access-Control-Allow-Origin': allowed ? origin : '',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };
    return { headers, allowed };
};

const logStep = (step: string, details?: any) => {
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
    console.log(`[CONNECT-REFUND] ${step}${detailsStr}`);
};

serve(async (req) => {
    const { headers } = getCors(req);

    if (req.method === 'OPTIONS') {
        return new Response(null, { headers, status: 204 });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...headers, 'Content-Type': 'application/json' }
        });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Authorization required' }), {
                status: 401,
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
        }

        const { bookingId, reason } = await req.json();

        if (!bookingId) {
            return new Response(JSON.stringify({ error: 'bookingId is required' }), {
                status: 400,
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
        }

        logStep('Processing refund', { bookingId, reason });

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Get booking details
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('id, stripe_payment_intent_id, payment_status, price, instructor_id, status')
            .eq('id', bookingId)
            .single();

        if (bookingError || !booking) {
            logStep('Booking not found', { bookingId, error: bookingError });
            return new Response(JSON.stringify({ error: 'Booking not found' }), {
                status: 404,
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
        }

        // Validate booking can be refunded
        if (booking.payment_status !== 'completed') {
            logStep('Booking not paid', { bookingId, paymentStatus: booking.payment_status });
            return new Response(JSON.stringify({
                error: 'Booking has not been paid yet',
                payment_status: booking.payment_status
            }), {
                status: 400,
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
        }

        if (!booking.stripe_payment_intent_id) {
            logStep('No payment intent', { bookingId });
            return new Response(JSON.stringify({ error: 'No payment intent found for this booking' }), {
                status: 400,
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
        }

        // Initialize Stripe
        const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (!stripeSecretKey) {
            logStep('Stripe not configured');
            return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
                status: 500,
                headers: { ...headers, 'Content-Type': 'application/json' }
            });
        }

        const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-08-27.basil' });

        // Process refund via Stripe
        logStep('Creating Stripe refund', {
            paymentIntentId: booking.stripe_payment_intent_id,
            amount: booking.price
        });

        const refund = await stripe.refunds.create({
            payment_intent: booking.stripe_payment_intent_id,
            reason: 'requested_by_customer',
            metadata: {
                booking_id: bookingId,
                refund_reason: reason || 'Cancelamento de aula',
            },
        });

        logStep('Stripe refund created', { refundId: refund.id, status: refund.status });

        // Update booking status
        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                payment_status: 'refunded',
                status: 'cancelled',
                cancellation_reason: reason || 'Cancelamento com reembolso',
                cancelled_at: new Date().toISOString(),
            })
            .eq('id', bookingId);

        if (updateError) {
            logStep('Error updating booking', { error: updateError.message });
            // Refund was processed, but DB update failed - log for manual intervention
        }

        // Create refund transaction record
        if (booking.instructor_id) {
            const { error: txError } = await supabase
                .from('transactions')
                .insert({
                    instructor_id: booking.instructor_id,
                    booking_id: bookingId,
                    amount: -(booking.price * 0.85), // Negative amount, instructor portion only
                    type: 'refund',
                    status: 'completed',
                    description: `Reembolso: ${reason || 'Cancelamento'}`,
                    stripe_payment_intent_id: `${booking.stripe_payment_intent_id}_refund_${refund.id}`,
                });

            if (txError) {
                logStep('Error creating refund transaction', { error: txError.message });
            }
        }

        logStep('Refund completed successfully', {
            bookingId,
            refundId: refund.id,
            amount: refund.amount / 100
        });

        return new Response(JSON.stringify({
            success: true,
            refund_id: refund.id,
            refund_status: refund.status,
            amount_refunded: refund.amount / 100,
            currency: refund.currency,
        }), {
            status: 200,
            headers: { ...headers, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logStep('Error processing refund', { error: errorMessage });

        return new Response(JSON.stringify({
            error: 'Failed to process refund',
            details: errorMessage
        }), {
            status: 500,
            headers: { ...headers, 'Content-Type': 'application/json' }
        });
    }
});
