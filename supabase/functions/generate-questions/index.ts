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
  const { headers: corsHeaders, allowed } = getCors(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: allowed ? 200 : 403 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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
    const { data: isAdminData } = await supabase.rpc('is_admin', { user_id: user.id });
    if (!isAdminData) {
      return new Response(JSON.stringify({ error: 'Permissão negada' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const schema = z.object({ pdfBase64: z.string().min(10) });
    const { pdfBase64 } = schema.parse(await req.json());
    
    if (!pdfBase64) {
      throw new Error("PDF base64 é obrigatório");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Variáveis de ambiente não configuradas");
    }

    console.log("Processing PDF with AI...");

    // Usar IA para gerar questões
    const systemPrompt = `Você é um especialista em criar questões de múltipla escolha para provas de habilitação de trânsito no Brasil.

Analise o conteúdo fornecido do Manual de Obtenção da CNH e gere questões de alta qualidade no estilo DETRAN.

FORMATO DE SAÍDA (JSON):
[
  {
    "question_text": "Enunciado claro da questão",
    "option_a": "Primeira alternativa",
    "option_b": "Segunda alternativa",
    "option_c": "Terceira alternativa",
    "option_d": "Quarta alternativa",
    "correct_option": "A, B, C ou D",
    "explanation": "Explicação detalhada do porquê a resposta está correta, citando artigos de lei quando aplicável",
    "difficulty": "easy, medium ou hard",
    "category": "Uma das categorias: Legislação, Sinalização, Direção Defensiva, Primeiros Socorros, Meio Ambiente, Mecânica"
  }
]

REGRAS:
1. Gere EXATAMENTE 60 questões
2. Distribua entre as categorias de forma equilibrada
3. Varie os níveis de dificuldade (30% easy, 50% medium, 20% hard)
4. Questões devem ser claras e sem ambiguidade
5. Alternativas erradas devem ser plausíveis (não óbvias)
6. Explicações devem ser educativas e citar legislação quando aplicável
7. Foque em situações práticas e que aparecem em provas reais
8. Retorne APENAS o JSON, sem texto adicional`;

    const userPrompt = `Analise este PDF do Manual de Obtenção da CNH e gere 60 questões de múltipla escolha no estilo DETRAN.

PDF em base64: ${pdfBase64.slice(0, 100000)}`;

    console.log("Calling Lovable AI...");
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    
    // Parse JSON da resposta
    let questions;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      questions = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Falha ao interpretar resposta da IA");
    }

    console.log(`Generated ${questions.length} questions`);

    // Buscar chapter_ids para associar às questões
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: chapters } = await supabase.from("study_chapters").select("id, title");

    // Mapear categoria para chapter_id
    const categoryToChapter: Record<string, string> = {};
    if (chapters) {
      chapters.forEach((ch: any) => {
        if (ch.title.includes("Legislação")) categoryToChapter["Legislação"] = ch.id;
        if (ch.title.includes("Sinalização")) categoryToChapter["Sinalização"] = ch.id;
        if (ch.title.includes("Defensiva")) categoryToChapter["Direção Defensiva"] = ch.id;
        if (ch.title.includes("Socorros")) categoryToChapter["Primeiros Socorros"] = ch.id;
        if (ch.title.includes("Ambiente")) categoryToChapter["Meio Ambiente"] = ch.id;
        if (ch.title.includes("Mecânica")) categoryToChapter["Mecânica"] = ch.id;
      });
    }

    // Inserir questões no banco
    const questionsToInsert = questions.map((q: any) => ({
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_option: q.correct_option,
      explanation: q.explanation,
      difficulty: q.difficulty,
      chapter_id: categoryToChapter[q.category] || chapters?.[0]?.id,
    }));

    const { error: insertError } = await supabase
      .from("quiz_questions")
      .insert(questionsToInsert);

    if (insertError) {
      console.error("Insert error:", insertError);
      throw insertError;
    }

    console.log(`Successfully inserted ${questionsToInsert.length} questions`);

    return new Response(
      JSON.stringify({
        success: true,
        questionsGenerated: questionsToInsert.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
