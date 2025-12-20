// @ts-nocheck - Deno Edge Function
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const getCors = (req: Request) => {
    const origin = req.headers.get('origin') || '';
    const allowedList = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(s => s.trim()).filter(Boolean);
    const allowed = allowedList.length === 0 || allowedList.includes(origin) || origin.includes('localhost');
    const headers = {
        'Access-Control-Allow-Origin': allowed ? origin : '',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };
    return { headers, allowed };
};

serve(async (req: Request) => {
    const { headers: corsHeaders, allowed } = getCors(req);
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders, status: allowed ? 200 : 403 });
    }

    try {
        // Use service role to access auth.users
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Verify caller is admin
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("No authorization header");

        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (!user) throw new Error("User not authenticated");

        // Check if user is admin
        const { data: adminRole } = await supabaseAdmin
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin')
            .single();

        if (!adminRole) {
            return new Response(JSON.stringify({ error: "Unauthorized - Admin only" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 403,
            });
        }

        // Fetch users from auth.users using admin API
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 500,
        });

        if (error) throw error;

        // Return simplified user data with emails
        const usersWithEmails = users.map(u => ({
            id: u.id,
            email: u.email,
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at,
        }));

        return new Response(JSON.stringify({ users: usersWithEmails }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
