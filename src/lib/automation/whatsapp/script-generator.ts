import { FunnelDiagnostic } from '@/types/database';

export function generateWhatsAppScript(diagnostic: FunnelDiagnostic, storeName: string): string {
    return `Olá Gerente da ${storeName}. Detectamos o seguinte diagnóstico: ${diagnostic.mensagem}. Recomendamos foco imediato na etapa: ${diagnostic.gargalo || 'Geral'}.`;
}
