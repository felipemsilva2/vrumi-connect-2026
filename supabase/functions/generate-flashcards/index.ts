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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseAuth.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: isAdminData } = await supabaseAuth.rpc('is_admin', { user_id: user.id });
    if (!isAdminData) {
      return new Response(JSON.stringify({ error: 'Permissão negada' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const schema = z.object({ pdfBase64: z.string().min(10) });
    const { pdfBase64 } = schema.parse(await req.json());
    
    if (!pdfBase64) {
      throw new Error("PDF base64 é obrigatório");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    console.log("Processing PDF with AI...");

    // Usar IA para gerar flashcards
    const systemPrompt = `Você é um especialista em criar flashcards educacionais para estudantes de habilitação de trânsito no Brasil.

Analise o conteúdo fornecido do Manual de Obtenção da CNH e gere flashcards de alta qualidade.

FORMATO DE SAÍDA (JSON):
[
  {
    "question": "Pergunta clara e objetiva",
    "answer": "Resposta completa e educativa",
    "category": "Uma das categorias: Legislação, Sinalização Vertical, Sinalização Horizontal, Direção Defensiva, Primeiros Socorros, Meio Ambiente, Mecânica Básica",
    "difficulty": "easy, medium ou hard"
  }
]

REGRAS:
1. Gere EXATAMENTE 50 flashcards
2. Distribua entre as categorias de forma equilibrada
3. Varie os níveis de dificuldade (30% easy, 50% medium, 20% hard)
4. Perguntas devem ser claras e diretas
5. Respostas devem ser completas mas concisas (2-4 linhas)
6. Foque em conceitos importantes e que aparecem em provas
7. Retorne APENAS o JSON, sem texto adicional`;

    const userPrompt = `Analise este PDF do Manual de Obtenção da CNH e gere 50 flashcards educacionais com perguntas e respostas sobre o conteúdo.

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
    let flashcards;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      flashcards = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Falha ao interpretar resposta da IA");
    }

    console.log(`Generated ${flashcards.length} flashcards`);

    // Buscar chapter_ids para associar aos flashcards
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: chapters } = await supabaseAdmin.from("study_chapters").select("id, title");

    // Mapear categoria para chapter_id
    const categoryToChapter: Record<string, string> = {};
    if (chapters) {
      chapters.forEach((ch: any) => {
        if (ch.title.includes("Legislação")) categoryToChapter["Legislação"] = ch.id;
        if (ch.title.includes("Sinalização")) categoryToChapter["Sinalização Vertical"] = ch.id;
        if (ch.title.includes("Sinalização")) categoryToChapter["Sinalização Horizontal"] = ch.id;
        if (ch.title.includes("Defensiva")) categoryToChapter["Direção Defensiva"] = ch.id;
        if (ch.title.includes("Socorros")) categoryToChapter["Primeiros Socorros"] = ch.id;
        if (ch.title.includes("Ambiente")) categoryToChapter["Meio Ambiente"] = ch.id;
        if (ch.title.includes("Mecânica")) categoryToChapter["Mecânica Básica"] = ch.id;
      });
    }

    // Inserir flashcards no banco
    const flashcardsToInsert = flashcards.map((fc: any) => ({
      question: fc.question,
      answer: fc.answer,
      category: fc.category,
      difficulty: fc.difficulty,
      chapter_id: categoryToChapter[fc.category] || chapters?.[0]?.id,
    }));

    const { error: insertError } = await supabaseAdmin
      .from("flashcards")
      .insert(flashcardsToInsert);

    if (insertError) {
      console.error("Insert error:", insertError);
      throw insertError;
    }

    console.log(`Successfully inserted ${flashcardsToInsert.length} flashcards`);

    return new Response(
      JSON.stringify({
        success: true,
        flashcardsGenerated: flashcardsToInsert.length,
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
