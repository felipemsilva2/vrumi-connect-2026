
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

serve(async (req) => {
    const { headers: corsHeaders, allowed } = getCors(req);
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        // 1. Verify if user is admin
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) throw new Error("Unauthorized");

        const { data: roles } = await supabaseClient
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (roles?.role !== 'admin') {
            throw new Error("Forbidden: Admin access required");
        }

        const { user_id, action, reason } = await req.json();

        if (!user_id || !['block', 'unblock'].includes(action)) {
            throw new Error("Invalid request parameters");
        }

        // Initialize Supabase Admin Client to perform Auth modifications
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        let result;
        if (action === 'block') {
            // Ban user for a very long time (~100 years)
            const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
                user_id,
                { ban_duration: "876000h" }
            );
            if (error) throw error;
            result = { message: "User blocked successfully", data };
        } else {
            // Unblock: set ban_duration to 0s
            const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
                user_id,
                { ban_duration: "0s" }
            );
            if (error) throw error;
            result = { message: "User unblocked successfully", data };
        }

        // Log the action
        await supabaseAdmin.rpc('log_admin_action', {
            p_action_type: action === 'block' ? 'BLOCK_USER' : 'UNBLOCK_USER',
            p_entity_type: 'user',
            p_entity_id: user_id,
            p_old_values: null,
            p_new_values: { reason: reason || 'No reason provided' },
            p_ip_address: null,
            p_user_agent: req.headers.get('user-agent'),
            p_user_id: user.id
        });

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
