import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

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
  console.log('study-chat function called');

  const { headers: corsHeaders, allowed } = getCors(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: allowed ? 200 : 403 });
  }

  try {
    console.log('Processing request...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const schema = z.object({
      message: z.string().min(1).max(2000),
      pdfContext: z.string().max(200000).optional(),
    });
    const body = await req.json();
    const { message, pdfContext } = schema.parse(body);
    console.log('Message received:', message);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('API key found, preparing request to AI...');

    const systemPrompt = `Você é um instrutor especialista em legislação de trânsito brasileira (CONTRAN/CTB). Suas respostas devem ser didáticas, curtas e focadas em ajudar o aluno a passar na prova teórica. Use **negrito** para destacar prazos e regras importantes.

CONTEXTO ATUAL (O QUE O ALUNO ESTÁ VENDO AGORA):
${pdfContext}

INSTRUÇÕES CRÍTICAS:
1. O aluno está visualizando uma página específica do PDF. Quando ele diz "nesta página", "aqui", "resuma isso" ou pede para "simplificar", ele se refere EXCLUSIVAMENTE ao conteúdo da página indicada no contexto acima.
2. Se o contexto diz "O usuário está visualizando o PDF... na página X", mas não fornece o TEXTO da página, você deve responder com base no seu conhecimento GERAL sobre o assunto que costuma estar nessa página do "Manual de Obtenção da CNH" ou pedir para o aluno descrever o que vê se for algo muito específico (como uma imagem).
3. Porém, o ideal é que você assuma que o aluno está na página indicada. Se a pergunta for "O que diz essa página?", e você não tem o texto exato extraído, faça uma suposição educada baseada na estrutura padrão do manual ou explique que precisa que ele leia um trecho para você.
4. Se o contexto contiver o texto extraído da página (o que seria o ideal), baseie-se 100% nele.

IMPORTANTE: Se o contexto for apenas "O usuário está visualizando o PDF 'X' na página Y", sem o texto do conteúdo, você DEVE informar ao aluno que não consegue "ler" o PDF diretamente, mas que pode tirar dúvidas sobre qualquer tema se ele disser o título ou o assunto da página.`;

    console.log('Calling AI gateway...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições atingido. Tente novamente em instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos esgotados. Por favor, adicione créditos ao workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Erro ao se comunicar com a IA');
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    console.log('AI response received successfully');

    return new Response(
      JSON.stringify({ message: aiMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in study-chat:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
