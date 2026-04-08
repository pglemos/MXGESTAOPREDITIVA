import { validateCheckinPayload } from './checkin-validator';

describe('Checkin Validator', () => {
    it('should validate and map canonical fields correctly', () => {
        const raw = {
            DATA: '2026-04-08',
            LOJA: 'Loja 1',
            VENDEDOR: 'Vendedor X',
            LEADS: '10',
            VND_PORTA: '2',
            AGD_CART: '5',
            AGD_NET: '3',
            VND_CART: '1',
            VND_NET: '1',
            VISITA: '4'
        };

        const result = validateCheckinPayload(raw);
        expect(result.success).toBe(true);
        expect(result.data?.leads_prev_day).toBe(10);
        expect(result.data?.vnd_porta_prev_day).toBe(2);
    });

    it('should return errors for non-numeric data', () => {
        const raw = { LEADS: 'abc' };
        const result = validateCheckinPayload(raw);
        expect(result.success).toBe(false);
        expect(result.errors).toContain("LEADS must be a number");
    });
});
