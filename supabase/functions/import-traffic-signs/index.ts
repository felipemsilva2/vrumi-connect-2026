import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrafficSignInput {
  code: string;
  name: string;
  image_url: string;
  description: string;
  category: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { signs }: { signs: TrafficSignInput[] } = await req.json();
    
    console.log(`📦 Iniciando importação de ${signs.length} placas de trânsito`);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const results = {
      total: signs.length,
      success: 0,
      errors: [] as any[],
    };

    for (const sign of signs) {
      try {
        console.log(`🔄 Processando placa: ${sign.code}`);
        
        // 1. Download da imagem externa
        const imageResponse = await fetch(sign.image_url);
        if (!imageResponse.ok) {
          throw new Error(`Failed to download image: ${imageResponse.statusText}`);
        }
        const imageBlob = await imageResponse.blob();
        
        // 2. Upload para Supabase Storage
        const fileName = `${sign.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('traffic-signs')
          .upload(fileName, imageBlob, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        // 3. Gerar URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('traffic-signs')
          .getPublicUrl(fileName);

        // 4. Inserir no banco de dados
        const { error: insertError } = await supabase
          .from('traffic_signs')
          .upsert({
            code: sign.code,
            name: sign.name,
            category: sign.category,
            description: sign.description || '',
            image_url: publicUrl,
            is_active: true,
          }, {
            onConflict: 'code'
          });

        if (insertError) throw insertError;
        
        results.success++;
        console.log(`✅ Placa ${sign.code} processada com sucesso (${results.success}/${signs.length})`);
        
      } catch (error: any) {
        console.error(`❌ Erro ao processar placa ${sign.code}:`, error.message);
        results.errors.push({
          code: sign.code,
          error: error.message,
        });
      }
    }

    console.log(`🎉 Importação concluída: ${results.success} sucessos, ${results.errors.length} erros`);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ Erro geral na importação:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
