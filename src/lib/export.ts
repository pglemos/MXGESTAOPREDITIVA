import * as XLSX from 'xlsx'
import type { TeamContactsWorkbookSheet } from '@/lib/team-contacts-export'

/**
 * Utilitário de exportação de alto desempenho para MX Performance.
 * Centraliza a lógica de geração de Excel para evitar redundância e lentidão no browser.
 */
export function exportToExcel(data: Record<string, unknown>[], filename: string, sheetName: string = 'Dados') {
  try {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    
    // Configurar larguras automáticas básicas para performance
    const wscols = Object.keys(data[0] || {}).map(() => ({ wch: 20 }))
    ws['!cols'] = wscols

    XLSX.writeFile(wb, `${filename}_${new Date().getTime()}.xlsx`)
    return true
  } catch (error) {
    console.error('Erro na exportação Excel:', error)
    return false
  }
}

export function exportWorkbookToExcel(
  sheets: TeamContactsWorkbookSheet[],
  filename: string,
) {
  try {
    const wb = XLSX.utils.book_new()
    for (const sheet of sheets) {
      const ws = XLSX.utils.json_to_sheet(sheet.rows as Record<string, unknown>[], { header: sheet.headers })
      ws['!cols'] = sheet.headers.map((header) => ({ wch: Math.max(12, Math.min(32, header.length + 8)) }))
      XLSX.utils.book_append_sheet(wb, ws, sheet.name)
    }
    XLSX.writeFile(wb, `${filename}_${new Date().getTime()}.xlsx`)
    return true
  } catch (error) {
    console.error('Erro na exportação Excel:', error)
    return false
  }
}
