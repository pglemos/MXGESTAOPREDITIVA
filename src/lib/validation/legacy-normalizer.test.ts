import { normalizeLegacyData } from './legacy-normalizer';
import { validateCheckinPayload } from './checkin-validator';

describe('Legacy Normalizer', () => {
    it('should map legacy-style headers to canonical keys', () => {
        const legacyRaw = {
            'Quantos Leads?': '10',
            'VENDAS PORTA': '2',
            'AGENDAMENTO CARTEIRA': '5',
            'VENDA CARTEIRA': '1',
            'AGENDAMENTO INTERNET': '3',
            'VENDA INTERNET': '1',
            'Total de VISITAS': '4'
        };

        const normalized = normalizeLegacyData(legacyRaw);
        const result = validateCheckinPayload(normalized);
        
        expect(result.success).toBe(true);
        expect(result.data?.leads_prev_day).toBe(10);
        expect(result.data?.visit_prev_day).toBe(4);
    });
});
