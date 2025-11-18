import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";
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
  const startTime = Date.now();
  
  const { headers: corsHeaders, allowed } = getCors(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: allowed ? 200 : 403 });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: isAdminData } = await supabase.rpc('is_admin', { user_id: user.id });
    if (!isAdminData) {
      return new Response(JSON.stringify({ error: 'Permissão negada' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const schema = z.object({
      lessonId: z.string().min(1),
      pdfContent: z.string().min(10),
      chapterContext: z.string().max(200000).optional(),
    });
    const { lessonId, pdfContent, chapterContext } = schema.parse(await req.json());
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log(`Processing lesson: ${lessonId}`);

    // Get lesson details
    const { data: lesson, error: lessonError } = await supabase
      .from('study_lessons')
      .select('*, study_chapters!inner(title, study_modules!inner(title))')
      .eq('id', lessonId)
      .single();

    if (lessonError) throw lessonError;

    // Prepare AI prompt
    const systemPrompt = `Você é um especialista em estruturar conteúdo educacional sobre legislação de trânsito brasileira. 
Sua tarefa é extrair e estruturar conteúdo do PDF em blocos granulares e didáticos.

TIPOS DE BLOCOS DISPONÍVEIS:
1. heading: Títulos (levels 1-6)
2. paragraph: Parágrafos de texto
3. list: Listas (bullet, numbered, checklist)
4. image: Referências a imagens
5. quote: Citações (com ou sem destaque)
6. law_article: Artigos de lei (article, law, text, penalty?)
7. highlight_box: Caixas de destaque (info, warning, tip, important)

INSTRUÇÕES:
- Extraia APENAS conteúdo relevante para a lição: "${lesson.title}"
- Estruture em blocos pequenos e didáticos
- Use highlight_box para pontos importantes
- Use law_article para artigos do CTB
- Use quote para dicas importantes
- Mantenha a ordem lógica do conteúdo
- Retorne APENAS um array JSON de blocos, sem texto adicional`;

    const userPrompt = `CONTEXTO:
Módulo: ${lesson.study_chapters.study_modules.title}
Capítulo: ${lesson.study_chapters.title}
Lição: ${lesson.title}

CONTEÚDO DO PDF:
${pdfContent}

Extraia e estruture o conteúdo relevante para esta lição em blocos granulares.
Retorne um array JSON onde cada objeto tem:
{
  "content_type": "tipo",
  "content_data": { dados específicos do tipo },
  "order_position": número
}`;

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData.choices[0].message.content;

    console.log('AI Response:', generatedContent);

    // Parse AI response
    let blocks;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = generatedContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                       generatedContent.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : generatedContent;
      blocks = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      throw new Error('Failed to parse AI response as JSON');
    }

    if (!Array.isArray(blocks)) {
      throw new Error('AI response is not an array of blocks');
    }

    // Insert blocks into database
    const lessonContents = blocks.map((block: any, index: number) => ({
      lesson_id: lessonId,
      content_type: block.content_type,
      content_data: block.content_data,
      order_position: block.order_position || index + 1,
    }));

    const { error: insertError } = await supabase
      .from('lesson_contents')
      .insert(lessonContents);

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    const processingTime = Date.now() - startTime;
    
    console.log(`✅ Successfully processed lesson: ${lesson.title} in ${processingTime}ms - ${blocks.length} blocks created`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        blocksCreated: blocks.length,
        lessonTitle: lesson.title,
        processingTimeMs: processingTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in populate-materiais-from-pdf:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
