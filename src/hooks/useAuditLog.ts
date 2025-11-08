import { supabase } from "@/integrations/supabase/client";

interface AuditLogParams {
  actionType: string;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
}

export const useAuditLog = () => {
  const logAction = async ({
    actionType,
    entityType,
    entityId,
    oldValues,
    newValues,
  }: AuditLogParams) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error("No user found for audit log");
        return;
      }

      const { error } = await supabase.rpc('log_admin_action', {
        p_user_id: user.id,
        p_action_type: actionType,
        p_entity_type: entityType,
        p_entity_id: entityId || null,
        p_old_values: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
        p_new_values: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
        p_ip_address: null,
        p_user_agent: navigator.userAgent,
      });

      if (error) {
        console.error("Error logging admin action:", error);
      }
    } catch (error) {
      console.error("Error in audit log:", error);
    }
  };

  return { logAction };
};
