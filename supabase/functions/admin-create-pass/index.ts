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

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autenticado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se é admin
    const { data: isAdminData, error: adminError } = await supabase
      .rpc('is_admin', { user_id: user.id });

    if (adminError || !isAdminData) {
      throw new Error('Permissão negada - apenas admins podem criar passes');
    }

    // Obter dados da requisição
    const { user_email, pass_type, expires_at, price } = await req.json();

    console.log('Creating pass for:', { user_email, pass_type, expires_at, price });

    // Buscar user_id pelo email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) throw listError;

    const targetUser = users.find(u => u.email === user_email);
    
    if (!targetUser) {
      throw new Error('Usuário não encontrado');
    }

    // Criar o passe
    const { data: pass, error: passError } = await supabase
      .from('user_passes')
      .insert({
        user_id: targetUser.id,
        pass_type,
        price,
        expires_at,
        payment_status: 'completed',
        purchased_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (passError) throw passError;

    // Log the admin action
    await supabase.rpc('log_admin_action', {
      p_user_id: user.id,
      p_action_type: 'CREATE',
      p_entity_type: 'pass',
      p_entity_id: pass.id,
      p_old_values: null,
      p_new_values: {
        user_id: targetUser.id,
        pass_type,
        price,
        expires_at,
        payment_status: 'completed',
      },
      p_ip_address: null,
      p_user_agent: req.headers.get('user-agent'),
    });

    console.log('Pass created successfully:', pass.id);

    return new Response(
      JSON.stringify({ success: true, pass }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in admin-create-pass:', error);
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
