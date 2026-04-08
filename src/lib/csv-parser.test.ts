import { describe, it, expect } from 'bun:test';
import { parseCSV, validateHeaders, MANDATORY_HEADERS } from './csv-parser';

describe('csv-parser', () => {
    describe('parseCSV', () => {
        it('should parse a basic CSV string', () => {
            const csv = `NOME,IDADE\nJoao, 30\nMaria, 25`;
            const result = parseCSV(csv);
            expect(result).toEqual([
                { NOME: 'Joao', IDADE: '30' },
                { NOME: 'Maria', IDADE: '25' }
            ]);
        });

        it('should return empty array for empty string', () => {
            expect(parseCSV('')).toEqual([]);
        });

        it('should return empty array when there are only headers', () => {
            expect(parseCSV('NOME,IDADE')).toEqual([]);
        });

        it('should ignore empty lines', () => {
            const csv = `NOME,IDADE\n\nJoao,30\n\nMaria,25\n`;
            const result = parseCSV(csv);
            expect(result).toEqual([
                { NOME: 'Joao', IDADE: '30' },
                { NOME: 'Maria', IDADE: '25' }
            ]);
        });

        it('should handle headers with different casings and whitespace', () => {
            const csv = ` Nome , iDaDe \nJoao,30`;
            const result = parseCSV(csv);
            expect(result).toEqual([
                { NOME: 'Joao', IDADE: '30' }
            ]);
        });

        it('should handle missing values for columns', () => {
            const csv = `NOME,IDADE,CIDADE\nJoao,30\nMaria,25,Sao Paulo`;
            const result = parseCSV(csv);
            expect(result).toEqual([
                { NOME: 'Joao', IDADE: '30', CIDADE: undefined },
                { NOME: 'Maria', IDADE: '25', CIDADE: 'Sao Paulo' }
            ]);
        });
    });

    describe('validateHeaders', () => {
        it('should return valid true when all mandatory headers are present', () => {
            const headers = [...MANDATORY_HEADERS];
            const result = validateHeaders(headers);
            expect(result.valid).toBe(true);
            expect(result.missing).toEqual([]);
        });

        it('should ignore casing when validating headers', () => {
            const headers = MANDATORY_HEADERS.map(h => h.toLowerCase());
            const result = validateHeaders(headers);
            expect(result.valid).toBe(true);
            expect(result.missing).toEqual([]);
        });

        it('should allow extra headers as long as mandatory ones are present', () => {
            const headers = [...MANDATORY_HEADERS, 'EXTRA_COL1', 'EXTRA_COL2'];
            const result = validateHeaders(headers);
            expect(result.valid).toBe(true);
            expect(result.missing).toEqual([]);
        });

        it('should return valid false and list missing headers', () => {
            const missing1 = MANDATORY_HEADERS[0];
            const missing2 = MANDATORY_HEADERS[1];

            const headers = MANDATORY_HEADERS.slice(2);
            const result = validateHeaders(headers);

            expect(result.valid).toBe(false);
            expect(result.missing).toContain(missing1);
            expect(result.missing).toContain(missing2);
            expect(result.missing.length).toBe(2);
        });

        it('should return all mandatory headers as missing if empty array provided', () => {
            const result = validateHeaders([]);
            expect(result.valid).toBe(false);
            expect(result.missing).toEqual(MANDATORY_HEADERS);
        });
    });
});
