import { supabase } from "@/integrations/supabase/client";

export async function logAction(
  action: string, // "create", "update", "delete", "register"
  entityType: string, // "employees", "clients", "services", "replacements", etc
  entityId: string,
  entityName: string,
  details?: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("audit_logs").insert({
      action,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      details,
      user_email: user?.email || "sistema",
    });
  } catch (error) {
    console.error("Erro ao registrar log:", error);
  }
}
