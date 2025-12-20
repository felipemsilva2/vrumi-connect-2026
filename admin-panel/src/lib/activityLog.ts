import { supabase } from './supabase';

export interface LogActivityParams {
    action: 'approve' | 'reject' | 'suspend' | 'reactivate' | 'update' | 'create' | 'cancel' | 'refund';
    entityType: 'instructor' | 'booking' | 'user' | 'transaction';
    entityId: string;
    entityName: string;
    details?: Record<string, any>;
}

export async function logAdminActivity(params: LogActivityParams): Promise<void> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('admin_activity_log').insert({
            admin_id: user.id,
            admin_email: user.email,
            action: params.action,
            entity_type: params.entityType,
            entity_id: params.entityId,
            entity_name: params.entityName,
            details: params.details || {},
        });
    } catch (error) {
        console.error('Error logging activity:', error);
    }
}
