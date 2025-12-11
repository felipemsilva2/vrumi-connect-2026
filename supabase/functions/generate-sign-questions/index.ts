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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { category, limit = 10 } = await req.json();

    console.log(`Generating questions for category: ${category || 'all'}, limit: ${limit}`);

    // Fetch traffic signs from database
    let query = supabase
      .from('traffic_signs')
      .select('id, code, name, category, description, meaning, image_url')
      .eq('is_active', true);

    if (category) {
      query = query.eq('category', category);
    }

    const { data: signs, error: signsError } = await query.limit(limit);

    if (signsError) {
      console.error("Error fetching signs:", signsError);
      throw signsError;
    }

    if (!signs || signs.length === 0) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Nenhuma placa encontrada" 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${signs.length} signs to generate questions for`);

    // Get a default chapter_id for the questions
    const { data: chapters } = await supabase
      .from('study_chapters')
      .select('id')
      .limit(1);

    const chapterId = chapters?.[0]?.id || '00000000-0000-0000-0000-000000000000';

    const generatedQuestions: any[] = [];

    for (const sign of signs) {
      const prompt = `Gere UMA questão de múltipla escolha sobre a placa de trânsito brasileira com as seguintes informações EXATAS:

Código: ${sign.code}
Nome: ${sign.name}
Categoria: ${sign.category}
${sign.description ? `Descrição: ${sign.description}` : ''}
${sign.meaning ? `Significado: ${sign.meaning}` : ''}

REGRAS IMPORTANTES:
1. A questão DEVE mencionar o código "${sign.code}" e o nome "${sign.name}" EXATAMENTE como fornecido
2. A resposta correta deve estar relacionada ao significado real da placa
3. As alternativas incorretas devem ser plausíveis mas claramente erradas
4. Use linguagem clara e objetiva
5. A questão deve ser educativa e ajudar no aprendizado para o exame do DETRAN

Responda APENAS com o JSON no formato:
{
  "question_text": "texto da pergunta incluindo o código ${sign.code} e nome '${sign.name}'",
  "option_a": "primeira alternativa",
  "option_b": "segunda alternativa", 
  "option_c": "terceira alternativa",
  "option_d": "quarta alternativa",
  "correct_option": "A, B, C ou D",
  "explanation": "explicação breve da resposta correta"
}`;

      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { 
                role: "system", 
                content: "Você é um especialista em legislação de trânsito brasileira e sinalização viária. Gere questões precisas e educativas para preparação de exames do DETRAN. Responda APENAS com JSON válido, sem markdown ou texto adicional." 
              },
              { role: "user", content: prompt }
            ],
          }),
        });

        if (!aiResponse.ok) {
          console.error(`AI error for sign ${sign.code}:`, await aiResponse.text());
          continue;
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content;

        if (!content) {
          console.error(`No content for sign ${sign.code}`);
          continue;
        }

        // Parse JSON from response (handle markdown code blocks if present)
        let questionData;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            questionData = JSON.parse(jsonMatch[0]);
          } else {
            console.error(`No JSON found for sign ${sign.code}`);
            continue;
          }
        } catch (parseError) {
          console.error(`Parse error for sign ${sign.code}:`, parseError);
          continue;
        }

        // Insert the question into the database
        const { data: insertedQuestion, error: insertError } = await supabase
          .from('quiz_questions')
          .insert({
            chapter_id: chapterId,
            question_text: questionData.question_text,
            option_a: questionData.option_a,
            option_b: questionData.option_b,
            option_c: questionData.option_c,
            option_d: questionData.option_d,
            correct_option: questionData.correct_option,
            explanation: questionData.explanation,
            image_url: sign.image_url,
            difficulty: 'medium'
          })
          .select()
          .single();

        if (insertError) {
          console.error(`Insert error for sign ${sign.code}:`, insertError);
          continue;
        }

        generatedQuestions.push({
          sign_code: sign.code,
          sign_name: sign.name,
          question_id: insertedQuestion.id
        });

        console.log(`Generated question for ${sign.code}: ${sign.name}`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (signError) {
        console.error(`Error processing sign ${sign.code}:`, signError);
        continue;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `${generatedQuestions.length} questões geradas com sucesso`,
      generated: generatedQuestions
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error in generate-sign-questions:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
