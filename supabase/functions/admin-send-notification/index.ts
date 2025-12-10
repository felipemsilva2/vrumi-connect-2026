import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    console.log("=== admin-send-notification function called ===");
    console.log("Method:", req.method);
    
    if (req.method === 'OPTIONS') {
        console.log("Handling CORS preflight");
        return new Response('ok', { headers: corsHeaders, status: 200 });
    }

    try {
        console.log("Creating supabase client with auth header");
        const authHeader = req.headers.get('Authorization');
        console.log("Auth header present:", !!authHeader);
        
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader! } } }
        );

        // 1. Verify if user is admin
        console.log("Getting user from auth");
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        
        if (userError) {
            console.error("User auth error:", userError);
            throw new Error("Unauthorized: " + userError.message);
        }
        
        if (!user) {
            console.error("No user found");
            throw new Error("Unauthorized: No user");
        }
        
        console.log("User ID:", user.id);

        console.log("Checking admin role");
        const { data: roles, error: rolesError } = await supabaseClient
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (rolesError) {
            console.error("Roles query error:", rolesError);
        }
        
        console.log("User roles:", roles);

        if (roles?.role !== 'admin') {
            console.error("User is not admin, role:", roles?.role);
            throw new Error("Forbidden: Admin access required");
        }

        console.log("Admin verified, parsing request body");
        const body = await req.json();
        console.log("Request body:", JSON.stringify(body));
        
        const { user_ids, title, message, type, data } = body;

        if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
            console.error("Invalid user_ids:", user_ids);
            throw new Error("Invalid request: user_ids must be a non-empty array");
        }
        if (!title || !message) {
            console.error("Missing title or message:", { title, message });
            throw new Error("Invalid request: title and message are required");
        }

        console.log("Creating admin client with service role");
        // Use Service Role to insert notifications (bypassing RLS)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const notifications = user_ids.map((uid: string) => ({
            user_id: uid,
            title,
            message,
            type: type || 'info',
            data: data || {},
            read: false
        }));

        console.log("Inserting notifications:", notifications.length);

        const { data: insertData, error: insertError } = await supabaseAdmin
            .from('notifications')
            .insert(notifications);

        if (insertError) {
            console.error("Insert error:", insertError);
            throw insertError;
        }

        console.log("Notifications inserted successfully");

        // Log the action
        try {
            await supabaseAdmin.rpc('log_admin_action', {
                p_action_type: 'SEND_NOTIFICATION',
                p_entity_type: 'notification',
                p_entity_id: null,
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
            console.log("Audit log created");
        } catch (auditError) {
            console.error("Audit log error (non-critical):", auditError);
        }

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
        console.error("=== Function error ===", errorMessage);
        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
