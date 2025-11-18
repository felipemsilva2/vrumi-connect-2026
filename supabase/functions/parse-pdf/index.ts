import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: allowed ? 200 : 403 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error("No file provided");
    }

    const type = (file as any).type || '';
    const size = (file as any).size || 0;
    if (!type.toLowerCase().includes('pdf')) {
      return new Response(
        JSON.stringify({ error: 'Tipo de arquivo inválido. Apenas PDF.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const maxSize = Number(Deno.env.get('MAX_UPLOAD_SIZE_BYTES') || '10485760');
    if (size > maxSize) {
      return new Response(
        JSON.stringify({ error: 'Arquivo excede o tamanho máximo permitido' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Parsing PDF: ${file.name}, size: ${size} bytes`);

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const base64 = btoa(String.fromCharCode(...bytes));

    // Use Lovable's document parser API with correct endpoint
    const parseResponse = await fetch('https://document-parser.lovable.app/v1/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: base64,
        filename: file.name,
        type: 'pdf'
      }),
    });

    if (!parseResponse.ok) {
      const errorText = await parseResponse.text();
      console.error(`Document parser failed: ${parseResponse.status} - ${errorText}`);
      throw new Error(`Document parser failed: ${parseResponse.status}`);
    }

    const parsedData = await parseResponse.json();
    
    // Extract text content from all pages
    let fullContent = '';
    let pageCount = 0;

    if (parsedData.pages) {
      for (const page of parsedData.pages) {
        pageCount++;
        if (page.text) {
          fullContent += `\n\n## Página ${pageCount}\n\n${page.text}`;
        }
      }
    }

    console.log(`Successfully parsed ${pageCount} pages, content length: ${fullContent.length} chars`);

    return new Response(
      JSON.stringify({ 
        content: fullContent,
        pages: pageCount,
        size: fullContent.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in parse-pdf:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
