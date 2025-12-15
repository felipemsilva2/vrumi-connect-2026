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
    console.log(`[CONNECT-CREATE-ACCOUNT] ${step}${detailsStr}`);
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

    const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    try {
        logStep("Function started");

        // Authenticate user
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("No authorization header provided");

        const token = authHeader.replace("Bearer ", "");
        const { data } = await supabaseClient.auth.getUser(token);
        const user = data.user;
        if (!user?.email) throw new Error("User not authenticated");

        logStep("User authenticated", { userId: user.id, email: user.email });

        // Get instructor profile
        const { data: instructor, error: instructorError } = await supabaseAdmin
            .from("instructors")
            .select("id, full_name, stripe_account_id")
            .eq("user_id", user.id)
            .single();

        if (instructorError || !instructor) {
            throw new Error("Instructor profile not found");
        }

        // If already has Stripe account, return it
        if (instructor.stripe_account_id) {
            logStep("Stripe account already exists", { accountId: instructor.stripe_account_id });
            return new Response(JSON.stringify({
                accountId: instructor.stripe_account_id,
                alreadyExists: true
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // Create Stripe Express account
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
            apiVersion: "2025-08-27.basil",
        });

        const account = await stripe.accounts.create({
            type: "express",
            country: "BR",
            email: user.email,
            capabilities: {
                transfers: { requested: true },
            },
            business_type: "individual",
            metadata: {
                instructor_id: instructor.id,
                user_id: user.id,
            },
            settings: {
                payouts: {
                    schedule: {
                        interval: "weekly",
                        weekly_anchor: "monday",
                    },
                },
            },
        });

        logStep("Stripe account created", { accountId: account.id });

        // Save account ID to database
        const { error: updateError } = await supabaseAdmin
            .from("instructors")
            .update({
                stripe_account_id: account.id,
                stripe_onboarding_complete: false,
            })
            .eq("id", instructor.id);

        if (updateError) {
            logStep("Error saving account ID", { error: updateError.message });
            // Don't throw - account was created, we can retry saving later
        }

        return new Response(JSON.stringify({
            accountId: account.id,
            alreadyExists: false
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
