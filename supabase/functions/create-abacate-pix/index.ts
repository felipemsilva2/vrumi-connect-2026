// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

declare const Deno: any;


const getCors = (req: Request) => {
    const origin = req.headers.get('origin') || '';
    const allowedList = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map((s: string) => s.trim()).filter(Boolean);
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

const PASS_EXPIRY_MAP: Record<string, number> = {
    'individual_30_days': 30,
    'individual_90_days': 90,
    'family_90_days': 90,
};

serve(async (req: Request) => {
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

        const { passType, secondUserEmail, customer, couponCode } = await req.json();

        if (!passType || !PASS_DETAILS_MAP[passType]) {
            throw new Error(`Invalid pass type: ${passType}`);
        }

        const passDetails = PASS_DETAILS_MAP[passType];
        const abacateApiKey = Deno.env.get("ABACATE_PAY_API_KEY");

        if (!abacateApiKey) {
            throw new Error("ABACATE_PAY_API_KEY not configured");
        }

        let finalPrice = passDetails.price;
        let couponId = null;

        // Handle Coupon Logic
        if (couponCode) {
            logStep("Validating coupon", { couponCode });

            const { data: coupon, error: couponError } = await supabaseClient
                .from('coupons')
                .select('*')
                .eq('code', couponCode)
                .single();

            if (!couponError && coupon && coupon.is_active) {
                const now = new Date();
                const expiresAt = coupon.expires_at ? new Date(coupon.expires_at) : null;
                const isExpired = expiresAt && expiresAt < now;
                const isLimitReached = coupon.max_uses && coupon.used_count >= coupon.max_uses;

                if (!isExpired && !isLimitReached) {
                    let discountAmount = 0;
                    if (coupon.discount_type === 'percentage') {
                        discountAmount = finalPrice * (coupon.discount_value / 100);
                    } else if (coupon.discount_type === 'fixed') {
                        // Discount value is in reais, convert to cents
                        discountAmount = coupon.discount_value * 100;
                    }

                    finalPrice = Math.max(0, finalPrice - discountAmount);
                    couponId = coupon.id;
                    logStep("Coupon applied", { code: couponCode, discountAmount, finalPrice });
                } else {
                    logStep("Coupon invalid (expired or limit reached)", { code: couponCode });
                }
            } else {
                logStep("Coupon not found or inactive", { code: couponCode });
            }
        }

        logStep("Creating Abacate Pay PIX QR Code", { passType, amount: finalPrice });

        const expiresInDays = PASS_EXPIRY_MAP[passType] || 30;

        const body = {
            amount: Math.round(finalPrice), // Ensure integer for cents
            expiresIn: expiresInDays * 24 * 60, // Convert days to minutes
            description: `${passDetails.name} - RoadWiz`,
            customer: {
                name: customer.name,
                cellphone: customer.phone,
                email: customer.email,
                taxId: customer.taxId
            },
            metadata: {
                externalId: user.id,
                user_id: user.id,
                pass_type: passType,
                second_user_email: secondUserEmail || '',
                coupon_code: couponCode || '',
                coupon_id: couponId || ''
            }
        };

        const response = await fetch("https://api.abacatepay.com/v1/pixQrCode/create", {
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
        logStep("PIX QR Code created", { id: result.data?.id, status: result.data?.status });

        if (result.error) {
            throw new Error(`Abacate Pay Error: ${JSON.stringify(result.error)}`);
        }

        // Increment coupon usage if applied
        if (couponId) {
            // First get current count, then update
            const { data: couponData } = await supabaseClient
                .from('coupons')
                .select('used_count')
                .eq('id', couponId)
                .single();
            
            if (couponData) {
                const { error: updateError } = await supabaseClient
                    .from('coupons')
                    .update({ used_count: (couponData.used_count || 0) + 1 })
                    .eq('id', couponId);

                if (updateError) {
                    logStep("Failed to increment coupon usage", { couponId, error: updateError });
                }
            }
        }

        // Response format from Abacate Pay:
        // { data: { id, amount, status, brCode, brCodeBase64, ... }, error: null }
        const qrCodeUrl = result.data?.brCodeBase64; // Base64 image for QR code
        const copyPaste = result.data?.brCode; // PIX copy/paste code
        const pixId = result.data?.id;

        if (!qrCodeUrl || !copyPaste) {
            logStep("Missing PIX data", { qrCodeUrl: !!qrCodeUrl, copyPaste: !!copyPaste });
            throw new Error("Incomplete PIX data received from Abacate Pay");
        }

        return new Response(JSON.stringify({
            qrCodeUrl,
            copyPaste,
            pixId,
            expiresAt: result.data?.expiresAt
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
