// @ts-nocheck - Deno Edge Function, TypeScript checks suppressed
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// Simplified CORS - allow all origins for now
const getCors = (req: Request) => {
    const origin = req.headers.get('origin') || '*';
    const headers = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };
    return { headers, allowed: true };
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

        // Parse request body
        let generateLink = true; // Default to generating link for performance
        try {
            const body = await req.json();
            if (body?.generateLink !== undefined) {
                generateLink = body.generateLink;
            }
        } catch {
            // No body or invalid JSON - use defaults
        }

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

        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
            apiVersion: "2025-08-27.basil",
        });

        let accountId = instructor.stripe_account_id;
        let alreadyExists = !!accountId;

        // Create Stripe account if it doesn't exist
        if (!accountId) {
            const account = await stripe.accounts.create({
                type: "express",
                country: "BR",
                email: user.email,
                default_currency: "brl",
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
                business_type: "individual",
                business_profile: {
                    mcc: "8299", // Educational services
                    url: "https://vrumi.com.br",
                },
                metadata: {
                    instructor_id: instructor.id,
                    user_id: user.id,
                },
                settings: {
                    payouts: {
                        schedule: {
                            interval: "daily",
                        },
                    },
                },
            });

            accountId = account.id;
            logStep("Stripe account created", { accountId });

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
            }
        } else {
            logStep("Stripe account already exists", { accountId });
        }

        // Generate onboarding link if requested (default: true for performance)
        let onboardingUrl: string | null = null;
        if (generateLink) {
            const baseReturnUrl = 'https://vrumi.com.br/connect/painel-instrutor';

            const accountLink = await stripe.accountLinks.create({
                account: accountId,
                refresh_url: `${baseReturnUrl}?stripe_refresh=true`,
                return_url: `${baseReturnUrl}?stripe_onboarded=true`,
                type: "account_onboarding",
                collect: "eventually_due",
            });

            onboardingUrl = accountLink.url;
            logStep("Onboarding link generated", { hasUrl: !!onboardingUrl });
        }

        return new Response(JSON.stringify({
            accountId,
            alreadyExists,
            onboardingUrl,
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
