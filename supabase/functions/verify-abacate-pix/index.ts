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
    const { pixId, passType, secondUserEmail } = await req.json();

    if (!pixId) {
      throw new Error('pixId is required');
    }

    // Check payment status with Abacate Pay
    const abacateResponse = await fetch(`https://api.abacatepay.com/v1/pixQrCode/check?pixId=${pixId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('ABACATE_PAY_API_KEY')}`,
      },
    });

    if (!abacateResponse.ok) {
      const errorText = await abacateResponse.text();
      console.error('Abacate Pay API error:', errorText);
      throw new Error(`Failed to check payment status: ${abacateResponse.status}`);
    }

    const result = await abacateResponse.json();
    
    console.log('Payment check result:', result);

    // If payment is completed, create the pass
    if (result.data?.status === 'COMPLETED') {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      // Get user from auth header
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('No authorization header');
      }

      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: { Authorization: authHeader },
          },
        }
      );

      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const passTypeMap: Record<string, { type: '30_days' | '90_days' | 'family_90_days', days: number, price: number }> = {
        'individual_30_days': { type: '30_days', days: 30, price: 29.90 },
        'individual_90_days': { type: '90_days', days: 90, price: 79.90 },
        'family_90_days': { type: 'family_90_days', days: 90, price: 84.90 },
      };

      const passInfo = passTypeMap[passType];
      if (!passInfo) {
        throw new Error('Invalid pass type');
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + passInfo.days);

      // Create pass for main user
      const { error: passError } = await supabaseAdmin
        .from('user_passes')
        .insert({
          user_id: user.id,
          pass_type: passInfo.type,
          expires_at: expiresAt.toISOString(),
          payment_status: 'paid',
          price: passInfo.price,
        });

      if (passError) {
        console.error('Error creating pass:', passError);
        throw new Error('Failed to create pass');
      }

      // If family pass, create pass for second user
      if (passType === 'family_90_days' && secondUserEmail) {
        // Check if second user exists
        const { data: secondUserData } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', secondUserEmail)
          .single();

        if (secondUserData) {
          await supabaseAdmin
            .from('user_passes')
            .insert({
              user_id: secondUserData.id,
              pass_type: '90_days',
              expires_at: expiresAt.toISOString(),
              payment_status: 'paid',
              price: 0, // Secondary user in family pass
            });
        }
      }

      return new Response(
        JSON.stringify({ success: true, status: 'COMPLETED' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Payment still pending or other status
    return new Response(
      JSON.stringify({ 
        success: false, 
        status: result.data?.status || 'PENDING',
        expiresAt: result.data?.expiresAt 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-abacate-pix:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
