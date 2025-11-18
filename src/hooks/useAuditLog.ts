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

      const { data, error } = await supabase.functions.invoke('log-audit', {
        body: {
          actionType,
          entityType,
          entityId: entityId || null,
          oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
          newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
        },
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
