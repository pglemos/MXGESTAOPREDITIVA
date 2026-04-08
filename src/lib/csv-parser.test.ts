import { describe, it, expect } from 'bun:test';
import { parseCSV, validateHeaders, MANDATORY_HEADERS } from './csv-parser';

describe('csv-parser', () => {
    describe('parseCSV', () => {
        it('should correctly parse a well-formed CSV string', () => {
            const csvText = `DATA,LOJA,VENDEDOR,LEADS,AGD_CART,AGD_NET,VND_PORTA,VND_CART,VND_NET,VISITA
2023-10-01,Loja A,João,10,2,3,1,1,1,5
2023-10-02,Loja B,Maria,15,3,4,2,0,2,6`;
            const result = parseCSV(csvText);
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                'DATA': '2023-10-01',
                'LOJA': 'Loja A',
                'VENDEDOR': 'João',
                'LEADS': '10',
                'AGD_CART': '2',
                'AGD_NET': '3',
                'VND_PORTA': '1',
                'VND_CART': '1',
                'VND_NET': '1',
                'VISITA': '5'
            });
            expect(result[1]['VENDEDOR']).toBe('Maria');
        });

        it('should return an empty array for empty string', () => {
            expect(parseCSV('')).toEqual([]);
        });

        it('should return an empty array if only header is present', () => {
            const csvText = 'DATA,LOJA,VENDEDOR,LEADS,AGD_CART,AGD_NET,VND_PORTA,VND_CART,VND_NET,VISITA';
            expect(parseCSV(csvText)).toEqual([]);
        });

        it('should ignore empty lines', () => {
            const csvText = `DATA,LOJA,VENDEDOR

2023-10-01,Loja A,João

2023-10-02,Loja B,Maria
`;
            const result = parseCSV(csvText);
            expect(result).toHaveLength(2);
            expect(result[0]['LOJA']).toBe('Loja A');
            expect(result[1]['LOJA']).toBe('Loja B');
        });

        it('should trim headers and values', () => {
            const csvText = ` DATA , LOJA , VENDEDOR
 2023-10-01 , Loja A , João `;
            const result = parseCSV(csvText);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                'DATA': '2023-10-01',
                'LOJA': 'Loja A',
                'VENDEDOR': 'João'
            });
        });

        it('should convert headers to uppercase', () => {
            const csvText = `data,loja,VENDEDOR
2023-10-01,Loja A,João`;
            const result = parseCSV(csvText);
            expect(result[0]).toEqual({
                'DATA': '2023-10-01',
                'LOJA': 'Loja A',
                'VENDEDOR': 'João'
            });
        });

        it('should handle rows with missing columns', () => {
            const csvText = `DATA,LOJA,VENDEDOR
2023-10-01,Loja A`;
            const result = parseCSV(csvText);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({
                'DATA': '2023-10-01',
                'LOJA': 'Loja A',
                'VENDEDOR': undefined
            });
        });
    });

    describe('validateHeaders', () => {
        it('should return valid=true for a complete set of mandatory headers', () => {
            const headers = [...MANDATORY_HEADERS, 'EXTRA_HEADER'];
            const result = validateHeaders(headers);
            expect(result.valid).toBe(true);
            expect(result.missing).toEqual([]);
        });

        it('should return valid=false and list missing headers', () => {
            const headers = ['DATA', 'LOJA'];
            const result = validateHeaders(headers);
            expect(result.valid).toBe(false);
            expect(result.missing).toContain('VENDEDOR');
            expect(result.missing).toContain('LEADS');
            expect(result.missing.length).toBe(MANDATORY_HEADERS.length - 2);
        });

        it('should be case insensitive', () => {
            const lowerHeaders = MANDATORY_HEADERS.map(h => h.toLowerCase());
            const result = validateHeaders(lowerHeaders);
            expect(result.valid).toBe(true);
            expect(result.missing).toEqual([]);
        });

        it('should return valid=false when headers list is empty', () => {
            const result = validateHeaders([]);
            expect(result.valid).toBe(false);
            expect(result.missing).toEqual(MANDATORY_HEADERS);
        });

        it('should trim headers before validating', () => {
            const headersWithSpaces = MANDATORY_HEADERS.map(h => ` ${h} `);
            const result = validateHeaders(headersWithSpaces);
            expect(result.valid).toBe(true);
            expect(result.missing).toEqual([]);
        });
    });
});
