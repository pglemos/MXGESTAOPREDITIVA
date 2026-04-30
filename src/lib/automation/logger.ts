export async function logAutomation(action: string, status: 'success' | 'failed', details: Record<string, any>) {
    console.log(`[AUTOMATION] ${action}: ${status}`, details);
    // Persist to logs_auditoria
}
