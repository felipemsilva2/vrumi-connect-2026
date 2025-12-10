
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

        const { user_ids, title, message, type, data } = await req.json();

        if (!user_ids || !Array.isArray(user_ids) || !title || !message) {
            throw new Error("Invalid request parameters");
        }

        // Use Service Role to insert notifications (bypassing RLS if necessary)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const notifications = user_ids.map(uid => ({
            user_id: uid,
            title,
            message,
            type: type || 'info', // 'info', 'warning', 'success', 'error'
            data: data || {},
            read: false
        }));

        const { error: insertError } = await supabaseAdmin
            .from('notifications')
            .insert(notifications);

        if (insertError) throw insertError;

        // Log the action (Summary of bulk action)
        await supabaseAdmin.rpc('log_admin_action', {
            p_action_type: 'SEND_NOTIFICATION',
            p_entity_type: 'notification',
            p_entity_id: null, // No single entity ID for bulk
            p_old_values: null,
            p_new_values: {
                count: user_ids.length,
                title: title,
                recipients_sample: user_ids.slice(0, 5)
            },
            p_ip_address: null,
            p_user_agent: req.headers.get('user-agent'),
            p_user_id: user.id
        });

        return new Response(JSON.stringify({
            success: true,
            count: user_ids.length,
            message: `Notifications sent to ${user_ids.length} users`
        }), {
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
