import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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

interface TrafficSignInput {
  code: string;
  name: string;
  image_url: string;
  description: string;
  category: string;
}

serve(async (req) => {
  const { headers: corsHeaders, allowed } = getCors(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: allowed ? 200 : 403 });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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

    const signSchema = z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      image_url: z.string().url(),
      description: z.string().optional().default(''),
      category: z.string().min(1),
    });
    const schema = z.object({ signs: z.array(signSchema).min(1) });
    const { signs } = schema.parse(await req.json());
    
    console.log(`📦 Iniciando importação de ${signs.length} placas de trânsito`);
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
        const ct = imageResponse.headers.get('content-type') || '';
        if (!ct.startsWith('image/')) {
          throw new Error('URL não contém imagem válida');
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
