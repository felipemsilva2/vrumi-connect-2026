// @ts-nocheck - Deno Edge Function
// Connect Cancel Booking - Allows students to cancel bookings up to 24h before
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const getCors = (req: Request) => {
    const origin = req.headers.get('origin') || '';
    const defaultOrigins = ['https://vrumi.com.br', 'https://kyuaxjkokntdmcxjurhm.supabase.co'];
    const allowed = defaultOrigins.some(o => origin.includes(o)) || origin.includes('localhost');
    return {
        headers: {
            'Access-Control-Allow-Origin': allowed ? origin : '',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
        allowed
    };
};

const logCancel = (level: 'INFO' | 'WARN' | 'ERROR', message: string, details?: Record<string, unknown>) => {
    console.log(`[CONNECT-CANCEL] [${level}] ${message} ${details ? JSON.stringify(details) : ''}`);
};

// Minimum hours before lesson for free cancellation
const CANCELLATION_WINDOW_HOURS = 24;

serve(async (req) => {
    const { headers: corsHeaders, allowed } = getCors(req);

    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders, status: allowed ? 200 : 403 });
    }

    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    try {
        // Authenticate user
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401
            });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabaseClient.auth.getUser(token);
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401
            });
        }

        const { bookingId, reason } = await req.json();
        if (!bookingId) {
            return new Response(JSON.stringify({ error: 'Missing bookingId' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            });
        }

        logCancel('INFO', 'Cancel request received', { bookingId, userId: user.id });

        // Fetch booking
        const { data: booking, error: fetchError } = await supabaseAdmin
            .from('bookings')
            .select('id, student_id, instructor_id, scheduled_datetime, status, payment_status, price, stripe_payment_intent_id')
            .eq('id', bookingId)
            .single();

        if (fetchError || !booking) {
            return new Response(JSON.stringify({ error: 'Booking not found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 404
            });
        }

        // Verify ownership (student or instructor can cancel)
        const isStudent = booking.student_id === user.id;
        const { data: instructor } = await supabaseAdmin
            .from('instructors')
            .select('id')
            .eq('user_id', user.id)
            .single();
        const isInstructor = instructor?.id === booking.instructor_id;

        if (!isStudent && !isInstructor) {
            return new Response(JSON.stringify({ error: 'You can only cancel your own bookings' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 403
            });
        }

        // Check if already cancelled
        if (booking.status === 'cancelled') {
            return new Response(JSON.stringify({ error: 'Booking already cancelled' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            });
        }

        // Check if already completed
        if (booking.status === 'completed') {
            return new Response(JSON.stringify({ error: 'Cannot cancel completed bookings' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            });
        }

        // Check cancellation window
        const now = new Date();
        const lessonTime = new Date(booking.scheduled_datetime);
        const hoursUntilLesson = (lessonTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        const canRefund = hoursUntilLesson >= CANCELLATION_WINDOW_HOURS;
        let refundProcessed = false;

        // Process refund if within window and payment was completed
        if (canRefund && booking.payment_status === 'completed' && booking.stripe_payment_intent_id) {
            try {
                const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
                    apiVersion: '2025-08-27.basil'
                });

                await stripe.refunds.create({
                    payment_intent: booking.stripe_payment_intent_id,
                });

                refundProcessed = true;
                logCancel('INFO', 'Refund processed', { bookingId, amount: booking.price });
            } catch (refundError) {
                const errorMsg = refundError instanceof Error ? refundError.message : String(refundError);
                logCancel('ERROR', 'Refund failed', { bookingId, error: errorMsg });
                // Continue with cancellation even if refund fails - will need manual intervention
            }
        }

        // Update booking status
        const cancellationReason = reason || (isStudent ? 'Cancelado pelo aluno' : 'Cancelado pelo instrutor');

        await supabaseAdmin
            .from('bookings')
            .update({
                status: 'cancelled',
                payment_status: refundProcessed ? 'refunded' : booking.payment_status,
                cancellation_reason: cancellationReason,
                cancelled_at: new Date().toISOString(),
                cancelled_by: isStudent ? 'student' : 'instructor'
            })
            .eq('id', bookingId);

        // Create notification for the other party
        const notifyUserId = isStudent ? null : booking.student_id; // Notify student if instructor cancelled
        if (notifyUserId) {
            await supabaseAdmin.from('notifications').insert({
                user_id: notifyUserId,
                type: 'booking_cancelled',
                title: 'Aula Cancelada',
                message: `Sua aula foi cancelada. ${refundProcessed ? 'O reembolso será processado em até 5 dias úteis.' : ''}`,
                read: false
            });
        }

        logCancel('INFO', 'Booking cancelled successfully', {
            bookingId,
            refundProcessed,
            cancelledBy: isStudent ? 'student' : 'instructor'
        });

        return new Response(JSON.stringify({
            success: true,
            refundProcessed,
            message: refundProcessed
                ? 'Aula cancelada e reembolso solicitado com sucesso.'
                : canRefund
                    ? 'Aula cancelada. O reembolso será processado manualmente.'
                    : 'Aula cancelada. Cancelamento fora do prazo de reembolso.'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logCancel('ERROR', 'Cancel booking failed', { error: errorMessage });
        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
