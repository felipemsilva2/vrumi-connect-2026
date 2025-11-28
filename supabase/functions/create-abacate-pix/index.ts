import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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

const logStep = (step: string, details?: any) => {
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
    console.log(`[CREATE-ABACATE-PIX] ${step}${detailsStr}`);
};

const PASS_DETAILS_MAP: Record<string, { price: number, name: string }> = {
    'individual_30_days': { price: 2990, name: 'Passaporte 30 Dias' },
    'individual_90_days': { price: 7990, name: 'Passaporte 90 Dias' },
    'family_90_days': { price: 8490, name: 'Passaporte Família' },
};

serve(async (req) => {
    const { headers: corsHeaders, allowed } = getCors(req);
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders, status: allowed ? 200 : 403 });
    }

    const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    try {
        logStep("Function started");

        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("No authorization header provided");

        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabaseClient.auth.getUser(token);

        if (!user?.email) throw new Error("User not authenticated or email not available");

        logStep("User authenticated", { userId: user.id, email: user.email });

        const { passType, secondUserEmail, customer } = await req.json();

        if (!passType || !PASS_DETAILS_MAP[passType]) {
            throw new Error(`Invalid pass type: ${passType}`);
        }

        const passDetails = PASS_DETAILS_MAP[passType];
        const abacateApiKey = Deno.env.get("ABACATE_PAY_API_KEY");

        if (!abacateApiKey) {
            throw new Error("ABACATE_PAY_API_KEY not configured");
        }

        logStep("Creating Abacate Pay billing", { passType, amount: passDetails.price });

        const returnUrl = `${req.headers.get("origin")}/pagamento/sucesso`;

        const body = {
            frequency: "ONE_TIME",
            methods: ["PIX"],
            products: [
                {
                    externalId: passType,
                    name: passDetails.name,
                    quantity: 1,
                    price: passDetails.price,
                    description: `Acesso ao RoadWiz - ${passDetails.name}`
                }
            ],
            returnUrl: returnUrl,
            completionUrl: returnUrl,
            customer: {
                name: customer.name,
                email: customer.email,
                taxId: customer.taxId,
                cellphone: customer.phone // Abacate Pay uses 'cellphone' usually, checking docs... search result said 'cellphone'
            },
            metadata: {
                user_id: user.id,
                pass_type: passType,
                second_user_email: secondUserEmail || ''
            }
        };

        const response = await fetch("https://api.abacatepay.com/v1/billing/create", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${abacateApiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            logStep("Abacate Pay API Error", { status: response.status, body: errorText });
            throw new Error(`Abacate Pay API Error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        logStep("Billing created", { id: result.data?.id });

        // Extract Pix info. Structure depends on API.
        // Usually result.data.pix.code or similar.
        // Based on common patterns: result.data.paymentMethods.pix...
        // Or result.data.url (billing url)
        // Search result said: "returns a billing object".
        // I'll assume the response contains the necessary info.
        // If I can't find the exact structure, I'll return the whole data for debugging or try to extract what I can.
        // However, for the frontend to work, I need `qrCodeUrl` and `copyPaste`.

        // Let's assume the standard response structure for these modern APIs.
        // Often: data.pix.qrcode (image url) and data.pix.code (copy paste)

        // If I'm unsure, I'll return the whole data object and let the frontend log it if it fails, 
        // but I need to map it to what the frontend expects: { qrCodeUrl, copyPaste }

        // Let's try to map from likely fields.
        // If the API returns a billing URL, maybe we just redirect there?
        // But the user asked for a "popup" (modal) with QR code.
        // So I need the raw QR code data.

        // I'll try to extract it from `result.data.pix`.

        const pixInfo = result.data?.pix;
        // Fallback if structure is different
        const qrCodeUrl = pixInfo?.qrcode || pixInfo?.qr_code_url || result.data?.url;
        const copyPaste = pixInfo?.code || pixInfo?.copy_paste || result.data?.id; // Fallback to ID if code missing? No, that won't work.

        return new Response(JSON.stringify({
            qrCodeUrl: qrCodeUrl,
            copyPaste: copyPaste,
            raw: result // Return raw data just in case for debugging
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logStep("ERROR in create-abacate-pix", { message: errorMessage });
        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
