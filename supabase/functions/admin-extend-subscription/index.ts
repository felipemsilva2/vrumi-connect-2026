import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { addDays, parseISO, isAfter } from "https://esm.sh/date-fns@2.30.0";

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
        return new Response(null, { headers: corsHeaders, status: allowed ? 200 : 403 });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Verify Authentication
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Não autenticado');
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            throw new Error('Usuário não autenticado');
        }

        // 2. Verify Admin Permission
        const { data: isAdminData, error: adminError } = await supabase
            .rpc('is_admin', { user_id: user.id });

        if (adminError || !isAdminData) {
            throw new Error('Permissão negada - apenas admins podem estender assinaturas');
        }

        // 3. Get Request Data
        const { subscription_id, days_to_add, reason } = await req.json();

        if (!subscription_id || !days_to_add || days_to_add <= 0) {
            throw new Error('Dados inválidos: subscription_id e days_to_add são obrigatórios');
        }

        console.log(`Extending subscription ${subscription_id} by ${days_to_add} days. Reason: ${reason}`);

        // 4. Fetch Current Subscription
        const { data: subscription, error: fetchError } = await supabase
            .from('user_passes')
            .select('*')
            .eq('id', subscription_id)
            .single();

        if (fetchError || !subscription) {
            throw new Error('Assinatura não encontrada');
        }

        // 5. Calculate New Expiry Date
        const currentExpiry = parseISO(subscription.expires_at);
        const now = new Date();

        // If expired, start from NOW. If active, add to current expiry.
        const baseDate = isAfter(currentExpiry, now) ? currentExpiry : now;
        const newExpiry = addDays(baseDate, days_to_add);

        // 6. Update Subscription
        const { data: updatedSubscription, error: updateError } = await supabase
            .from('user_passes')
            .update({
                expires_at: newExpiry.toISOString(),
                payment_status: 'completed' // Ensure it's active if it was pending/cancelled? Maybe safer to leave status unless explicitly reviving. Let's assume we maintain completed status or revive if it was expired.
                // Actually, if we are extending, we imply it should be valid.
            })
            .eq('id', subscription_id)
            .select()
            .single();

        if (updateError) throw updateError;

        // 7. Log Action
        await supabase.rpc('log_admin_action', {
            p_user_id: user.id,
            p_action_type: 'UPDATE', // Using UPDATE as we are modifying an existing pass
            p_entity_type: 'pass',
            p_entity_id: subscription_id,
            p_old_values: { expires_at: subscription.expires_at },
            p_new_values: {
                expires_at: newExpiry.toISOString(),
                days_added: days_to_add,
                reason: reason || 'Manual extension'
            },
            p_ip_address: null,
            p_user_agent: req.headers.get('user-agent'),
        });

        return new Response(
            JSON.stringify({ success: true, data: updatedSubscription }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        );

    } catch (error) {
        console.error('Error in admin-extend-subscription:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        return new Response(
            JSON.stringify({ error: errorMessage }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        );
    }
});
