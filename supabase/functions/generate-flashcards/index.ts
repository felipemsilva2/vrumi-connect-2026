import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfBase64 } = await req.json();
    
    if (!pdfBase64) {
      throw new Error("PDF base64 é obrigatório");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Variáveis de ambiente não configuradas");
    }

    // Primeiro, parse o PDF
    console.log("Parsing PDF...");
    const parseResponse = await fetch("https://document.parser.lovable.app/parse-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        document: pdfBase64,
        include_page_screenshots: false,
      }),
    });

    if (!parseResponse.ok) {
      throw new Error(`Document parser failed: ${parseResponse.status}`);
    }

    const parseData = await parseResponse.json();
    const pdfContent = parseData.pages.map((p: any) => p.text).join("\n\n");
    console.log(`PDF parsed: ${pdfContent.length} characters`);

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

    const userPrompt = `Baseado neste conteúdo do Manual de Obtenção da CNH, gere 50 flashcards educacionais:

${pdfContent.slice(0, 150000)}`;

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
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: chapters } = await supabase.from("study_chapters").select("id, title");

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

    const { error: insertError } = await supabase
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
