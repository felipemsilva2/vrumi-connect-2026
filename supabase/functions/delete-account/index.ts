// @ts-nocheck - Deno Edge Function
// Delete User Account - Apple App Store Requirement
// This function deletes all user data to comply with Apple's account deletion requirements

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getSecureCors } from '../_shared/cors.ts'

Deno.serve(async (req) => {
    const cors = getSecureCors(req);

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: cors.headers });
    }

    try {
        // Validate authentication
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Authorization header required' }),
                { status: 401, headers: { ...cors.headers, 'Content-Type': 'application/json' } }
            );
        }

        // Create Supabase client with service role for admin operations
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { persistSession: false } }
        );

        // Create client with user's token to get their ID
        const supabaseUser = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: { headers: { Authorization: authHeader } },
                auth: { persistSession: false }
            }
        );

        // Get the authenticated user
        const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Invalid or expired token' }),
                { status: 401, headers: { ...cors.headers, 'Content-Type': 'application/json' } }
            );
        }

        const userId = user.id;
        console.log(`Starting account deletion for user: ${userId}`);

        // Delete user data in order (respecting foreign key constraints)

        // 1. Delete notifications
        await supabaseAdmin.from('notifications').delete().eq('user_id', userId);

        // 2. Delete flashcard progress
        await supabaseAdmin.from('user_flashcard_progress').delete().eq('user_id', userId);

        // 3. Delete quiz answers
        await supabaseAdmin.from('quiz_answers').delete().eq('user_id', userId);

        // 4. Delete quiz attempts
        await supabaseAdmin.from('quiz_attempts').delete().eq('user_id', userId);

        // 5. Delete daily study activities
        await supabaseAdmin.from('daily_study_activities').delete().eq('user_id', userId);

        // 6. Delete chat messages (as student)
        const { data: chatRooms } = await supabaseAdmin
            .from('connect_chat_rooms')
            .select('id')
            .eq('student_id', userId);

        if (chatRooms && chatRooms.length > 0) {
            const roomIds = chatRooms.map(r => r.id);
            await supabaseAdmin.from('connect_chat_messages').delete().in('room_id', roomIds);
            await supabaseAdmin.from('connect_chat_rooms').delete().eq('student_id', userId);
        }

        // 7. Delete bookings (as student)
        await supabaseAdmin.from('bookings').delete().eq('student_id', userId);

        // 8. Check if user is an instructor
        const { data: instructor } = await supabaseAdmin
            .from('instructors')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (instructor) {
            // Delete instructor-related data
            await supabaseAdmin.from('instructor_availability').delete().eq('instructor_id', instructor.id);
            await supabaseAdmin.from('instructor_services').delete().eq('instructor_id', instructor.id);
            await supabaseAdmin.from('instructor_documents').delete().eq('instructor_id', instructor.id);

            // Delete bookings where user is instructor
            await supabaseAdmin.from('bookings').delete().eq('instructor_id', instructor.id);

            // Delete chat rooms where user is instructor
            const { data: instructorRooms } = await supabaseAdmin
                .from('connect_chat_rooms')
                .select('id')
                .eq('instructor_id', instructor.id);

            if (instructorRooms && instructorRooms.length > 0) {
                const roomIds = instructorRooms.map(r => r.id);
                await supabaseAdmin.from('connect_chat_messages').delete().in('room_id', roomIds);
                await supabaseAdmin.from('connect_chat_rooms').delete().eq('instructor_id', instructor.id);
            }

            // Delete instructor profile
            await supabaseAdmin.from('instructors').delete().eq('id', instructor.id);
        }

        // 9. Delete user profile
        await supabaseAdmin.from('profiles').delete().eq('id', userId);

        // 10. Delete the auth user (this should be last)
        const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteAuthError) {
            console.error('Error deleting auth user:', deleteAuthError);
            throw deleteAuthError;
        }

        console.log(`Successfully deleted account for user: ${userId}`);

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Account and all associated data deleted successfully'
            }),
            {
                status: 200,
                headers: { ...cors.headers, 'Content-Type': 'application/json' }
            }
        );

    } catch (error) {
        console.error('Delete account error:', error);
        return new Response(
            JSON.stringify({
                error: 'Failed to delete account',
                message: error.message || 'An unexpected error occurred'
            }),
            {
                status: 500,
                headers: { ...cors.headers, 'Content-Type': 'application/json' }
            }
        );
    }
});
