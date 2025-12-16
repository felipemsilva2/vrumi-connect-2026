import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
    userId?: string;
    userIds?: string[];
    title: string;
    body: string;
    data?: Record<string, any>;
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const payload: NotificationPayload = await req.json();
        const { userId, userIds, title, body, data } = payload;

        if (!title || !body) {
            return new Response(
                JSON.stringify({ error: 'title and body are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Determine which users to notify
        const targetUserIds = userIds || (userId ? [userId] : []);

        if (targetUserIds.length === 0) {
            return new Response(
                JSON.stringify({ error: 'userId or userIds is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Fetch push tokens for the target users
        const { data: tokens, error: fetchError } = await supabase
            .from('push_tokens')
            .select('token')
            .in('user_id', targetUserIds);

        if (fetchError) {
            console.error('Error fetching tokens:', fetchError);
            return new Response(
                JSON.stringify({ error: 'Failed to fetch push tokens' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (!tokens || tokens.length === 0) {
            return new Response(
                JSON.stringify({ message: 'No push tokens found for the specified users', sent: 0 }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Prepare messages for Expo Push API
        const messages = tokens.map((t: { token: string }) => ({
            to: t.token,
            sound: 'default',
            title,
            body,
            data: data || {},
        }));

        // Send to Expo Push API in chunks of 100
        const chunks = [];
        for (let i = 0; i < messages.length; i += 100) {
            chunks.push(messages.slice(i, i + 100));
        }

        let totalSent = 0;
        const errors: any[] = [];

        for (const chunk of chunks) {
            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Accept-Encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(chunk),
            });

            const result = await response.json();

            if (result.data) {
                result.data.forEach((r: any, index: number) => {
                    if (r.status === 'ok') {
                        totalSent++;
                    } else {
                        errors.push({ token: chunk[index].to, error: r.message });
                    }
                });
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                sent: totalSent,
                failed: errors.length,
                errors: errors.slice(0, 5) // Return first 5 errors for debugging
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error in send-push-notification:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
