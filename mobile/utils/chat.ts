import { supabase } from '../src/lib/supabase';
import { router } from 'expo-router';

/**
 * Start or get an existing conversation with another user
 * @param currentUserId - Current logged in user's ID
 * @param otherUserId - The user to start a conversation with
 * @returns The conversation ID
 */
export async function startOrGetConversation(
    currentUserId: string,
    otherUserId: string
): Promise<string | null> {
    try {
        // Check if conversation already exists
        const { data: existing } = await (supabase as any)
            .from('conversations')
            .select('id')
            .or(
                `and(participant_1.eq.${currentUserId},participant_2.eq.${otherUserId}),` +
                `and(participant_1.eq.${otherUserId},participant_2.eq.${currentUserId})`
            )
            .single();

        if (existing) {
            return existing.id;
        }

        // Create new conversation
        const { data: newConv, error } = await (supabase as any)
            .from('conversations')
            .insert({
                participant_1: currentUserId,
                participant_2: otherUserId,
            })
            .select('id')
            .single();

        if (error) throw error;
        return newConv?.id || null;

    } catch (error) {
        console.error('Error getting/creating conversation:', error);
        return null;
    }
}

/**
 * Navigate to chat with a user
 */
export async function navigateToChat(currentUserId: string, otherUserId: string) {
    const conversationId = await startOrGetConversation(currentUserId, otherUserId);
    if (conversationId) {
        router.push(`/connect/chat/${conversationId}`);
    }
}
