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
        throw new Error('Permissão negada - apenas admins podem excluir assinaturas');
    }

    // Obter dados da requisição
    const { subscription_id } = await req.json();

    if (!subscription_id) {
        throw new Error('ID da assinatura é obrigatório');
    }

    console.log('Deleting subscription:', subscription_id);

    // Deletar a assinatura
    const { error: deleteError } = await supabase
        .from('user_passes')
        .delete()
        .eq('id', subscription_id);

    if (deleteError) throw deleteError;

    // Log the admin action
    await supabase.rpc('log_admin_action', {
        p_user_id: user.id,
        p_action_type: 'DELETE',
        p_entity_type: 'pass',
        p_entity_id: subscription_id,
        p_old_values: { id: subscription_id },
        p_new_values: null,
        p_ip_address: null,
        p_user_agent: req.headers.get('user-agent'),
    });

    console.log('Subscription deleted successfully:', subscription_id);

    return new Response(
        JSON.stringify({ success: true }),
        {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        }
    );

} catch (error) {
    console.error('Error in delete-subscription:', error);
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
