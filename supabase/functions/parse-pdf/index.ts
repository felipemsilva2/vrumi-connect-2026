import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error("No file provided");
    }

    console.log(`Parsing PDF: ${file.name}, size: ${file.size} bytes`);

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Call Lovable's document parsing API
    const parseResponse = await fetch('https://document-parser.lovable.app/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/pdf',
      },
      body: uint8Array,
    });

    if (!parseResponse.ok) {
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
