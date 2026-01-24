import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role for full access
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

        // Gather all user data
        const userData: Record<string, any> = {
            exportedAt: new Date().toISOString(),
            userId: user.id,
            email: user.email,
            metadata: user.user_metadata,
        }

        // Fetch profile data
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        userData.profile = profile

        // Fetch instructor data if applicable
        const { data: instructor } = await supabaseClient
            .from('instructors')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (instructor) {
            userData.instructor = instructor
        }

        // Fetch bookings
        const { data: bookings } = await supabaseClient
            .from('bookings')
            .select('*')
            .or(`student_id.eq.${user.id},instructor_id.eq.${instructor?.id || 'null'}`)

        userData.bookings = bookings || []

        // Fetch chat messages
        const { data: chatSessions } = await supabaseClient
            .from('chat_sessions')
            .select('id')
            .or(`student_id.eq.${user.id},instructor_id.eq.${instructor?.id || 'null'}`)

        if (chatSessions && chatSessions.length > 0) {
            const sessionIds = chatSessions.map(s => s.id)
            const { data: messages } = await supabaseClient
                .from('chat_messages')
                .select('*')
                .in('session_id', sessionIds)

            userData.chatMessages = messages || []
        }

        // Fetch consents
        const { data: consents } = await supabaseClient
            .from('user_consents')
            .select('*')
            .eq('user_id', user.id)

        userData.consents = consents || []

        // Fetch data subject requests
        const { data: dataRequests } = await supabaseClient
            .from('data_subject_requests')
            .select('*')
            .eq('user_id', user.id)

        userData.dataSubjectRequests = dataRequests || []

        // Create a data subject request for this export
        await supabaseClient.from('data_subject_requests').insert({
            user_id: user.id,
            type: 'portability',
            status: 'completed',
            notes: 'Automated data export completed',
        })

        // In production, you would:
        // 1. Store the JSON file in Supabase Storage
        // 2. Generate a temporary signed URL
        // 3. Send an email with the download link
        // For now, we'll return the data directly

        // Log the export
        try {
            await supabaseClient.from('audit_logs').insert({
                user_id: user.id,
                action_type: 'data_exported',
                entity_type: 'user_data',
                entity_id: user.id,
                details: {
                    export_size: JSON.stringify(userData).length,
                    timestamp: new Date().toISOString(),
                },
            })
        } catch (auditError) {
            console.error('Failed to create audit log:', auditError)
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Data export completed',
                data: userData,
                note: 'In production, this would be sent via email'
            }),
            {
                status: 200,
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
