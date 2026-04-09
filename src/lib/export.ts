import * as XLSX from 'xlsx'

/**
 * Utilitário de exportação de alto desempenho para MX Performance.
 * Centraliza a lógica de geração de Excel para evitar redundância e lentidão no browser.
 */
export function exportToExcel(data: any[], filename: string, sheetName: string = 'Dados') {
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
