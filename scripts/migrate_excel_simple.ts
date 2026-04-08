import * as XLSX from 'xlsx';

async function migrate() {
    const filePath = '/Users/pedroguilherme/PROJETOS/MX GESTAO PREDITIVA/ARQUIVOS_MX/Sistema de Gestão de Alta Performance (1).xlsx';
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    console.log('Sheets found:', sheetNames);
    
    // Read first sheet as sample
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);
    console.log('Sample data (first 5 rows):', JSON.stringify(data.slice(0, 5), null, 2));
}
migrate().catch(console.error);
