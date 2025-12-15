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
    console.log(`[CONNECT-CREATE-PAYMENT] ${step}${detailsStr}`);
};

// Platform fee: 15%
const PLATFORM_FEE_PERCENTAGE = 0.15;

serve(async (req) => {
    const { headers: corsHeaders, allowed } = getCors(req);
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders, status: allowed ? 200 : 403 });
    }

    const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    try {
        logStep("Function started");

        // Authenticate user (student)
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("No authorization header provided");

        const token = authHeader.replace("Bearer ", "");
        const { data } = await supabaseClient.auth.getUser(token);
        const user = data.user;
        if (!user?.email) throw new Error("User not authenticated");

        logStep("Student authenticated", { userId: user.id, email: user.email });

        // Parse request body
        const {
            instructorId,
            bookingId,
            amount, // Amount in cents (BRL)
        } = await req.json();

        if (!instructorId || !amount) {
            throw new Error("Missing required fields: instructorId, amount");
        }

        // Get instructor's Stripe account
        const { data: instructor, error: instructorError } = await supabaseAdmin
            .from("instructors")
            .select("id, full_name, stripe_account_id, stripe_onboarding_complete")
            .eq("id", instructorId)
            .single();

        if (instructorError || !instructor) {
            throw new Error("Instructor not found");
        }

        if (!instructor.stripe_account_id) {
            throw new Error("Instructor has not completed Stripe onboarding");
        }

        logStep("Instructor found", {
            instructorId: instructor.id,
            stripeAccountId: instructor.stripe_account_id
        });

        // Calculate platform fee (15%)
        const platformFee = Math.round(amount * PLATFORM_FEE_PERCENTAGE);

        logStep("Fee calculated", {
            totalAmount: amount,
            platformFee,
            instructorAmount: amount - platformFee
        });

        // Create Stripe PaymentIntent with application fee
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
            apiVersion: "2025-08-27.basil",
        });

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount, // Amount in cents
            currency: "brl",
            application_fee_amount: platformFee,
            transfer_data: {
                destination: instructor.stripe_account_id,
            },
            metadata: {
                booking_id: bookingId || "",
                instructor_id: instructorId,
                student_id: user.id,
                platform_fee: platformFee.toString(),
            },
            receipt_email: user.email,
        });

        logStep("PaymentIntent created", {
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret ? "present" : "missing"
        });

        // Update booking with payment intent ID if booking exists
        if (bookingId) {
            await supabaseAdmin
                .from("bookings")
                .update({
                    stripe_payment_intent_id: paymentIntent.id,
                    payment_status: "pending",
                })
                .eq("id", bookingId);
        }

        return new Response(JSON.stringify({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: amount,
            platformFee: platformFee,
            instructorAmount: amount - platformFee,
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logStep("ERROR", { message: errorMessage });
        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
