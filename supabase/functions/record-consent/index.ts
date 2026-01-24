import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ConsentRequest {
    consentType: 'terms' | 'privacy' | 'marketing' | 'cookies'
    version: string
    metadata?: Record<string, any>
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Create Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        // Verify user is authenticated
        const {
            data: { user },
            error: authError,
        } = await supabaseClient.auth.getUser()

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Parse request body
        const { consentType, version, metadata = {} }: ConsentRequest = await req.json()

        // Validate required fields
        if (!consentType || !version) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: consentType, version' }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Validate consent type
        const validTypes = ['terms', 'privacy', 'marketing', 'cookies']
        if (!validTypes.includes(consentType)) {
            return new Response(
                JSON.stringify({ error: `Invalid consent type. Must be one of: ${validTypes.join(', ')}` }),
                {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Extract client information for audit trail
        const ipAddress = req.headers.get('x-forwarded-for') ||
            req.headers.get('x-real-ip') ||
            'unknown'
        const userAgent = req.headers.get('user-agent') || 'unknown'

        // Check if there's an existing active consent of this type
        const { data: existingConsent } = await supabaseClient
            .from('user_consents')
            .select('id, version')
            .eq('user_id', user.id)
            .eq('consent_type', consentType)
            .is('revoked_at', null)
            .order('accepted_at', { ascending: false })
            .limit(1)
            .single()

        // If same version already accepted, return existing
        if (existingConsent && existingConsent.version === version) {
            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'Consent already recorded',
                    consentId: existingConsent.id,
                    alreadyExists: true
                }),
                {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Insert new consent record
        const { data: newConsent, error: insertError } = await supabaseClient
            .from('user_consents')
            .insert({
                user_id: user.id,
                consent_type: consentType,
                version,
                ip_address: ipAddress,
                user_agent: userAgent,
                metadata: {
                    ...metadata,
                    recorded_via: 'edge_function',
                    timestamp: new Date().toISOString(),
                },
            })
            .select()
            .single()

        if (insertError) {
            console.error('Error inserting consent:', insertError)
            return new Response(
                JSON.stringify({ error: 'Failed to record consent', details: insertError.message }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Log to audit_logs if available
        try {
            await supabaseClient.from('audit_logs').insert({
                user_id: user.id,
                action_type: 'consent_recorded',
                entity_type: 'user_consent',
                entity_id: newConsent.id,
                details: {
                    consent_type: consentType,
                    version,
                    ip_address: ipAddress,
                },
            })
        } catch (auditError) {
            // Don't fail the request if audit logging fails
            console.error('Failed to create audit log:', auditError)
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Consent recorded successfully',
                consentId: newConsent.id,
                consentType,
                version,
                acceptedAt: newConsent.accepted_at
            }),
            {
                status: 201,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )

    } catch (error) {
        console.error('Unexpected error:', error)
        return new Response(
            JSON.stringify({ error: 'Internal server error', details: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})
