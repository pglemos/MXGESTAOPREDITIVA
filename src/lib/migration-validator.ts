/**
 * MX Performance — Canonical Data Validator (EPIC-MIGRATION)
 * Valida a integridade estrutural e de negócio de massas de dados legadas.
 */

export interface ValidationResult {
    isValid: boolean
    errors: string[]
    warnings: string[]
    summary: {
        totalRows: number
        validRows: number
        storesFound: string[]
        sellersFound: string[]
    }
    records: any[]
}

export function validateLegacyCSV(text: string): ValidationResult {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0)
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        summary: { totalRows: 0, validRows: 0, storesFound: [], sellersFound: [] },
        records: []
    }

    if (lines.length < 2) {
        result.isValid = false
        result.errors.push('Arquivo vazio ou sem cabeçalho.')
        return result
    }

    // Identificar cabeçalhos e mapear índices
    const headers = lines[0].split(',').map(h => h.trim().toUpperCase())
    const getIdx = (name: string) => headers.findIndex(h => h.includes(name.toUpperCase()))

    const idxMap = {
        data: getIdx('DATA'),
        loja: getIdx('LOJA'),
        vendedor: getIdx('VENDEDOR'),
        leads: getIdx('LEADS'),
        agd_cart: getIdx('AGD_CART'),
        agd_net: getIdx('AGD_NET'),
        vnd_porta: getIdx('VND_PORTA'),
        vnd_cart: getIdx('VND_CART'),
        vnd_net: getIdx('VND_NET'),
        visita: getIdx('VISITA'),
        motivo_zero: getIdx('MOTIVO_ZERO')
    }

    // Validar colunas críticas (Conforme RPC process_import_data)
    const required = ['DATA', 'LOJA', 'VENDEDOR']
    const missing = required.filter(r => getIdx(r) === -1)
    
    if (missing.length > 0) {
        result.isValid = false
        result.errors.push(`Colunas obrigatórias ausentes: ${missing.join(', ')}`)
        return result
    }

    result.summary.totalRows = lines.length - 1
    const storeSet = new Set<string>()
    const sellerSet = new Set<string>()

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i])
        if (values.length < headers.length) {
            if (i < 10) result.warnings.push(`Linha ${i+1} parece incompleta (colunas insuficientes).`)
            continue
        }

        const record: any = {}
        Object.entries(idxMap).forEach(([key, idx]) => {
            if (idx !== -1) record[key.toUpperCase()] = values[idx]
        })

        if (record.LOJA) storeSet.add(record.LOJA)
        if (record.VENDEDOR) sellerSet.add(record.VENDEDOR)
        
        result.records.push(record)
    }

    result.summary.validRows = result.records.length
    result.summary.storesFound = Array.from(storeSet)
    result.summary.sellersFound = Array.from(sellerSet)

    if (result.records.length === 0) {
        result.isValid = false
        result.errors.push('Nenhum registro válido processado.')
    }

    return result
}

function parseCSVLine(line: string): string[] {
    const values: string[] = []
    let curVal = ''
    let inQuotes = false
    for (const char of line) {
        if (char === '"') inQuotes = !inQuotes
        else if (char === ',' && !inQuotes) {
            values.push(curVal.trim())
            curVal = ''
        } else {
            curVal += char
        }
    }
    values.push(curVal.trim())
    return values
}
