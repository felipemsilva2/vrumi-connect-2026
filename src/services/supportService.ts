import { supabase } from "@/integrations/supabase/client";

export interface Ticket {
    id: string;
    user_id: string;
    user_email: string;
    subject: string;
    message: string;
    priority: 'normal' | 'high' | 'critical';
    status: 'open' | 'in_progress' | 'resolved';
    created_at: string;
}

export const supportService = {
    // Create a new ticket
    createTicket: async (
        userId: string,
        userEmail: string,
        subject: string,
        message: string,
        priority: 'normal' | 'high' | 'critical'
    ): Promise<Ticket> => {
        const { data, error } = await (supabase
            .from('support_tickets' as any)
            .insert({
                user_id: userId,
                user_email: userEmail,
                subject,
                message,
                priority,
                status: 'open'
            })
            .select()
            .single()) as any;

        if (error) throw error;
        return data;
    },

    // Get tickets (filtered by user or all for admin)
    getTickets: async (userId?: string, isAdmin: boolean = false): Promise<Ticket[]> => {
        let query = supabase
            .from('support_tickets' as any)
            .select('*')
            .order('created_at', { ascending: false });

        if (!isAdmin && userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as Ticket[];
    },

    // Update ticket status
    updateTicketStatus: async (ticketId: string, status: 'open' | 'in_progress' | 'resolved'): Promise<void> => {
        const { error } = await supabase
            .from('support_tickets' as any)
            .update({ status })
            .eq('id', ticketId);

        if (error) throw error;
    }
};
