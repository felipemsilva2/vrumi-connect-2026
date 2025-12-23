// @ts-nocheck - Deno Edge Function
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
    console.log(`[CONNECT-VERIFY-STATUS] ${step}${detailsStr}`);
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
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

        logStep("User authenticated", { userId: user.id });

        // Get instructor with Stripe account
        const { data: instructor, error: instructorError } = await supabaseAdmin
            .from("instructors")
            .select("id, stripe_account_id, stripe_onboarding_complete")
            .eq("user_id", user.id)
            .single();

        if (instructorError || !instructor) {
            throw new Error("Instructor profile not found");
        }

        if (!instructor.stripe_account_id) {
            return new Response(JSON.stringify({
                onboarding_complete: false,
                has_account: false,
                message: "Stripe account not created yet"
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // Check Stripe account status
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
            apiVersion: "2025-08-27.basil",
        });

        const account = await stripe.accounts.retrieve(instructor.stripe_account_id);

        logStep("Stripe account retrieved", {
            accountId: account.id,
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            detailsSubmitted: account.details_submitted,
        });

        // Use details_submitted as primary indicator for onboarding completion
        // charges_enabled and payouts_enabled only become true after Stripe's verification
        // which can take days. details_submitted becomes true when user finishes the form.
        const isComplete = account.details_submitted === true;
        const canReceivePayments = account.charges_enabled && account.payouts_enabled;

        // Update database if status changed
        if (isComplete !== instructor.stripe_onboarding_complete) {
            await supabaseAdmin
                .from("instructors")
                .update({ stripe_onboarding_complete: isComplete })
                .eq("id", instructor.id);

            logStep("Updated instructor status", {
                instructorId: instructor.id,
                newStatus: isComplete
            });
        }

        return new Response(JSON.stringify({
            onboarding_complete: isComplete,
            can_receive_payments: canReceivePayments,
            has_account: true,
            charges_enabled: account.charges_enabled,
            payouts_enabled: account.payouts_enabled,
            details_submitted: account.details_submitted,
            stripe_account_id: instructor.stripe_account_id,
            requirements: account.requirements?.currently_due || [],
            message: canReceivePayments
                ? "Account is fully verified and can receive payments"
                : isComplete
                    ? "Onboarding complete. Stripe is verifying your account."
                    : "Account requires additional information"
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
