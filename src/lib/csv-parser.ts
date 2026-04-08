/**
 * CSV Parser Utility for MX Methodology
 * Alinhado com EPIC-11: Motor de Reprocessamento
 */

export interface ParsedCSVRow {
    [key: string]: string | number;
}

export const MANDATORY_HEADERS = [
    'DATA',
    'LOJA',
    'VENDEDOR',
    'LEADS',
    'AGD_CART',
    'AGD_NET',
    'VND_PORTA',
    'VND_CART',
    'VND_NET',
    'VISITA'
];

export function parseCSV(text: string): ParsedCSVRow[] {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toUpperCase());
    const results: ParsedCSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
        const currentline = lines[i].split(',');
        const obj: ParsedCSVRow = {};

        for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentline[j]?.trim();
        }
        results.push(obj);
    }

    return results;
}

export function validateHeaders(headers: string[]): { valid: boolean; missing: string[] } {
    const upperHeaders = headers.map(h => h.trim().toUpperCase());
    const missing = MANDATORY_HEADERS.filter(h => !upperHeaders.includes(h));
    
    return {
        valid: missing.length === 0,
        missing
    };
}
