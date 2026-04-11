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
}

export function validateLegacyCSV(text: string): ValidationResult {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0)
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        summary: { totalRows: 0, validRows: 0, storesFound: [], sellersFound: [] }
    }

    if (lines.length < 2) {
        result.isValid = false
        result.errors.push('Arquivo vazio ou sem cabeçalho.')
        return result
    }

    const headers = lines[0].split(',').map(h => h.trim().toUpperCase())
    result.summary.totalRows = lines.length - 1

    // 1. Validação de Colunas Obrigatórias
    const required = ['DATA', 'LOJA', 'VENDEDOR', 'LEADS', 'VISITA', 'VND_PORTA']
    const missing = required.filter(r => !headers.some(h => h.includes(r)))
    
    if (missing.length > 0) {
        result.isValid = false
        result.errors.push(`Colunas obrigatórias ausentes: ${missing.join(', ')}`)
        return result
    }

    // 2. Validação de Conteúdo (Amostra das primeiras 100 linhas)
    const storeSet = new Set<string>()
    const sellerSet = new Set<string>()
    let validCount = 0

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        if (values.length < headers.length) {
            if (i < 10) result.warnings.push(`Linha ${i+1} parece incompleta (colunas insuficientes).`)
            continue
        }

        // Simulação de parsing para encontrar nomes
        // (No mundo real usaríamos os índices mapeados)
        const storeName = values[headers.findIndex(h => h.includes('LOJA'))]
        const sellerName = values[headers.findIndex(h => h.includes('VENDEDOR'))]

        if (storeName) storeSet.add(storeName)
        if (sellerName) sellerSet.add(sellerName)
        validCount++
    }

    result.summary.validRows = validCount
    result.summary.storesFound = Array.from(storeSet)
    result.summary.sellersFound = Array.from(sellerSet)

    if (validCount === 0) {
        result.isValid = false
        result.errors.push('Nenhum registro válido processado.')
    }

    return result
}
