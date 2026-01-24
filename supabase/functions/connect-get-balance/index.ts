import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "No authorization header" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get user from token
        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            return new Response(JSON.stringify({ error: "Invalid token" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Get instructor's Stripe account ID
        const { data: instructor, error: instructorError } = await supabase
            .from("instructors")
            .select("id, stripe_account_id, stripe_onboarding_complete")
            .eq("user_id", user.id)
            .single();

        if (instructorError || !instructor) {
            return new Response(JSON.stringify({ error: "Instructor not found" }), {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        if (!instructor.stripe_account_id) {
            return new Response(JSON.stringify({
                balance: { available: 0, pending: 0 },
                transactions: [],
                payouts: [],
                message: "Stripe account not connected"
            }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Initialize Stripe
        const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeSecretKey) {
            throw new Error("STRIPE_SECRET_KEY not configured");
        }

        const stripe = new Stripe(stripeSecretKey, {
            apiVersion: "2023-10-16",
        });

        // Get balance for the connected account
        const balance = await stripe.balance.retrieve({
            stripeAccount: instructor.stripe_account_id,
        });

        // Get recent transfers/payments to this account (last 30 days)
        const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);

        const transfers = await stripe.transfers.list({
            destination: instructor.stripe_account_id,
            created: { gte: thirtyDaysAgo },
            limit: 50,
        });

        // Get payouts from the connected account
        const payouts = await stripe.payouts.list({
            limit: 10,
        }, {
            stripeAccount: instructor.stripe_account_id,
        });

        // Calculate totals
        const availableBalance = balance.available.reduce((sum, b) => sum + b.amount, 0) / 100;
        const pendingBalance = balance.pending.reduce((sum, b) => sum + b.amount, 0) / 100;

        // Format transactions
        const formattedTransactions = transfers.data.map(t => ({
            id: t.id,
            amount: t.amount / 100,
            currency: t.currency,
            created: new Date(t.created * 1000).toISOString(),
            description: t.description || "Pagamento de aula",
            type: "earning",
            status: "completed",
        }));

        // Format payouts
        const formattedPayouts = payouts.data.map(p => ({
            id: p.id,
            amount: p.amount / 100,
            currency: p.currency,
            arrival_date: new Date(p.arrival_date * 1000).toISOString(),
            status: p.status,
            type: p.type,
        }));

        // Calculate total earned this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const totalThisMonth = formattedTransactions
            .filter(t => new Date(t.created) >= startOfMonth)
            .reduce((sum, t) => sum + t.amount, 0);

        return new Response(JSON.stringify({
            balance: {
                available: availableBalance,
                pending: pendingBalance,
            },
            totalThisMonth,
            transactions: formattedTransactions,
            payouts: formattedPayouts,
            nextPayoutDate: payouts.data[0]?.arrival_date
                ? new Date(payouts.data[0].arrival_date * 1000).toISOString()
                : null,
        }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("Error fetching Stripe data:", error);
        return new Response(JSON.stringify({
            error: error.message || "Failed to fetch financial data",
            balance: { available: 0, pending: 0 },
            transactions: [],
            payouts: [],
        }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
