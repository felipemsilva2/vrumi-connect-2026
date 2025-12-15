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
    console.log(`[CONNECT-ONBOARDING-LINK] ${step}${detailsStr}`);
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

        logStep("User authenticated", { userId: user.id });

        // Get instructor with Stripe account
        const { data: instructor, error: instructorError } = await supabaseAdmin
            .from("instructors")
            .select("id, stripe_account_id")
            .eq("user_id", user.id)
            .single();

        if (instructorError || !instructor) {
            throw new Error("Instructor profile not found");
        }

        if (!instructor.stripe_account_id) {
            throw new Error("Stripe account not created. Call connect-create-account first.");
        }

        // Create onboarding link
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
            apiVersion: "2025-08-27.basil",
        });

        const origin = req.headers.get("origin") || "https://vrumi.com.br";

        const accountLink = await stripe.accountLinks.create({
            account: instructor.stripe_account_id,
            refresh_url: `${origin}/connect/painel-instrutor?stripe_refresh=true`,
            return_url: `${origin}/connect/painel-instrutor?stripe_onboarded=true`,
            type: "account_onboarding",
        });

        logStep("Onboarding link created", { url: accountLink.url });

        return new Response(JSON.stringify({
            url: accountLink.url,
            expiresAt: accountLink.expires_at,
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
