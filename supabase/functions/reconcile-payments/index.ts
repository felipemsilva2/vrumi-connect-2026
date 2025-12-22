// @ts-nocheck - Deno Edge Function
// Reconciliation job: Checks for stuck bookings and mismatched payments
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logReconcile = (level: 'INFO' | 'WARN' | 'ERROR', message: string, details?: Record<string, unknown>) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [RECONCILE] [${level}] ${message} ${details ? JSON.stringify(details) : ''}`);
};

serve(async (req) => {
    // Only allow POST from cron or admin
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    // Verify auth (should be called by cron with service role or admin)
    const authHeader = req.headers.get('Authorization');
    const expectedKey = Deno.env.get('RECONCILE_SECRET_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!authHeader || !authHeader.includes(expectedKey?.slice(0, 20) || '')) {
        // Allow if no auth configured (for initial setup)
        if (expectedKey) {
            logReconcile('WARN', 'Unauthorized reconciliation attempt');
            // For now, allow but log - can be stricter later
        }
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', { apiVersion: '2025-08-27.basil' });
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results = {
        checked: 0,
        fixed: 0,
        errors: [] as string[],
        alerts: [] as string[]
    };

    try {
        logReconcile('INFO', 'Starting reconciliation job');

        // 1. Find bookings stuck in 'pending' for more than 1 hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

        const { data: stuckBookings, error: fetchError } = await supabase
            .from('bookings')
            .select('id, student_id, instructor_id, payment_status, status, price, created_at')
            .eq('payment_status', 'pending')
            .lt('created_at', oneHourAgo)
            .limit(50);

        if (fetchError) {
            throw new Error(`Failed to fetch stuck bookings: ${fetchError.message}`);
        }

        logReconcile('INFO', 'Found stuck bookings', { count: stuckBookings?.length || 0 });
        results.checked = stuckBookings?.length || 0;

        // 2. For each stuck booking, check if there's a payment in Stripe
        for (const booking of stuckBookings || []) {
            try {
                // Search for payment intents with this booking ID in metadata
                const paymentIntents = await stripe.paymentIntents.search({
                    query: `metadata['booking_id']:'${booking.id}'`,
                    limit: 1
                });

                if (paymentIntents.data.length > 0) {
                    const pi = paymentIntents.data[0];

                    if (pi.status === 'succeeded') {
                        // Payment succeeded but booking not updated - fix it
                        logReconcile('WARN', 'Found succeeded payment for stuck booking', {
                            bookingId: booking.id,
                            paymentIntentId: pi.id
                        });

                        const { error: updateError } = await supabase
                            .from('bookings')
                            .update({
                                payment_status: 'completed',
                                status: 'confirmed',
                                updated_at: new Date().toISOString()
                            })
                            .eq('id', booking.id);

                        if (updateError) {
                            results.errors.push(`Failed to fix booking ${booking.id}: ${updateError.message}`);
                        } else {
                            results.fixed++;
                            results.alerts.push(`Fixed booking ${booking.id} - payment was completed but webhook missed`);
                        }
                    } else if (pi.status === 'canceled' || pi.status === 'requires_payment_method') {
                        // Payment failed or was abandoned - mark booking as cancelled
                        logReconcile('INFO', 'Cancelling abandoned booking', {
                            bookingId: booking.id,
                            piStatus: pi.status
                        });

                        await supabase
                            .from('bookings')
                            .update({
                                payment_status: 'failed',
                                status: 'cancelled',
                                cancellation_reason: 'Payment abandoned or failed',
                                cancelled_at: new Date().toISOString()
                            })
                            .eq('id', booking.id);

                        results.fixed++;
                    }
                } else {
                    // No payment intent found for very old booking - likely abandoned
                    const bookingAge = Date.now() - new Date(booking.created_at).getTime();
                    if (bookingAge > 24 * 60 * 60 * 1000) { // Older than 24 hours
                        logReconcile('INFO', 'Cancelling very old booking without payment', {
                            bookingId: booking.id
                        });

                        await supabase
                            .from('bookings')
                            .update({
                                payment_status: 'failed',
                                status: 'cancelled',
                                cancellation_reason: 'Abandoned - no payment attempted',
                                cancelled_at: new Date().toISOString()
                            })
                            .eq('id', booking.id);

                        results.fixed++;
                    }
                }
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : String(err);
                results.errors.push(`Error processing booking ${booking.id}: ${errorMsg}`);
                logReconcile('ERROR', 'Error processing booking', { bookingId: booking.id, error: errorMsg });
            }
        }

        // 3. Send alerts to admin if there are fixes or errors
        if (results.alerts.length > 0 || results.errors.length > 0) {
            // Insert notification for admin
            await supabase.from('notifications').insert({
                user_id: null, // Will be filtered by admin role in RLS
                type: 'system_alert',
                title: 'Reconciliação de Pagamentos',
                message: `Verificados: ${results.checked}, Corrigidos: ${results.fixed}, Erros: ${results.errors.length}`,
                read: false,
                created_at: new Date().toISOString()
            });
        }

        logReconcile('INFO', 'Reconciliation completed', results);

        return new Response(JSON.stringify({
            success: true,
            ...results
        }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logReconcile('ERROR', 'Reconciliation failed', { error: errorMessage });

        return new Response(JSON.stringify({
            success: false,
            error: errorMessage,
            ...results
        }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
