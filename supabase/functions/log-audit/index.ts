import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
    }

    const body = await req.json();
    const actionType = body.actionType as string;
    const entityType = body.entityType as string;
    const entityId = body.entityId ?? null;
    const oldValues = body.oldValues ?? null;
    const newValues = body.newValues ?? null;

    const forwardedFor = req.headers.get('x-forwarded-for') || '';
    const cfIp = req.headers.get('cf-connecting-ip') || '';
    const ip = (forwardedFor.split(',')[0] || cfIp || '').trim() || null;
    const userAgent = req.headers.get('user-agent');

    const { error } = await supabase.rpc('log_admin_action', {
      p_user_id: user.id,
      p_action_type: actionType,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_old_values: oldValues,
      p_new_values: newValues,
      p_ip_address: ip,
      p_user_agent: userAgent,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});