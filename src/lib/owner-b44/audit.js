import { base44 } from "@/api/base44Client";

// Registra um evento de auditoria vinculado à empresa.
export const logAudit = async ({ companyId, user, entityType, entityId, eventType, previousStatus, newStatus, notes }) => {
  if (!companyId || !entityId) return null;
  try {
    return await base44.entities.AuditEvent.create({
      company_id: companyId,
      actor_user_id: user?.id || "",
      actor_name: user?.full_name || user?.email || "Sistema",
      entity_type: entityType,
      entity_id: entityId,
      event_type: eventType,
      previous_status: previousStatus || "",
      new_status: newStatus || "",
      notes: notes || "",
    });
  } catch (e) {
    return null;
  }
};