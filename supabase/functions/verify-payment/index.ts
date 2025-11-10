import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error("User not authenticated");
    
    logStep("User authenticated", { userId: user.id });

    const { sessionId } = await req.json();
    
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    logStep("Session ID received", { sessionId });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Recuperar a sessão do Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    logStep("Session retrieved", { 
      status: session.payment_status, 
      metadata: session.metadata 
    });

    if (session.payment_status !== 'paid') {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Payment not completed' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Extrair metadados
    const passType = session.metadata?.pass_type;
    const userId = session.metadata?.user_id;
    const secondUserEmail = session.metadata?.second_user_email;

    if (!passType || !userId) {
      throw new Error("Invalid session metadata");
    }

    // Calcular data de expiração
    const durationMap: Record<string, number> = {
      'individual_30_days': 30,
      'individual_90_days': 90,
      'family_90_days': 90,
    };

    const durationDays = durationMap[passType];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    // Preço em centavos (convertido de reais)
    const priceMap: Record<string, number> = {
      'individual_30_days': 29.90,
      'individual_90_days': 79.90,
      'family_90_days': 84.90,
    };

    const price = priceMap[passType];

    logStep("Creating passes", { passType, userId, secondUserEmail, expiresAt, price });

    // Se for plano família, criar dois passes
    if (passType === 'family_90_days' && secondUserEmail) {
      // Buscar o segundo usuário
      const { data: users, error: listError } = await supabaseClient.auth.admin.listUsers();
      
      if (listError) {
        logStep("Error listing users", { error: listError });
        throw listError;
      }

      const secondUser = users?.users?.find(u => u.email === secondUserEmail);
      
      if (!secondUser) {
        logStep("Second user not found, creating invite", { secondUserEmail });
        
        // Criar apenas o passe do usuário principal
        const { error: insertError1 } = await supabaseClient
          .from('user_passes')
          .insert({
            user_id: userId,
            pass_type: passType,
            price: price / 2,
            expires_at: expiresAt.toISOString(),
            payment_status: 'completed',
          });

        if (insertError1) {
          logStep("Error creating main user pass", { error: insertError1 });
          throw insertError1;
        }

        logStep("Main user pass created, second user needs to sign up");
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Pass created for main user. Second user needs to sign up.',
          needsSecondUserSignup: true,
          secondUserEmail
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Criar passes para ambos os usuários
      const { error: insertError1 } = await supabaseClient
        .from('user_passes')
        .insert({
          user_id: userId,
          pass_type: passType,
          price: price / 2,
          expires_at: expiresAt.toISOString(),
          payment_status: 'completed',
        });

      if (insertError1) {
        logStep("Error creating first pass", { error: insertError1 });
        throw insertError1;
      }

      const { error: insertError2 } = await supabaseClient
        .from('user_passes')
        .insert({
          user_id: secondUser.id,
          pass_type: passType,
          price: price / 2,
          expires_at: expiresAt.toISOString(),
          payment_status: 'completed',
        });

      if (insertError2) {
        logStep("Error creating second pass", { error: insertError2 });
        throw insertError2;
      }

      logStep("Both family passes created successfully");
    } else {
      // Criar passe individual
      const { error: insertError } = await supabaseClient
        .from('user_passes')
        .insert({
          user_id: userId,
          pass_type: passType,
          price,
          expires_at: expiresAt.toISOString(),
          payment_status: 'completed',
        });

      if (insertError) {
        logStep("Error creating individual pass", { error: insertError });
        throw insertError;
      }

      logStep("Individual pass created successfully");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Payment verified and pass created successfully' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in verify-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
