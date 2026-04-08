import { DailyCheckin } from '@/types/database';
import { validateCheckinPayload } from './checkin-validator';

/**
 * Maps legacy headers to canonical fields and normalizes data.
 */
export function normalizeLegacyData(raw: Record<string, string>): Record<string, any> {
    const mapping: Record<string, string> = {
        'LEADS': 'LEADS',
        'VENDAS PORTA': 'VND_PORTA',
        'AGENDAMENTO CARTEIRA': 'AGD_CART',
        'VENDA CARTEIRA': 'VND_CART',
        'AGENDAMENTO INTERNET': 'AGD_NET',
        'VENDA INTERNET': 'VND_NET',
        'VISITAS': 'VISITA'
    };

    const normalized: Record<string, any> = {};
    
    // Fuzzy matching headers
    for (const [key, value] of Object.entries(raw)) {
        const upperKey = key.toUpperCase();
        for (const [legacyKeyword, canonicalKey] of Object.entries(mapping)) {
            if (upperKey.includes(legacyKeyword)) {
                normalized[canonicalKey] = value;
            }
        }
    }

    return normalized;
}
